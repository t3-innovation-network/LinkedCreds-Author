/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useEffect, useState } from 'react'
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
  styled
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { SVGDate, SVGBadge, CheckMarkSVG, LineSVG, SVGSparklesBlue, Logo } from '../../Assets/SVGs'
import { Restore as RestoreIcon } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import useGoogleDrive from '../../hooks/useGoogleDrive'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { GoogleDriveStorage } from '@cooperation/vc-storage'

import EvidencePreview from './EvidencePreview'
import { getAccessToken, getFileViaFirebase } from '../../firebase/storage'
import QRCode from 'qrcode'
import GenericCredentialViewer from './GenericCredentialViewer'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import { ensureProtocol } from '../../utils/urlValidation'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}
// Define types
interface Portfolio {
  name: string
  url: string
}
interface Achievement {
  name: string
  description: string
  criteria?: { narrative: string }
  image?: { id: string }
  alignment?: { targetName: string, targetDescription?: string, targetCode?: string, uuid?: string, score?: number }[]
}
interface CredentialSubject {
  name?: string // Made optional since external creds might not have it
  credentialType?: string // Added as optional for native detection
  achievement?: Achievement[]
  duration?: string
  portfolio?: Portfolio[]
  createdTime?: string
  evidenceLink?: string
  howKnow?: string
  recommendationText?: string
  qualifications?: string
  explainAnswer?: string
  skills?: string[]
  removedSkills?: string[]
}
interface ClaimDetail {
  '@context': string[]
  id: string
  type: string[]
  issuanceDate: string
  expirationDate: string
  credentialSubject: CredentialSubject
}
interface ComprehensiveClaimDetailsProps {
  onAchievementLoad?: (achievementName: string) => void
  fileID?: string
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
const isPDF = (fileName: string) => fileName.toLowerCase().endsWith('.pdf')
const isMP4 = (fileName: string) => fileName.toLowerCase().endsWith('.mp4')
const isGoogleDriveImageUrl = (url: string): boolean => {
  return /https:\/\/drive\.google\.com\/uc\?export=view&id=.+/.test(url)
}

// Styled components
const HeaderContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '720px',
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
  shouldForwardProp: (prop) => prop !== 'currentStep'
})<{ currentStep?: number }>(({ theme, currentStep }) => ({
  width: '100%',
  maxWidth: '720px',
  padding: theme.breakpoints.down('sm') ? '24px 8px' : '45px 30px',
  backgroundColor: '#fff', // Always white for view mode
  borderRadius: '0 0 20px 20px',
  borderTop: '1px solid #d1e4ff',
  borderLeft: '1px solid #d1e4ff',
  borderRight: '1px solid #d1e4ff',
  margin: '0 auto'
}))

const SkillCard = styled(Card)(({ theme }) => ({
  padding: theme.breakpoints.down('sm') ? '10px 8px' : '15px 30px',
  backgroundColor: '#fff',
  borderRadius: '10px',
  border: '1px solid #155dfc',
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

const MediaContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column'
}))

const Media = styled(Box)<{ hasImage?: boolean }>(({ hasImage, theme }) => ({
  width: '100%',
  maxWidth: theme.breakpoints.down('sm') ? '400px' : '500px',
  aspectRatio: hasImage ? '4/3' : 'auto',
  position: 'relative',
  backgroundImage: 'none',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
  boxShadow: hasImage ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
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

const ComprehensiveClaimDetails: React.FC<ComprehensiveClaimDetailsProps> = ({
  onAchievementLoad,
  fileID: propFileID
}) => {
  const params = useParams()
  const fileID = propFileID || (params?.id as string)

  const [claimDetail, setClaimDetail] = useState<ClaimDetail | null>(null)
  const [comments, setComments] = useState<ClaimDetail[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [qrCodeDataUrlMobile, setQrCodeDataUrlMobile] = useState<string>('')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const accessToken = session?.accessToken
  const isAskForRecommendation = pathname?.includes('/askforrecommendation')
  const isView = pathname?.includes('/view')
  const isRecommendationsPage = pathname?.includes('/recommendations/')
  const { } = useGoogleDrive()
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({})

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
  const [displayFiles, setDisplayFiles] = useState<{ id: string, name: string, url: string, isFeatured?: boolean }[]>([])

  const credentialSubject = claimDetail?.credentialSubject
  const achievement = credentialSubject?.achievement && credentialSubject.achievement[0]

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) || isGoogleDriveImageUrl(url)

  // Prepare display files from credential data
  useEffect(() => {
    if (credentialSubject) {
      const files: { id: string, name: string, url: string, isFeatured?: boolean }[] = []

      // Main evidence link - Add only if visual
      if (credentialSubject.evidenceLink) {
        const url = getGoogleDriveDirectLink(ensureProtocol(credentialSubject.evidenceLink))
        if (isImage(url) || isPDF(credentialSubject.evidenceLink) || isMP4(credentialSubject.evidenceLink)) {
          files.push({
            id: 'main-evidence',
            name: 'Main Evidence',
            url: url,
            isFeatured: true
          })
        }
      }

      // Portfolio items - Add only if visual
      if (credentialSubject.portfolio && Array.isArray(credentialSubject.portfolio)) {
        credentialSubject.portfolio.forEach((item, index) => {
          if (item.url && item.url !== credentialSubject.evidenceLink) {
            const url = getGoogleDriveDirectLink(ensureProtocol(item.url))
            const name = item.name || `Evidence ${index + 1}`
            if (isImage(url) || isPDF(name) || isPDF(item.url) || isMP4(name) || isMP4(item.url)) {
              files.push({
                id: `portfolio-${index}`,
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
      // PDF handling
      if (isPDF(file.name || file.url) && !pdfThumbnails[file.id]) {
        const thumbnail = await renderPDFThumbnail(file.url)
        setPdfThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
      }

      // Video handling
      if (isMP4(file.name || file.url) && !videoThumbnails[file.id]) {
        try {
          const thumbnail = await generateVideoThumbnail(file.url)
          setVideoThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
        } catch (error) {
          console.error('Error generating video thumbnail:', error)
          setVideoThumbnails(prev => ({
            ...prev,
            [file.id]: '/fallback-video.png'
          }))
        }
      }

      // Google Drive Image handling (authenticated fetch)
      if (isGoogleDriveImageUrl(file.url) && !imageThumbnails[file.id] && viewToken) {
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
              const objectUrl = URL.createObjectURL(blob)
              setImageThumbnails(prev => ({ ...prev, [file.id]: objectUrl }))
            } else {
              // Fallback to direct URL if fetch fails (public files)
              console.warn('Failed to fetch private image blob, using direct URL', response.status)
            }
          }
        } catch (e) {
          console.error('Error fetching image blob:', e)
        }
      }
    })
  }, [displayFiles, viewToken])

  const handleNextImage = () => {
    if (displayFiles.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % displayFiles.length)
    }
  }

  const handlePrevImage = () => {
    if (displayFiles.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + displayFiles.length) % displayFiles.length)
    }
  }

  // Get current display image
  const currentDisplayFile = displayFiles.length > 0
    ? displayFiles[currentImageIndex]
    : null
  useEffect(() => {
    if (fileID) {
      const sourceUrl = `${window.location.origin}/api/credential-raw/${fileID}`

      QRCode.toDataURL(sourceUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#2563eb',
          light: '#F0F4F8'
        }
      })
        .then(url => {
          setQrCodeDataUrl(url)
        })
        .catch(err => {
          console.error('Error generating QR code:', err)
        })

      QRCode.toDataURL(sourceUrl, {
        width: 80,
        margin: 1,
        color: {
          dark: '#2563eb',
          light: '#F0F4F8'
        }
      })
        .then(url => {
          setQrCodeDataUrlMobile(url)
        })
        .catch(err => {
          console.error('Error generating mobile QR code:', err)
        })
    }
  }, [fileID])

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
        const accessToken1 = await getAccessToken(fileID)
        setViewToken(accessToken1)
        const uncachedStorage = new GoogleDriveStorage(accessToken1)
        let vcData = await getFileViaFirebase(fileID)
        vcData = JSON.parse(vcData.body)

        if (vcData) {
          setClaimDetail(vcData as unknown as ClaimDetail)
        }

        const shouldFetchRecommendations = isView || !!propFileID
        if (shouldFetchRecommendations) {
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
                  const recFile = await getFileViaFirebase(recId)
                  const body = recFile?.body ?? null
                  return body ? JSON.parse(body) : null
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

  const validPortfolio = Array.isArray(credentialSubject?.portfolio)
    ? credentialSubject.portfolio.filter(item => {
      if (!item || !item.name || !item.url) return false
      return true
    })
    : []
  const hasValidEvidence = validPortfolio.length > 0

  // Check if this is an external credential
  const isExternalCredential = () => {
    if (!claimDetail) return false

    const subject = claimDetail.credentialSubject || {}

    const hasNativeName = typeof subject.name === 'string'
    const hasCredentialType = typeof subject.credentialType === 'string'
    const hasArrayAchievement = Array.isArray(subject.achievement)

    if (hasNativeName && hasCredentialType && hasArrayAchievement) {
      return false
    }

    return true
  }

  const recommendations = (
    <Box>
      {loading ? (
        <Box display='flex' justifyContent='center' my={2}>
          <CircularProgress size={24} />
        </Box>
      ) : comments && comments.length > 0 ? (
        <List sx={{ p: 0, mb: 2 }}>
          {comments.map((comment: ClaimDetail, index: number) => (
            <React.Fragment key={index}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  pr: '30px'
                }}
              >
                <LineSVG />
              </Box>
              <ListItem
                sx={{ borderRadius: '10px', border: '1px solid #003FE0' }}
                alignItems='flex-start'
                secondaryAction={
                  <IconButton
                    edge='end'
                    onClick={() => handleToggleComment(comment.id || index.toString())}
                    aria-label='expand'
                  >
                    {expandedComments[comment.id || index.toString()] ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )}
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <SVGBadge />
                      <Box>
                        <Typography variant='h6' component='div'>
                          {comment.credentialSubject?.name}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Vouched for {credentialSubject?.name}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              <Collapse
                in={expandedComments[comment.id || index.toString()]}
                timeout='auto'
                unmountOnExit
              >
                <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
                  {/* How They Know Each Other */}
                  {comment.credentialSubject?.howKnow && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        How They Know Each Other:
                      </Typography>
                      <Typography variant='body2'>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: cleanHTML(comment.credentialSubject.howKnow)
                          }}
                        />
                      </Typography>
                    </Box>
                  )}
                  {/* Recommendation Text */}
                  {comment.credentialSubject?.recommendationText && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Recommendation:
                      </Typography>
                      <Typography variant='body2'>
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
                    <Box sx={{ mt: 1 }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Your Qualifications:
                      </Typography>
                      <Typography variant='body2'>
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
                    <Box sx={{ mt: 1 }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Explain Your Answer:
                      </Typography>
                      <Typography variant='body2'>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: cleanHTML(comment.credentialSubject.explainAnswer)
                          }}
                        />
                      </Typography>
                    </Box>
                  )}
                  {/* Supporting Evidence */}
                  {Array.isArray(comment.credentialSubject?.portfolio) &&
                    comment.credentialSubject.portfolio.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant='subtitle2' color='text.secondary'>
                          Supporting Evidence:
                        </Typography>
                        {comment.credentialSubject.portfolio.map((item, idx) => (
                          <Box key={`comment-portfolio-${idx}`} sx={{ mt: 1 }}>
                            {item.name && item.url ? (
                              <MuiLink
                                href={ensureProtocol(item.url)}
                                underline='hover'
                                color='primary'
                                sx={{
                                  fontSize: '15px',
                                  textDecoration: 'underline',
                                  color: '#003fe0'
                                }}
                                target='_blank'
                              >
                                {item.name}
                              </MuiLink>
                            ) : null}
                          </Box>
                        ))}
                      </Box>
                    )}
                </Box>
              </Collapse>
              {/* Add Divider between comments */}
              {index < comments.length - 1 && <Divider component='li' />}
            </React.Fragment>
          ))}
        </List>
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
                sx={{
                  backgroundColor: '#003FE0',
                  textTransform: 'none',
                  borderRadius: '100px',
                  width: { xs: 'fit-content', sm: '300px', md: '300px' }
                }}
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
      <Container sx={{ maxWidth: '800px' }}>
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
    <Container sx={{ maxWidth: '800px', pb: 4 }}>
      {claimDetail && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            margin: '20px auto',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Section */}
          <HeaderContainer elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box sx={{ flexShrink: 1, minWidth: 0, overflow: 'hidden', maxWidth: '300px' }}>
                <Logo />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  variant='h5'
                  sx={{
                    fontFamily: 'Lato',
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '38px',
                    color: '#000E40'
                  }}
                >
                  Credential View
                </Typography>

                {/* View Source and QR Code Links in Header for desktop */}
                {fileID && !isMobile && (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                    <Link
                      href={`/api/credential-raw/${fileID}`}
                      target='_blank'
                      style={{ textDecoration: 'none' }}
                    >
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'Lato',
                          color: '#003FE0',
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }}
                      >
                        View Source
                      </Typography>
                    </Link>
                  </Box>
                )}
              </Box>
              {/* QR Code in Header */}
              {fileID && !isMobile && qrCodeDataUrl && (
                <Box sx={{ ml: 'auto' }}>
                  <img
                    src={qrCodeDataUrl}
                    alt='QR Code'
                    style={{ width: '80px', height: '80px' }}
                  />
                </Box>
              )}
            </Box>
          </HeaderContainer>

          {/* Main Content Section */}
          <MainContentContainer currentStep={4}>
            <Box sx={{ width: '100%', mb: 4 }}>
              <SkillCard>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <Field label='Name' value={credentialSubject?.name} />
                    <Field
                      label='Skill Name'
                      value={achievement?.name}
                    />
                    <Field
                      label='Skill Description'
                      value={achievement?.description}
                      isHtml={true}
                    />

                    {/* Media Carousel Section */}
                    {displayFiles.length > 0 && (
                      <MediaContainer
                        onMouseEnter={() => setIsHoveringMedia(true)}
                        onMouseLeave={() => setIsHoveringMedia(false)}
                      >
                        <Media hasImage={!!currentDisplayFile}>
                          {currentDisplayFile ? (
                            <>
                              {isPDF(currentDisplayFile.name || currentDisplayFile.url) ? (
                                <img
                                  src={
                                    pdfThumbnails[currentDisplayFile.id] ??
                                    '/fallback-pdf-thumbnail.svg'
                                  }
                                  alt='PDF Preview'
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '16px',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : isMP4(currentDisplayFile.name || currentDisplayFile.url) ? (
                                <img
                                  src={
                                    videoThumbnails[currentDisplayFile.id] ?? '/fallback-video.png'
                                  }
                                  alt='Video Thumbnail'
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '16px',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <img
                                  src={
                                    imageThumbnails[currentDisplayFile.id] ?? currentDisplayFile.url
                                  }
                                  alt='Featured Media'
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '16px',
                                    objectFit: 'cover'
                                  }}
                                />
                              )}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: '10px',
                                  right: '10px',
                                  bgcolor: 'rgba(0,0,0,0.6)',
                                  color: 'white',
                                  px: 1,
                                  borderRadius: 1,
                                  fontSize: '12px'
                                }}
                              >
                                {currentImageIndex + 1} / {displayFiles.length}
                              </Box>

                              {/* Navigation Buttons */}
                              {displayFiles.length > 1 && isHoveringMedia && (
                                <>
                                  <Box
                                    onClick={handlePrevImage}
                                    sx={{
                                      position: 'absolute',
                                      left: '10px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      bgcolor: 'rgba(170, 170, 170, 0.8)',
                                      borderRadius: '50%',
                                      p: 1,
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: 'white' }
                                    }}
                                  >
                                    <Typography variant='h6' sx={{ lineHeight: 0.4 }}>‹</Typography>
                                  </Box>
                                  <Box
                                    onClick={handleNextImage}
                                    sx={{
                                      position: 'absolute',
                                      right: '10px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      bgcolor: 'rgba(170, 170, 170, 0.8)',
                                      borderRadius: '50%',
                                      p: 1,
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: 'white' }
                                    }}
                                  >
                                    <Typography variant='h6' sx={{ lineHeight: 0.4, }}>›</Typography>
                                  </Box>
                                </>
                              )}
                            </>
                          ) : null}
                        </Media>

                      </MediaContainer>
                    )}

                    {/* Skills Section */}
                    {(achievement?.alignment && achievement.alignment.length > 0) || (credentialSubject?.skills && credentialSubject.skills.length > 0) ? (
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <SVGSparklesBlue />
                          <FieldLabel sx={{ mb: 0 }}>
                            Skills
                          </FieldLabel>
                        </Box>

                        <Box sx={{
                          backgroundColor: '#f0f8ff',
                          borderRadius: '12px',
                          p: 2,
                        }}>
                          {/* Claimed Skills from Alignment (New) */}
                          {achievement?.alignment && achievement.alignment.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: credentialSubject?.skills?.length ? 2 : 0 }}>
                              {achievement.alignment.map((align, idx) => (
                                <Box
                                  key={`aligned-${idx}`}
                                  sx={{
                                    background: '#155dfc',
                                    color: '#ffffff',
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}
                                  title={align.targetDescription || align.targetName}
                                >
                                  {align.targetName}
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Legacy Claimed Skills (Fallback) */}
                          {(!achievement?.alignment || achievement.alignment.length === 0) && credentialSubject?.skills && credentialSubject.skills.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {credentialSubject.skills.map((skill, idx) => (
                                <Box
                                  key={`claimed-${idx}`}
                                  sx={{
                                    background: '#155dfc',
                                    color: '#ffffff',
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}
                                >
                                  {skill}
                                </Box>
                              ))}
                            </Box>
                          )}

                        </Box>
                      </Box>
                    ) : null}

                    <Field
                      label='What does that entail?'
                      value={achievement?.criteria?.narrative}
                      isHtml={true}
                    />

                    {credentialSubject?.duration && (
                      <Box>
                        <FieldLabel>Duration</FieldLabel>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px 5px',
                            borderRadius: '5px',
                            width: 'fit-content',
                            bgcolor: '#d5e1fb',
                            mt: 0.5
                          }}
                        >
                          <Box sx={{ mt: '2px' }}>
                            <SVGDate />
                          </Box>
                          <Typography sx={{ color: 't3BodyText', fontSize: '13px' }}>
                            {credentialSubject.duration}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Supporting Evidence List (Links) */}
                    {hasValidEvidence && (
                      <Box>
                        <FieldLabel>Supporting Evidence / Portfolio:</FieldLabel>
                        <ul
                          style={{
                            marginLeft: '25px',
                            textDecorationLine: 'underline',
                            color: 'blue'
                          }}
                        >
                          {validPortfolio.map((portfolioItem, idx) => (
                            <li
                              key={`main-portfolio-${idx}`}
                              style={{
                                cursor: 'pointer',
                                width: 'fit-content',
                                marginBottom: '10px'
                              }}
                            >
                              <Link
                                href={ensureProtocol(portfolioItem.url)}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                {portfolioItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}
                    {(pathname?.includes('/view') || !!propFileID) &&
                      claimDetail &&
                      !isRecommendationsPage && (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            mt: '20px'
                          }}
                        >
                          <Typography
                            sx={{ fontSize: '13px', fontWeight: 700, color: '#000E40' }}
                          >
                            Credential Details
                          </Typography>
                          <Box
                            sx={{ display: 'flex', gap: '5px', mt: '10px', alignItems: 'center' }}
                          >
                            <Box sx={{ borderRadius: '4px', bgcolor: '#C2F1BE', p: '4px' }}>
                              <CheckMarkSVG />
                            </Box>
                            <Typography>Has a valid digital signature</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <Box sx={{ borderRadius: '4px', bgcolor: '#C2F1BE', p: '4px' }}>
                              <CheckMarkSVG />
                            </Box>
                            <Typography>Has not expired</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <Box sx={{ borderRadius: '4px', bgcolor: '#C2F1BE', p: '4px' }}>
                              <CheckMarkSVG />
                            </Box>
                            <Typography>Has not been revoked by issuer</Typography>
                          </Box>
                        </Box>
                      )}

                  </Box>
                </CardContent>
              </SkillCard>
            </Box>


            {
              (pathname?.includes('/view') || !!propFileID) &&
              claimDetail &&
              !isExternalCredential() && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant='h6' sx={{ mb: 2, color: '#000E40', fontFamily: 'Lato', fontWeight: 700 }}>
                    Recommendations
                  </Typography>
                  {recommendations}
                </Box>
              )
            }

          </MainContentContainer >
        </Box >
      )}
    </Container >
  )
}

export default ComprehensiveClaimDetails
