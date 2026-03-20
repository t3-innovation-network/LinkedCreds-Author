/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Typography,
  Box,
  Button,
  Snackbar,
  useMediaQuery,
  useTheme,
  Stack,
  CircularProgress,
  Tooltip,
  Alert,
  Divider,
  Card,
  CardContent,
  styled
} from '@mui/material'
import {
  GlobalSVG,
  HeartSVG,
  BlueBadge,
  NewCopy,
  NewLinkedin,
  SVGEmail,
  SVGDescribeBadge,
  DescriptionOutlinedIcon,
  InsertLinkIcon
} from '../../../Assets/SVGs'
import LoadingOverlay from '../../../components/Loading/LoadingOverlay'
import { FormData } from '../../../credentialForm/form/types/Types'
import { copyFormValuesToClipboard } from '../../../utils/formUtils'
import { useStepContext } from '../StepContext'
import { useRouter } from 'next/navigation'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import QRCode from 'react-qr-code'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Link from 'next/link'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { OutlinedInput, InputAdornment, IconButton } from '@mui/material';
import Image from 'next/image'
import {
  actionButtonStyles,
  actionButtonTitleStyles,
  successPageContainerStyles,
  successMessageBoxStyles,
  BadgePill,
  CredentialTitle,
  RecipientName,
  ExperienceText,
  SectionHeader,
  DescriptionText,
  MediaContainer,
  Media,
  EmptySkillsState,
  publicLinkBoxStyles,
  publicLinkInputStyles,
  copyButtonStyles,
  qrCodeBoxStyles,
  credentialCardStyles
} from '../../../components/Styles/appStyles'
import CheckIcon from '@mui/icons-material/Check'

// Types from ComprehensiveClaimDetails
interface Portfolio {
  name: string
  url: string
  googleId?: string
  wasId?: string
}
interface Achievement {
  name: string
  description: string
  criteria?: { narrative: string }
  image?: { id: string }
  alignment?: { targetName: string, targetDescription?: string, soc?: string[], uuid?: string, score?: number }[]
}

interface CredentialSubject {
  type?: string[]
  name?: string
  durationPerformed?: string
  skill?: { id: string; name: string; description?: string; source?: string; frameworkMatch?: { framework?: string; socCode?: string[]; name?: string; similarityScore?: number }[] }[]
  narrative?: string
  description?: string
  person?: { type: string[]; id?: string; name?: string; email?: string }
  evidence?: { id: string; name: string }[]
}

interface ClaimDetail {
  '@context': string[]
  id: string
  name?: string // W3C VC top-level name (credential title)
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

interface SuccessPageProps {
  setActiveStep: (step: number) => void //NOSONAR
  formData: FormData | null
  reset: () => void
  link: string
  setLink: (link: string) => void
  setFileId: (fileId: string) => void
  storageOption: string
  fileId: string
  selectedImage: string
  res: any
}

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error'
}
import { ensureProtocol } from '../../../utils/urlValidation'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

// Helper functions for file type detection
const isPDF = (fileName: string) => fileName?.toLowerCase().endsWith('.pdf')
const isMP4 = (fileName: string) => fileName?.toLowerCase().endsWith('.mp4')
const isGoogleDriveImageUrl = (url: string): boolean => {
  return /https:\/\/drive\.google\.com\/uc\?export=view&id=.+/.test(url)
}

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
    video.crossOrigin = 'anonymous' // Enable CORS if needed
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

const GreenCheckMark = () => (
  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3.625L4.5 9.125L2 6.625" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SuccessPage: React.FC<SuccessPageProps> = ({
  formData,
  reset,
  setLink,
  setFileId,
  fileId,
  res,
  link
}) => {
  const router = useRouter()
  const { data: session } = useSession()
  const accessToken = session?.accessToken as string | undefined
  const { setActiveStep } = useStepContext()
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [tooltipMessage, setTooltipMessage] = useState('Signing your skill...')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Parse credential data from res prop (Google Drive JSON)
  const claimDetail: ClaimDetail | null = res
    ? typeof res === 'string'
      ? JSON.parse(res)
      : res
    : null
  const credentialSubject = claimDetail?.credentialSubject

  // Carousel State
  const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})
  const [imageThumbnails, setImageThumbnails] = useState<Record<string, string>>({})
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

      // Top-level evidence items - Add for visual preview
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
  }, [credentialSubject]) // eslint-disable-line react-hooks/exhaustive-deps

  // Generate thumbnails
  useEffect(() => {
    displayFiles.forEach(async file => {
      let finalFileUrl = file.url
      let isFetchedBlob = false

      // Google Drive secure fetch for any file
      if (isGoogleDriveImageUrl(file.url) && accessToken) {
        try {
          const match = file.url.match(/id=([^&]+)/)
          if (match && match[1]) {
            const fileId = match[1]
            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }
            )
            if (response.ok) {
              const blob = await response.blob()
              finalFileUrl = URL.createObjectURL(blob)
              isFetchedBlob = true
            }
          }
        } catch (e) {
          console.error('Error fetching file blob:', e)
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
  }, [displayFiles, accessToken])

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
    if (!fileId) {
      setTooltipMessage('Signing your skill...')
      const timer1 = setTimeout(() => setTooltipMessage('Saving your skill...'), 500)
      const timer2 = setTimeout(() => setTooltipMessage('Fetching link...'), 500)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    } else {
      setTooltipMessage('Click to view')
    }
  }, [fileId])

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const generateLinkedInUrl = () => {
    const baseLinkedInUrl = 'https://www.linkedin.com/profile/add'
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: credentialSubject?.name ?? 'Certification Name',
      organizationName: 'LinkedTrust',
      issueYear: new Date().getFullYear().toString(),
      issueMonth: (new Date().getMonth() + 1).toString(),
      certUrl: `https://linkedcreds.allskillscount.org/view/${fileId}`,
      certId: fileId
    })
    return `${baseLinkedInUrl}?${params.toString()}`
  }

  const handleShareOption = (
    option: 'LinkedIn' | 'Email' | 'CopyURL' | 'View' | 'LinkedTrust'
  ) => {
    const credentialLink = `https://linkedcreds.allskillscount.org/view/${fileId}`

    if (option === 'LinkedIn') {
      const linkedInUrl = generateLinkedInUrl()
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
      const mailPageUrl = `${window.location.origin}/mail/${fileId}`
      window.location.href = mailPageUrl
    }
  }

  // Data extraction
  const selectedSkills = credentialSubject?.skill ?? []
  const credentialTitle = claimDetail?.name || credentialSubject?.name || ''
  const personName = credentialSubject?.person?.name || ''
  const credentialNarrative = credentialSubject?.description || credentialSubject?.narrative || ''
  const evidenceItems =
    claimDetail?.evidence?.map(e => {
      let googleId = undefined
      const match = e.id.match(/\/file\/d\/([^/]+)/) || e.id.match(/[?&]id=([^&]+)/)
      if (match && match[1]) {
        googleId = match[1]
      }
      return { name: e.name, url: e.id, googleId }
    }) || []

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        maxWidth: '1280px',
        width: '100%'
      }}
    >
      {/* Success Message */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            p: '30px',
            borderRadius: '10px',
            backgroundColor: '#FFF'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: 1,
              width: '100%'
            }}
          >
            <CheckIcon
              sx={{
                color: '#10B981',
                width: '40px',
                height: '40px',
                flexShrink: 0,
                backgroundColor: '#ECFDF5',
                borderRadius: '50%',
                padding: '4px'
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                sx={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#000E40',
                  fontFamily: 'Lato',
                  lineHeight: 'normal'
                }}
              >
                Credential Saved!
              </Typography>
              <Typography
                sx={{
                  fontSize: '16px',
                  color: '#4A5565',
                  fontFamily: 'Inter',
                  lineHeight: '24px',
                  letterSpacing: '-0.31px'
                }}
              >
                Your credential has been successfully signed and saved.
              </Typography>
            </Box>
          </Box>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            sx={{
              gap: '10px',
              width: '100%',
              maxWidth: '420px',
              mt: { xs: 2, md: 0 },
              justifyContent: 'center'
            }}
          >
            <Button
              variant='outlined'
              onClick={() => {
                window.location.href = '/claims'
              }}
              sx={{
                borderRadius: '50px',
                minHeight: '40px',
                px: 5,
                textTransform: 'none',
                fontFamily: 'Inter',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                color: '#2563EB',
                border: '1px solid #2563EB',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#F0F9FF',
                  borderColor: '#2563EB'
                }
              }}
            >
              View My Skills
            </Button>
            <Button
              onClick={() => {
                setActiveStep(1)
                setLink('')
                setFileId('')
                reset()
                router.push('/credentialForm#step1')
              }}
              variant='contained'
              sx={{
                borderRadius: '50px',
                minHeight: '40px',
                px: 5,
                textTransform: 'none',
                fontFamily: 'Inter',
                fontSize: '14px',
                color: '#FFFFFF',
                backgroundColor: '#2563EB',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#1D4ED8'
                }
              }}
            >
              Add Another Skill
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Two Column Layout */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          maxWidth: '1280px',
          width: '100%',
          backgroundColor: '#88ABE4',
          p: '30px',
          borderRadius: '0 0 20px 20px'
        }}
      >
        {/* LEFT COLUMN - Credential Preview */}
        <Box
          sx={{
            flex: 1,
            ...credentialCardStyles,
            p: { xs: 3, md: 4 },
            border: '1px solid #E2E8F0' // Overriding specific border/shadow if needed, but imported style has them
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Badge and Title */}
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
                  <CredentialTitle>{credentialTitle || 'No title found'}</CredentialTitle>
                  <RecipientName sx={{ mt: 1 }}>
                    Issued to: {personName || 'No name found'}
                  </RecipientName>
                  <ExperienceText sx={{ mt: 0.5 }}>
                    {credentialSubject?.durationPerformed
                      ? `${credentialSubject.durationPerformed} of experience`
                      : '5 years of experience'}
                  </ExperienceText>
                </Box>

                {/* QR Code */}
                <Box sx={qrCodeBoxStyles}>
                  <div style={{ height: '100px', width: '100px' }}>
                    <QRCode
                      size={256}
                      style={{ height: '100%', width: '100%' }}
                      value={
                        fileId
                          ? `https://linkedcreds.allskillscount.org/view/${fileId}`
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
                      fileId
                        ? `https://linkedcreds.allskillscount.org/view/${fileId}`
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
                    sx={{ fontSize: '13px', color: '#64748b', fontFamily: 'Inter' }}
                  >
                    Created:{' '}
                    {(() => {
                      const dateStr =
                        claimDetail?.proof?.created ||
                        claimDetail?.issuanceDate ||
                        claimDetail?.validFrom ||
                        new Date().toISOString()
                      return new Date(dateStr).toLocaleString()
                    })()}
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

            {/* Skill Description */}
            <Box>
              <SectionHeader>Skill Description</SectionHeader>
              <DescriptionText as='div'>{credentialNarrative}</DescriptionText>
            </Box>

            {/* Featured Image */}
            {/* Featured Media / Carousel */}
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
                            objectFit: 'contain'
                          }}
                        />
                      ) : isMP4(currentDisplayFile.name || currentDisplayFile.url) ? (
                        <img
                          src={
                            videoThumbnails[currentDisplayFile.id] ??
                            '/fallback-video.png'
                          }
                          alt='Video Thumbnail'
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '16px',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <img
                          src={
                            imageThumbnails[currentDisplayFile.id] ??
                            currentDisplayFile.url
                          }
                          alt='Featured Media'
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '16px',
                            objectFit: 'contain'
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
                            <Typography variant='h6' sx={{ lineHeight: 0.4 }}>
                              ‹
                            </Typography>
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
                            <Typography variant='h6' sx={{ lineHeight: 0.4 }}>
                              ›
                            </Typography>
                          </Box>
                        </>
                      )}
                    </>
                  ) : null}
                </Media>
              </MediaContainer>
            )}

            {/* Skills */}
            <Box>
              <SectionHeader sx={{ mb: 1 }}>
                {`Skills (${selectedSkills.length})`}
              </SectionHeader>
              {selectedSkills && selectedSkills.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedSkills.map((skill: any, index: number) => (
                    <Box
                      key={(skill.id ?? skill.uuid) || index}
                      sx={{
                        color: '#EFF6FF',
                        backgroundColor: '#2563EB',
                        px: '8px',
                        py: '2px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 'medium'
                      }}
                    >
                      {skill.name ?? skill.targetName}
                    </Box>
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
            {evidenceItems.length > 0 && (
              <Box>
                <SectionHeader sx={{ mb: 1 }}>Supporting Evidence</SectionHeader>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {evidenceItems.map((item, index) => (
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
                      {!item.googleId ? <InsertLinkIcon /> : <DescriptionOutlinedIcon />}
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

            {/* Credential Verification */}
            <Box
              sx={{
                p: 3,
                bgcolor: '#F6FEF9',
                border: '1px solid #D1FADF',
                borderRadius: '8px'
              }}
            >
              <Typography
                sx={{ fontSize: '16px', fontWeight: 700, color: '#000E40', mb: 2 }}
              >
                Credential Verification
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <GreenCheckMark />
                  <Typography sx={{ color: '#344054', fontSize: '14px' }}>
                    Has a valid digital signature
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <GreenCheckMark />
                  <Typography sx={{ color: '#344054', fontSize: '14px' }}>
                    Has not been revoked by issuer
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#D1FADF' }} />

              <Typography sx={{ fontSize: '14px', color: '#667085' }}>
                Issued:{' '}
                {new Date(res?.proof?.created || Date.now()).toLocaleDateString(
                  undefined,
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </Typography>
            </Box>

            {/* View Source Button */}
            <Box sx={{ display: 'flex-start', flexDirection: 'column', gap: 1 }}>
              <Button
                onClick={() => window.open(`/api/credential-raw/${fileId}`, '_blank')}
                disabled={!fileId}
                variant='contained'
                startIcon={<DescriptionOutlinedIcon />}
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
        </Box>

        {/* RIGHT COLUMN - Action Items */}
        <Box
          sx={{
            width: { xs: '100%', md: '420px' },
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
          {/* Strengthen Section */}
          <Box
            sx={{
              backgroundColor: '#FFF',
              borderRadius: '14px',
              p: '25px'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '15px', p: '5px' }}>
              <Typography
                sx={{
                  ...actionButtonTitleStyles
                }}
              >
                Strengthen the value of your skill:
              </Typography>

              <Button
                onClick={() => {
                  window.location.href = `/askforrecommendation/${fileId}`
                }}
                disabled={!fileId}
                fullWidth
                variant='outlined'
                startIcon={<HeartSVG />}
                endIcon={<OpenInNewIcon sx={{ fontSize: '14px' }} />}
                sx={actionButtonStyles}
              >
                Ask for a recommendation
              </Button>
            </Box>

            {/* Make Skills Work Section */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                p: '5px',
                mt: '36px'
              }}
            >
              <Typography
                sx={{
                  ...actionButtonTitleStyles
                }}
              >
                Make your skills work for you:
              </Typography>

              <Stack spacing={1.5}>
                <Button
                  onClick={() => handleShareOption('CopyURL')}
                  disabled={!fileId}
                  fullWidth
                  variant='outlined'
                  startIcon={<InsertLinkIcon />}
                  sx={actionButtonStyles}
                >
                  Copy URL
                </Button>

                <Button
                  disabled={!fileId}
                  onClick={() => handleShareOption('LinkedIn')}
                  fullWidth
                  variant='outlined'
                  startIcon={<NewLinkedin />}
                  endIcon={<OpenInNewIcon sx={{ fontSize: '16px' }} />}
                  sx={actionButtonStyles}
                >
                  Share to LinkedIn
                </Button>

                <Button
                  disabled={!fileId}
                  onClick={() => handleShareOption('Email')}
                  fullWidth
                  variant='outlined'
                  startIcon={<SVGEmail />}
                  endIcon={<OpenInNewIcon sx={{ fontSize: '16px' }} />}
                  sx={actionButtonStyles}
                >
                  Share via email
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <LoadingOverlay
        text='Creating public link and saving to Google Drive...'
        open={!fileId}
      />
    </Box>
  )
}

export default SuccessPage
