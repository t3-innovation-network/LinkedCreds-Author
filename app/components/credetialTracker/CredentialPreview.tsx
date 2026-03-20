import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react'
import { Box, Typography, Paper, Divider, styled, Button } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { SVGDescribeBadge, SVGSparklesBlue, SVGSparkles, LightbulbSVG, DescriptionOutlinedIcon, InsertLinkIcon } from '../../Assets/SVGs'
import RestoreIcon from '@mui/icons-material/Restore'
import {
    previewContainerStyles,
    sectionLabelStyles,
    sectionValueStyles,
    placeholderTextStyles,
    previewHeaderStyles,
    previewTitleStyles,
    previewSubtitleStyles,
    SkillBadgePill,
    previewDividerStyles,
    descriptionClampStyles,
    viewMoreButtonStyles,
    previewMediaContainerStyles,
    carouselNavButtonStyles,
    carouselCounterStyles,
    skillRemoveButtonStyles,
    manualSkillInputStyles,
    addSkillButtonStyles,
    removedSkillPillStyles,
    sidebarHeaderStyles,
    evidenceTipBoxStyles,
    evidenceTipBoxTextStyles,
} from '../Styles/appStyles'
import { FormData } from '../../credentialForm/form/types/Types'
import { SkillMatch, extractRawSkillsApi, searchSkillsApi } from '../../utils/skillsApi'
import Image from 'next/image'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import { ensureProtocol } from '../../utils/urlValidation'

// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

// Helper functions for file type detection
const isPDF = (fileName: string) => fileName?.toLowerCase().endsWith('.pdf')
const isMP4 = (fileName: string) => fileName.toLowerCase().endsWith('.mp4')
const isGoogleDriveImageUrl = (url: string): boolean => {
    return /https:\/\/drive\.google\.com\/uc\?export=view&id=.+/.test(url)
}

// Helper to check if a URL is likely a file (doc or image)
const isDocOrImage = (url: string) => {
    if (!url) return false
    return /\.(pdf|png|jpe?g|gif|webp|svg|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url) ||
        url.includes('drive.google.com') ||
        url.startsWith('blob:') ||
        url.startsWith('data:')
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
    const [detectedSkillNames, setDetectedSkillNames] = useState<string[]>([])  // raw names from /extract
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

    // Combined evidence (files + manual links) for the Supporting Documentation section
    const uniqueLinks = useMemo(() => {
        const links: { name: string; url: string; hasId?: boolean }[] = []
        const seenUrls = new Set<string>()

        const normalize = (val: any) => {
            if (!val || typeof val !== 'string') return ''
            let u = val.trim().toLowerCase()
            if (!u.startsWith('http') && !u.startsWith('blob:')) u = 'https://' + u
            if (u.endsWith('/')) u = u.slice(0, -1)
            return u
        }

        // 1. Files from selectedFiles (maintains user's reorder)
        selectedFiles.forEach(file => {
            const nUrl = normalize(file.url)
            if (nUrl && !seenUrls.has(nUrl)) {
                links.push({ name: file.name || 'View File', url: file.url })
                seenUrls.add(nUrl)
            }
        })

        // 2. Manual links from formData.evidence (those without Drive/Was IDs)
        if (formData?.evidence && Array.isArray(formData.evidence)) {
            formData.evidence.forEach(item => {
                const isManual = !item.googleId && !item.wasId
                if (isManual) {
                    const nUrl = normalize(item.url)
                    if (nUrl && !seenUrls.has(nUrl)) {
                        links.push({ name: item.name || item.url, url: item.url, hasId: false })
                        seenUrls.add(nUrl)
                    }
                }
            })
        }

        // 3. Mark selectedFiles as having ID
        return links.map(l => {
            const isFile = selectedFiles.find(f => normalize(f.url) === normalize(l.url))
            return { ...l, hasId: !!isFile?.googleId || !!isFile?.wasId }
        })
    }, [selectedFiles, formData?.evidence])

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

    // Step 1: Description changes → /extract → detectedSkillNames (raw names, shown immediately)
    useEffect(() => {
        if (currentStep && currentStep >= 4) return

        const text = formData?.credentialDescription || ''

        // Clear names no longer present in text
        setDetectedSkillNames(prev => prev.filter(name =>
            text.toLowerCase().includes(name.toLowerCase())
        ))

        const timer = setTimeout(async () => {
            if (text.length > 3) {
                try {
                    const rawNames = await extractRawSkillsApi(text)
                    setDetectedSkillNames(prev => {
                        const existing = new Set(prev.map(n => n.toLowerCase()))
                        const newNames = rawNames.filter(n => !existing.has(n.toLowerCase()))
                        return [...prev, ...newNames]
                    })
                } catch (error) {
                    console.error('Failed to extract skills:', error)
                } finally {
                    setHasFetched(true)
                }
            } else {
                setHasFetched(true)
            }
        }, 200)

        return () => clearTimeout(timer)
    }, [formData?.credentialDescription, currentStep])

    // Step 2: detectedSkillNames changes → /search → detectedSkills (full O*NET SkillMatch[])
    useEffect(() => {
        if (!detectedSkillNames.length) {
            setDetectedSkills([])
            return
        }
        searchSkillsApi(detectedSkillNames).then(mapped => {
            setDetectedSkills(mapped)
        })
    }, [detectedSkillNames])

    const onSkillsChangeRef = useRef(onSkillsChange)
    useLayoutEffect(() => { onSkillsChangeRef.current = onSkillsChange })

    // Sync selectedSkills from detectedSkills
    useEffect(() => {
        if ((currentStep && currentStep >= 4) || (!hasFetched && selectedSkills.length > 0)) return

        const detectedNames = detectedSkills.map(s => s.name)

        setSelectedSkills(prev => {
            if (prev.length === 0 && detectedSkills.length > 0) return detectedSkills
            // Keep manual skills + still-detected skills, add newly detected
            const stillValid = prev.filter(skill =>
                manuallyAddedSkills.some(m => m.name === skill.name) || detectedNames.includes(skill.name)
            )
            const newDetected = detectedSkills.filter(skill =>
                !prev.some(p => p.name === skill.name) && !removedSkills.some(r => r.name === skill.name)
            )
            const next = [...stillValid, ...newDetected]
            return next
        })
    }, [detectedSkills, hasFetched, currentStep, manuallyAddedSkills])

    // Notify parent whenever selected skills change
    useEffect(() => {
        onSkillsChangeRef.current?.(selectedSkills)
    }, [selectedSkills]) // intentionally excludes onSkillsChange — only value changes matter

    const onRemovedSkillsChangeRef = useRef(onRemovedSkillsChange)
    useLayoutEffect(() => { onRemovedSkillsChangeRef.current = onRemovedSkillsChange })

    useEffect(() => {
        onRemovedSkillsChangeRef.current?.(removedSkills)
    }, [removedSkills])

    const onManualSkillsChangeRef = useRef(onManualSkillsChange)
    useLayoutEffect(() => { onManualSkillsChangeRef.current = onManualSkillsChange })

    useEffect(() => {
        onManualSkillsChangeRef.current?.(manuallyAddedSkills)
    }, [manuallyAddedSkills])

    const handleRemoveSkill = (skillToRemove: SkillMatch) => {
        setSelectedSkills(prev => prev.filter(s => s.name !== skillToRemove.name))

        if (!removedSkills.some(s => s.name === skillToRemove.name)) {
            setRemovedSkills(prev => [...prev, skillToRemove])
        }
    }

    const handleRestoreSkill = (skill: SkillMatch) => {
        if (!selectedSkills.some(s => s.name === skill.name)) {
            setSelectedSkills(prev => [...prev, skill])
            setRemovedSkills(prev => prev.filter(s => s.name !== skill.name))
        }
    }

    const handleAddManualSkill = () => {
        const trimmed = newSkillInput.trim()
        if (trimmed && !selectedSkills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
            // Add to detectedSkillNames → triggers Step 2 (search) automatically
            setDetectedSkillNames(prev => {
                if (prev.some(n => n.toLowerCase() === trimmed.toLowerCase())) return prev
                return [...prev, trimmed]
            })

            // Also track as manually added (for sync logic)
            const placeholderSkill: SkillMatch = {
                id: trimmed,
                name: trimmed.toLowerCase(),
                source: 'user',
                frameworkMatch: []
            }
            setManuallyAddedSkills(prev => [...prev, placeholderSkill])
            setNewSkillInput('')

            // Un-remove if it was previously removed
            setRemovedSkills(prev => prev.filter(s => s.name.toLowerCase() !== trimmed.toLowerCase()))
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
                <Box sx={{ ...sidebarHeaderStyles, gap: '16px' }}>
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

            <Divider sx={previewDividerStyles} />

            {/* Credential Recipient */}
            <Box>
                <Typography sx={sectionLabelStyles}>Credential Recipient</Typography>
                <Typography sx={{ ...sectionValueStyles }}>
                    {formData?.fullName || 'Your Name'}
                </Typography>
            </Box>
            {currentStep == 1 && <Divider sx={previewDividerStyles} />}


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
                                    ...descriptionClampStyles,
                                    WebkitLineClamp: isDescriptionExpanded ? 'unset' : 3
                                }}
                                component="div"
                                dangerouslySetInnerHTML={{ __html: formData.credentialDescription }}
                            />
                            {/* Simple heuristic: show button if long enough. 150 chars is approx 2-3 lines */}
                            {(formData.credentialDescription.length > 150) && (
                                <Button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    sx={viewMoreButtonStyles}
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
            {currentStep == 2 && <Divider sx={previewDividerStyles} />}


            {/* Media Carousel (restored) */}
            {currentStep >= 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Box
                        onMouseEnter={() => setIsHoveringMedia(true)}
                        onMouseLeave={() => setIsHoveringMedia(false)}
                        sx={previewMediaContainerStyles}>
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

                                {isHoveringMedia && selectedFiles.length > 1 && (
                                    <>
                                        <Box onClick={handlePrevImage} sx={{ ...carouselNavButtonStyles, left: '8px' }}>‹</Box>
                                        <Box
                                            onClick={handleNextImage}
                                            sx={{ ...carouselNavButtonStyles, right: '8px' }}
                                        >
                                            ›
                                        </Box>
                                        <Box sx={carouselCounterStyles}>
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
                                style={{ objectFit: 'contain' }}
                            />
                        ) : (
                            <Image
                                src='/images/SkillMedia.svg'
                                alt='Media placeholder'
                                width={64}
                                height={64}
                                style={{ width: 'auto', height: 'auto' }}
                            />
                        )}
                    </Box>
                    <Typography sx={sectionLabelStyles}>{(currentDisplayFile || formData?.evidenceLink) ? '' : 'Media (optional)'}</Typography>
                </Box>
            )}

            {currentStep == 2 && <Divider sx={previewDividerStyles} />}
            {currentStep == 2 && <Box sx={evidenceTipBoxStyles}>
                <LightbulbSVG />
                <Typography sx={evidenceTipBoxTextStyles}>
                    Be sure to review detected skills before continuing to the next step.
                </Typography>
            </Box>}
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
                                    <SkillBadgePill
                                        key={skill.name}
                                        sx={{
                                            padding: '6px 10px',
                                            transition: 'all 0.2s',
                                            '&:hover': { background: '#1d4ed8' }
                                        }}
                                    >
                                        {skill.name}
                                        {currentStep == 2 && (
                                            <Box
                                                component='span'
                                                onClick={() => handleRemoveSkill(skill)}
                                                sx={skillRemoveButtonStyles}
                                            >
                                                ×
                                            </Box>
                                        )}
                                    </SkillBadgePill>
                                ))}
                            </Box>

                            <Typography sx={{ ...sectionLabelStyles, mt: 1.5 }}>
                                {currentStep == 2 && 'Click any skill to remove it'}
                            </Typography>

                            <Divider sx={previewDividerStyles} />
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
                                style={manualSkillInputStyles}
                            />
                            <Box
                                onClick={handleAddManualSkill}
                                sx={addSkillButtonStyles}
                            >
                                +
                            </Box>
                        </Box>
                    </Box>

                    {/* Supporting Documentation Section */}
                    <Box sx={{ mt: 2 }}>
                        <Typography sx={sectionLabelStyles}>Supporting Documentation</Typography>

                        {uniqueLinks.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mt: '8px' }}>
                                {uniqueLinks.map((link, idx) => (
                                    <Box
                                        key={`evidence-${idx}`}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            color: '#2563EB',
                                        }}
                                    >
                                        {isDocOrImage(link.url) ? (
                                            <DescriptionOutlinedIcon />
                                        ) : (
                                            <InsertLinkIcon />
                                        )}
                                        <Typography sx={{ ...sectionValueStyles, fontSize: '13px', color: 'inherit', textDecoration: 'underline' }}>
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'inherit', textDecoration: 'inherit', cursor: 'pointer' }}
                                            >
                                                {link.name || 'View File'}
                                            </a>
                                        </Typography>
                                        <OpenInNewIcon sx={{ fontSize: '14px' }} />
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography sx={{ ...placeholderTextStyles, fontStyle: 'italic', mt: '4px' }}>
                                Add links or upload files to show evidence of the skills you are claiming.
                            </Typography>
                        )}
                    </Box>
                </>
            )}
            <Divider sx={previewDividerStyles} />

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
                                sx={removedSkillPillStyles}
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

            {currentStep == 2 && removedSkills.length > 0 && <Divider sx={previewDividerStyles} />}


            {/* Issued by */}
            <Box>
                <Typography sx={sectionLabelStyles}>Issued by</Typography>
                <Typography sx={sectionValueStyles}>Self-Issued</Typography>
            </Box>
        </Paper>
    )
}

export default CredentialPreview
