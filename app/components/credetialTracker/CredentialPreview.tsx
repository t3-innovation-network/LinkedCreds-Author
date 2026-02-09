import React, { useEffect, useState } from 'react'
import { Box, Typography, Paper, Divider, styled, Button } from '@mui/material'
import { SVGDescribeBadge, SVGSparklesBlue, SVGSparkles } from '../../Assets/SVGs'
import RestoreIcon from '@mui/icons-material/Restore'
import {
    previewContainerStyles,
    sectionLabelStyles,
    sectionValueStyles,
    placeholderTextStyles,
    previewHeaderStyles,
    previewTitleStyles,
    previewSubtitleStyles
} from '../Styles/appStyles'
import { FormData } from '../../credentialForm/form/types/Types'
import { SkillMatch, extractSkillsFromTextApi } from '../../utils/skillsApi'
import Image from 'next/image'
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

interface CredentialPreviewProps {
    formData?: FormData
    selectedFiles?: any[]
    activeSkills?: SkillMatch[]
    removedSkills?: SkillMatch[]
    manuallyAddedSkills?: SkillMatch[]
    onSkillsChange?: (skills: SkillMatch[]) => void
    onRemovedSkillsChange?: (skills: SkillMatch[]) => void
    onManualSkillsChange?: (skills: SkillMatch[]) => void
    currentStep?: number
}

// Reuse or adapt styled components from Page.tsx if they aren't in appStyles.tsx
// For now, defining minimal needed styles locally or using Box/sx for speed and keeping it self-contained as requested.

const FieldLabel = styled(Typography)(({ theme }) => ({
    fontFamily: 'Inter',
    fontSize: theme.breakpoints.down('sm') ? '14px' : '16px',
    fontWeight: 700,
    lineHeight: '24px',
    color: '#000e40',
    letterSpacing: '0.08px'
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

const CredentialPreview: React.FC<CredentialPreviewProps> = ({
    formData,
    selectedFiles = [],
    activeSkills = [],
    removedSkills: initialRemovedSkills = [],
    manuallyAddedSkills: initialManuallyAddedSkills = [],
    onSkillsChange,
    onRemovedSkillsChange,
    onManualSkillsChange,
    currentStep = 2 // Default to 2 if not provided to avoid breaking changes, but should be passed
}) => {
    const [selectedSkills, setSelectedSkills] = useState<SkillMatch[]>(activeSkills || [])
    const [detectedSkills, setDetectedSkills] = useState<SkillMatch[]>([])
    const [hasFetched, setHasFetched] = useState(false)
    const [manuallyAddedSkills, setManuallyAddedSkills] = useState<SkillMatch[]>(initialManuallyAddedSkills || [])
    const [removedSkills, setRemovedSkills] = useState<SkillMatch[]>(initialRemovedSkills || [])
    const [newSkillInput, setNewSkillInput] = useState('')

    const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
    const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
    const [isHoveringMedia, setIsHoveringMedia] = useState<boolean>(false)

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

    useEffect(() => {
        if (initialRemovedSkills && initialRemovedSkills.length > 0) {
            setRemovedSkills(initialRemovedSkills)
        }
    }, [initialRemovedSkills])

    useEffect(() => {
        if (initialManuallyAddedSkills && initialManuallyAddedSkills.length > 0) {
            setManuallyAddedSkills(initialManuallyAddedSkills)
        }
    }, [initialManuallyAddedSkills])

    useEffect(() => {
        if (currentStep && currentStep >= 4) {
            return
        }

        const text = formData?.credentialDescription || ''

        setDetectedSkills(prev => prev.filter(s =>
            text.toLowerCase().includes(s.name.toLowerCase())
        ))

        const timer = setTimeout(() => {
            const fetchSkills = async () => {
                if (text.length > 3) {
                    try {
                        const apiSkills: SkillMatch[] = await extractSkillsFromTextApi(text)

                        setDetectedSkills(prev => {
                            const existingNames = new Set(prev.map(s => s.name.toLowerCase()))
                            const newUnique = apiSkills.filter(s => !existingNames.has(s.name.toLowerCase()))
                            return [...prev, ...newUnique]
                        })
                    } catch (error) {
                        console.error('Failed to extract skills:', error)
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

    // --- Sync Logic ---
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
    }, [detectedSkills, hasFetched, currentStep, manuallyAddedSkills])

    // Notify parent component whenever selected skills change (for backend storage)
    useEffect(() => {
        if (onSkillsChange) {
            onSkillsChange(selectedSkills)
        }
    }, [selectedSkills, onSkillsChange])

    const handleRemoveSkill = (skillToRemove: SkillMatch) => {
        setSelectedSkills(prev => prev.filter(s => s.name !== skillToRemove.name))

        if (!removedSkills.some(s => s.name === skillToRemove.name)) {
            setRemovedSkills(prev => {
                const updated = [...prev, skillToRemove]
                onRemovedSkillsChange?.(updated)
                return updated
            })
        }
    }

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

    const handleAddManualSkill = () => {
        const trimmed = newSkillInput.trim()
        if (trimmed && !selectedSkills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
            const newSkill: SkillMatch = {
                name: trimmed,
                score: 1.0,
                soc_codes: [],
                uuid: crypto.randomUUID(),
                originalMatch: trimmed
            }
            setSelectedSkills(prev => [...prev, newSkill])
            setManuallyAddedSkills(prev => {
                const updated = [...prev, newSkill]
                onManualSkillsChange?.(updated)
                return updated
            })
            setNewSkillInput('')

            // Un-remove if it was removed
            setRemovedSkills(prev => {
                const updated = prev.filter(s => s.name.toLowerCase() !== trimmed.toLowerCase())
                onRemovedSkillsChange?.(updated)
                return updated
            })
        }
    }

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
        <Paper sx={previewContainerStyles} elevation={0}>
            <Box sx={previewHeaderStyles}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <SVGDescribeBadge width="48" height="48" />
                    <Box>
                        <Typography sx={previewTitleStyles}>
                            Preview
                        </Typography>
                        <Typography sx={previewSubtitleStyles}>
                            Live preview of your credential
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ borderColor: '#E2E8F0' }} />

            {/* Credential Recipient */}
            <Box>
                <Typography sx={sectionLabelStyles}>Credential Recipient</Typography>
                <Typography sx={{ ...sectionValueStyles }}>
                    {formData?.fullName || 'Your Name'}
                </Typography>
            </Box>
            {currentStep == 1 && <Divider sx={{ borderColor: '#E2E8F0' }} />}


            {/* Skill Name */}
            <Box>
                <Typography sx={sectionLabelStyles}>Skill Name</Typography>
                {formData?.credentialName ? (
                    <Typography sx={sectionValueStyles}>{formData.credentialName}</Typography>
                ) : (
                    <Typography sx={placeholderTextStyles}>
                        {currentStep === 1 ? 'Will be added in next step' : 'Enter a skill name.'}
                    </Typography>
                )}
            </Box>

            {/* Years of Experience */}
            {currentStep >= 2 && (
                <Box>
                    <Typography sx={sectionLabelStyles}>Years of Experience</Typography>
                    {formData?.credentialDuration ? (
                        <Typography sx={sectionValueStyles}>{formData.credentialDuration}</Typography>
                    ) : (
                        <Typography sx={placeholderTextStyles}>Enter years of experience (e.g., &lt;1, 5 years, etc.).</Typography>
                    )}
                </Box>
            )}


            {/* Skill Description */}
            {currentStep >= 2 && (
                <Box>
                    <Typography sx={sectionLabelStyles}>Skill Description</Typography>
                    {/* Using dangerouslySetInnerHTML if description is HTML from rich text editor */}
                    {formData?.credentialDescription && formData.credentialDescription !== '<p><br></p>' ? (
                        <Box>
                            <Typography
                                sx={{
                                    ...sectionValueStyles,
                                    display: '-webkit-box',
                                    WebkitLineClamp: isDescriptionExpanded ? 'unset' : 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                                component="div"
                                dangerouslySetInnerHTML={{ __html: formData.credentialDescription }}
                            />
                            {/* Simple heuristic: show button if long enough. 150 chars is approx 2-3 lines */}
                            {(formData.credentialDescription.length > 150) && (
                                <Button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '12px',
                                        padding: '4px 0',
                                        minWidth: 'auto',
                                        marginTop: '4px',
                                        color: '#2563EB',
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            textDecoration: 'underline'
                                        }
                                    }}
                                >
                                    {isDescriptionExpanded ? 'View Less' : 'View More'}
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Typography sx={placeholderTextStyles}>Describe the skill(s) you want to claim.</Typography>
                    )}
                </Box>
            )}
            {currentStep == 2 && <Divider sx={{ borderColor: '#E2E8F0' }} />}


            {/* Media (Optional) */}
            {currentStep >= 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Box
                        onMouseEnter={() => setIsHoveringMedia(true)}
                        onMouseLeave={() => setIsHoveringMedia(false)}
                        sx={{
                            width: '100%',
                            height: '160px',
                            borderRadius: '12px',
                            backgroundColor: '#F8FAFC',
                            border: '1px dashed #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
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
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <Image
                                        src={currentDisplayFile.url}
                                        alt='Featured Media'
                                        fill
                                        style={{
                                            objectFit: 'cover'
                                        }}
                                    />
                                )}

                                {/* Navigation Controls */}
                                {isHoveringMedia && selectedFiles.length > 1 && (
                                    <>
                                        <Box
                                            onClick={handlePrevImage}
                                            sx={{
                                                position: 'absolute',
                                                left: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: '#ffffff',
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                zIndex: 10,
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                }
                                            }}
                                        >
                                            ‹
                                        </Box>
                                        <Box
                                            onClick={handleNextImage}
                                            sx={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: '#ffffff',
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                zIndex: 10,
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                }
                                            }}
                                        >
                                            ›
                                        </Box>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                color: '#ffffff',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                fontWeight: 500,
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
                                alt='Evidence Link'
                                fill
                                style={{
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <Image
                                src='/images/SkillMedia.svg'
                                alt='Media placeholder'
                                width={64}
                                height={64}
                            />
                        )}
                    </Box>
                    <Typography sx={sectionLabelStyles} style={{ fontSize: '12px' }}>{(currentDisplayFile || formData?.evidenceLink) ? '' : 'Media (optional)'}</Typography>
                </Box>
            )}

            {currentStep == 2 && <Divider sx={{ borderColor: '#E2E8F0' }} />}

            {/* Detected Skills */}
            {currentStep >= 2 && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SVGSparklesBlue />
                        <Typography sx={{ ...sectionValueStyles, mb: 0 }}>
                            {currentStep >= 3 ? 'Skills' : 'Detected Skills'}
                            <span style={{ color: '#6B7280', marginLeft: '6px' }}>
                                ({selectedSkills.length})
                            </span>
                        </Typography>
                    </Box>

                    {/* Selected Skills Display with X buttons */}
                    {selectedSkills && selectedSkills.length > 0 ? (
                        <Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                {selectedSkills.map(skill => (
                                    <Box
                                        key={skill.name}
                                        sx={{
                                            background: '#2563EB',
                                            color: '#ffffff',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                background: '#1d4ed8'
                                            }
                                        }}
                                    >
                                        {skill.name}
                                        {currentStep == 2 && (
                                            <Box
                                                component='span'
                                                onClick={() => handleRemoveSkill(skill)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    lineHeight: '16px',
                                                    '&:hover': {
                                                        opacity: 0.9
                                                    }
                                                }}
                                            >
                                                ×
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            <Typography sx={{ ...sectionLabelStyles, mt: 1.5 }}>
                                {currentStep == 2 && 'Click any skill to remove it'}
                            </Typography>

                            <Divider sx={{ borderColor: '#E2E8F0' }} />
                        </Box>
                    ) : (
                        <EmptySkillsState>
                            <SVGSparkles width='24' height='24' />
                            <Typography sx={{ ...sectionLabelStyles }}>
                                Skills will appear here as you type
                            </Typography>
                        </EmptySkillsState>
                    )}
                </Box>
            )}

            {currentStep === 2 && (
                <>

                    {/* Add Skill Manually Section */}
                    <Box>
                        <Typography sx={{ ...sectionLabelStyles }}>
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
                                    background: '#2563EB',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '24px',
                                    color: '#ffffff',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        background: '#2563EB'
                                    }
                                }}
                            >
                                +
                            </Box>
                        </Box>
                    </Box>
                </>
            )}
            <Divider sx={{ borderColor: '#E2E8F0' }} />

            {currentStep == 2 && removedSkills.length > 0 && (
                <Box>
                    <Typography sx={{ ...sectionLabelStyles }}>
                        Removed Skills (click to restore)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                        {removedSkills.map(skill => (
                            <Box
                                key={skill.name}
                                onClick={() => handleRestoreSkill(skill)}
                                sx={{
                                    background: '#fefefeff',
                                    color: '#666666',
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: '8px',
                                    fontSize: '12px',
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

            {currentStep == 2 && removedSkills.length > 0 && <Divider sx={{ borderColor: '#E2E8F0' }} />}


            {/* Issued by */}
            <Box>
                <Typography sx={sectionLabelStyles}>Issued by</Typography>
                <Typography sx={sectionValueStyles}>Self-Issued</Typography>
            </Box>
        </Paper >
    )
}

export default CredentialPreview
