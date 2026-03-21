/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
  Button,
  Collapse,
  Container,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Link as MuiLink,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  styled,
  OutlinedInput,
  Stack
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import Image from 'next/image'
import {
  SVGSparklesBlue,
  SVGBadgeCheck,
  SVGRecommendBadge,
  DescriptionOutlinedIcon,
  InsertLinkIcon
} from '../../Assets/SVGs'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import { useSession } from 'next-auth/react'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { GoogleDriveStorage } from '@cooperation/vc-storage'
import {
  BadgePill,
  SkillBadgePill,
  CredentialTitle,
  DescriptionText,
  ExperienceText,
  MediaContainer,
  Media,
  RecipientName,
  SectionHeader,
  publicLinkBoxStyles,
  publicLinkInputStyles,
  copyButtonStyles,
  qrCodeBoxStyles,
  credentialCardStyles,
  recommendationListCardStyles,
  recommendationDetailLabelStyles,
  recommendationDetailValueStyles,
  recommendationSkillChipStyles,
  verificationBadgeBoxStyles,
  verificationBadgeTextStyles,
  askRecommendationButtonStyles,
  minimizedCredentialCardStyles,
  minimizedCredentialTitleStyles,
  viewMoreButtonStyles,
  carouselNavButtonStyles,
  carouselCounterStyles,
  recThumbnailContainerStyles,
  recThumbnailImageStyles,
  recEvidenceLinkRowStyles,
  recEvidenceLinkTextStyles
} from '../../components/Styles/appStyles'
import dynamic from 'next/dynamic'
import { getAccessToken, getFileViaFirebase } from '../../firebase/storage'
import QRCode from 'react-qr-code'
import GenericCredentialViewer from './GenericCredentialViewer'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import { verifyCredential } from '../../utils/verification'
import { ensureProtocol } from '../../utils/urlValidation'
import { generateLinkedInUrl } from '../../utils/claimsHelpers'
import { copyFormValuesToClipboard } from '../../utils/formUtils'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}
// Define types
interface CredentialSubject {
  type?: string[] // e.g. ['SkillClaim'] in new ISkillClaimCredential format
  name?: string
  durationPerformed?: string
  howKnow?: string
  recommendationText?: string
  qualifications?: string
  explainAnswer?: string
  skillsEndorsed?: string[]
  removedSkills?: string[]
  // ISkillClaimCredential format (new)
  skill?: {
    id: string
    name: string
    description?: string
    source?: string
    frameworkMatch?: {
      framework?: string
      socCode?: string[]
      name?: string
      similarityScore?: number
    }[]
  }[]
  narrative?: string
  description?: string
  person?: { type: string[]; id?: string; name?: string; email?: string }
  evidence?: { id?: string; url?: string; name: string }[]
  portfolio?: { id?: string; url?: string; name: string }[]
}
interface ClaimDetail {
  '@context': string[]
  id: string
  name?: string // W3C VC top-level credential title
  uniqueId?: string
  type: string[]
  issuanceDate?: string
  validFrom?: string
  expirationDate?: string
  credentialSubject: CredentialSubject
  proof?: {
    created: string
    [key: string]: any
  }
  evidence?: { id: string; name: string }[]
}
interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error'
}
interface ComprehensiveClaimDetailsProps {
  onAchievementLoad?: (achievementName: string) => void
  fileID?: string
  minimized?: boolean
}
const cleanHTML = (htmlContent: any): string => {
  if (typeof htmlContent !== 'string') {
    return ''
  }
  return htmlContent
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p><\/p>/g, '')
    .replace(/<br>/g, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
}

// --- Ported from Page.tsx ---

// PDF thumbnail generation
const renderPDFThumbnail = async (fileUrl: string): Promise<string> => {
  try {
    const loadingTask = getDocument({ url: fileUrl })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not get 2D context')

    canvas.height = viewport.height
    canvas.width = viewport.width
    await page.render({ canvasContext: context, viewport }).promise
    return canvas.toDataURL()
  } catch (error) {
    console.error('Error rendering PDF thumbnail:', error)
    return '/fallback-pdf-thumbnail.svg'
  }
}

// Video thumbnail generation
const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = videoUrl
    video.addEventListener(
      'loadeddata',
      () => {
        video.currentTime = 1
      },
      { once: true }
    )
    video.addEventListener(
      'seeked',
      () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get 2D canvas context'))
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataURL = canvas.toDataURL('image/png')
        resolve(dataURL)
      },
      { once: true }
    )

    video.addEventListener('error', e => {
      reject(e)
    })
  })
}

// Helper functions for file type detection
const isPDF = (fileName: string) => fileName?.toLowerCase().endsWith('.pdf')
const isMP4 = (fileName: string) => fileName?.toLowerCase().endsWith('.mp4')
const isGoogleDriveImageUrl = (url: string): boolean => {
  return /https:\/\/drive\.google\.com\/uc\?export=view&id=.+/.test(url)
}

const getDirectGoogleDriveUrl = (url: string): string => {
  try {
    const urlObject = new URL(url)
    if (urlObject.hostname === 'drive.google.com') {
      let fileIdMatch = url.match(/[?&]id=([^&]+)/)
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}`
      }
      fileIdMatch = url.match(/\/file\/d\/([^\/]+)/)
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}`
      }
    }
  } catch (e) { }
  return url
}

// Styled components
const HeaderContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '800px',
  padding: theme.breakpoints.down('sm') ? '18px' : '30px',
  borderRadius: '20px 20px 0 0',
  borderLeft: '1px solid #d1e4ff',
  borderRight: '1px solid #d1e4ff',
  borderBottom: '1px solid #d1e4ff',
  display: 'flex',
  alignItems: 'center',
  margin: '0 auto'
}))

const MainContentContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'currentStep'
})<{ currentStep?: number }>(({ theme, currentStep }) => ({
  width: '100%',
  maxWidth: '820px',
  backgroundColor: '#fff', // Always white for view mode
  borderRadius: '0 0 20px 20px',
  gap: '24px'
}))

const SkillCard = styled(Card)(({ theme }) => ({
  padding: theme.breakpoints.down('sm') ? '10px 8px' : '15px 30px',
  backgroundColor: '#fff',
  borderRadius: '10px',
  border: '1px solid #2563EB',
  width: '100%'
}))

const FieldLabel = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: theme.breakpoints.down('sm') ? '14px' : '16px',
  fontWeight: 700,
  lineHeight: '24px',
  color: '#000e40',
  letterSpacing: '0.08px'
}))

const FieldValue = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: theme.breakpoints.down('sm') ? '14px' : '16px',
  fontWeight: 400,
  lineHeight: '24px',
  color: '#000E40',
  letterSpacing: '0.08px',
  wordBreak: 'break-word',
  whiteSpace: 'pre-line',
  overflowWrap: 'anywhere'
}))

// Field component for consistent styling
interface FieldProps {
  label: string
  value?: string
  isHtml?: boolean
  placeholder?: string
}

const Field: React.FC<FieldProps> = ({ label, value, isHtml, placeholder }) => (
  <Box sx={{ mb: 1.5 }}>
    <FieldLabel>{label}</FieldLabel>
    {isHtml && value ? (
      <FieldValue>
        <span dangerouslySetInnerHTML={{ __html: value }} />
      </FieldValue>
    ) : value ? (
      <FieldValue>{value}</FieldValue>
    ) : (
      <FieldValue sx={{ fontStyle: 'italic', color: '#4e4e4e' }}>
        {placeholder || '...'}
      </FieldValue>
    )}
  </Box>
)

const GreenCheckMark = () => (
  <svg
    width='12'
    height='13'
    viewBox='0 0 12 13'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M10 3.625L4.5 9.125L2 6.625'
      stroke='#12B76A'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

const ComprehensiveClaimDetails: React.FC<ComprehensiveClaimDetailsProps> = ({
  onAchievementLoad,
  fileID: propFileID,
  minimized = false
}) => {
  const params = useParams()
  const fileID = propFileID || (params?.id as string)

  const [claimDetail, setClaimDetail] = useState<ClaimDetail | null>(null)
  const [comments, setComments] = useState<ClaimDetail[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const accessToken = session?.accessToken
  const isView = pathname?.includes('/view')
  const isRecommendationsPage = pathname?.includes('/recommendations/')
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({})
  const [isExpanded, setIsExpanded] = useState(!minimized)

  const credentialSubject = claimDetail?.credentialSubject

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  const handleShareOption = (
    option: 'LinkedIn' | 'Email' | 'CopyURL' | 'View' | 'LinkedTrust'
  ) => {
    const credentialLink = `https://linkedcreds.allskillscount.org/view/${fileID}`

    if (option === 'LinkedIn') {
      const linkedInUrl = generateLinkedInUrl(claimDetail)
      window.open(linkedInUrl, '_blank', 'noopener noreferrer')
      return
    }

    if (option === 'CopyURL') {
      copyFormValuesToClipboard(credentialLink)
      showNotification('Link copied to clipboard!', 'success')
      return
    }

    if (option === 'View') {
      window.location.href = credentialLink
      return
    }

    if (option === 'Email') {
      const mailPageUrl = `${window.location.origin}/mail/${fileID}`
      window.location.href = mailPageUrl
    }
  }

  const credentialTitle = claimDetail?.name || credentialSubject?.name || ''
  const personName = credentialSubject?.person?.name || ''
  const credentialNarrative = credentialSubject?.description || credentialSubject?.narrative || ''

  useEffect(() => {
    if (onAchievementLoad && credentialTitle) {
      onAchievementLoad(credentialTitle)
    }
  }, [onAchievementLoad, credentialTitle])

  const displayEvidence = useMemo(() => {
    if (!claimDetail && !credentialSubject) return []
    const evidenceItems =
      credentialSubject?.evidence ||
      claimDetail?.evidence ||
      (credentialSubject as any)?.portfolio ||
      (claimDetail as any)?.portfolio
    if (!evidenceItems || !Array.isArray(evidenceItems)) return []

    const evidence: {
      name: string
      url: string
      googleId?: string
      wasId?: string
      type?: string[]
    }[] = []

    // Add evidence items
    evidenceItems.forEach(item => {
      const itemUrl = item.url || item.id
      if (itemUrl) {
        // Extract googleId from URL if possible
        let googleId = undefined
        const match =
          itemUrl.match(/\/file\/d\/([^/]+)/) || itemUrl.match(/[?&]id=([^&]+)/)
        if (match && match[1]) {
          googleId = match[1]
        }

        evidence.push({
          name: item.name || itemUrl,
          url: itemUrl,
          googleId: googleId,
          wasId: undefined,
          type: ['Evidence']
        })
      }
    })

    return evidence
  }, [claimDetail, credentialSubject])

  // Helper to convert Google Drive share links to direct view links
  const getGoogleDriveDirectLink = (url: string): string => {
    if (!url) return ''
    // Already a direct link?
    if (url.includes('drive.google.com/uc?export=view')) return url

    // Try to match the ID from standard share URLs
    const match = url.match(/\/file\/d\/([^/]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`
    }

    return url
  }

  // Carousel State
  const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})
  const [imageThumbnails, setImageThumbnails] = useState<Record<string, string>>({})
  const [viewToken, setViewToken] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [isHoveringMedia, setIsHoveringMedia] = useState<boolean>(false)
  const [displayFiles, setDisplayFiles] = useState<
    { id: string; name: string; url: string; isFeatured?: boolean }[]
  >([])

  const isImage = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) || isGoogleDriveImageUrl(url)

  // Prepare display files from credential data
  useEffect(() => {
    if (credentialSubject) {
      const files: { id: string; name: string; url: string; isFeatured?: boolean }[] = []

      // Top-level evidence items - Add only if visual
      if (claimDetail?.evidence && Array.isArray(claimDetail.evidence)) {
        claimDetail.evidence.forEach((item, index) => {
          if (item.id) {
            const url = getGoogleDriveDirectLink(ensureProtocol(item.id))
            const name = item.name || `Evidence ${index + 1}`
            if (
              isImage(url) ||
              isPDF(name) ||
              isPDF(item.id) ||
              isMP4(name) ||
              isMP4(item.id)
            ) {
              files.push({
                id: `evidence-${index}`,
                name: name,
                url: url
              })
            }
          }
        })
      }

      setDisplayFiles(files)
    }
  }, [credentialSubject])

  // Generate thumbnails
  useEffect(() => {
    displayFiles.forEach(async file => {
      let finalFileUrl = file.url
      let isFetchedBlob = false

      // Google Drive secure fetch for any file
      if (isGoogleDriveImageUrl(file.url) && viewToken) {
        try {
          // Extract ID from Google Drive URL
          const match = file.url.match(/id=([^&]+)/)
          if (match && match[1]) {
            const fileId = match[1]
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              {
                headers: {
                  Authorization: `Bearer ${viewToken}`
                }
              }
            )
            if (response.ok) {
              const blob = await response.blob()
              finalFileUrl = URL.createObjectURL(blob)
              isFetchedBlob = true
            } else {
              // Fallback to direct URL if fetch fails (public files)
              console.warn(
                'Failed to fetch private image blob, using direct URL',
                response.status
              )
            }
          }
        } catch (e) {
          console.error('Error fetching image blob:', e)
        }
      }

      // PDF handling
      if (isPDF(file.name || file.url) && !pdfThumbnails[file.id]) {
        const thumbnail = await renderPDFThumbnail(finalFileUrl)
        setPdfThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
        return
      }

      // Video handling
      if (isMP4(file.name || file.url) && !videoThumbnails[file.id]) {
        try {
          const thumbnail = await generateVideoThumbnail(finalFileUrl)
          setVideoThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
        } catch (error) {
          console.error('Error generating video thumbnail:', error)
          setVideoThumbnails(prev => ({
            ...prev,
            [file.id]: '/fallback-video.png'
          }))
        }
        return
      }

      // Standard Image handling
      if (!imageThumbnails[file.id] && (isFetchedBlob || isImage(file.url))) {
        setImageThumbnails(prev => ({ ...prev, [file.id]: finalFileUrl }))
      }
    })
  }, [displayFiles, viewToken])

  const handleNextImage = () => {
    if (displayFiles.length > 1) {
      setCurrentImageIndex(prev => (prev + 1) % displayFiles.length)
    }
  }

  const handlePrevImage = () => {
    if (displayFiles.length > 1) {
      setCurrentImageIndex(prev => (prev - 1 + displayFiles.length) % displayFiles.length)
    }
  }

  // Get current display image
  const currentDisplayFile =
    displayFiles.length > 0 ? displayFiles[currentImageIndex] : null

  useEffect(() => {
    if (!fileID) {
      setErrorMessage('Invalid claim ID.')
      setLoading(false)
      return
    }
    if (status === 'loading') {
      return
    }
    const fetchDriveData = async () => {
      try {
        setLoading(true)
        // Try Firestore token first; fall back to live session token if null
        let accessToken1: string | null = await getAccessToken(fileID)
        if (!accessToken1) {
          accessToken1 = accessToken ?? null
        }

        let vcResponse: Response

        if (accessToken1) {
          setViewToken(accessToken1)
          vcResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileID}?alt=media`,
            { headers: { Authorization: `Bearer ${accessToken1}` } }
          )

          // If the stored token returns Unauthorized, fallback to the user's live session token
          if (vcResponse.status === 401 && accessToken && accessToken !== accessToken1) {
            console.warn(
              'Stored token was unauthorized. Retrying with active session token...'
            )
            accessToken1 = accessToken
            setViewToken(accessToken1)

            vcResponse = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileID}?alt=media`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken1}`
                }
              }
            )
          }
        } else {
          // We have no valid token in hand. To support unauthenticated visits (e.g. public links),
          // we try proxying via the Firebase API / serverless functions as a last resort fallback instead
          // of immediately throwing an error.
          console.warn(
            'No active tokens found. Attempting to fall back to anonymous proxy fetch...'
          )
          vcResponse = await fetch(`/api/drive/${fileID}`)

          if (!vcResponse.ok) {
            setErrorMessage(
              'Your Google session has expired. Please sign out and sign back in.'
            )
            setLoading(false)
            return
          }
        }

        if (!vcResponse.ok) {
          setErrorMessage('Failed to load credential data.')
          setLoading(false)
          return
        }

        const vcData = await vcResponse.json()
        if (!vcData) {
          throw new Error('No data found for this credential.')
        }

        let parsedVc = vcData
        if (vcData.body && typeof vcData.body === 'string') {
          parsedVc = JSON.parse(vcData.body)
        } else if (typeof vcData === 'string') {
          parsedVc = JSON.parse(vcData)
        }

        if (parsedVc) {
          setClaimDetail(parsedVc as unknown as ClaimDetail)
        }

        const shouldFetchRecommendations = isView || !!propFileID
        if (shouldFetchRecommendations && accessToken1) {
          // Reinstantiate storage with the final working token
          const uncachedStorage = new GoogleDriveStorage(accessToken1)
          const vcFolderId = await uncachedStorage.getFileParents(fileID)
          const files = await uncachedStorage.findFolderFiles(vcFolderId)
          const relationsFile = files.find((f: any) => f.name === 'RELATIONS')

          if (relationsFile) {
            const relationsContent = await uncachedStorage.retrieve(relationsFile.id)
            const relationsData = relationsContent?.data?.body
              ? JSON.parse(relationsContent.data.body)
              : relationsContent?.data

            const rawIds = Array.isArray(relationsData?.recommendations)
              ? relationsData.recommendations
              : []
            const recommendationIds = rawIds.filter(
              (id: any): id is string => typeof id === 'string' && id.trim().length > 0
            )

            const recommendations = await Promise.all(
              recommendationIds.map(async (recId: string) => {
                try {
                  const recFile = await getFileViaFirebase(recId, accessToken as string)
                  if (!recFile) return null

                  let parsed = recFile
                  if (recFile.body && typeof recFile.body === 'string') {
                    parsed = JSON.parse(recFile.body)
                  } else if (typeof recFile === 'string') {
                    parsed = JSON.parse(recFile)
                  }

                  if (parsed) {
                    parsed.uniqueId = recId
                    return parsed
                  }
                  return null
                } catch (e) {
                  console.warn('Failed to load recommendation file:', recId, e)
                  return null
                }
              })
            )
            const validRecs = recommendations.filter(Boolean)
            if (validRecs.length) {
              setComments(validRecs as any)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching claim details:', error)
        setErrorMessage('Failed to fetch claim details.')
      } finally {
        setLoading(false)
      }
    }

    fetchDriveData()
  }, [accessToken, fileID, status, isView, propFileID])

  const handleToggleComment = (commentId: string) => {
    setExpandedComments(prevState => ({
      ...prevState,
      [commentId]: !prevState[commentId]
    }))
  }
  if (status === 'loading' || loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (errorMessage) {
    return (
      <Typography variant='h6' color='error' align='center' sx={{ mt: 4 }}>
        {errorMessage}
      </Typography>
    )
  }

  // Check if this is an external credential
  const isExternalCredential = () => {
    if (!claimDetail) return false

    const subject = claimDetail.credentialSubject || {}

    // New ISkillClaimCredential format (hr-context): type includes 'SkillClaim' or has skill array
    const isSkillClaim =
      Array.isArray(subject.type) && subject.type.includes('SkillClaim')
    const hasSkillArray = Array.isArray(subject.skill)
    if (isSkillClaim || hasSkillArray) return false

    return true
  }

  const recommendations = (
    <Box sx={{}}>
      {loading ? (
        <Box display='flex' justifyContent='center' my={2}>
          <CircularProgress size={24} />
        </Box>
      ) : comments && comments.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant='h6'
            sx={{ mb: 2, color: '#000E40', fontFamily: 'Inter', fontWeight: 700 }}
          >
            Recommendations ({comments.length})
          </Typography>
          {comments.map((comment: ClaimDetail, index: number) => {
            const uniqueKey = comment.uniqueId || comment.id || index.toString()
            const isExpanded = expandedComments[uniqueKey]

            return (
              <Box
                key={uniqueKey}
                sx={recommendationListCardStyles}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggleComment(uniqueKey)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: '#E0F2FE',
                        color: '#003FE0',
                        width: 40,
                        height: 40,
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      {comment.credentialSubject?.name //Avatar of the recommender
                        ? comment.credentialSubject.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                        : 'U'}
                    </Avatar>
                    <Box>
                      <Typography
                        variant='subtitle1'
                        sx={{
                          fontWeight: 600,
                          color: '#101828',
                          fontSize: '14px',
                          lineHeight: '20px'
                        }}
                      >
                        {comment.credentialSubject?.name || 'Unknown User'}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size='small' sx={{ color: '#98A2B3' }}>
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    {/* How they know you */}
                    {comment.credentialSubject?.howKnow && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          sx={recommendationDetailLabelStyles}
                        >
                          How {comment.credentialSubject.name || 'this person'} knows you:
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={recommendationDetailValueStyles}
                        >
                          <span
                            dangerouslySetInnerHTML={{
                              __html: cleanHTML(comment.credentialSubject.howKnow)
                            }}
                          />
                        </Typography>
                      </Box>
                    )}

                    {/* Skills Endorsed */}
                    {comment.credentialSubject?.skillsEndorsed &&
                      comment.credentialSubject.skillsEndorsed.length > 0 && (
                        <Box sx={{ mt: 2, mb: 2 }}>
                          <Typography
                            variant='subtitle2'
                            sx={recommendationDetailLabelStyles}
                          >
                            Skills Endorsed: (
                            {comment.credentialSubject.skillsEndorsed.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {comment.credentialSubject.skillsEndorsed.map(
                              (skill: any, skillIndex: number) => (
                                <Chip
                                  key={`${skill.id ?? skill.uuid ?? 'skill'}-${skillIndex}`}
                                  label={skill.name ?? skill.targetName}
                                  size='small'
                                  sx={recommendationSkillChipStyles}
                                />
                              )
                            )}
                          </Box>
                        </Box>
                      )}

                    {/* Recommendation Text */}
                    {comment.credentialSubject?.recommendationText && (
                      <Box sx={{}}>
                        <Typography
                          variant='subtitle2'
                          sx={recommendationDetailLabelStyles}
                        >
                          Recommendation:
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={recommendationDetailValueStyles}
                        >
                          <span
                            dangerouslySetInnerHTML={{
                              __html: cleanHTML(
                                comment.credentialSubject.recommendationText
                              )
                            }}
                          />
                        </Typography>
                      </Box>
                    )}

                    {/* Your Qualifications */}
                    {comment.credentialSubject?.qualifications && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant='subtitle2'
                          sx={recommendationDetailLabelStyles}
                        >
                          Qualifications:
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#475467' }}>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: cleanHTML(comment.credentialSubject.qualifications)
                            }}
                          />
                        </Typography>
                      </Box>
                    )}
                    {/* Explain Your Answer */}
                    {comment.credentialSubject?.explainAnswer && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant='subtitle2'
                          sx={recommendationDetailLabelStyles}
                        >
                          Additional Context:
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#475467' }}>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: cleanHTML(comment.credentialSubject.explainAnswer)
                            }}
                          />
                        </Typography>
                      </Box>
                    )}
                    {/* Supporting Evidence */}
                    {(() => {
                      const evidenceItems =
                        comment.credentialSubject?.evidence ||
                        (comment.credentialSubject as any)?.portfolio ||
                        comment.evidence
                      if (Array.isArray(evidenceItems) && evidenceItems.length > 0) {
                        const isFile = (url: string, name: string) => url.includes('drive.google.com') || isImage(name || url) || isPDF(name || url) || isMP4(name || url)
                        const mediaItems = evidenceItems.filter((e: any) => isFile(e.url || e.id || '', e.name || ''))

                        return (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant='subtitle2'
                              sx={recommendationDetailLabelStyles}
                            >
                              Supporting Evidence:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* Thumbnails row */}
                              {mediaItems.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mt: '8px', mb: '8px' }}>
                                  {mediaItems.map((file: any, index: number) => {
                                    const rawUrl = file.url || file.id || ''
                                    const url = ensureProtocol(rawUrl)
                                    const isGoogleDrive = url.includes('drive.google.com')
                                    const isPdf = isPDF(file.name || url)
                                    const isVid = isMP4(file.name || url)
                                    
                                    let imageUrl = url
                                    if (isGoogleDrive) {
                                      imageUrl = getDirectGoogleDriveUrl(url)
                                    } else {
                                      if (isPdf) imageUrl = '/fallback-pdf-thumbnail.svg'
                                      else if (isVid) imageUrl = '/fallback-video.png'
                                    }
                                    
                                    return (
                                      <Box
                                        key={index}
                                        sx={recThumbnailContainerStyles}
                                        onClick={() => window.open(url, '_blank')}
                                      >
                                        <img
                                          style={recThumbnailImageStyles}
                                          src={imageUrl}
                                          alt={file.name || 'Evidence thumbnail'}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/Document.svg'
                                          }}
                                        />
                                      </Box>
                                    )
                                  })}
                                </Box>
                              )}

                              {/* Link Rows */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mt: 1 }}>
                                {evidenceItems.map((item: any, idx: number) => {
                                  const itemUrl = item.url || item.id
                                  if (!itemUrl) return null
                                  
                                  const url = ensureProtocol(itemUrl)
                                  const isGoogleDriveLink = url.includes('drive.google.com')
                                  const isDoc = isImage(item.name || url) || isPDF(item.name || url) || isMP4(item.name || url) || isGoogleDriveLink
                                  
                                  return (
                                    <Box
                                      key={`comment-portfolio-${idx}`}
                                      component="a"
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={recEvidenceLinkRowStyles}
                                    >
                                      {isDoc ? (
                                        <DescriptionOutlinedIcon />
                                      ) : (
                                        <InsertLinkIcon />
                                      )}
                                      <Typography sx={recEvidenceLinkTextStyles}>
                                        {item.name || itemUrl}
                                      </Typography>
                                      <OpenInNewIcon sx={{ fontSize: '14px' }} />
                                    </Box>
                                  )
                                })}
                              </Box>
                            </Box>
                          </Box>
                        )
                      }
                      return null
                    })()}
                  </Box>

                  {/* Credential Status Digital Signature */}
                  {(() => {
                    const verificationResult = verifyCredential(comment)
                    if (verificationResult.ok) {
                      return (
                        <Box
                          sx={verificationBadgeBoxStyles}
                        >
                          <GreenCheckMark />
                          <Typography
                            sx={verificationBadgeTextStyles}
                          >
                            Has a valid digital signature
                          </Typography>
                        </Box>
                      )
                    }
                    return null
                  })()}
                </Collapse>
              </Box>
            )
          })}
        </Box>
      ) : (
        !isRecommendationsPage && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              mb: '20px'
            }}
          >
            <Typography variant='body2'>No recommendations available.</Typography>
            <Link href={`/askforrecommendation/${fileID}`}>
              <Button
                variant='contained'
                sx={askRecommendationButtonStyles}
              >
                Ask for Recommendation
              </Button>
            </Link>
          </Box>
        )
      )}
    </Box>
  )

  // If it's an external credential, use the generic viewer
  if (isExternalCredential()) {
    return (
      <Container sx={{ maxWidth: '872px' }}>
        <GenericCredentialViewer
          credential={claimDetail}
          qrCodeDataUrl={qrCodeDataUrl}
          fileID={fileID}
        />
        {recommendations}
      </Container>
    )
  }

  return (
    <Container sx={{ maxWidth: '872px', ...(minimized ? { px: '0 !important' } : {}) }}>
      {claimDetail && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            margin: minimized ? '0' : '20px auto',
            boxSizing: 'border-box',
            maxWidth: '872px',
            ...credentialCardStyles,
            p: minimized ? '15px 20px' : '25px',
            border: minimized ? '1px solid #2563EB' : '1px solid #E2E8F0',
            borderRadius: minimized ? '12px' : '10px',
            boxShadow: minimized
              ? '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)'
              : 'none'
          }}
        >
          {minimized && !isExpanded ? (
            <Box
              onClick={() => setIsExpanded(true)}
              sx={minimizedCredentialCardStyles}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px'
                    }}
                  >
                    <SVGRecommendBadge />
                  </Box>
                  <Typography
                    sx={minimizedCredentialTitleStyles}
                  >
                    {credentialTitle || 'Skill'}
                  </Typography>
                </Box>
                <ExpandMore sx={{ color: '#475569' }} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: '#475569',
                    display: isDescriptionExpanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: isDescriptionExpanded ? 'none' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {credentialNarrative || credentialSubject?.recommendationText || ''}
                </Typography>
                {(credentialNarrative || credentialSubject?.recommendationText) && (
                  <Button
                    onClick={e => {
                      e.stopPropagation()
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }}
                    sx={viewMoreButtonStyles}
                  >
                    {isDescriptionExpanded ? 'Read less' : 'Read more'}
                  </Button>
                )}
              </Box>

              {credentialSubject?.skill && credentialSubject.skill.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {credentialSubject.skill.map((skill: any, index: number) => (
                    <SkillBadgePill
                      key={`${(skill.id ?? skill.uuid) || 'skill'}-${index}`}
                    >
                      {skill.name ?? skill.targetName}
                    </SkillBadgePill>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ position: 'relative' }}>
              {minimized && isExpanded && (
                <ExpandLess
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    setIsExpanded(false)
                  }}
                  sx={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    zIndex: 10,
                    cursor: 'pointer',
                    color: '#475569',
                    fontSize: '28px',
                    '&:hover': { color: '#000E40' }
                  }}
                />
              )}
              {/* Main Content Section */}
              <MainContentContainer currentStep={4}>
                {/* Badge and Title */}

                <Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <BadgePill>Self-issued</BadgePill>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 2
                        }}
                      >
                        <Box>
                          <CredentialTitle>
                            {credentialTitle || 'Credential'}
                          </CredentialTitle>
                          <RecipientName sx={{ mt: 1 }}>{personName}</RecipientName>
                          <ExperienceText sx={{ mt: 0.5 }}>
                            {credentialSubject?.durationPerformed
                              ? `${credentialSubject.durationPerformed} of experience`
                              : ''}
                          </ExperienceText>
                        </Box>

                        {/* QR Code */}
                        <Box sx={qrCodeBoxStyles}>
                          <div style={{ height: '100px', width: '100px' }}>
                            <QRCode
                              size={256}
                              style={{ height: '100%', width: '100%' }}
                              value={
                                fileID
                                  ? `https://linkedcreds.allskillscount.org/view/${fileID}`
                                  : 'https://linkedcreds.com'
                              }
                              viewBox={`0 0 256 256`}
                            />
                          </div>
                        </Box>
                      </Box>
                      <Divider />
                    </Box>
                    {/* Public Link Section */}
                    {!minimized && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Box sx={publicLinkBoxStyles}>
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 'semibold',
                              color: '#364153',
                              fontFamily: 'Inter',
                              lineHeight: '20px',
                              letterSpacing: '-0.15px'
                            }}
                          >
                            Public Link
                          </Typography>

                          <Stack direction='row' spacing={1} alignItems='center'>
                            <OutlinedInput
                              fullWidth
                              readOnly
                              value={
                                fileID
                                  ? `https://linkedcreds.allskillscount.org/view/${fileID}`
                                  : ''
                              }
                              sx={publicLinkInputStyles}
                            />
                            <Button
                              variant='contained'
                              onClick={() => handleShareOption('CopyURL')}
                              startIcon={<ContentCopyIcon />}
                              sx={copyButtonStyles}
                            >
                              Copy
                            </Button>
                          </Stack>

                          <Stack direction='column' spacing={0.5}>
                            <Typography
                              sx={{
                                fontSize: '13px',
                                color: '#64748b',
                                fontFamily: 'Inter'
                              }}
                            >
                              Created:{' '}
                              {claimDetail?.issuanceDate
                                ? new Date(claimDetail.issuanceDate).toLocaleString()
                                : new Date().toLocaleString()}
                            </Typography>
                          </Stack>
                        </Box>
                        <Typography
                          sx={{
                            fontSize: '13px',
                            color: '#475569',
                            fontFamily: 'Inter',
                            lineHeight: 1.5
                          }}
                        >
                          Anyone with this link can view this credential.
                        </Typography>
                      </Box>
                    )}

                    {/* Skill Description */}
                    <Box>
                      <SectionHeader >Skill Description</SectionHeader>
                      <DescriptionText as='div'>
                        {credentialNarrative ||
                          credentialSubject?.recommendationText ||
                          ''}
                      </DescriptionText>
                    </Box>

                    {/* Additional Details for Single Recommendation View */}
                    {credentialSubject?.howKnow && (
                      <Box>
                        <SectionHeader sx={{ mb: 1 }}>
                          {`How ${credentialSubject.name || 'they'} know you`}
                        </SectionHeader>
                        <DescriptionText as='div'>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: cleanHTML(credentialSubject.howKnow)
                            }}
                          />
                        </DescriptionText>
                      </Box>
                    )}

                    {credentialSubject?.qualifications && (
                      <Box>
                        <SectionHeader sx={{ mb: 1 }}>Qualifications</SectionHeader>
                        <DescriptionText as='div'>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: cleanHTML(credentialSubject.qualifications)
                            }}
                          />
                        </DescriptionText>
                      </Box>
                    )}

                    {/* Featured Image */}
                    {displayFiles.length > 0 && (
                      <MediaContainer
                        onMouseEnter={() => setIsHoveringMedia(true)}
                        onMouseLeave={() => setIsHoveringMedia(false)}
                      >
                        {currentDisplayFile ? (
                          <>
                            {isPDF(currentDisplayFile.name || currentDisplayFile.url) ? (
                              <Image
                                src={pdfThumbnails[currentDisplayFile.id] ?? '/fallback-pdf-thumbnail.svg'}
                                alt='PDF Preview'
                                fill
                                style={{ objectFit: 'contain' }}
                              />
                            ) : isMP4(currentDisplayFile.name || currentDisplayFile.url) ? (
                              <Image
                                src={videoThumbnails[currentDisplayFile.id] ?? '/fallback-video.png'}
                                alt='Video Thumbnail'
                                fill
                                style={{ objectFit: 'contain' }}
                              />
                            ) : (
                              <Image
                                src={imageThumbnails[currentDisplayFile.id] ?? currentDisplayFile.url}
                                alt='Featured Media'
                                fill
                                style={{ objectFit: 'contain' }}
                              />
                            )}

                            {/* Image Counter Overlay (Always Visible) */}
                            {displayFiles.length > 1 && (
                              <Box sx={carouselCounterStyles}>
                                {currentImageIndex + 1} / {displayFiles.length}
                              </Box>
                            )}

                            {/* Navigation Buttons */}
                            {isHoveringMedia && displayFiles.length > 1 && (
                              <>
                                <Button
                                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                  sx={{ ...carouselNavButtonStyles, left: 8 }}
                                >
                                  ‹
                                </Button>
                                <Button
                                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                  sx={{ ...carouselNavButtonStyles, right: 8 }}
                                >
                                  ›
                                </Button>
                              </>
                            )}
                          </>
                        ) : null}
                      </MediaContainer>
                    )}

                    {/* Skills */}
                    <Box>
                      <SectionHeader sx={{ mb: 1 }}>
                        {`Skills (${(credentialSubject?.skill ?? []).length})`}
                      </SectionHeader>
                      {credentialSubject?.skill && credentialSubject.skill.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {credentialSubject.skill.map((skill: any, index: number) => (
                            <SkillBadgePill
                              key={`${(skill.id ?? skill.uuid) || 'skill'}-${index}`}
                            >
                              {skill.name ?? skill.targetName}
                            </SkillBadgePill>
                          ))}
                        </Box>
                      ) : (
                        <Typography
                          sx={{ fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}
                        >
                          No specific skills listed.
                        </Typography>
                      )}
                    </Box>

                    {/* Supporting Evidence */}
                    {displayEvidence.length > 0 && (
                      <Box>
                        <SectionHeader sx={{ mb: 1 }}>Supporting Evidence</SectionHeader>
                        <Box
                          sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                        >
                          {displayEvidence.map((item, index) => (
                            <Box
                              key={index}
                              component='a'
                              href={item.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              sx={{
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#2563EB',
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              {!item.googleId ? (
                                <InsertLinkIcon />
                              ) : (
                                <DescriptionOutlinedIcon />
                              )}
                              <Typography
                                sx={{
                                  fontFamily: 'Inter',
                                  fontSize: '14px',
                                  fontWeight: 500
                                }}
                              >
                                {item.name || item.url}
                              </Typography>
                              <OpenInNewIcon sx={{ fontSize: '14px' }} />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {(pathname?.includes('/view') || !!propFileID) &&
                    claimDetail &&
                    !isExternalCredential() && (
                      <Box sx={{ mt: 4 }}>
                        {recommendations}
                        {/* Credential Verification Section */}
                        <Box
                          sx={{
                            my: 2,
                            p: 3,
                            bgcolor: '#F6FEF9',
                            border: '1px solid #D1FADF',
                            borderRadius: '8px'
                          }}
                        >
                          <Typography sx={{ fontSize: '16px', color: '#000E40', mb: 2 }}>
                            Credential Verification
                          </Typography>

                          <Box
                            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                          >
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                              <GreenCheckMark />
                              <Typography
                                sx={{
                                  color: '#344054',
                                  fontSize: '14px',
                                  textColor: '#000E40'
                                }}
                              >
                                Has a valid digital signature
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                              <GreenCheckMark />
                              <Typography
                                sx={{
                                  color: '#344054',
                                  fontSize: '14px',
                                  textColor: '#000E40'
                                }}
                              >
                                Has not been revoked by issuer
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2, borderColor: '#D1FADF' }} />

                          {claimDetail?.proof?.created && (
                            <Typography sx={{ fontSize: '14px', color: '#667085' }}>
                              Issued:{' '}
                              {(() => {
                                const dateStr =
                                  claimDetail?.proof?.created ||
                                  claimDetail?.issuanceDate ||
                                  claimDetail?.validFrom ||
                                  new Date().toISOString()
                                const date = new Date(dateStr)
                                return isNaN(date.getTime())
                                  ? 'Invalid date'
                                  : date.toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                              })()}
                            </Typography>
                          )}
                        </Box>

                        <Box
                          sx={{ display: 'flex-start', flexDirection: 'column', gap: 1 }}
                        >
                          <Button
                            onClick={() =>
                              window.open(`/api/credential-raw/${fileID}`, '_blank')
                            }
                            disabled={!fileID}
                            variant='contained'
                            startIcon={<DescriptionOutlinedIcon sx={{ color: '#FFFFFF' }} />}
                            endIcon={<OpenInNewIcon />}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontFamily: 'Inter',
                              fontWeight: 600,
                              fontSize: '16px',
                              py: 1.5,
                              px: 3,
                              backgroundColor: '#2563EB',
                              color: '#FFFFFF',
                              '&:hover': {
                                backgroundColor: '#1D4ED8'
                              }
                            }}
                          >
                            View Source (JSON)
                          </Button>
                          <Typography
                            sx={{
                              fontSize: '14px',
                              mt: 1,
                              color: '#6B7280',
                              fontFamily: 'Inter',
                              textAlign: 'left'
                            }}
                          >
                            Download the raw JSON data for this credential
                          </Typography>
                        </Box>
                      </Box>
                    )}
                </Box>
              </MainContentContainer>
            </Box>
          )}
        </Box>
      )}
    </Container>
  )
}

export default ComprehensiveClaimDetails
