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
import { FormData } from '../../credentialForm/form/types/Types'
import { Logo } from '../../Assets/SVGs'
import Image from 'next/image'
import { commonTypographyStyles, evidenceListStyles } from '../Styles/appStyles'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'

//TODO keyword is used to add API call for skill extraction later


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

const MainContentContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '720px',
  padding: theme.breakpoints.down('sm') ? '24px 8px' : '45px 30px',
  backgroundColor: '#87abe4',
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
  border: '1px solid #003fe0',
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
  color: '#6b7280',
  letterSpacing: '0.08px',
  wordBreak: 'break-word',
  whiteSpace: 'pre-line',
  overflowWrap: 'anywhere'
}))

const MediaContainer = styled(Box)(({ theme }) => ({
  height: theme.breakpoints.down('sm') ? '120px' : '180px',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column'
}))

const Media = styled(Box)<{ hasImage?: boolean }>(({ hasImage, theme }) => ({
  width: theme.breakpoints.down('sm') ? '100px' : '160.506px',
  height: theme.breakpoints.down('sm') ? '90px' : '153.129px',
  position: 'relative',
  backgroundImage: hasImage ? 'none' : 'url(/images/SkillMedia.svg)',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  overflow: 'hidden',
  margin: '0 auto'
}))

// SKILL EXTRACTION - TEMPORARY IMPLEMENTATION
// TODO: Replace with API call

// Temporary keyword list for demo - will be replaced by API
const TEMP_SKILL_KEYWORDS = [
  'Leadership', 'Strategic Planning', 'Process Improvement', 'Quality Assurance',
  'Documentation', 'Problem Solving', 'Critical Thinking', 'Collaboration',
  'Communication', 'Teamwork', 'Project Management', 'Software Development',
  'Research', 'Data Analysis', 'Customer Service', 'Plant Care', 'Diagnosis'
]

/**
 * Extract skills from text description
 * TODO: Need to add API call for skill extraction
 */
const extractSkillsFromText = (text: string): string[] => {
  if (!text) return []
  const lowerText = text.toLowerCase()
  return TEMP_SKILL_KEYWORDS.filter(skill => lowerText.includes(skill.toLowerCase()))
}

// Field component for consistent styling
interface FieldProps {
  label: string
  value?: string
  isHtml?: boolean
}

const Field: React.FC<FieldProps> = ({ label, value, isHtml }) => (
  <Box sx={{ mb: 2.5 }}>
    <FieldLabel>{label}</FieldLabel>
    {isHtml && value ? (
      <FieldValue>
        <span dangerouslySetInnerHTML={{ __html: value }} />
      </FieldValue>
    ) : (
      <FieldValue>{value || 'Start typing...'}</FieldValue>
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
  onSkillsChange?: (skills: string[]) => void  // Callback to store skills for backend
  currentStep?: number  // Current form step (1, 2, 3, or final) - controls visibility of skill editing
}

const CredentialTracker: React.FC<CredentialTrackerProps> = ({
  formData,
  selectedFiles = [],
  onSkillsChange,
  currentStep = 2  // Default to step 2 for backward compatibility
}) => {
  const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [removedSkills, setRemovedSkills] = useState<string[]>([])
  const [manuallyAddedSkills, setManuallyAddedSkills] = useState<string[]>([])
  const [newSkillInput, setNewSkillInput] = useState<string>('')

  // Generate thumbnails for PDF and video files
  useEffect(() => {
    selectedFiles.forEach(async file => {
      if (isPDF(file.name) && !pdfThumbnails[file.id]) {
        const thumbnail = await renderPDFThumbnail(file.url)
        setPdfThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
      }

      if (isMP4(file.name) && !videoThumbnails[file.id]) {
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
    })
  }, [selectedFiles, pdfThumbnails, videoThumbnails])

  // Helper for Evidence section
  const shouldDisplayUrl = (url: string): boolean => {
    return !isGoogleDriveImageUrl(url)
  }
  const handleNavigate = (url: string, target: string = '_blank') => {
    window.open(url, target)
  }
  const hasValidEvidence =
    (formData?.portfolio &&
      Array.isArray(formData.portfolio) &&
      formData.portfolio.some((p: any) => p.name && p.url)) ||
    (formData?.evidenceLink && shouldDisplayUrl(formData.evidenceLink))

  // Get featured media file
  const featuredFile = selectedFiles.find(f => f.isFeatured)

  // Extract skills from description text
  // TODO: When API is ready, this can become an async effect with loading state
  const detectedSkills = React.useMemo(() => {
    const text = (formData?.credentialDescription || '') + ' ' + (formData?.description || '')
    return extractSkillsFromText(text)
  }, [formData?.credentialDescription, formData?.description])

  // Sync selected skills with detected skills when description changes
  useEffect(() => {
    // On first load (no skills selected yet), initialize with detected skills
    if (selectedSkills.length === 0 && removedSkills.length === 0 && detectedSkills.length > 0) {
      setSelectedSkills(detectedSkills)
      return
    }

    // When description changes, update selected skills:
    // 1. Remove skills that are no longer detected (unless manually added)
    // 2. Add newly detected skills (unless they were previously removed)
    setSelectedSkills(prev => {
      // Keep manually added skills and skills that are still detected
      const stillValid = prev.filter(skill =>
        manuallyAddedSkills.includes(skill) || detectedSkills.includes(skill)
      )

      // Add new detected skills that weren't previously removed
      const newDetected = detectedSkills.filter(skill =>
        !prev.includes(skill) && !removedSkills.includes(skill)
      )

      return [...stillValid, ...newDetected]
    })
  }, [detectedSkills])

  // Notify parent component whenever selected skills change (for backend storage)
  useEffect(() => {
    if (onSkillsChange) {
      onSkillsChange(selectedSkills)
    }
  }, [selectedSkills, onSkillsChange])

  // Handle removing a skill from selected list
  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skillToRemove))
    // Add to removed skills if it's a detected or manually added skill
    if (!removedSkills.includes(skillToRemove)) {
      setRemovedSkills(prev => [...prev, skillToRemove])
    }
  }

  // Handle restoring a removed skill
  const handleRestoreSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills(prev => [...prev, skill])
      setRemovedSkills(prev => prev.filter(s => s !== skill))
    }
  }

  // Handle adding a manual skill
  const handleAddManualSkill = () => {
    const trimmedSkill = newSkillInput.trim()
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
      setSelectedSkills(prev => [...prev, trimmedSkill])
      setManuallyAddedSkills(prev => [...prev, trimmedSkill])
      setNewSkillInput('')
      // Remove from removed skills if it was there
      setRemovedSkills(prev => prev.filter(s => s !== trimmedSkill))
    }
  }

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
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: '38px',
                  color: '#202e5b'
                }}
              >
                Here's what you're building
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: '24px',
                  color: '#202e5b',
                  letterSpacing: '0.08px'
                }}
              >
                {formData?.fullName || 'User'} - just now
              </Typography>
            </Box>
          </Box>
        </HeaderContainer>

        {/* Main Content Section */}
        <MainContentContainer>
          <Box sx={{ width: '100%', mb: 6 }}>
            <SkillCard>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Field label='Skill Name' value={formData?.credentialName} />
                  <Field
                    label='Skill Description'
                    value={formData?.credentialDescription as string}
                    isHtml={true}
                  />

                  {/* Detected Skills Section */}
                  <Box sx={{ mb: 2.5 }}>
                    {/* Detected Skills Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box
                        component='span'
                        sx={{
                          fontSize: '18px',
                          color: '#003fe0'
                        }}
                      >
                        ✨
                      </Box>
                      <FieldLabel sx={{ mb: 0 }}>
                        Detected Skills ({selectedSkills.length})
                      </FieldLabel>
                    </Box>

                    {/* Selected Skills Display with X buttons */}
                    {selectedSkills && selectedSkills.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                        {selectedSkills.map(skill => (
                          <Box
                            key={skill}
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
                                background: '#003fe0'
                              }
                            }}
                          >
                            {skill}
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
                          </Box>
                        ))}
                      </Box>
                    ) : null}

                    {/* Only show skill editing controls on step 2 */}
                    {currentStep === 2 && (
                      <>
                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            color: '#6b7280',
                            mb: 2
                          }}
                        >
                          Click any skill to remove it
                        </Typography>

                        <Divider sx={{ mb: 2 }} />

                        {/* Add Skill Manually Section */}
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            sx={{
                              fontFamily: 'Inter',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#6b7280',
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
                                  background: '#003fe0'
                                }
                              }}
                            >
                              +
                            </Box>
                          </Box>
                        </Box>

                        <Divider sx={{ mb: 2 }} />
                      </>
                    )}

                    {/* Issued By Section */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: 'Inter',
                          fontSize: '14px',
                          color: '#6b7280',
                          mb: 0.5
                        }}
                      >
                        Issued by
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Inter',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#000e40'
                        }}
                      >
                        Self-Issued
                      </Typography>
                    </Box>
                  </Box>

                  {/* Removed Skills Section */}
                  {removedSkills.length > 0 && (
                    <Box
                      sx={{
                        background: '#f9fafb',
                        borderRadius: '12px',
                        p: 2.5,
                        mb: 2.5
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#000e40'
                          }}
                        >
                          Removed Skills
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            color: '#6b7280'
                          }}
                        >
                          Click to restore
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {removedSkills.map(skill => (
                          <Box
                            key={skill}
                            onClick={() => handleRestoreSkill(skill)}
                            sx={{
                              background: '#ffffff',
                              border: '1px solid #e5e7eb',
                              color: '#9ca3af',
                              px: 2,
                              py: 0.75,
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 400,
                              textDecoration: 'line-through',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: '#f3f4f6',
                                color: '#6b7280'
                              }
                            }}
                          >
                            {skill}
                            <Box
                              component='span'
                              sx={{
                                fontSize: '16px',
                                fontWeight: 400
                              }}
                            >
                              ↻
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  {/* Enhanced Media Section with PDF support */}
                  <MediaContainer>
                    <Media hasImage={!!featuredFile || !!formData?.evidenceLink}>
                      {featuredFile ? (
                        // Handle different file types with proper thumbnails
                        <>
                          {isPDF(featuredFile.name) ? (
                            <Image
                              width={160}
                              height={153}
                              style={{
                                borderRadius: '10px',
                                objectFit: 'cover'
                              }}
                              src={
                                pdfThumbnails[featuredFile.id] ??
                                '/fallback-pdf-thumbnail.svg'
                              }
                              alt='PDF Preview'
                            />
                          ) : isMP4(featuredFile.name) ? (
                            <Image
                              width={160}
                              height={153}
                              style={{
                                borderRadius: '10px',
                                objectFit: 'cover'
                              }}
                              src={
                                videoThumbnails[featuredFile.id] ?? '/fallback-video.png'
                              }
                              alt='Video Thumbnail'
                            />
                          ) : (
                            <Image
                              src={featuredFile.url}
                              alt='Featured Media'
                              width={160}
                              height={153}
                              style={{
                                borderRadius: '10px',
                                objectFit: 'cover'
                              }}
                            />
                          )}
                        </>
                      ) : formData?.evidenceLink ? (
                        <Image
                          src={formData.evidenceLink}
                          alt='Featured Media'
                          width={160}
                          height={153}
                          style={{
                            borderRadius: '10px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Image
                          src='/images/SkillMedia.svg'
                          alt='Media placeholder'
                          width={160}
                          height={153}
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
                        color: '#6b7280',
                        letterSpacing: '0.08px',
                        mt: 1
                      }}
                    >
                      Media (optional)
                    </Typography>
                  </MediaContainer>

                  {/* Evidence Section (matches dataPreview.tsx) */}
                  {hasValidEvidence && (
                    <Box sx={commonTypographyStyles}>
                      <FieldLabel sx={{ display: 'block' }}>
                        Supporting Documentation:
                      </FieldLabel>
                      <ul style={evidenceListStyles}>
                        {formData.evidenceLink &&
                          shouldDisplayUrl(formData.evidenceLink) && (
                            <li
                              style={{
                                cursor: 'pointer',
                                width: 'fit-content',
                                color: '#003fe0',
                                textDecoration: 'underline'
                              }}
                              key={formData.evidenceLink}
                              onClick={() =>
                                handleNavigate(formData.evidenceLink, '_blank')
                              }
                            >
                              {formData.evidenceLink}
                            </li>
                          )}
                        {Array.isArray(formData.portfolio) &&
                          formData.portfolio.map(
                            (porto: { name: string; url: string }) =>
                              porto.name &&
                              porto.url && (
                                <li
                                  style={{
                                    cursor: 'pointer',
                                    width: 'fit-content',
                                    color: '#003fe0',
                                    textDecoration: 'underline'
                                  }}
                                  key={porto.url}
                                  onClick={() => handleNavigate(porto.url, '_blank')}
                                >
                                  {porto.name || porto.url}
                                </li>
                              )
                          )}
                      </ul>
                    </Box>
                  )}

                  <Field
                    label='Earning Criteria'
                    value={formData?.description as string}
                    isHtml={true}
                  />
                  <Field label='Duration' value={formData?.credentialDuration} />
                </Box>
              </CardContent>
            </SkillCard>
          </Box>
        </MainContentContainer>
      </Box>
    </Box>
  )
}

export default CredentialTracker
