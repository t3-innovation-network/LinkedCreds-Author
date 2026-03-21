'use client'

import React, { useEffect, useState } from 'react'
import useGoogleDrive from '../hooks/useGoogleDrive'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import NextLink from 'next/link'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { InsertLinkIcon, DescriptionOutlinedIcon } from '../Assets/SVGs'
import { styled, useTheme } from '@mui/material/styles'
import { recThumbnailContainerStyles, recThumbnailImageStyles, recEvidenceLinkRowStyles, recEvidenceLinkTextStyles } from '../components/Styles/appStyles'
import {
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  useMediaQuery
} from '@mui/material'
import { useSession, signIn } from 'next-auth/react'
import { getFileViaFirebase } from '../firebase/storage'
import QRCode from 'qrcode'

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

const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif)$/i.test(fileName)
const isPDF = (fileName: string) => /\.pdf$/i.test(fileName)
const isVideo = (fileName: string) => /\.(mp4|webm|ogg)$/i.test(fileName)

// EvidencePreview removed in favor of inline RecommenderPreview layout

interface AlertState {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
}

interface RecommendationData {
  recommendationText: string
  howKnow: any
  name: string
  qualifications: string
  evidence: Array<{ name: string; url: string; type?: string[] }>
  skillsEndorsed?: Array<{
    name?: string
    id?: string
    frameworkMatch?: Array<{ framework?: string; socCode?: string[]; name?: string; similarityScore?: number }>
    targetName?: string
  }>
}

const Page = () => {
  const { storage } = useGoogleDrive()
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isApproved, setIsApproved] = useState(false)
  const [isRejected, setIsRejected] = useState(false)
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'info'
  })
  const [approveLoading, setApproveLoading] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [recId, setRecId] = useState<string | null>(null)
  const [vcId, setVcId] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [qrCodeDataUrlMobile, setQrCodeDataUrlMobile] = useState<string>('')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: session } = useSession()

  const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1)
  }))

  const ContentSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3)
  }))

  const cleanHTML = (htmlContent: string) => {
    return htmlContent
      .replace(/<p><br><\/p>/g, '')
      .replace(/<p><\/p>/g, '')
      .replace(/<br>/g, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '')
  }

  const getQueryParams = (key: string): string | null => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get(key)
    }
    return null
  }

  useEffect(() => {
    const fileId = getQueryParams('recId')
    setRecId(fileId)
    setVcId(getQueryParams('vcId'))
    if (fileId) {
      const sourceUrl = `${window.location.origin}/api/credential-raw/${fileId}`
      QRCode.toDataURL(sourceUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#2563eb',
          light: '#F0F4F8'
        }
      })
        .then((url: string) => {
          setQrCodeDataUrl(url)
        })
        .catch((err: any) => {
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
        .then((url: string) => {
          setQrCodeDataUrlMobile(url)
        })
        .catch((err: any) => {
          console.error('Error generating mobile QR code:', err)
        })
    }
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined' && recId) {
      const hiddenRecs = JSON.parse(localStorage.getItem('hiddenRecommendations') ?? '[]')
      if (hiddenRecs.includes(recId)) {
        setIsRejected(true)
      }
    }
  }, [recId])

  useEffect(() => {
    const checkProcessingStatus = async () => {
      try {
        if (typeof window !== 'undefined' && recId) {
          const localApprovedRecs = JSON.parse(
            localStorage.getItem('approvedRecommendations') ?? '[]'
          )
          if (localApprovedRecs.includes(recId)) {
            setIsApproved(true)
            return
          }
        }

        if (!vcId || !storage || !recId) return

        const vcFolderId = await storage.getFileParents(vcId)
        const files = await storage.findFolderFiles(vcFolderId)
        const relationsFile = files.find((f: any) => f.name === 'RELATIONS')

        if (relationsFile) {
          try {
            const relations = await (storage as any).getRelationsFile(relationsFile.id)

            const alreadyProcessed = relations.some(
              (relation: any) => relation.recommendationFileId === recId
            )

            if (alreadyProcessed) {
              setIsApproved(true)

              if (typeof window !== 'undefined') {
                const localApprovedRecs = JSON.parse(
                  localStorage.getItem('approvedRecommendations') ?? '[]'
                )
                if (!localApprovedRecs.includes(recId)) {
                  localStorage.setItem(
                    'approvedRecommendations',
                    JSON.stringify([...localApprovedRecs, recId])
                  )
                }
              }
            }
          } catch (error) {
            console.error('Error getting relations file:', error)
          }
        }
      } catch (error) {
        console.error('Error checking processing status:', error)
      }
    }

    if (recId && vcId) {
      checkProcessingStatus()
    }
  }, [recId, vcId, storage])

  useEffect(() => {
    const fetchRecommendation = async () => {
      setLoading(true)
      try {
        if (!recId) {
          console.log('No recommendation file recId')
          return
        }
        // const recommendation = await storage?.retrieve(recId as string)
        const recommendation = await getFileViaFirebase(recId, session?.accessToken as string)

        if (!recommendation) {
          console.log('No recommendation file')
          return
        }
        const recData = recommendation

        let recBody = recData
        if (recData?.body && typeof recData.body === 'string') {
          recBody = JSON.parse(recData.body)
        } else if (typeof recData === 'string') {
          recBody = JSON.parse(recData)
        }

        setRecommendation(recBody.credentialSubject)
      } catch (error) {
        console.error('Error fetching recommendation:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecommendation()
  }, [recId, storage])

  const handleUnhide = async () => {
    if (isRejected && recId) {
      try {
        if (typeof window !== 'undefined') {
          const hiddenRecs = JSON.parse(
            localStorage.getItem('hiddenRecommendations') ?? '[]'
          )
          const updatedHiddenRecs = hiddenRecs.filter((id: string) => id !== recId)
          localStorage.setItem('hiddenRecommendations', JSON.stringify(updatedHiddenRecs))
        }

        setIsRejected(false)
        setAlertState({
          open: true,
          message: 'Recommendation is now visible in your claim again',
          severity: 'success'
        })
      } catch (error) {
        console.error('Error unhiding recommendation:', error)
        setAlertState({
          open: true,
          message: 'Error unhiding recommendation. Please try again.',
          severity: 'error'
        })
      }
    }
  }

  const handleApprove = async () => {
    if (isApproved) {
      setAlertState({
        open: true,
        message: 'This recommendation has already been approved',
        severity: 'info'
      })
      return
    }

    setApproveLoading(true)
    try {
      if (!vcId || !storage || !recId) {
        console.log('No recommendation file id')
        setAlertState({
          open: true,
          message: 'Error: Missing recommendation file ID',
          severity: 'error'
        })
        return
      }
      const vcFolderId = await storage.getFileParents(vcId)
      const files = await storage.findFolderFiles(vcFolderId)
      const relationsFile = files.find((f: any) => f.name === 'RELATIONS')

      await storage.updateRelationsFile({
        relationsFileId: relationsFile.id,
        recommendationFileId: recId
      })

      if (typeof window !== 'undefined') {
        const localApprovedRecs = JSON.parse(
          localStorage.getItem('approvedRecommendations') ?? '[]'
        )
        if (!localApprovedRecs.includes(recId)) {
          localStorage.setItem(
            'approvedRecommendations',
            JSON.stringify([...localApprovedRecs, recId])
          )
        }
      }

      setIsApproved(true)
      setAlertState({
        open: true,
        message: 'Recommendation approved successfully!',
        severity: 'success'
      })
      console.log('Successfully approving recommendation!')
    } catch (error) {
      console.error('Error approving recommendation:', error)
      setAlertState({
        open: true,
        message: 'Error approving recommendation. Please try again.',
        severity: 'error'
      })
    } finally {
      setApproveLoading(false)
    }
  }

  const handleReject = async () => {
    if (isRejected) {
      setAlertState({
        open: true,
        message:
          "You've already hidden this recommendation. You can still approve it if you want to include it in your claim.",
        severity: 'info'
      })
      return
    }

    setRejectLoading(true)
    try {
      if (typeof window !== 'undefined' && recId) {
        const hiddenRecs = JSON.parse(
          localStorage.getItem('hiddenRecommendations') ?? '[]'
        )
        if (!hiddenRecs.includes(recId)) {
          localStorage.setItem(
            'hiddenRecommendations',
            JSON.stringify([...hiddenRecs, recId])
          )
        }
      }

      setIsRejected(true)
      setAlertState({
        open: true,
        message:
          'This recommendation has been temporarily hidden from your claim. You can always come back and approve it later if you change your mind!',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error rejecting recommendation:', error)
      setAlertState({
        open: true,
        message: 'Error hiding recommendation. Please try again.',
        severity: 'error'
      })
    } finally {
      setRejectLoading(false)
    }
  }

  const handleCloseAlert = () => {
    setAlertState({
      ...alertState,
      open: false
    })
  }

  const renderButtonContent = (
    isLoading: boolean,
    isComplete: boolean,
    completeText: string,
    initialText: string
  ) => {
    if (isLoading) {
      return <CircularProgress size={24} color='inherit' />
    }
    if (isComplete) {
      return completeText
    }
    return initialText
  }

  if ((session as any)?.error === 'RefreshAccessTokenError') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
          px: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant='h6' color='error'>
          Your Google Drive session has expired.
        </Typography>
        <Typography variant='body1'>
          To provide or view recommendations, please sign in again to refresh your permissions.
        </Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={() => signIn('google')}
          sx={{ borderRadius: '100px', textTransform: 'none', px: 4 }}
        >
          Sign In with Google
        </Button>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }
  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant='h4'
        sx={{
          textAlign: 'center',
          marginBottom: '20px'
        }}
      >
        Review the recommendation
      </Typography>
      {recommendation && (
        <Card
          sx={{
            maxWidth: 672,
            mx: 'auto',
            border: '1px solid rgba(25, 118, 210, 0.12)',
            borderRadius: 2
          }}
        >
          <CardHeader
            sx={{
              borderBottom: '1px solid rgba(25, 118, 210, 0.08)',
              bgcolor: 'background.paper',
              '& .MuiCardHeader-content': {}
            }}
            action={
              recId && (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <NextLink
                    href={`/api/credential-raw/${recId}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography
                      sx={{
                        color: '#003FE0',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'none'
                        }
                      }}
                    >
                      View Source
                    </Typography>
                  </NextLink>
                  {qrCodeDataUrl && (
                    <img
                      src={isMobile ? qrCodeDataUrlMobile : qrCodeDataUrl}
                      alt='QR Code for credential source'
                      style={{
                        width: isMobile ? '80px' : '120px',
                        height: isMobile ? '80px' : '120px',
                        marginTop: '8px'
                      }}
                    />
                  )}
                </Box>
              )
            }
            avatar={
              <CheckCircleIcon
                sx={{
                  color: 'primary.main',
                  width: 20,
                  height: 20
                }}
              />
            }
            title={<Typography variant='h6'>{recommendation?.name} vouch </Typography>}
          />

          <CardContent sx={{ py: 3 }}>


            <ContentSection>
              <SectionTitle>How {recommendation?.name} knows you</SectionTitle>
              <Typography color='text.primary'>
                <span
                  dangerouslySetInnerHTML={{
                    __html: cleanHTML(recommendation?.howKnow)
                  }}
                />
              </Typography>
            </ContentSection>

            {recommendation?.skillsEndorsed && recommendation.skillsEndorsed.length > 0 && (
              <ContentSection>
                <SectionTitle>Skills Endorsed</SectionTitle>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {recommendation.skillsEndorsed.map((skill, index) => (
                    <Box
                      key={skill.id ?? `skill-${index}`}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        borderRadius: '16px',
                        backgroundColor: 'rgba(0, 63, 224, 0.08)',
                        border: '1px solid rgba(0, 63, 224, 0.2)'
                      }}
                    >
                      <Typography variant="body2" color="primary.main" fontWeight={500}>
                        {skill.name ?? skill.targetName}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </ContentSection>
            )}
            <ContentSection>
              <SectionTitle>Recommendation</SectionTitle>
              <Typography color='text.primary'>
                <span
                  dangerouslySetInnerHTML={{
                    __html: cleanHTML(recommendation?.recommendationText)
                  }}
                />
              </Typography>
            </ContentSection>
            <ContentSection>
              <SectionTitle>The qualifications</SectionTitle>
              <Typography color='text.primary'>
                <span
                  dangerouslySetInnerHTML={{
                    __html: cleanHTML(recommendation?.qualifications)
                  }}
                />
              </Typography>
            </ContentSection>

            {(() => {
              const evidenceItems = recommendation?.evidence || (recommendation as any)?.portfolio || []
              if (evidenceItems.length > 0) {
                const isFile = (url: string, name: string) => url.includes('drive.google.com') || isImage(name || url) || isPDF(name || url) || isVideo(name || url)
                const mediaItems = evidenceItems.filter((e: any) => isFile(e.url || e.id || '', e.name || ''))

                return (
                  <ContentSection sx={{ mb: 0 }}>
                    <SectionTitle>Supporting Evidence</SectionTitle>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Card 2 Thumbnails for Uploaded Files */}
                      {mediaItems.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mt: '8px', mb: '8px' }}>
                          {mediaItems.map((file: any, index: number) => {
                            const rawUrl = file.url || file.id || ''
                            const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
                            const isGoogleDrive = url.includes('drive.google.com')
                            const isPdf = isPDF(file.name || url || '')
                            const isVid = isVideo(file.name || url || '')
                            
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

                      {/* Link Rows for ALL evidence */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mt: 1 }}>
                        {evidenceItems.map((evidence: any, index: number) => {
                          const itemUrl = evidence.url || evidence.id
                          if (!itemUrl) return null
                          const url = itemUrl.startsWith('http') ? itemUrl : `https://${itemUrl}`
                          const isGoogleDriveLink = url.includes('drive.google.com')
                          const isDoc = isImage(evidence.name || url || '') || isPDF(evidence.name || url || '') || isVideo(evidence.name || url || '') || isGoogleDriveLink
                          return (
                            <Box
                              key={index}
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
                                {evidence.name || evidence.url}
                              </Typography>
                              <OpenInNewIcon sx={{ fontSize: '14px' }} />
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  </ContentSection>
                )
              }
              return null
            })()}
          </CardContent>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              mb: '10px'
            }}
          >
            <Tooltip
              title={isApproved ? 'This recommendation has already been approved' : ''}
              arrow
              placement='top'
            >
              <span>
                <Button
                  sx={{
                    padding: '10px 20px',
                    borderRadius: '100px',
                    textTransform: 'capitalize',
                    fontFamily: 'Roboto',
                    fontWeight: '600',
                    lineHeight: '20px',
                    backgroundColor: isApproved ? '#EFF6FF' : '#003FE0',
                    color: '#FFF',
                    '&:hover': {
                      backgroundColor: isApproved ? '#EFF6FF' : '#003FE0'
                    },
                    '&:disabled': {
                      color: '#FFF',
                      opacity: 0.7
                    }
                  }}
                  onClick={handleApprove}
                  disabled={isApproved || approveLoading}
                >
                  {renderButtonContent(approveLoading, isApproved, 'Approved', 'Approve')}
                </Button>
              </span>
            </Tooltip>
            <Tooltip
              title={
                isApproved
                  ? 'This recommendation has been approved and cannot be hidden'
                  : isRejected
                    ? 'Click to unhide this recommendation'
                    : ''
              }
              arrow
              placement='top'
            >
              <span>
                <Button
                  variant='contained'
                  sx={{
                    padding: '10px 20px',
                    borderRadius: '100px',
                    textTransform: 'capitalize',
                    fontFamily: 'Roboto',
                    fontWeight: '600',
                    lineHeight: '20px',
                    backgroundColor: isRejected ? '#f44336' : '#003FE0',
                    color: '#FFF',
                    '&:hover': {
                      backgroundColor: isRejected ? '#f44336' : '#003FE0'
                    },
                    '&:disabled': {
                      color: '#FFF',
                      opacity: 0.7
                    }
                  }}
                  onClick={isRejected ? handleUnhide : handleReject}
                  disabled={isApproved || rejectLoading}
                >
                  {renderButtonContent(rejectLoading, isRejected, 'Hidden', 'Hide')}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Card>
      )}

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alertState.severity}
          sx={{ width: '100%' }}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Page
