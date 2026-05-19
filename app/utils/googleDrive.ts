import { GoogleDriveStorage, saveToGoogleDrive } from '@cooperation/vc-storage'
import { createDID, signCred } from './credential'
import { getAccessToken } from '../firebase/storage'

export async function ensureCredentialsFolderCached(storage: GoogleDriveStorage): Promise<void> {
  const cache = (GoogleDriveStorage as any).folderCache

  if (cache['root'] && Array.isArray(cache['root']) && cache['root'].some((f: any) => f.name === 'Credentials')) {
    return
  }
  const existingFolders: any[] = await (storage as any).searchFiles(
    `name='Credentials' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  )

  if (existingFolders && existingFolders.length > 0) {
    cache['root'] = existingFolders
  } else {
    delete cache['root']
  }
}

export async function saveRaw(accessToken: string | undefined, data: any) {
  if (!accessToken) {
    throw new Error('No access token available')
  }

  const storage = new GoogleDriveStorage(accessToken)
  try {
    await ensureCredentialsFolderCached(storage)
    const file = (await saveToGoogleDrive({ storage, data, type: 'VC' })) as any

    console.log('saved to google drive:', file)
    return file
  } catch (error) {
    console.error('Google Drive operation failed:', error)
    throw error
  }
}

export async function signAndSave(accessToken: string | undefined, data: any) {
  if (!accessToken) {
    throw new Error('No access token available')
  }

  const storage = new GoogleDriveStorage(accessToken)
  try {
    await ensureCredentialsFolderCached(storage)
    const { didDocument, keyPair, issuerId } = await createDID(accessToken)
    const saveResponse = await saveToGoogleDrive({
      storage,
      data: {
        didDocument,
        keyPair
      },
      type: 'DID'
    })
    const res = await signCred(accessToken, data, issuerId, keyPair, 'VC', null)
    const file = (await saveToGoogleDrive({ storage, data: res, type: 'VC' })) as any

    console.log('saved to google drive:', res)
    return file
  } catch (error) {
    console.error('Google Drive operation failed:', error)
    throw error
  }
}

export function makeGoogleDriveLink(file: any) {
  return `https://drive.google.com/file/d/${file.id}/view`
}

/**
 * Add a recommendation file id to the claim owner's RELATIONS file on Drive.
 * Uses claim-owner tokens from Firestore — the recommender cannot access that folder.
 */
export async function linkRecommendationToClaimOnDrive(
  claimFileId: string,
  recommendationFileId: string
): Promise<void> {
  const claimAccessToken = await getAccessToken(claimFileId)
  if (!claimAccessToken) {
    throw new Error(`No claim owner token in Firestore for file ${claimFileId}`)
  }

  const storage = new GoogleDriveStorage(claimAccessToken)
  const parents = await storage.getFileParents(claimFileId)
  const vcFolderId = Array.isArray(parents) ? parents[0] : parents
  if (!vcFolderId) {
    throw new Error(`Unable to resolve parent folder for claim file ${claimFileId}`)
  }

  const vcFolderFiles = await storage.findFolderFiles(vcFolderId)
  let relationsFile = vcFolderFiles.find((f: { name?: string }) => f.name === 'RELATIONS')

  if (!relationsFile) {
    relationsFile = await storage.createRelationsFile({ vcFolderId })
  }

  await storage.updateRelationsFile({
    relationsFileId: relationsFile.id,
    recommendationFileId
  })
}
