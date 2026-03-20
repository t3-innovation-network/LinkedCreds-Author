import {
  CredentialEngine,
  GoogleDriveStorage,
  saveToGoogleDrive
} from '@cooperation/vc-storage'
import jsonld from 'jsonld'

if (jsonld) {
  const patch = (method: string, optionsIndex: number) => {
    const original = (jsonld as any)[method]
    if (typeof original === 'function') {
      ;(jsonld as any)[method] = function (...args: any[]) {
        args[optionsIndex] = { ...args[optionsIndex], safe: false }
        return original.apply(this, args)
      }
    }
  }
  ;[
    ['expand', 1],
    ['toRDF', 1],
    ['canonize', 1],
    ['normalize', 1],
    ['compact', 2],
    ['flatten', 2],
    ['frame', 2]
  ].forEach(([m, i]) => patch(m as string, i as number))
}
import type { ISkillClaimCredential } from 'hr-context'
import type { FormData } from '../credentialForm/form/types/Types'
import { normalizeSkillClaimFormData, SkillClaimFormData } from './normalization/hrContextSkillClaim'

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
  if (!storage || !engine)
    throw new Error('Storage and CredentialEngine are required.')

  const normalizedData: SkillClaimFormData = normalizeSkillClaimFormData(formData)

  let keyPair = options?.keyPair
  let issuerId = options?.issuerId

  if (!keyPair || !issuerId) {
    const { didDocument, keyPair: kp } = await engine.createDID()
    keyPair = kp
    issuerId = didDocument.id
    normalizedData.personId = normalizedData.personId ?? issuerId
  }

  if (!issuerId) throw new Error('Issuer DID is required.')

  try {
    const signedVC = await engine.signVC({
      data: normalizedData as unknown as any,
      type: 'VC',
      keyPair,
      issuerId
    }) as unknown as ISkillClaimCredential

    delete (signedVC as any).expirationDate
    delete (signedVC as any).issuanceDate
      ; (signedVC as any).issuer = issuerId
      ; (signedVC as any)['@context'] = [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        "https://w3id.org/hr/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ]

    if (Array.isArray(signedVC.type)) {
      ; (signedVC as any).type = (signedVC.type as any).filter((t: string) => t !== 'OpenBadgeCredential')
    }
    if (options?.saveToDrive) {
      const file = await saveToGoogleDrive({
        storage,
        data: signedVC,
        type: 'VC'
      })
      return { signedVC, file }
    }

    return signedVC
  } catch (error) {
    console.error('🚀 ~ signSkillClaim ~ error:', JSON.stringify(error, null, 2))
    throw error
  }
}
