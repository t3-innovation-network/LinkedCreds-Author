import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { GoogleDriveStorage } from '@cooperation/vc-storage'

interface ClaimDetail {
  data: {
    '@context': string[]
    id: string
    type: string[]
    issuer: {
      id: string
      type: string[]
    }
    issuanceDate: string
    expirationDate: string
    credentialSubject: {
      [x: string]: any
      type: string[]
      name: string
      achievement: any
      duration: string
      portfolio: any
    }
  }
}

const useGoogleDrive = () => {
  const [fileMetadata, setFileMetadata] = useState<any | null>(null)
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null)
  const [storage, setStorage] = useState<GoogleDriveStorage | null>(null)
  const { data: session } = useSession()
  const accessToken = session?.accessToken

  useEffect(() => {
    if (accessToken) {
      try {
        const storageInstance = new GoogleDriveStorage(accessToken)
        setStorage(storageInstance)
      } catch (error) {
        console.error('Error initializing GoogleDriveStorage:', error)
      }
    } else {
      console.warn('No access token available.')
    }
  }, [accessToken])

  const memoizedStorage = storage

  const getContent = useCallback(async (fileID: string) => {
    try {
      const response = await fetch(`/api/drive/${fileID}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const text = await blob.text()
      const dataBody = JSON.parse(text)
      const data = JSON.parse(dataBody.body)
      console.log(':  getContent  data', data)

      return {
        success: true,
        data,
        contentType: response.headers.get('content-type')
      }
    } catch (error) {
      console.error('Error fetching file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }, [])

  const extractGoogleDriveId = (url: string) => {
    const marker = '/file/d/'
    const startIndex = url.indexOf(marker)

    if (startIndex !== -1) {
      const idPart = url.substring(startIndex + marker.length)
      const endIndex = idPart.indexOf('/')
      if (endIndex !== -1) {
        return idPart.substring(0, endIndex)
      } else {
        return idPart
      }
    } else {
      return null
    }
  }

  const fetchFileMetadata = useCallback(
    async (fileID: string, resourceKey: string = '') => {
      if (!fileID || !accessToken) {
        console.error('FileId or Access token is missing or invalid')
        return {
          success: false,
          error: !fileID ? 'File ID is missing' : 'Access token is missing or invalid'
        }
      }

      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileID}?fields=id,name,mimeType,owners&supportsAllDrives=true`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        if (response.ok) {
          const metadata = await response.json()
          setFileMetadata(metadata)

          if (metadata.owners && metadata.owners.length > 0) {
            setOwnerEmail(metadata.owners[0].emailAddress)
          }
          return { success: true, metadata }
        } else if (response.status === 404) {
          console.error('File not found (404):', fileID)
          return { success: false, error: 'File not found or has been deleted' }
        } else {
          console.error('Error fetching file metadata:', response.statusText)
          return { success: false, error: `Failed to fetch metadata: ${response.statusText}` }
        }
      } catch (error) {
        console.error('Error fetching file metadata:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    },
    [accessToken]
  )

  return {
    getContent,
    fetchFileMetadata,
    fileMetadata,
    ownerEmail,
    storage
  }
}

export default useGoogleDrive
