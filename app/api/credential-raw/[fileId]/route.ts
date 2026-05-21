import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getFileViaFirebase } from '../../../firebase/storage'
import { parseVcPayloadFromDrive } from '../../../utils/parseVcPayload'

export const dynamic = 'force-dynamic' // Makes the route dynamic instead of statically optimized

/**
 * Handles GET requests to download files
 *
 * @param request - The incoming request
 * @param params - URL parameters, including fileId
 * @returns JSON response with file data or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId
  console.log('🚀 ~ fileId:', fileId)

  if (!fileId) {
    return NextResponse.json(
      { success: false, error: 'File ID is missing' },
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  try {
    // Extract Google Drive ID if the fileId is a Drive URL
    const actualFileId = extractGoogleDriveId(fileId)

    console.log(`Processing download request for file: ${actualFileId}`)

    const jwt = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })
    const sessionAccessToken =
      typeof jwt?.accessToken === 'string' ? jwt.accessToken : undefined

    // Prefer Firestore file-owner tokens; fall back to the signed-in user's Drive token
    const fileData = await getFileViaFirebase(actualFileId, sessionAccessToken)

    if (!fileData) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const payload = parseVcPayloadFromDrive(fileData)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid credential file format' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return NextResponse.json(payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error retrieving file:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve file data' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

/**
 * Extracts a Google Drive file ID from a Drive URL
 *
 * @param url - The URL or ID to process
 * @returns The extracted Google Drive ID or the original string if not a Drive URL
 */
function extractGoogleDriveId(url: string): string {
  // Handle Google Drive links in format https://drive.google.com/file/d/{fileId}/view?usp=...
  const regex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/
  const match = url.match(regex)

  if (match && match[1]) {
    return match[1]
  }

  // If not a Google Drive link or different format, return the original
  return url
}
