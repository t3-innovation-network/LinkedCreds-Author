// Google Drive operations and data fetching utilities

import { isValidRecommendation } from './recommendationHelpers'
import { isSkillCredential } from './claimsHelpers'

// JSON parsing utility
export const safeJSON = (v: string) => {
  try {
    const j = JSON.parse(v)
    if (typeof j === 'string' && j.trim().startsWith('<')) return null
    return j
  } catch {
    return null
  }
}

// Extract Google Drive IDs from URLs
export const pickDriveIds = (url: string) => {
  const re1 = /\/d\/([\w-]{10,})/
  const re2 = /[?&]id=([\w-]{10,})/
  const match = re1.exec(url) ?? re2.exec(url)
  return match ? match[1] : null
}

// Safe delete operation
export const safeDelete = async (storage: any, fileId: string | null) => {
  if (!fileId) return
  try {
    await storage.delete(fileId)
  } catch (err: any) {
    const msg: string = err?.message ?? ''
    if (msg.includes('File not found') || msg.includes('Expected JSON')) return
    throw err
  }
}

// Complete teardown operation for claims
export const tearDown = async (storage: any, claim: any) => {
  const fileId = claim.id?.id ?? ''
  let parents
  try {
    parents = await storage.getFileParents(fileId)
  } catch (err: any) {
    const msg: string = err?.message ?? ''
    if (!msg.includes('File not found')) throw err
    parents = []
  }
  const folderId = parents?.[0] ?? null
  let relationsId: string | null = null
  if (folderId != null) {
    try {
      const kids = await storage.findFolderFiles(folderId)
      const r = kids.find((f: any) => f?.name === 'RELATIONS')
      relationsId = r?.id ?? null
    } catch { }
  }
  await safeDelete(storage, fileId)
  await safeDelete(storage, relationsId)
  const data = safeJSON(claim.id.data?.body ?? '') ?? claim
  const urls: string[] = []
  const ev = data?.credentialSubject?.evidence || data?.credentialSubject?.portfolio || []
  ev.forEach((p: any) => urls.push(p.url))
  if (data?.credentialSubject?.evidenceLink)
    urls.push(data.credentialSubject.evidenceLink)
  data?.credentialSubject?.achievement?.forEach((a: any) => {
    if (a.image?.id) urls.push(a.image.id)
  })
  const ids = urls.map(pickDriveIds).filter(Boolean) as string[]
  await Promise.all(ids.map((i: string) => safeDelete(storage, i)))
}

// Fetch all recommendations from Google Drive
export const getAllRecommendations = async (storage: any): Promise<any[]> => {
  try {
    const driveFiles = await storage?.getAllFilesByType('RECOMMENDATIONs' as any)
    if (!driveFiles?.length) return []

    const recommendations = []
    for (const file of driveFiles) {
      try {
        const content = safeJSON(file?.data?.body)
        if (
          content &&
          '@context' in content &&
          content.type?.includes('https://schema.org/RecommendationCredential')
        ) {
          const recommendation = {
            ...content,
            id: file
          }
          if (isValidRecommendation(recommendation)) {
            recommendations.push(recommendation)
          }
        }
      } catch (error) {
        console.error(`Error processing recommendation file ${file}:`, error)
        continue
      }
    }

    return recommendations
  } catch (error) {
    console.error('Error fetching recommendations from drive:', error)
    return []
  }
}

// Fetch all claims from Google Drive (always fresh, no local cache)
export const getAllClaims = async (storage: any): Promise<any[]> => {
  try {
    const driveFiles = await storage?.getAllFilesByType('VCs')
    if (!driveFiles?.length) return []

    const vcs = []
    for (const file of driveFiles) {
      try {
        const content = safeJSON(file?.data?.body)
        if (content && '@context' in content) {
          const credential = {
            ...content,
            id: file
          }
          if (isSkillCredential(credential)) {
            vcs.push(credential)
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error)
        continue
      }
    }

    return vcs
  } catch (error) {
    console.error('Error fetching claims from drive:', error)
    return []
  }
}
