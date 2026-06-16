import {
  CredentialEngine,
  GoogleDriveStorage,
  saveToGoogleDrive
} from '@cooperation/vc-storage'
import type { ISkillClaimCredential } from 'hr-context'
import type { FormData } from '../credentialForm/form/types/Types'
import { normalizeSkillClaimFormData } from './normalization/hrContextSkillClaim'

/**
 * Sign a SkillClaimCredential using the HR Context data model.
 * Uses the shared storage and engine. Creates a DID if keyPair/issuerId are not provided.
 *
 * @param storage - Shared GoogleDriveStorage instance (e.g. from useGoogleDrive)
 * @param engine - Shared CredentialEngine instance (e.g. from getCredentialEngine)
 * @param input - Form data + skills (or pre-built SkillClaimFormData)
 * @param options - Optional keyPair and issuerId (if already have DID); saveToDrive to persist
 * @returns The signed SkillClaimCredential
 */
export async function signSkillClaim(
  storage: GoogleDriveStorage,
  engine: CredentialEngine,
  formData: FormData,
  options?: {
    keyPair?: any
    issuerId?: string
    saveToDrive?: boolean
  }
): Promise<ISkillClaimCredential | { signedVC: ISkillClaimCredential; file: any }> {
  if (!storage || !engine) throw new Error('Storage and CredentialEngine are required.')

  let keyPair = options?.keyPair
  let issuerId = options?.issuerId

  if (!keyPair || !issuerId) {
    const { didDocument, keyPair: kp } = await engine.createDID()
    keyPair = kp
    issuerId = didDocument.id
  }

  if (!issuerId) throw new Error('Issuer DID is required.')

  const { subject, evidence } = normalizeSkillClaimFormData(formData, issuerId)

  try {
    const contextArray = [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
      'https://w3id.org/hr/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1'
    ]

    // The `as any` cast can be dropped once @cooperation/vc-storage exporting
    // SkillClaimFormDataI is published and the dependency is bumped.
    let signedVC = (await engine.signSkillClaimVC(
      {
        personId: issuerId,
        personName: subject.person.name,
        skills: subject.skill.map((s: any) => ({
          name: s.name,
          description: s.description,
          durationPerformed: s.durationPerformed,
          image: s.image,
          source: s.source
        })),
        inferredSkills: (subject.inferredSkill ?? []).map(s => ({
          name: s.name,
          source: s.source,
          model: s.model,
          frameworkMatch: s.frameworkMatch
        })),
        evidence
      } as any,
      keyPair,
      issuerId
    )) as any

    delete signedVC.expirationDate
    delete signedVC.issuanceDate
    signedVC.issuer = issuerId

    if (Array.isArray(signedVC.type)) {
      signedVC.type = signedVC.type.filter((t: string) => t !== 'OpenBadgeCredential')
    }

    const finalVC: any = {
      '@context': signedVC['@context'] || contextArray,
      id: signedVC.id,
      type: signedVC.type,
      issuer: signedVC.issuer,
      credentialSubject: signedVC.credentialSubject,
      proof: signedVC.proof
    }

    if (evidence && evidence.length > 0) {
      finalVC.evidence = evidence
    }

    if (options?.saveToDrive) {
      const file = await saveToGoogleDrive({
        storage,
        data: finalVC,
        type: 'VC'
      })
      return { signedVC: finalVC, file }
    }

    return finalVC
  } catch (error) {
    console.error('🚀 ~ signSkillClaim ~ error:', JSON.stringify(error, null, 2))
    throw error
  }
}
