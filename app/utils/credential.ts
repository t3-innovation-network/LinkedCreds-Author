import {
  CredentialEngine,
  GoogleDriveStorage,
  saveToGoogleDrive
} from '@cooperation/vc-storage'
import type { ISkill, IFrameworkMatch } from 'hr-context'
import { FormData } from '../credentialForm/form/types/Types'
// @ts-ignore
import * as dbVc from '@digitalcredentials/vc'
// @ts-ignore
import { Ed25519Signature2020 } from '@digitalcredentials/ed25519-signature-2020'
// @ts-ignore
import { customDocumentLoader } from '@cooperation/vc-storage/dist/utils/digitalbazaar.js'
import { v4 as uuidv4 } from 'uuid'
import * as hrContextObj from 'hr-context'

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
    const credentialEngine = getCredentialEngine(accessToken)

    const contextArray = [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
      'https://w3id.org/hr/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1'
    ]

    let credentialSubject: any
    let evidenceItems: any[] = []

    if (type === 'RECOMMENDATION') {
      const { subject, evidence } = generateRecommendationData(data)
      credentialSubject = subject
      evidenceItems = evidence

      signedVC = await credentialEngine.signVC({
        data: {
          '@context': contextArray,
          ...credentialSubject
        },
        type: 'RECOMMENDATION',
        keyPair,
        issuerId: issuerDid,
        vcFileId
      })
    } else {
      const { subject, evidence } = generateCredentialData(data, issuerDid)
      credentialSubject = subject
      evidenceItems = evidence

      const unsignedCredential: any = {
        '@context': contextArray,
        id: `urn:uuid:${uuidv4()}`,
        type: ['VerifiableCredential', 'SkillClaimCredential', 'SelfIssuedCredential'],
        issuer: { id: issuerDid, type: ['Profile'] },
        issuanceDate: new Date().toISOString(),
        credentialSubject: credentialSubject
      }

      if (evidenceItems && evidenceItems.length > 0) {
        unsignedCredential.evidence = evidenceItems
      }

      console.log('VC BEFORE SIGNING (SkillClaim):', JSON.stringify(unsignedCredential, null, 2))

      const wrappedDocumentLoader = async (url: string) => {
        if (url === 'https://w3id.org/hr/v1' || url === 'https://w3id.org/hr/v1/') {
          return {
            contextUrl: null,
            documentUrl: url,
            document: (hrContextObj as any).CONTEXT_V1 || (hrContextObj as any).contexts?.get(url)
          }
        }
        if (url === 'https://www.w3.org/ns/credentials/v2' || url === 'https://www.w3.org/ns/credentials/v2/') {
          const v1Doc = await customDocumentLoader('https://www.w3.org/2018/credentials/v1')
          return {
            contextUrl: null,
            documentUrl: url,
            document: v1Doc.document
          }
        }
        return customDocumentLoader(url)
      }

      const suite = new Ed25519Signature2020({ key: keyPair, verificationMethod: keyPair.id })
      signedVC = await dbVc.issue({ credential: unsignedCredential, suite, documentLoader: wrappedDocumentLoader })
    }

    const finalVC: any = {
      '@context': signedVC['@context'] || contextArray,
      id: signedVC.id,
      type: signedVC.type,
      issuer: signedVC.issuer,
      issuanceDate: signedVC.issuanceDate,
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
  const skills: ISkill[] = (data.skills ?? []).map(skill => {
    const align = {
      targetName: skill.name,
      targetDescription: skill.description || skill.frameworkMatch?.[0]?.name,
      soc: skill.frameworkMatch?.[0]?.socCode,
      uuid: skill.id,
      score: skill.frameworkMatch?.[0]?.similarityScore
    }
    return {
      id: align.uuid ?? `urn:uuid:${align.targetName}`,
      name: align.targetName,
      ...(align.targetDescription ? { description: align.targetDescription } : {}),
      source: 'ollama',
      frameworkMatch: align.soc?.length
        ? [
          {
            name: align.targetDescription ?? align.targetName,
            socCode: align.soc,
            framework: 'O*Net',
            similarityScore: align.score ?? 0
          } satisfies IFrameworkMatch
        ]
        : []
    }
  })

  const subject = {
    type: ['SkillClaim'],
    person: {
      id: issuerDid,
      name: data.fullName || ''
    },
    name: data.credentialName || '',
    ...(data.credentialDescription ? { description: data.credentialDescription } : {}),
    ...(data.credentialDuration ? { durationPerformed: data.credentialDuration } : {}),
    skill: skills
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
  const subject: any = {
    name: data.recommendationText || '',
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
    explainAnswer: data.explainAnswer || ''
  }

  const evidence: any[] = []
  if (data.evidence && (data.evidence as any[]).length > 0) {
    ; (data.evidence as any[]).forEach((p: any) => {
      if (p.url || p.googleId || p.id) {
        evidence.push({
          id: p.url || p.googleId || p.id || '',
          name: p.name || 'Evidence',
          type: ['Evidence']
        })
      }
    })
  }

  return { subject, evidence }
}

export { signCred }
