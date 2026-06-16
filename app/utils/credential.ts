import {
  CredentialEngine,
  GoogleDriveStorage,
  saveToGoogleDrive
} from '@cooperation/vc-storage'
import type { ISkill } from 'hr-context'
import { FormData } from '../credentialForm/form/types/Types'
import { getFileViaFirebase } from '../firebase/storage'
import { buildSkillClaimSkillsFromForm } from './normalization/hrContextSkillClaim'

function parseVcPayloadFromDrive(fileData: unknown): Record<string, unknown> | null {
  if (!fileData) return null
  let vcData: unknown = fileData
  if (typeof vcData === 'string') {
    vcData = JSON.parse(vcData)
  }
  const envelope = vcData as { body?: string }
  if (envelope?.body && typeof envelope.body === 'string') {
    vcData = JSON.parse(envelope.body)
  }
  return vcData as Record<string, unknown>
}

/** Resolve claim VC `id` (urn/did) using claim-owner tokens in Firestore — not the recommender session. */
async function resolveTargetVcUri(vcFileId: string): Promise<string> {
  if (vcFileId.startsWith('urn:') || vcFileId.startsWith('did:')) {
    return vcFileId
  }
  const fileData = await getFileViaFirebase(vcFileId)
  if (!fileData) {
    throw new Error(`Unable to resolve VC from file id: ${vcFileId}`)
  }
  const payload = parseVcPayloadFromDrive(fileData)
  const resolvedId = payload?.id
  if (!resolvedId || typeof resolvedId !== 'string') {
    throw new Error(`Resolved VC is missing an 'id' (from file id: ${vcFileId})`)
  }
  return resolvedId
}

function getCredentialEngine(accessToken: string): CredentialEngine {
  if (!accessToken) {
    throw new Error('Access token is required to instantiate CredentialEngine.')
  }
  const storage = new GoogleDriveStorage(accessToken)
  return new CredentialEngine(storage)
}

/**
 * Create a DID
 * @param accessToken - The access token for authentication
 * @returns DID Document, Key Pair, and Issuer ID
 */
export const createDID = async (accessToken: string) => {
  const credentialEngine = getCredentialEngine(accessToken)
  const { didDocument, keyPair } = await credentialEngine.createDID()
  return { didDocument, keyPair, issuerId: didDocument.id }
}

/**
 * Sign a Verifiable Credential
 * @param accessToken - The access token for authentication
 * @param data - The data to include in the credential
 * @param issuerDid - The issuer's DID
 * @param keyPair - The key pair used for signing
 * @param type - The type of credential ('RECOMMENDATION' or 'VC')
 * @returns The signed Verifiable Credential
 */
const signCred = async (
  accessToken: string,
  data: any,
  issuerDid: string,
  keyPair: any,
  type: 'RECOMMENDATION' | 'VC',
  vcFileId?: any,
  saveToDrive: boolean = false
) => {
  if (!accessToken) throw new Error('Access token is not provided')
  let signedVC
  try {
    let credentialSubject: any
    let evidenceItems: any[] = []
    const credentialEngine = getCredentialEngine(accessToken)

    if (type === 'RECOMMENDATION') {
      if (!vcFileId) throw new Error('vcFileId is required for recommendation')

      const { subject, evidence } = generateRecommendationData(data)
      evidenceItems = evidence

      // vc-storage would call storage.retrieve(claimFileId) with the recommender token and 404.
      // Resolve the target VC URI via Firestore (claim owner tokens) first.
      const targetVcUri = await resolveTargetVcUri(vcFileId)

      signedVC = await credentialEngine.signVC({
        data: {
          fullName: subject.fullName || subject.name,
          recipientName: subject.recipientName,
          howKnow: subject.howKnow,
          recommendationText: subject.recommendationText,
          qualifications: subject.qualifications,
          explainAnswer: subject.explainAnswer,
          portfolio: subject.portfolio,
          skillsEndorsed: subject.skillsEndorsed,
          evidence
        },
        type: 'RECOMMENDATION',
        keyPair,
        issuerId: issuerDid,
        vcFileId: targetVcUri
      })
      credentialSubject = signedVC.credentialSubject
    } else {
      const { subject, evidence } = generateCredentialData(data, issuerDid)
      credentialSubject = subject
      evidenceItems = evidence

      signedVC = await credentialEngine.signSkillClaimVC(
        {
          personId: issuerDid,
          personName: subject.person.name,
          skills: subject.skill.map((s: ISkill) => ({
            name: s.name,
            description: s.description,
            durationPerformed: s.durationPerformed,
            source: s.source
          })),
          inferredSkills: (subject.inferredSkill ?? []).map(s => ({
            name: s.name,
            source: s.source,
            model: s.model,
            frameworkMatch: s.frameworkMatch
          })),
          evidence: evidence.map((e: { id: string; name: string; type?: string | string[] }) => ({
            id: e.id,
            name: e.name,
            type: Array.isArray(e.type) ? e.type[0] : e.type || 'Evidence'
          }))
        } as any,
        keyPair,
        issuerDid
      )
    }

    const finalVC: any = {
      '@context': signedVC['@context'],
      id: signedVC.id,
      type: signedVC.type,
      issuer: signedVC.issuer,
      validFrom: signedVC.validFrom,
      issuanceDate: signedVC.validFrom,
      credentialSubject: signedVC.credentialSubject,
      proof: signedVC.proof
    }

    if (signedVC.evidence) {
      finalVC.evidence = signedVC.evidence
    }

    if (saveToDrive) {
      const storage = new GoogleDriveStorage(accessToken)
      const file = await saveToGoogleDrive({
        storage,
        data: finalVC,
        type: type === 'RECOMMENDATION' ? 'RECOMMENDATION' : 'VC'
      })
      return { signedVC: finalVC, file }
    }

    return finalVC
  } catch (error) {
    console.error('Error during VC signing:', error)
    throw error
  }
}

/**
 * Generate credential data for 'VC' type
 * @param data - The form data
 * @param issuerDid - The issuer's DID
 * @returns { subject, evidence }
 */
export const generateCredentialData = (data: FormData, issuerDid: string) => {
  const claimName = (data.credentialName ?? '').trim()
  const { skills, inferredSkills } = buildSkillClaimSkillsFromForm(data)

  const subject = {
    type: ['SkillClaim'],
    person: {
      id: issuerDid,
      name: data.fullName || ''
    },
    name: claimName,
    ...(data.credentialDescription ? { description: data.credentialDescription } : {}),
    ...(data.credentialDuration ? { durationPerformed: data.credentialDuration } : {}),
    skill: skills,
    ...(inferredSkills.length ? { inferredSkill: inferredSkills } : {})
  }

  const evidence: any[] = []
  if (data.evidence && data.evidence.length > 0) {
    data.evidence.forEach((p: any) => {
      const url = p.url || p.googleId || p.id || ''
      if (url) {
        evidence.push({
          id: url,
          name: p.name || 'Evidence',
          type: ['Evidence']
        })
      }
    })
  } else if (data.evidenceLink) {
    evidence.push({
      id: data.evidenceLink,
      name: data.evidenceDescription || 'Evidence',
      type: ['Evidence']
    })
  }

  return { subject, evidence }
}

/**
 * Generate credential data for 'RECOMMENDATION' type
 * @param data - The form data
 * @returns { subject, evidence }
 */
const generateRecommendationData = (data: any) => {
  const evidence: any[] = []
  const portfolio: any[] = []

  if (data.evidence && (data.evidence as any[]).length > 0) {
    ; (data.evidence as any[]).forEach((p: any) => {
      if (p.url || p.googleId || p.id) {
        const url = p.url || p.googleId || p.id || ''
        const name = p.name || 'Evidence'
        evidence.push({
          id: url,
          name: name,
          type: ['Evidence']
        })
        portfolio.push({
          name: name,
          url: url
        })
      }
    })
  }

  const subject: any = {
    fullName: data.fullName || '',
    name: data.fullName || '',
    recipientName: data.recipientName || '',
    howKnow: data.howKnow || '',
    skillsEndorsed:
      data.selectedSkills?.map((skill: any) => ({
        name: skill.name ?? skill.targetName,
        id: skill.id ?? skill.uuid,
        frameworkMatch:
          skill.frameworkMatch ??
          (skill.soc ? [{ socCode: skill.soc, similarityScore: skill.score }] : [])
      })) || [],
    recommendationText: data.recommendationText || '',
    qualifications: data.qualifications || '',
    explainAnswer: data.explainAnswer || '',
    portfolio: portfolio
  }

  return { subject, evidence }
}

export { signCred }
