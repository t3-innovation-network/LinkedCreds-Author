import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  styled,
  Card,
  CardContent,
  Divider,
  Button
} from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import InsertLinkIcon from '@mui/icons-material/InsertLink'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { FormData } from '../../credentialForm/form/types/Types'
import { Logo, SVGSparkles, SVGSparklesBlue, SVGDescribeBadge } from '../../Assets/SVGs'
import Image from 'next/image'
import { SkillMatch } from '../../utils/skillsApi'
import { GlobalWorkerOptions } from 'pdfjs-dist'
import {
  sectionLabelStyles,
  sectionValueStyles,
  sectionDescriptionStyles,
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
  EmptySkillsState
} from '../Styles/appStyles'
// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

// Helper functions for file type detection
const isPDF = (fileName: string) => fileName.toLowerCase().endsWith('.pdf')
const isMP4 = (fileName: string) => fileName.toLowerCase().endsWith('.mp4')

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
  onManualSkillsChange?: (skills: SkillMatch[]) => void
  manuallyAddedSkills?: SkillMatch[]
  currentStep?: number
  onBack?: () => void
}

const CredentialTracker: React.FC<CredentialTrackerProps> = ({
  formData,
  selectedFiles = [],
  currentStep = 2,
  onBack
}) => {
  const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})

  // Use props directly for display in final preview
  const selectedSkills = formData?.skills || []

  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [isHoveringMedia, setIsHoveringMedia] = useState<boolean>(false)


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
                      style={{ objectFit: 'cover' }}
                    />
                  ) : isMP4(currentDisplayFile.name) ? (
                    <Image
                      src={videoThumbnails[currentDisplayFile.id] ?? '/fallback-video.png'}
                      alt='Video Thumbnail'
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Image
                      src={currentDisplayFile.url}
                      alt='Featured Media'
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  )}

                  {/* Media Navigation Controls (Simplified from previous) */}
                  {isHoveringMedia && selectedFiles.length > 1 && (
                    <>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                        sx={{
                          position: 'absolute', left: 8, minWidth: '40px', height: '40px',
                          borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
                      >
                        ‹
                      </Button>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                        sx={{
                          position: 'absolute', right: 8, minWidth: '40px', height: '40px',
                          borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
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
                  style={{ objectFit: 'cover' }}
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
          {((formData?.evidence && (formData.evidence as any[]).length > 0) || formData?.evidenceLink) && (
            <Box>
              <SectionHeader>
                Supporting Evidence
              </SectionHeader>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mt: 1 }}>
                {(() => {
                  const evidenceItems = (formData?.evidence as any[]) || []
                  const evidenceLink = formData?.evidenceLink

                  // Check if evidenceLink is already in evidence to avoid duplicates
                  const isLinkInEvidence = evidenceLink && evidenceItems.some(item => item.url === evidenceLink)

                  // Create display list
                  const displayItems: any[] = [...evidenceItems]
                  if (evidenceLink && !isLinkInEvidence) {
                    displayItems.push({ name: 'Media Link', url: evidenceLink })
                  }

                  // Add selectedFiles (local previews) that aren't already in evidence
                  if (selectedFiles && selectedFiles.length > 0) {
                    selectedFiles.forEach(file => {
                      // Avoid duplicates if file is already represented
                      const exists = displayItems.some((p: any) => p.name === file.name)
                      if (!exists) {
                        displayItems.push({ name: file.name, url: file.url, isLocal: true })
                      }
                    })
                  }

                  return displayItems.map((item, index) => (
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
                      {!item.googleId && !item.wasId ? (
                        <InsertLinkIcon style={{ transform: 'rotate(-45deg)' }} fontSize="small" />
                      ) : (
                        <DescriptionOutlinedIcon fontSize="small" />
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
                  ))
                })()}
              </Box>
            </Box>
          )}
        </CredentialContent>
      </PreviewCard>
    </Box>
  )
}

export default CredentialTracker
