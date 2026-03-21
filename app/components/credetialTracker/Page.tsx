import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Divider,
  Button
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { FormData } from '../../credentialForm/form/types/Types'
import { SVGSparklesBlue, SVGDescribeBadge, DescriptionOutlinedIcon, InsertLinkIcon } from '../../Assets/SVGs'
import Image from 'next/image'
import { SkillMatch } from '../../utils/skillsApi'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import {
  sectionLabelStyles,
  sectionValueStyles,
  PreviewCard,
  CredentialContent,
  StepIndicator,
  StepDot,
  BadgePill,
  CredentialTitle,
  RecipientName,
  ExperienceText,
  SectionHeader,
  DescriptionText,
  MediaContainer,
  EmptySkillsState,
  carouselNavButtonStyles,
  carouselCounterStyles
} from '../Styles/appStyles'
// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

// Helper functions for file type detection
const isPDF = (fileName: string) => fileName?.toLowerCase().endsWith('.pdf')
const isMP4 = (fileName: string) => fileName?.toLowerCase().endsWith('.mp4')

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

interface CredentialTrackerProps {
  formData?: FormData
  selectedFiles?: {
    id: string
    name: string
    url: string
    isFeatured?: boolean
  }[]
  onBack?: () => void
}

const CredentialTracker: React.FC<CredentialTrackerProps> = ({
  formData,
  selectedFiles = [],
  onBack
}) => {
  const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})

  // Generate thumbnails for PDFs and Videos
  useEffect(() => {
    selectedFiles.forEach(async (file) => {
      if (file.url) {
        if (isPDF(file.name) && !pdfThumbnails[file.id]) {
          const thumb = await renderPDFThumbnail(file.url)
          setPdfThumbnails(prev => ({ ...prev, [file.id]: thumb }))
        } else if (isMP4(file.name) && !videoThumbnails[file.id]) {
          try {
            const thumb = await generateVideoThumbnail(file.url)
            setVideoThumbnails(prev => ({ ...prev, [file.id]: thumb }))
          } catch (e) {
            console.error("Error generating video thumbnail", e)
          }
        }
      }
    })
  }, [selectedFiles])

  const selectedSkills = formData?.skills || []

  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [isHoveringMedia, setIsHoveringMedia] = useState<boolean>(false)

  // Memoized supporting evidence links
  const uniqueLinks = useMemo(() => {
    const links: { name: string; url: string; hasId: boolean }[] = []
    const seenUrls = new Set<string>()

    const normalize = (val: any) => {
      if (!val || typeof val !== 'string') return ''
      let u = val.trim().toLowerCase()
      if (!u.startsWith('http') && !u.startsWith('blob:')) u = 'https://' + u
      if (u.endsWith('/')) u = u.slice(0, -1)
      return u
    }

    // 1. Files from selectedFiles
    selectedFiles.forEach(file => {
      const nUrl = normalize(file.url)
      if (nUrl && !seenUrls.has(nUrl)) {
        links.push({
          name: file.name || 'View File',
          url: file.url,
          hasId: !!(file as any).googleId || !!(file as any).wasId
        })
        seenUrls.add(nUrl)
      }
    })

    // 2. Manual links from formData.evidence
    if (formData?.evidence && Array.isArray(formData.evidence)) {
      formData.evidence.forEach(item => {
        const isManual = !item.googleId && !item.wasId
        if (isManual) {
          const nUrl = normalize(item.url)
          if (nUrl && !seenUrls.has(nUrl)) {
            links.push({
              name: item.name || item.url,
              url: item.url,
              hasId: false
            })
            seenUrls.add(nUrl)
          }
        }
      })
    }
    return links
  }, [selectedFiles, formData?.evidence])


  // Image gallery navigation handlers
  const handleNextImage = () => {
    if (selectedFiles.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedFiles.length)
    }
  }

  const handlePrevImage = () => {
    if (selectedFiles.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedFiles.length) % selectedFiles.length)
    }
  }

  // Reset image index when files change
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedFiles.length])

  // Get current display image (use index if multiple files, otherwise use featured or first)
  const currentDisplayFile = selectedFiles.length > 0
    ? selectedFiles[currentImageIndex]
    : null

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <PreviewCard elevation={0}>
        {/* Header */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <SVGDescribeBadge width="48" height="48" />
          <Box>
            <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#202E5B' }}>
              Credential Preview
            </Typography>
            <Typography sx={{ ...sectionLabelStyles }}>
              Review your credential before finalizing
            </Typography>
            <StepIndicator sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <StepDot active />
                <StepDot active />
                <StepDot active />
                <StepDot />
              </Box>
              <Typography component="span" sx={{ fontSize: '12px', ml: 0.5 }}>
                Step 3 of 4
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: '12px',
                  color: '#2563EB',
                  ml: 1,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={onBack}
              >
                ← Previous
              </Typography>
            </StepIndicator>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <CredentialContent>
          {/* Content */}
          <Box>
            <BadgePill>
              Self-issued
            </BadgePill>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '15px' }}>
              <Box sx={{ maxWidth: '75%', gap: '12px' }}>
                <CredentialTitle>
                  {formData?.credentialName || "Credential Name"}
                </CredentialTitle>
                <RecipientName>
                  Issued to: {formData?.fullName || "Your Name"}
                </RecipientName>
                <ExperienceText>
                  {formData?.credentialDuration ? `${formData.credentialDuration} of experience` : "No experience listed"}
                </ExperienceText>
              </Box>
            </Box>
            <Divider />
          </Box>


          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Box>
              <SectionHeader>
                Skill Description
              </SectionHeader>
            </Box>

            <DescriptionText as="div">
              {formData?.credentialDescription ? (
                <span dangerouslySetInnerHTML={{ __html: formData.credentialDescription }} />
              ) : (
                "No description provided."
              )}
            </DescriptionText>
          </Box>
          {/* Media */}
          {(currentDisplayFile || formData?.evidenceLink) && (
            <MediaContainer
              onMouseEnter={() => setIsHoveringMedia(true)}
              onMouseLeave={() => setIsHoveringMedia(false)}
            >
              {currentDisplayFile ? (
                <>
                  {isPDF(currentDisplayFile.name) ? (
                    <Image
                      src={pdfThumbnails[currentDisplayFile.id] ?? '/fallback-pdf-thumbnail.svg'}
                      alt='PDF Preview'
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  ) : isMP4(currentDisplayFile.name) ? (
                    <Image
                      src={videoThumbnails[currentDisplayFile.id] ?? '/fallback-video.png'}
                      alt='Video Thumbnail'
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <Image
                      src={currentDisplayFile.url}
                      alt='Featured Media'
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  )}

                  {/* Image Counter Overlay (Always Visible) */}
                  {selectedFiles.length > 1 && (
                    <Box sx={carouselCounterStyles}>
                      {currentImageIndex + 1} / {selectedFiles.length}
                    </Box>
                  )}

                  {/* Media Navigation Controls (Simplified from previous) */}
                  {isHoveringMedia && selectedFiles.length > 1 && (
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
              ) : formData?.evidenceLink ? (
                <Image
                  src={formData.evidenceLink}
                  alt='Featured Media'
                  fill
                  style={{ objectFit: 'contain' }}
                />
              ) : null}
            </MediaContainer>
          )}

          {/* Skills List (Preserved) */}
          <Box sx={{ gap: '12px', mt: '15px', display: 'flex', flexDirection: 'column' }}>

            <SectionHeader>
              {'Skills' + ` (${selectedSkills.length})`}
            </SectionHeader>


            {selectedSkills && selectedSkills.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedSkills.map(skill => (
                  <Box
                    key={skill.name}
                    sx={{
                      background: '#2563EB',
                      color: '#ffffff',
                      px: 2,
                      py: 0.75,
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    {skill.name}
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptySkillsState>
                <SVGSparklesBlue width="24" height="24" />
                <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                  No specific skills listed.
                </Typography>
              </EmptySkillsState>
            )}
          </Box>
          {/* Supporting Evidence Section */}
          {uniqueLinks.length > 0 && (
            <Box>
              <SectionHeader>
                Supporting Documentation
              </SectionHeader>
              {/* Thumbnails for Images */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mt: '8px', mb: '8px' }}>
                {selectedFiles.map((file, idx) => (
                  <Box
                    key={file.id || idx}
                    sx={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #E2E8F0',
                      '&:hover': { transform: 'scale(1.05)', transition: 'transform 0.2s' }
                    }}
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <Image
                      src={pdfThumbnails[file.id] || videoThumbnails[file.id] || file.url}
                      alt={file.name}
                      width={60}
                      height={60}
                      style={{ objectFit: 'cover' }}
                      unoptimized={!!(pdfThumbnails[file.id] || videoThumbnails[file.id] || file.url.startsWith('blob:') || file.url.startsWith('data:'))}
                    />
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mt: 1 }}>
                {uniqueLinks.map((item, index) => {
                  const isDocOrImage = (url: string) => {
                    if (!url) return false
                    return /\.(pdf|png|jpe?g|gif|webp|svg|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url) ||
                      url.includes('drive.google.com') ||
                      url.startsWith('blob:') ||
                      url.startsWith('data:')
                  }

                  return (
                    <Box
                      key={index}
                      component="a"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
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
                      {isDocOrImage(item.url) ? (
                        <DescriptionOutlinedIcon />
                      ) : (
                        <InsertLinkIcon />
                      )}
                      <Typography
                        sx={{
                          fontFamily: 'Inter',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'inherit'
                        }}
                      >
                        {item.name}
                      </Typography>
                      <OpenInNewIcon sx={{ fontSize: '14px' }} />
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )}
        </CredentialContent>
      </PreviewCard>
    </Box>
  )
}

export default CredentialTracker
