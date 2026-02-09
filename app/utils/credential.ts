import { CredentialEngine, GoogleDriveStorage } from '@cooperation/vc-storage'
import { FormData } from '../credentialForm/form/types/Types'

interface FormDataI {
  expirationDate: string
  fullName: string
  duration: string
  criteriaNarrative: string
  achievementDescription: string
  achievementName: string
  portfolio: { googleId?: string; name: string; url: string }[]
  evidenceLink: string
  evidenceDescription: string
  credentialType: string
  alignment?: { targetName: string; targetDescription?: string; targetCode?: string; uuid?: string; score?: number }[]
}

interface RecommendationI {
  recommendationText: string
  qualifications: string
  expirationDate: string
  fullName: string  // Recommender's name
  recipientName?: string  // Recipient's name (who the recommendation is for)
  howKnow: string
  explainAnswer: string
  portfolio: { googleId?: string; name: string; url: string }[]
  skillsEndorsed?: Array<{
    targetName: string
    soc?: string
    uuid?: string
    score?: number
  }>
}

function getCredentialEngine(accessToken: string): CredentialEngine {
  if (!accessToken) {
    throw new Error('Access token is required to instantiate CredentialEngine.')
  }
  const storage = new GoogleDriveStorage(accessToken)
  return new CredentialEngine(storage)
}

/**
 * Create a DID using MetaMask address
 * @param metaMaskAddress - The user's MetaMask address
 * @param accessToken - The access token for authentication
 * @returns DID Document, Key Pair, and Issuer ID
 */
export async function createDIDWithMetaMask(
  metaMaskAddress: string,
  accessToken: string
) {
  const credentialEngine = getCredentialEngine(accessToken)
  const { didDocument, keyPair } = await credentialEngine.createWalletDID(metaMaskAddress)
  return { didDocument, keyPair, issuerId: didDocument.id }
}

/**
 * Create a DID
 * @param accessToken - The access token for authentication
 * @returns DID Document, Key Pair, and Issuer ID
 */
export const createDID = async (accessToken: string) => {
  const credentialEngine = getCredentialEngine(accessToken)
  const { didDocument, keyPair } = await credentialEngine.createDID()
  console.log('DID:', didDocument)
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
  vcFileId: any
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




      // Manually add skillsEndorsed and recipientName since the library doesn't include them
      // Also ensure correct property order: skillsEndorsed should come after howKnow
      // Extract current credentialSubject fields
      const { name, howKnow, recommendationText, qualifications, explainAnswer, portfolio, ...rest } = signedVC.credentialSubject

      // Reconstruct with proper order and additional fields
      signedVC.credentialSubject = {
        name,
        recipientName: (formData as RecommendationI).recipientName,
        howKnow,
        ...((formData as RecommendationI).skillsEndorsed && (formData as RecommendationI).skillsEndorsed!.length > 0 ? { skillsEndorsed: (formData as RecommendationI).skillsEndorsed } : {}),
        recommendationText,
        qualifications,
        explainAnswer,
        portfolio,
        ...rest
      }

      // Add recipientName and skillsEndorsed to @context if not already present
      if (Array.isArray(signedVC['@context'])) {
        const contextObj = signedVC['@context'].find((item: any) => typeof item === 'object')
        if (contextObj) {
          if (!contextObj.recipientName) {
            contextObj.recipientName = 'https://schema.org/recipient'
          }
          if (!contextObj.skillsEndorsed) {
            contextObj.skillsEndorsed = 'https://schema.org/skillsEndorsed'
            contextObj.targetName = 'https://schema.org/name'
            contextObj.soc = 'https://schema.org/identifier'
            contextObj.uuid = 'https://schema.org/identifier'
            contextObj.score = 'https://schema.org/value'
          }
        }
      }

    } else {
      formData = generateCredentialData(data)
      signedVC = await credentialEngine.signVC({
        data: formData,
        type: 'VC',
        keyPair,
        issuerId: issuerDid
      })

      // Post-process to add skills/alignment support
      if ((formData as FormDataI).alignment && (formData as FormDataI).alignment!.length > 0) {
        // Add alignment to credentialSubject.achievement[0]
        if (signedVC.credentialSubject?.achievement && Array.isArray(signedVC.credentialSubject.achievement)) {
          signedVC.credentialSubject.achievement[0].alignment = (formData as FormDataI).alignment!.map(align => ({
            type: ['Alignment'],
            targetName: align.targetName,
            targetCode: align.targetCode,
            uuid: align.uuid,
            score: align.score
          }))
        }

        // Add skill-related terms to @context
        if (Array.isArray(signedVC['@context'])) {
          const contextObj = signedVC['@context'].find((item: any) => typeof item === 'object')
          if (contextObj) {
            if (!contextObj.uuid) {
              contextObj.uuid = 'https://schema.org/identifier'
            }
            if (!contextObj.score) {
              contextObj.score = 'https://schema.org/value'
            }
          }
        }
      }
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
    targetDescription: skill.onetName || skill.originalMatch,
    targetCode: skill.soc_codes?.[0],
    uuid: skill.uuid,
    score: skill.score
  })) || []

  return {
    expirationDate: new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    ).toISOString(),
    fullName: data.fullName || '',
    duration: data.credentialDuration || '',
    criteriaNarrative: data.credentialDescription || '',
    achievementDescription:
      typeof data.description === 'string'
        ? data.description
        : String(data.description || ''),
    achievementName: data.credentialName || '',
    portfolio:
      data.portfolio && data.portfolio.length > 0
        ? data.portfolio.map(({ googleId, ...rest }) => rest)
        : [{ name: '', url: '' }],
    evidenceLink: data?.evidenceLink || '',
    evidenceDescription: data.evidenceDescription || '',
    credentialType: data.persons || '',
    alignment: alignment
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
    expirationDate: new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    ).toISOString(),
    fullName: data.fullName,
    recipientName: data.recipientName,
    howKnow: data.howKnow,
    skillsEndorsed: data.selectedSkills?.map((skill: any) => ({
      targetName: skill.targetName,
      soc: skill.targetCode,
      uuid: skill.uuid,
      score: skill.score
    })) || [],
    explainAnswer: data.explainAnswer,
    portfolio: data.portfolio
  }
}

export { signCred }
