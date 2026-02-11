import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Container,
  styled,
  Card,
  CardContent,
  Divider
} from '@mui/material'
import { CloudUpload, Restore as RestoreIcon } from '@mui/icons-material'
import { FormData } from '../../credentialForm/form/types/Types'
import { Logo, SVGSparkles, SVGSparklesBlue } from '../../Assets/SVGs'
import Image from 'next/image'
import { commonTypographyStyles, evidenceListStyles } from '../Styles/appStyles'
import { extractSkillsFromTextApi, SkillMatch } from '../../utils/skillsApi'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import { ensureProtocol } from '../../utils/urlValidation'



// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

// Helper functions for file type detection
const isPDF = (fileName: string) => fileName.toLowerCase().endsWith('.pdf')
const isMP4 = (fileName: string) => fileName.toLowerCase().endsWith('.mp4')
const isGoogleDriveImageUrl = (url: string): boolean => {
  return /https:\/\/drive\.google\.com\/uc\?export=view&id=.+/.test(url)
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
  alignItems: 'center'
}))

const MainContentContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'currentStep'
})<{ currentStep?: number }>(({ theme, currentStep }) => ({
  width: '100%',
  maxWidth: '720px',
  padding: theme.breakpoints.down('sm') ? '24px 8px' : '45px 30px',
  backgroundColor: currentStep === 4 ? '#fff' : '#87abe4',
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

const Media = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasImage'
})<{ hasImage?: boolean }>(({ hasImage, theme }) => ({
  width: '100%',
  maxWidth: theme.breakpoints.down('sm') ? '400px' : '500px',
  aspectRatio: hasImage ? '4/3' : 'auto',
  position: 'relative',
  backgroundImage: 'none',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  // overflow: 'hidden', // Removing overflow hidden to allow shadow to be visible if needed, but keeping it is cleaner for borderRadius
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
  boxShadow: hasImage ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
}))

const EmptySkillsState = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: '#f2f8ff',
  borderRadius: '12px',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginTop: '8px',
  marginBottom: '8px'
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



interface CredentialTrackerProps {
  formData?: FormData
  selectedFiles?: {
    id: string
    name: string
    url: string
    isFeatured?: boolean
  }[]
  onSkillsChange?: (skills: SkillMatch[]) => void
  onRemovedSkillsChange?: (skills: SkillMatch[]) => void
  currentStep?: number
}

const CredentialTracker: React.FC<CredentialTrackerProps> = ({
  formData,
  selectedFiles = [],
  onSkillsChange,
  onRemovedSkillsChange,
  currentStep = 2
}) => {
  const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})
  // Initialize with empty array if undefined, assuming parent handles initial population or we sync from detected
  const [selectedSkills, setSelectedSkills] = useState<SkillMatch[]>(formData?.skills || [])
  const [removedSkills, setRemovedSkills] = useState<SkillMatch[]>(formData?.removedSkills || [])
  const [manuallyAddedSkills, setManuallyAddedSkills] = useState<SkillMatch[]>([])
  const [newSkillInput, setNewSkillInput] = useState<string>('')
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [isHoveringMedia, setIsHoveringMedia] = useState<boolean>(false)
  const [detectedSkills, setDetectedSkills] = useState<SkillMatch[]>([])
  const [hasFetched, setHasFetched] = useState(false)

  // ... (thumbnail generation code omitted for brevity as it shouldn't be touched by this replace) ...

  // Helper for Evidence section
  const shouldDisplayUrl = (url: string): boolean => {
    return !isGoogleDriveImageUrl(url)
  }
  // Sync selected skills with detected skills when description changes
  const featuredFile = selectedFiles.find(f => f.isFeatured)

  // Extract skills from description text using API
  useEffect(() => {
    const text = formData?.credentialDescription || ''

    // Skip extraction if on Preview step or later to prevent refresh
    if (currentStep && currentStep >= 4) {
      return
    }

    // Immediate pruning: Remove skills that are no longer in the text
    setDetectedSkills(prev => prev.filter(s =>
      text.toLowerCase().includes(s.name.toLowerCase())
    ))

    const timer = setTimeout(() => {
      const fetchSkills = async () => {
        if (text.length > 3) {
          try {
            const apiSkills: SkillMatch[] = await extractSkillsFromTextApi(text)

            // Additive update: Merge new skills with existing ones
            setDetectedSkills(prev => {
              const existingNames = new Set(prev.map(s => s.name.toLowerCase()))
              const newUnique = apiSkills.filter(s => !existingNames.has(s.name.toLowerCase()))
              return [...prev, ...newUnique]
            })
          } catch (error) {
            console.error('Failed to extract skills:', error)
            // Do not clear skills on error, just keep existing valid ones
          } finally {
            setHasFetched(true)
          }
        } else {
          setHasFetched(true)
        }
      }
      fetchSkills()
    }, 500)

    return () => clearTimeout(timer)

  }, [formData?.credentialDescription, currentStep])

  // Sync selected skills with detected skills when description changes
  useEffect(() => {
    // Skip sync if locked (Preview step) or waiting for initial fetch to prevent clearing valid skills
    if ((currentStep && currentStep >= 4) || (!hasFetched && selectedSkills.length > 0)) {
      return
    }

    if (selectedSkills.length === 0 && removedSkills.length === 0 && detectedSkills.length > 0) {
      setSelectedSkills(detectedSkills)
      return
    }

    const detectedNames = detectedSkills.map(s => s.name)

    setSelectedSkills(prev => {
      // Keep manual skills and skills that are still detected
      const stillValid = prev.filter(skill =>
        manuallyAddedSkills.some(m => m.name === skill.name) || detectedNames.includes(skill.name)
      )

      // Add new detected skills that aren't already selected and haven't been removed
      const newDetected = detectedSkills.filter(skill =>
        !prev.some(p => p.name === skill.name) && !removedSkills.some(r => r.name === skill.name)
      )

      return [...stillValid, ...newDetected]
    })
  }, [detectedSkills, hasFetched, currentStep]) // Depend on objects, ref stable

  // Notify parent component whenever selected skills change (for backend storage)
  useEffect(() => {
    if (onSkillsChange) {
      onSkillsChange(selectedSkills)
    }
  }, [selectedSkills, onSkillsChange])

  // Handle removing a skill from selected list
  const handleRemoveSkill = (skillToRemove: SkillMatch) => {
    setSelectedSkills(prev => prev.filter(s => s.name !== skillToRemove.name))
    // Add to removed skills if it's a detected or manually added skill
    if (!removedSkills.some(s => s.name === skillToRemove.name)) {
      setRemovedSkills(prev => {
        const updated = [...prev, skillToRemove]
        onRemovedSkillsChange?.(updated)
        return updated
      })
    }
  }

  // Handle restoring a removed skill
  const handleRestoreSkill = (skill: SkillMatch) => {
    if (!selectedSkills.some(s => s.name === skill.name)) {
      setSelectedSkills(prev => [...prev, skill])
      setRemovedSkills(prev => {
        const updated = prev.filter(s => s.name !== skill.name)
        onRemovedSkillsChange?.(updated)
        return updated
      })
    }
  }

  // Handle adding a manual skill
  const handleAddManualSkill = () => {
    const trimmedSkillName = newSkillInput.trim()
    if (trimmedSkillName && !selectedSkills.some(s => s.name.toLowerCase() === trimmedSkillName.toLowerCase())) {
      const newSkill: SkillMatch = {
        name: trimmedSkillName,
        score: 1.0,
        soc_codes: [],
        uuid: crypto.randomUUID(),
        originalMatch: trimmedSkillName
      }
      setSelectedSkills(prev => [...prev, newSkill])
      setManuallyAddedSkills(prev => [...prev, newSkill])
      setNewSkillInput('')
      // Remove from removed skills if it was there
      setRemovedSkills(prev => prev.filter(s => s.name.toLowerCase() !== trimmedSkillName.toLowerCase()))
    }
  }

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

  const hasValidEvidence = Boolean(
    (formData?.evidenceLink && formData.evidenceLink.trim() !== '') ||
    (selectedFiles && selectedFiles.length > 0) ||
    (formData?.portfolio && formData.portfolio.length > 0)
  )

  return (
    <Box sx={{ p: 0, width: '100%', maxWidth: { xs: '100%', md: '720px' } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Section */}
        <HeaderContainer elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Logo />
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
                {currentStep === 4 ? "Please review your credential before signing!" : "Here's what you're building"}
              </Typography>

            </Box>
          </Box>
        </HeaderContainer>

        {/* Main Content Section */}
        <MainContentContainer currentStep={currentStep}>
          <Box sx={{ width: '100%', mb: 4 }}>
            <SkillCard>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <Field label='Name' value={formData?.fullName} />
                  <Field
                    label='Skill Name'
                    value={formData?.credentialName}
                    placeholder={currentStep === 1 ? '...' : 'Example: Caring For Healthy Plants'}
                  />
                  <Field
                    label='Skill Description'
                    value={formData?.credentialDescription as string}
                    isHtml={true}
                    placeholder={
                      currentStep === 1
                        ? '...'
                        : 'Example:\nWatering And Feeding On A Routine Schedule, Diagnosing Plant Sickness, Over/Under Watering, Removing Dead Leaves, And Cultivating Rich Soil.'
                    }
                  />
                  {/* Enhanced Media Section with PDF support and Gallery Navigation */}
                  <MediaContainer
                    onMouseEnter={() => setIsHoveringMedia(true)}
                    onMouseLeave={() => setIsHoveringMedia(false)}
                  >
                    <Media hasImage={!!currentDisplayFile || !!formData?.evidenceLink}>
                      {currentDisplayFile ? (
                        // Handle different file types with proper thumbnails
                        <>
                          {isPDF(currentDisplayFile.name) ? (
                            <Image
                              src={
                                pdfThumbnails[currentDisplayFile.id] ??
                                '/fallback-pdf-thumbnail.svg'
                              }
                              alt='PDF Preview'
                              fill
                              style={{
                                borderRadius: '16px',
                                objectFit: 'cover'
                              }}
                            />
                          ) : isMP4(currentDisplayFile.name) ? (
                            <Image
                              src={
                                videoThumbnails[currentDisplayFile.id] ?? '/fallback-video.png'
                              }
                              alt='Video Thumbnail'
                              fill
                              style={{
                                borderRadius: '16px',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <Image
                              src={currentDisplayFile.url}
                              alt='Featured Media'
                              fill
                              style={{
                                borderRadius: '16px',
                                objectFit: 'cover'
                              }}
                            />
                          )}

                          {/* Navigation Controls - Show only when hovering and multiple images */}
                          {isHoveringMedia && selectedFiles.length > 1 && (
                            <>
                              <Box
                                onClick={handlePrevImage}
                                sx={{
                                  position: 'absolute',
                                  left: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#ffffff',
                                  fontSize: '24px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    transform: 'translateY(-50%) scale(1.1)'
                                  },
                                  zIndex: 10
                                }}
                              >
                                ‹
                              </Box>
                              <Box
                                onClick={handleNextImage}
                                sx={{
                                  position: 'absolute',
                                  right: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#ffffff',
                                  fontSize: '24px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    transform: 'translateY(-50%) scale(1.1)'
                                  },
                                  zIndex: 10
                                }}
                              >
                                ›
                              </Box>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: '12px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                  color: '#ffffff',
                                  padding: '6px 12px',
                                  borderRadius: '16px',
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  fontFamily: 'Inter',
                                  zIndex: 10
                                }}
                              >
                                {currentImageIndex + 1} / {selectedFiles.length}
                              </Box>
                            </>
                          )}
                        </>
                      ) : formData?.evidenceLink ? (
                        <Image
                          src={formData.evidenceLink}
                          alt='Featured Media'
                          fill
                          style={{
                            borderRadius: '16px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Image
                          src='/images/SkillMedia.svg'
                          alt='Media placeholder'
                          width={100}
                          height={100}
                          style={{
                            borderRadius: '10px',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </Media>
                    <Typography
                      sx={{
                        fontFamily: 'Inter',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        color: '#000E40',
                        letterSpacing: '0.08px',
                        mt: 1
                      }}
                    >
                      {(currentDisplayFile || formData?.evidenceLink) ? 'Media' : 'Media (optional)'}
                    </Typography>
                  </MediaContainer>
                  {/* Detected Skills Section */}
                  <Box sx={{ mb: 1.5 }}>
                    {/* Detected Skills Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {currentStep < 4 && <SVGSparklesBlue />}
                      <FieldLabel sx={{ mb: 0 }}>
                        {currentStep >= 4 ? 'Skills' : 'Detected Skills'}
                      </FieldLabel>
                    </Box>

                    {/* Selected Skills Display with X buttons */}
                    {selectedSkills && selectedSkills.length > 0 ? (
                      <Box sx={{
                        backgroundColor: '#f0f8ff',
                        borderRadius: '12px',
                        p: 2,
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          {selectedSkills.map(skill => (
                            <Box
                              key={skill.name}
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
                                gap: 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  background: '#155dfc'
                                }
                              }}
                            >
                              {skill.name}
                              {currentStep < 4 && (
                                <Box
                                  component='span'
                                  onClick={() => handleRemoveSkill(skill)}
                                  sx={{
                                    cursor: 'pointer',
                                    fontWeight: 400,
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    ml: 0.5,
                                    '&:hover': {
                                      transform: 'scale(1.2)'
                                    }
                                  }}
                                >
                                  ×
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>

                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: '12px',
                            color: '#000E40',
                            mb: 0
                          }}
                        >
                          {currentStep < 4 && 'Click any skill to remove it'}
                        </Typography>
                      </Box>
                    ) : (
                      <EmptySkillsState>
                        <SVGSparkles />
                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '24px',
                            color: '#000e40',
                            textAlign: 'center'
                          }}
                        >
                          Skills will appear here as you type
                        </Typography>
                      </EmptySkillsState>
                    )}

                    {/* Only show skill editing controls on step 2 */}
                    {currentStep === 2 && (
                      <>

                        {/* Add Skill Manually Section */}
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            sx={{
                              fontFamily: 'Inter',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#000E40',
                              mb: 1
                            }}
                          >
                            Add skill manually
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <input
                              type='text'
                              placeholder='Type skill name...'
                              value={newSkillInput}
                              onChange={e => setNewSkillInput(e.target.value)}
                              onKeyPress={e => {
                                if (e.key === 'Enter') {
                                  handleAddManualSkill()
                                }
                              }}
                              style={{
                                flex: 1,
                                background: '#fff',
                                color: '#000000ff',
                                padding: '12px 16px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'Inter',
                                outline: 'none'
                              }}
                            />
                            <Box
                              onClick={handleAddManualSkill}
                              sx={{
                                width: '48px',
                                height: '48px',
                                background: '#155dfc',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '24px',
                                color: '#ffffff',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  background: '#155dfc'
                                }
                              }}
                            >
                              +
                            </Box>
                          </Box>
                        </Box>
                      </>
                    )}

                    {currentStep < 4 && removedSkills.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#000E40',
                            mb: 1
                          }}
                        >
                          Removed Skills (click to restore)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', background: '#edf1f7ff', borderRadius: '14px', padding: '12px' }}>
                          {removedSkills.map(skill => (
                            <Box
                              key={skill.name}
                              onClick={() => handleRestoreSkill(skill)}
                              sx={{
                                background: '#fefefeff',
                                color: '#666666',
                                px: 2,
                                py: 0.75,
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                border: '1px dashed #cccccc',
                                transition: 'all 0.2s',
                                textDecoration: 'line-through',
                                '&:hover': {
                                  background: '#e0e0e0',
                                  borderColor: '#999999',
                                  color: '#333333'
                                }
                              }}
                            >
                              {skill.name}
                              <Box
                                component='span'
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  ml: 0.5,
                                  textDecoration: 'none'
                                }}
                              >
                                <RestoreIcon sx={{ fontSize: 16 }} />
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>


                  <Field
                    label='Earning Criteria'
                    value={formData?.description as string}
                    isHtml={true}
                    placeholder={
                      currentStep === 1
                        ? '...'
                        : 'Example:\n• I have been a weekly volunteer at the Beloved NC garden for the past 3 years in addition to caring for my own personal garden.'
                    }
                  />

                  <Box>
                    <Typography
                      sx={{
                        fontFamily: 'Inter',
                        fontSize: '16px', // Matched FieldLabel size
                        fontWeight: 700,
                        lineHeight: '24px',
                        color: '#000e40',
                        letterSpacing: '0.08px',

                      }}
                    >
                      Duration
                    </Typography>

                    {formData?.credentialDuration ? (
                      <Typography
                        sx={{
                          fontFamily: 'Inter',
                          fontSize: '14px', // Matched FieldValue size
                          fontWeight: 400,
                          lineHeight: '24px',
                          color: '#000E40',
                          letterSpacing: '0.08px'
                        }}
                      >
                        • {formData.credentialDuration}
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: 'Inter',
                          fontSize: '14px',
                          fontWeight: 400,
                          lineHeight: '24px',
                          color: '#4e4e4e',
                          letterSpacing: '0.08px',
                          fontStyle: 'italic'
                        }}
                      >
                        {currentStep === 1 ? '...' : '• Example: 3 years'}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{}}>
                    <Typography
                      sx={{
                        fontFamily: 'Inter',
                        fontSize: '14px', // Matched FieldLabel
                        fontWeight: 700,
                        color: '#000E40',
                        letterSpacing: '0.08px', // Matched FieldLabel
                        lineHeight: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      Supporting Documentation
                    </Typography>

                    {hasValidEvidence ? (
                      <Box component='ul' sx={{ pl: 2, m: 0 }}>
                        {formData?.evidenceLink &&
                          ((formData?.portfolio?.filter((p: any) => p.url === formData.evidenceLink).length) === 0) && (
                            <Box component='li' sx={{ color: '#155dfc', mb: 1, '::marker': { fontSize: '1.2em' } }}>
                              <a
                                href={ensureProtocol(formData.evidenceLink)}
                                target='_blank'
                                rel='noopener noreferrer'
                                style={{
                                  color: '#155dfc',
                                  fontFamily: 'Inter',
                                  textDecoration: 'underline',
                                  fontWeight: 400,
                                  fontSize: '14px' // Match text size
                                }}
                              >
                                {formData.evidenceLink}
                              </a>
                            </Box>
                          )}

                        {/* Selected Files (Active Uploads) */}
                        {selectedFiles.map((file) => (
                          <Box key={file.id || file.url} component='li' sx={{ color: '#155dfc', mb: 1, '::marker': { fontSize: '1.2em' } }}>
                            <a
                              href={ensureProtocol(file.url)}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                color: '#155dfc',
                                fontFamily: 'Inter',
                                textDecoration: 'underline',
                                fontWeight: 400,
                                fontSize: '14px'
                              }}
                            >
                              {file.name || file.url}
                            </a>
                          </Box>
                        ))}

                        {/* Portfolio Items (only if not already shown via selectedFiles to avoid duplicates) */}
                        {formData?.portfolio?.map((porto: { name: string; url: string }) => {
                          const isAlreadyShown = selectedFiles.some(f => f.url === porto.url || (f.name && f.name === porto.name));
                          if (porto.name && porto.url && !isAlreadyShown) {
                            return (
                              <Box component='li' key={porto.url} sx={{ color: '#155dfc', mb: 1, '::marker': { fontSize: '1.2em' } }}>
                                <a
                                  href={ensureProtocol(porto.url)}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  style={{
                                    color: '#155dfc',
                                    fontFamily: 'Inter',
                                    textDecoration: 'underline',
                                    fontWeight: 400,
                                    fontSize: '14px' // Match text size
                                  }}
                                >
                                  {porto.name || porto.url}
                                </a>
                              </Box>
                            )
                          }
                          return null
                        })}
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: 'Inter',
                          fontSize: '14px',
                          fontWeight: 400, // Matched FieldValue
                          lineHeight: '24px',
                          color: '#4e4e4e',
                          fontStyle: 'italic',
                          letterSpacing: '0.08px'
                        }}
                      >
                        {currentStep === 1
                          ? '...'
                          : '• Links to supporting documentation will appear here'}
                      </Typography>
                    )}
                  </Box>

                </Box>
              </CardContent>
            </SkillCard >
          </Box >
        </MainContentContainer >
      </Box >
    </Box >
  )
}

export default CredentialTracker
