'use client'

import React, { useState } from 'react'
import { Box, Typography, Divider, Button } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { SVGDescribeBadge, DescriptionOutlinedIcon, InsertLinkIcon } from '../../../../Assets/SVGs'
import Image from 'next/image'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'

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
import {
    sectionLabelStyles,
    sectionValueStyles,
    SkillBadgePill,
    sidebarContainerStyles,
    sidebarCredentialCardStyles,
    sidebarHeaderStyles,
    previewTitleStyles,
    previewSubtitleStyles,
    sidebarChipsContainerStyles,
    sidebarRecommendationCardStyles,
    RecommendationBadgePill,
    recommendationDividerStyles,
    descriptionClampStyles,
    placeholderTextStyles,
    viewMoreButtonStyles
} from '../../../../components/Styles/appStyles'
import { SelectedSkill } from '../../../../credentialForm/form/types/Types'

interface RecommenderPreviewProps {
    // Credential data
    fullName: string
    credentialSubject: any
    originalEvidence?: any[]
    skills: SelectedSkill[]
    // Live form data
    recommenderName: string
    selectedSkills: SelectedSkill[]
    recommendationText: string
    howKnow: string
    qualifications: string
    evidence: any[]
    selectedFiles?: any[]
    showOnlyRecommendation?: boolean
}

const RecommenderPreview: React.FC<RecommenderPreviewProps> = ({
    fullName,
    credentialSubject,
    originalEvidence = [],
    skills,
    recommenderName,
    selectedSkills,
    recommendationText,
    howKnow,
    qualifications,
    evidence,
    selectedFiles = [],
    showOnlyRecommendation = false
}) => {
    const [isDescExpanded, setIsDescExpanded] = useState(false)
    const [isRecExpanded, setIsRecExpanded] = useState(false)
    const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
    const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})

    // Generate thumbnails for PDFs and Videos in Card 2
    React.useEffect(() => {
        selectedFiles.forEach(async (file) => {
            if (file.url) {
                const id = file.id || file.googleId || file.url
                if (isPDF(file.name) && !pdfThumbnails[id]) {
                    const thumb = await renderPDFThumbnail(file.url)
                    setPdfThumbnails(prev => ({ ...prev, [id]: thumb }))
                } else if (isMP4(file.name) && !videoThumbnails[id]) {
                    try {
                        const thumb = await generateVideoThumbnail(file.url)
                        setVideoThumbnails(prev => ({ ...prev, [id]: thumb }))
                    } catch (e) {
                        console.error("Error generating video thumbnail", e)
                    }
                }
            }
        })
    }, [selectedFiles])

    // Logic for Card 1 (Credential) evidence - extracting from credentialSubject or top-level prop
    const credentialEvidence = React.useMemo(() => {
        // Preference 1: Explicit prop passed from parent (top-level VC evidence)
        if (Array.isArray(originalEvidence) && originalEvidence.length > 0) return originalEvidence

        // Preference 2: Inside credentialSubject (common in some formats)
        const sub = Array.isArray(credentialSubject) ? credentialSubject[0] : credentialSubject
        const ce = sub?.evidence || sub?.portfolio || []
        return Array.isArray(ce) ? ce : []
    }, [credentialSubject, originalEvidence])

    // Helper to check if a URL is likely a file (doc or image)
    const isDocOrImage = (url: string) => {
        if (!url) return false
        return /\.(pdf|png|jpe?g|gif|webp|svg|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url) ||
            url.includes('drive.google.com') ||
            url.startsWith('blob:') ||
            url.startsWith('data:')
    }



    // Memoized supporting evidence links for the recommendation (Card 2)
    const uniqueLinks = React.useMemo(() => {
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

        // 2. Manual links from evidence array
        if (evidence && Array.isArray(evidence)) {
            evidence.forEach(item => {
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
    }, [selectedFiles, evidence])


    // Extract skill info from credentialSubject
    const achievement = credentialSubject?.achievement?.[0]
    const skillName =
        credentialSubject?.name ||
        achievement?.name ||
        'Skill'
    const skillDescription =
        credentialSubject?.narrative ||
        achievement?.description ||
        credentialSubject?.description ||
        ''

    // Strip HTML tags from recommendation text for preview
    const stripHtml = (html: string) => {
        if (!html) return ''
        return html.replace(/<[^>]*>/g, '').trim()
    }

    const cleanRecommendation = stripHtml(recommendationText)

    return (
        <Box sx={sidebarContainerStyles}>
            {/* Card 1: Credential Preview */}
            {!showOnlyRecommendation && (
                <Box sx={sidebarCredentialCardStyles}>
                    {/* Header */}
                    <Box sx={sidebarHeaderStyles}>
                        <SVGDescribeBadge width="40" height="40" />
                        <Box>
                            <Typography sx={previewTitleStyles}>
                                {fullName}&apos;s Credential
                            </Typography>
                            <Typography sx={previewSubtitleStyles}>
                                What you&apos;re recommending
                            </Typography>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Skill Name */}
                    <Box>
                        <Typography sx={sectionLabelStyles}>Skill Name</Typography>
                        <Typography sx={sectionValueStyles}>
                            {skillName}
                        </Typography>
                    </Box>

                    {/* Skill Description */}
                    {skillDescription && (
                        <Box>
                            <Typography sx={sectionLabelStyles}>
                                Skill Description
                            </Typography>
                            <Typography sx={isDescExpanded ? sectionValueStyles : descriptionClampStyles}>
                                {skillDescription}
                            </Typography>
                            {skillDescription.length > 150 && (
                                <Button
                                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                                    sx={viewMoreButtonStyles}
                                >
                                    {isDescExpanded ? 'View Less' : 'View More'}
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* Skills Claimed */}
                    {skills.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography sx={sectionLabelStyles}>
                                Skills Claimed ({skills.length})
                            </Typography>
                            <Box sx={sidebarChipsContainerStyles}>
                                {skills.map((skill, idx) => {
                                    const name = (skill as any).name ?? skill.targetName
                                    return (
                                        <SkillBadgePill key={idx}>
                                            {name}
                                        </SkillBadgePill>
                                    )
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* Supporting Documentation for Card 1 (Alice's Evidence) */}
                    {credentialEvidence.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography sx={sectionLabelStyles}>
                                Supporting Documentation
                            </Typography>
                            {/* Card 1 List for ALL items */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mt: 1 }}>
                                {credentialEvidence.map((item: any, index: number) => {
                                    const url = item.url || item.id
                                    return (
                                        <Box
                                            key={index}
                                            component="a"
                                            href={url}
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
                                            {isDocOrImage(url) ? (
                                                <DescriptionOutlinedIcon />
                                            ) : (
                                                <InsertLinkIcon />
                                            )}
                                            <Typography
                                                sx={{
                                                    fontFamily: 'Inter',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    color: 'inherit'
                                                }}
                                            >
                                                {item.name || 'View File'}
                                            </Typography>
                                            <OpenInNewIcon sx={{ fontSize: '14px' }} />
                                        </Box>
                                    )
                                })}
                            </Box>
                        </Box>
                    )}

                    <Divider />

                    {/* Claimed by */}
                    <Box>
                        <Typography sx={sectionLabelStyles}>Claimed by</Typography>
                        <Typography sx={sectionValueStyles}>
                            {fullName}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Card 2: Recommendation Preview */}
            <Box sx={sidebarRecommendationCardStyles}>
                {/* Header */}
                <Typography sx={sectionValueStyles}>
                    Your Recommendation
                </Typography>
                <Divider sx={recommendationDividerStyles} />

                {/* Recommender Name */}
                <Box>
                    <Typography sx={sectionLabelStyles}>Your Name:</Typography>
                    <Typography sx={recommenderName ? sectionValueStyles : placeholderTextStyles}>
                        {recommenderName || 'Please enter your name'}
                    </Typography>
                </Box>

                {/* Selected skills */}
                <Box>
                    <Typography sx={sectionLabelStyles}>
                        Skills being recommended:
                    </Typography>
                    {selectedSkills.length > 0 ? (
                        <Box sx={{ ...sidebarChipsContainerStyles, mt: '4px' }}>
                            {selectedSkills.map((skill, idx) => {
                                const name = (skill as any).name ?? skill.targetName
                                return (
                                    <RecommendationBadgePill key={idx}>
                                        {name}
                                    </RecommendationBadgePill>
                                )
                            })}
                        </Box>
                    ) : (
                        <Typography sx={placeholderTextStyles}>
                            Please select skills to appear here
                        </Typography>
                    )}
                </Box>

                {/* Recommendation text */}
                {cleanRecommendation ? (
                    <Box>
                        <Typography sx={{
                            ...(isRecExpanded ? sectionValueStyles : descriptionClampStyles),
                            color: 't3BodyText',
                            fontStyle: 'normal'
                        }}>
                            &quot;{cleanRecommendation}&quot;
                        </Typography>
                        {cleanRecommendation.length > 150 && (
                            <Button
                                onClick={() => setIsRecExpanded(!isRecExpanded)}
                                sx={viewMoreButtonStyles}
                            >
                                {isRecExpanded ? 'View Less' : 'View More'}
                            </Button>
                        )}
                    </Box>
                ) : (
                    <Typography sx={placeholderTextStyles}>
                        Describe the recommendation..
                    </Typography>
                )}

                {/* Qualifications */}
                <Box>
                    <Typography sx={sectionLabelStyles}>Your Qualifications:</Typography>
                    {qualifications ? (
                        <Typography sx={{ ...placeholderTextStyles, color: 't3BodyText', fontStyle: 'normal' }}>
                            &quot;{stripHtml(qualifications)}&quot;
                        </Typography>
                    ) : (
                        <Typography sx={placeholderTextStyles}>
                            Your qualifications will appear here...
                        </Typography>
                    )}
                </Box>

                {/* Evidence Section for Recommendation */}
                <Box>
                    <Typography sx={sectionLabelStyles}>Supporting Documentation:</Typography>

                    {/* Card 2 Thumbnails for Uploaded Files */}
                    {selectedFiles.length > 0 && (
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
                                    <img
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        src={pdfThumbnails[file.id || file.googleId || file.url] || videoThumbnails[file.id || file.googleId || file.url] || file.url}
                                        alt={file.name}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}

                    {uniqueLinks.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mt: 1 }}>
                            {uniqueLinks.map((item, index) => (
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
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: 'inherit'
                                        }}
                                    >
                                        {item.name}
                                    </Typography>
                                    <OpenInNewIcon sx={{ fontSize: '14px' }} />
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography sx={placeholderTextStyles}>
                            Please add evidence to appear here...
                        </Typography>
                    )}
                </Box>

                {/* Recommending as */}
                <Divider sx={recommendationDividerStyles} />
                <Typography sx={sectionLabelStyles}>
                    Recommending as: {howKnow || 'Relationship'}
                </Typography>
            </Box>
        </Box>
    )
}

export default RecommenderPreview
