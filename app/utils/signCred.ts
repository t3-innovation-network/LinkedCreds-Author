// @ts-nocheck
import { CredentialEngine, GoogleDriveStorage } from '@cooperation/vc-storage'
import { FormData } from '../credentialForm/form/types/Types'
import { SkillMatch } from './skillsApi'
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020'
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020'
import * as dbVc from '@digitalbazaar/vc'
import { driver as didKeyDriver } from '@digitalbazaar/did-method-key'
import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'
import { localOBContext, localED25519Context } from '@cooperation/vc-storage/dist/utils/context.js'
// import { customDocumentLoader } from '@cooperation/vc-storage/dist/utils/digitalbazaar.js' // Trying to reimplement to avoid issues

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
  skills?: SkillMatch[]
  skills?: SkillMatch[]
  alignment?: { targetName: string; targetDescription?: string; targetCode?: string; uuid?: string; score?: number }[]
}

interface RecommendationI {
  recommendationText: string
  qualifications: string
  expirationDate: string
  fullName: string
  howKnow: string
  explainAnswer: string
  portfolio: { googleId?: string; name: string; url: string }[]
}

function getCredentialEngine(accessToken: string): CredentialEngine {
  if (!accessToken) {
    throw new Error('Access token is required to instantiate CredentialEngine.')
  }
  const storage = new GoogleDriveStorage(accessToken)
  return new CredentialEngine(storage)
}

// Initialize the DID method key driver
const didKeyDriverInstance = didKeyDriver()
didKeyDriverInstance.use({
  multibaseMultikeyHeader: 'z6Mk',
  fromMultibase: Ed25519VerificationKey2020.from,
})

// Custom document loader
const customDocumentLoader = async (url: string) => {
  // Context map for local contexts
  const contextMap: any = {
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json': localOBContext,
    'https://w3id.org/security/suites/ed25519-2020/v1': localED25519Context,
  }
  // Return local context if it matches the URL
  if (contextMap[url]) {
    return {
      contextUrl: null,
      documentUrl: url,
      document: contextMap[url],
    }
  }
  // Handle did:key resolution
  if (url.startsWith('did:key:')) {
    const didDocument = await didKeyDriverInstance.get({ did: url })
    return {
      contextUrl: null,
      documentUrl: url,
      document: didDocument,
    }
  }
  // Fallback to the default document loader for unknown URLs
  // @ts-ignore
  return dbVc.defaultDocumentLoader(url)
}

function generateHashedId(credential: any) {
  // Exclude the `id` field from the hash
  const credentialWithoutId = { ...credential, id: undefined }
  const serialized = JSON.stringify(credentialWithoutId)
  return CryptoJS.SHA256(serialized).toString(CryptoJS.enc.Hex)
}

function generateCustomUnsignedVC({ formData, issuerDid }: { formData: FormDataI, issuerDid: string }) {
  const issuanceDate = new Date().toISOString()
  if (issuanceDate > formData.expirationDate)
    throw new Error('issuanceDate cannot be after expirationDate')

  const unsignedCredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
      {
        duration: 'https://schema.org/duration',
        fullName: 'https://schema.org/name',
        portfolio: 'https://schema.org/portfolio',
        evidenceLink: 'https://schema.org/evidenceLink',
        evidenceDescription: 'https://schema.org/evidenceDescription',
        credentialType: 'https://schema.org/credentialType',
        uuid: 'https://schema.org/identifier',
        score: 'https://schema.org/value',
      },
    ],
    id: '', // Will be set after hashing
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
      id: issuerDid,
      type: ['Profile'],
    },
    issuanceDate,
    expirationDate: formData.expirationDate,
    credentialSubject: {
      type: ['AchievementSubject'],
      name: formData.fullName,
      portfolio: formData.portfolio.map((item) => ({
        '@type': 'schema:CreativeWork',
        name: item.name,
        url: item.url,
      })),
      evidenceLink: formData.evidenceLink,
      evidenceDescription: formData.evidenceDescription || formData.achievementDescription, // Use achievementDescription as fallback if evidenceDescription is empty? or just standard mapping
      duration: formData.duration,
      credentialType: formData.credentialType,
      achievement: [
        { //JSON Schema for Skill Credential
          id: `urn:uuid:${uuidv4()}`,
          type: ['Achievement'],
          criteria: {
            narrative: formData.criteriaNarrative,
          },
          description: formData.achievementDescription,
          name: formData.achievementName,
          image: formData.evidenceLink
            ? {
              id: formData.evidenceLink,
              type: 'Image',
            }
            : undefined,
          alignment: formData.alignment ? formData.alignment.map(align => ({
            type: ['Alignment'],
            targetName: align.targetName,
            targetCode: align.targetCode,
            uuid: align.uuid,
            score: align.score
          })) : undefined
        },
      ],
    },
  }

  // Generate the hashed ID
  unsignedCredential.id = 'urn:' + generateHashedId(unsignedCredential)
  return unsignedCredential
}


export async function createDIDWithMetaMask(
  metaMaskAddress: string,
  accessToken: string
) {
  const credentialEngine = getCredentialEngine(accessToken)
  const { didDocument, keyPair } = await credentialEngine.createWalletDID(metaMaskAddress)
  return { didDocument, keyPair, issuerId: didDocument.id }
}

export const createDID = async (accessToken: string) => {
  const credentialEngine = getCredentialEngine(accessToken)
  const { didDocument, keyPair } = await credentialEngine.createDID()
  console.log('DID:', didDocument)
  return { didDocument, keyPair, issuerId: didDocument.id }
}


const signCred = async (
  accessToken: string,
  data: any,
  issuerDid: string,
  keyPair: any,
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
    } else {
      // Use Custom Signing for VC to support Skills/Alignment
      formData = generateCredentialData(data)
      console.log('🚀 ~ formData with alignment:', formData)

      const credential = generateCustomUnsignedVC({ formData: formData as FormDataI, issuerDid })

      // Reconstruct key pair for signing
      // CredentialEngine returns a keyPair object, we need to ensure it has id and controller
      // If keyPair comes from CredentialEngine.createDID, it should have them.

      const suite = new Ed25519Signature2020({ key: keyPair, verificationMethod: keyPair.id })

      signedVC = await dbVc.issue({
        credential,
        suite,
        documentLoader: customDocumentLoader
      })
    }

    return signedVC
  } catch (error) {
    console.error('Error during VC signing:', error)
    throw error
  }
}

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
    skills: data.skills || [],
    alignment: alignment
  }
}

const generateRecommendationData = (data: any): RecommendationI => {
  return {
    recommendationText: data.recommendationText,
    qualifications: data.qualifications,
    expirationDate: new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    ).toISOString(),
    fullName: data.fullName,
    howKnow: data.howKnow,
    explainAnswer: data.explainAnswer,
    portfolio: data.portfolio
  }
}

export { signCred }
