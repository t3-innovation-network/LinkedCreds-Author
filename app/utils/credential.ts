import { CredentialEngine, GoogleDriveStorage } from '@cooperation/vc-storage'
import type { ISkill, IFrameworkMatch } from 'hr-context'
import { FormData } from '../credentialForm/form/types/Types'

interface FormDataI {
  fullName: string
  duration: string
  criteriaNarrative: string
  achievementDescription: string
  achievementName: string
  evidence: { googleId?: string; name: string; url: string; type?: string[] }[]
  portfolio: { googleId?: string; name: string; url: string; type?: string[] }[]
  evidenceLink: string
  evidenceDescription: string
  credentialType: string
  alignment?: { targetName: string; targetDescription?: string; soc?: string[]; uuid?: string; score?: number }[]
  expirationDate: string
}

interface RecommendationI {
  recommendationText: string
  qualifications: string
  fullName: string  // Recommender's name
  recipientName?: string  // Recipient's name (who the recommendation is for)
  howKnow: string
  explainAnswer: string
  evidence: { googleId?: string; name: string; url: string; type?: string[] }[]
  portfolio: { googleId?: string; name: string; url: string; type?: string[] }[]
  skillsEndorsed?: Pick<ISkill, 'name' | 'id' | 'frameworkMatch'>[]
  expirationDate: string
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
  keyPair: string,
  type: 'RECOMMENDATION' | 'VC',
  vcFileId?: any
) => {
  if (!accessToken) {
    throw new Error('Access token is not provided')
  }
  let formData: FormDataI | RecommendationI
  let signedVC
  try {
    const credentialEngine = getCredentialEngine(accessToken)
    if (type === 'RECOMMENDATION') {
      formData = generateRecommendationData(data)
      signedVC = await credentialEngine.signVC({
        data: formData,
        type: 'RECOMMENDATION',
        keyPair,
        issuerId: issuerDid,
        vcFileId
      })

      delete signedVC.expirationDate
      delete signedVC.issuanceDate
      signedVC.issuer = issuerDid
      signedVC['@context'] = [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        "https://w3id.org/hr/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ]

      const { name, howKnow, recommendationText, qualifications, explainAnswer, evidence, ...rest } = signedVC.credentialSubject

      signedVC.credentialSubject = {
        name,
        recipientName: (formData as RecommendationI).recipientName,
        howKnow,
        ...((formData as RecommendationI).skillsEndorsed && (formData as RecommendationI).skillsEndorsed!.length > 0 ? { skillsEndorsed: (formData as RecommendationI).skillsEndorsed } : {}),
        recommendationText,
        qualifications,
        explainAnswer,
        evidence: evidence,
        ...rest
      }
    } else {
      formData = generateCredentialData(data)
      signedVC = await credentialEngine.signVC({
        data: formData,
        type: 'VC',
        keyPair,
        issuerId: issuerDid
      })
      delete signedVC.issuanceDate
      delete signedVC.expirationDate
      signedVC.issuer = issuerDid

      // Restructure to ISkillClaimCredential (hr-context format)
      const f = formData as FormDataI
      // Capture the credential name from signVC's achievement before replacing credentialSubject
      const credentialName = signedVC.credentialSubject?.achievement?.[0]?.name ?? f.achievementName
      const skills: ISkill[] = (f.alignment ?? []).map(align => ({
        id: align.uuid ?? `urn:uuid:${align.targetName}`,
        name: align.targetName,
        ...(align.targetDescription ? { description: align.targetDescription } : {}),
        source: 'ollama',
        frameworkMatch: align.soc?.length
          ? [{
            name: align.targetDescription ?? align.targetName,
            socCode: align.soc,
            framework: 'O*Net',
            similarityScore: align.score ?? 0
          } satisfies IFrameworkMatch]
          : []
      }))

      // Standardize @context
      signedVC['@context'] = [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        "https://w3id.org/hr/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ]
      if (Array.isArray(signedVC.type)) {
        signedVC.type = signedVC.type.filter((t: string) => t !== 'OpenBadgeCredential')
        if (!signedVC.type.includes('SkillClaimCredential')) signedVC.type.push('SkillClaimCredential')
        if (!signedVC.type.includes('SelfIssuedCredential')) signedVC.type.push('SelfIssuedCredential')
      }

      // Reshape credentialSubject
      signedVC.credentialSubject = {
        type: ['SkillClaim'],
        person: {
          type: ['Person'],
          id: issuerDid,
          name: f.fullName

        },
        name: credentialName,
        ...(f.criteriaNarrative ? { narrative: f.criteriaNarrative } : {}),
        ...(f.duration ? { durationPerformed: f.duration } : {}),
        skill: skills
      }
      const evidenceItems: { id: string; name: string; type?: string[] }[] = []

      if (f.evidence?.length) {
        f.evidence.forEach((p: any) => {
          if (p.id || p.url) {
            evidenceItems.push({
              id: p.id || p.url,
              name: p.name || 'Evidence',
              type: ['Evidence']
            })
          }
        })
      }


      if (evidenceItems.length) signedVC['evidence'] = evidenceItems
    }

    return signedVC
  } catch (error) {
    console.error('Error during VC signing:', error)
    throw error
  }
}

/**
 * Generate credential data for 'VC' type
 * @param data - The form data
 * @returns FormDataI object
 */
export const generateCredentialData = (data: FormData): FormDataI => {
  const alignment = data.skills?.map(skill => ({
    targetName: skill.name,
    targetDescription: skill.description || skill.frameworkMatch?.[0]?.name,
    soc: skill.frameworkMatch?.[0]?.socCode,
    uuid: skill.id,
    score: skill.frameworkMatch?.[0]?.similarityScore
  })) || []

  return {
    fullName: data.fullName || '',
    duration: data.credentialDuration || '',
    criteriaNarrative: data.credentialDescription || '',
    achievementDescription:
      typeof data.description === 'string'
        ? data.description
        : String(data.description || ''),
    achievementName: data.credentialName || '',
    evidence:
      data.evidence && data.evidence.length > 0
        ? data.evidence.map(({ googleId, ...rest }: any) => ({ ...rest, type: ['Evidence'] }))
        : [{ name: '', url: '', type: ['Evidence'] }],
    portfolio:
      data.evidence && data.evidence.length > 0
        ? data.evidence.map(({ googleId, ...rest }: any) => ({ ...rest, type: ['Evidence'] }))
        : [{ name: '', url: '', type: ['Evidence'] }],
    evidenceLink: data?.evidenceLink || '',
    evidenceDescription: data.evidenceDescription || '',
    credentialType: data.persons || '',
    alignment: alignment,
    expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
  }
}

/**
 * Generate credential data for 'RECOMMENDATION' type
 * @param data - The form data
 * @returns RecommendationI object
 */
const generateRecommendationData = (data: any): RecommendationI => {
  return {
    recommendationText: data.recommendationText,
    qualifications: data.qualifications,
    fullName: data.fullName,
    recipientName: data.recipientName,
    howKnow: data.howKnow,
    skillsEndorsed: data.selectedSkills?.map((skill: any) => ({
      name: skill.name ?? skill.targetName,
      id: skill.id ?? skill.uuid,
      frameworkMatch: skill.frameworkMatch ?? (skill.soc ? [{ socCode: skill.soc, similarityScore: skill.score }] : [])
    })) || [],
    explainAnswer: data.explainAnswer,
    evidence:
      data.evidence && (data.evidence as any[]).length > 0
        ? (data.evidence as any[]).map(({ googleId, ...rest }: any) => ({ ...rest, type: ['Evidence'] }))
        : [{ name: '', url: '', type: ['Evidence'] }],
    portfolio:
      data.evidence && (data.evidence as any[]).length > 0
        ? (data.evidence as any[]).map(({ googleId, ...rest }: any) => ({ ...rest, type: ['Evidence'] }))
        : [{ name: '', url: '', type: ['Evidence'] }],
    expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString()
  }
}

export { signCred }
