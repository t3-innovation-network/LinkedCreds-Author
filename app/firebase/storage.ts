import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from './config/firebase'

interface FileTokens {
  accessToken: string
  refreshToken: string
}

interface UserTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export const getFileViaFirebase = async (fileId: string, sessionToken?: string) => {
  try {
    // Check if Firebase is configured
    if (!db) {
      console.error('Firebase is not configured. Cannot retrieve file.')
      return null
    }

    // Prefer Firestore tokens (claim owner / file owner) so recommenders and public viewers
    // can read files they do not own in their Google session. Session is fallback only.
    let accessToken = (await getAccessToken(fileId)) || sessionToken
    if (!accessToken) {
      console.warn(`No access token available for file ${fileId} (Firestore or session)`)
      return null
    }
    let response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    // Handle 401 Unauthorized by attempting a forced token refresh and retry
    if (response.status === 401) {
      console.warn(`401 Unauthorized for file ${fileId}, attempting forced token refresh...`)
      accessToken = await getAccessToken(fileId, true)
      if (accessToken) {
        response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error fetching file ${fileId} from Google Drive: ${response.status} ${response.statusText}`, errorText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error retrieving file ${fileId} from Firebase:`, error)
    return null
  }
}
/**
 * Stores both access and refresh tokens in Firestore for a Google Drive file.
 */
export const storeFileTokens = async ({
  googleFileId,
  tokens,
  /** When set, refuse to write tokens onto this claim file (avoids overwriting the claim owner's tokens). */
  protectClaimFileId
}: {
  googleFileId: string
  tokens: FileTokens
  protectClaimFileId?: string
}): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase is not configured')
    }

    if (!googleFileId) {
      throw new Error('googleFileId is required')
    }

    if (protectClaimFileId && googleFileId === protectClaimFileId) {
      throw new Error(
        `Refusing to store tokens on claim file ${protectClaimFileId}; use the new recommendation Drive file id instead.`
      )
    }

    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new Error('Invalid tokens object')
    }
    await setDoc(
      doc(db, 'files', googleFileId),
      {
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600 * 1000, // 1 hour from now,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      },
      {
        merge: true
      }
    )

    console.log(`Tokens stored for file ${googleFileId}`)
  } catch (error) {
    console.error('Error storing file tokens:', error)
    throw error
  }
}

export const getAccessToken = async (fileId: string, forceRefresh: boolean = false) => {
  try {
    if (!db) {
      console.error('Firebase is not configured. Cannot retrieve access token.')
      return null
    }

    const docRef = doc(db, 'files', fileId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.error(`No tokens found for file: ${fileId}`)
      return null
    }

    const data = docSnap.data()

    if (!data || !data.accessToken || !data.expiresAt) {
      console.error(`Invalid token data for file: ${fileId}`)
      return null
    }

    const isExpired = data.expiresAt < Date.now()
    if (isExpired || forceRefresh) {
      console.log(`Access token for file ${fileId} is ${forceRefresh ? 'being forced to refresh' : 'expired'}, refreshing...`)
      try {
        const refreshedToken = await refreshAccessToken({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
          googleFileId: fileId
        })
        return refreshedToken.accessToken
      } catch (refreshError) {
        console.warn(`Token refresh failed for file ${fileId}, returning null:`, refreshError)
        return null
      }
    }

    return data.accessToken
  } catch (error) {
    console.error(`Error retrieving tokens for file ${fileId}:`, error)
    return null
  }
}


const refreshAccessToken = async (tokens: any) => {
  try {

    const apiBase =
      typeof window !== 'undefined'
        ? ''
        : process.env.NEXTAUTH_URL ||
          process.env.NEXT_PUBLIC_APP_BASE_URL ||
          'http://localhost:3000'

    const response = await fetch(`${apiBase}/api/google-token-refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refreshToken })
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Google token refresh failed:', data)
      throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
    }
    const newAccessToken = data.access_token

    if (!newAccessToken) {
      console.error('Token refresh failed – Google returned no access_token:', data)
      throw new Error('Token refresh failed: no access_token in response')
    }

    // Update the access token in Firestore
    await updateFileAccessToken({
      googleFileId: tokens.googleFileId,
      accessToken: newAccessToken
    })

    return { ...tokens, accessToken: newAccessToken, expiresAt: Date.now() + 3600 * 1000 }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw error
  }
}

/**
 * Updates the access token for a Google Drive file in Firestore.
 */
export const updateFileAccessToken = async ({
  googleFileId,
  accessToken
}: {
  googleFileId: string
  accessToken: string
}): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase is not configured')
    }

    await setDoc(
      doc(db, 'files', googleFileId),
      { accessToken, expiresAt: Date.now() + 3600 * 1000 },
      { merge: true }
    )
  } catch (error) {
    console.error('Error updating file access token:', error)
    throw error
  }
}

/**
 * Retrieves tokens for a specific Google Drive file from Firestore.
 */
export const getFileTokens = async ({ googleFileId }: { googleFileId: string }) => {
  try {
    if (!db) {
      console.error('Firebase is not configured. Cannot retrieve file tokens.')
      return null
    }

    const docRef = doc(db, 'files', googleFileId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (error) {
    console.error('Error retrieving file tokens:', error)
    throw error
  }
}

/**
 * Retrieves tokens from Firestore for a specific user.
 */
export const getUserTokens = async ({
  userId
}: {
  userId: string
}): Promise<UserTokens | null> => {
  try {
    if (!db) {
      console.error('Firebase is not configured. Cannot retrieve user tokens.')
      return null
    }

    const docRef = doc(db, 'users', userId, 'tokens', 'googleDrive')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as UserTokens
    }
    return null
  } catch (error) {
    console.error('Error retrieving user tokens:', error)
    throw error
  }
}



/**
 * Deletes tokens for a Google Drive file from Firestore.
 */
export const deleteFileTokens = async ({
  googleFileId
}: {
  googleFileId: string
}): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase is not configured')
    }

    await deleteDoc(doc(db, 'files', googleFileId))
    console.log(`Deleted Firestore tokens doc for file ${googleFileId}`)
  } catch (error) {
    console.error('Error deleting file tokens:', error)
    throw error
  }
}

/**
 * Deletes user tokens from Firestore.
 */
export const deleteUserTokens = async ({ userId }: { userId: string }): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase is not configured')
    }

    await setDoc(doc(db, 'users', userId, 'tokens', 'googleDrive'), {})
  } catch (error) {
    console.error('Error deleting user tokens:', error)
    throw error
  }
}
