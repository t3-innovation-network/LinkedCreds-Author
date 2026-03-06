export const handleUrlValidation = async (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setUrlError: (arg0: string[]) => void,
  index: number,
  urlErrorArray: string[]
) => {
  let url = event.target.value
  const updatedErrors = [...urlErrorArray] // Copy existing error array

  // Prepend https:// if protocol is missing to prevent backend errors
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  if (url) {
    try {
      const response = await fetch(`/api/fetchContent?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const { contentType } = data

      const videoRegex = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$|youtube\.com|vimeo\.com/i
      const gitHubRegex = /github\.com/i

      // Valid content types are now accepted without error messages
      if (
        videoRegex.test(url) ||
        gitHubRegex.test(url) ||
        contentType.includes('text/html') ||
        contentType.startsWith('image/') ||
        contentType.startsWith('audio/') ||
        contentType === 'application/pdf' ||
        contentType === 'application/json' ||
        contentType.startsWith('application/') ||
        contentType.startsWith('text/') ||
        contentType.startsWith('font/')
      ) {
        updatedErrors[index] = ''
      } else {
        updatedErrors[index] = ''
      }
    } catch (error: any) {
      updatedErrors[index] =
        `Failed to fetch the URL or URL is not valid: ${error.message}`
    }
  } else {
    updatedErrors[index] = 'URL cannot be empty.'
  }

  setUrlError(updatedErrors) // Set the updated errors array
}

export const ensureProtocol = (url: string): string => {
  if (!url) return url
  // Allow blob:, data:, did:, and zcap: URLs to pass through without modification
  if (
    url.startsWith('blob:') ||
    url.startsWith('data:') ||
    url.startsWith('did:') ||
    url.startsWith('zcap:')
  ) {
    return url
  }
  // Check if it starts with http:// or https://
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`
  }
  return url
}
