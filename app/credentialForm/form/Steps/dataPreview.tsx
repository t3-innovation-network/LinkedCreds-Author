// /* eslint-disable @next/next/no-img-element */
// 'use client'

// import React, { useState, useEffect } from 'react'
// import { useTheme } from '@mui/material/styles'
// import { Box, Typography, useMediaQuery, Theme } from '@mui/material'
// import { FormData } from '../types/Types'
// import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
// import { StepTrackShape } from '../fromTexts & stepTrack/StepTrackShape'
// import { ensureProtocol } from '../../../utils/urlValidation'

// GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
// const isPDF = (fileName: string) => fileName.toLowerCase().endsWith('.pdf')
// const isMP4 = (fileName: string) => fileName.toLowerCase().endsWith('.mp4')
// const isGoogleDriveImageUrl = (url: string): boolean => {
//   return /https:\/\/drive\.google\.com\/uc\?export=view&id=.+/.test(url)
// }

// const cleanHTML = (htmlContent: string) => {
//   return htmlContent
//     .replace(/<p><br><\/p>/g, '')
//     .replace(/<p><\/p>/g, '')
//     .replace(/<br>/g, '')
//     .replace(/class="[^"]*"/g, '')
//     .replace(/style="[^"]*"/g, '')
// }

// interface DataPreviewProps {
//   formData: FormData
//   selectedFiles: {
//     id: string
//     name: string
//     url: string
//     isFeatured?: boolean
//   }[]
// }

// const renderPDFThumbnail = async (fileUrl: string) => {
//   try {
//     const loadingTask = getDocument(fileUrl)
//     const pdf = await loadingTask.promise
//     const page = await pdf.getPage(1)
//     const viewport = page.getViewport({ scale: 0.1 })
//     const canvas = document.createElement('canvas')
//     const context = canvas.getContext('2d')
//     if (context) {
//       canvas.height = viewport.height
//       canvas.width = viewport.width
//       await page.render({ canvasContext: context, viewport }).promise
//       return canvas.toDataURL()
//     }
//   } catch (error) {
//     console.error('Error rendering PDF thumbnail:', error)
//   }
//   return '/fallback-pdf-thumbnail.svg'
// }

// const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const video = document.createElement('video')
//     video.src = videoUrl
//     video.addEventListener(
//       'loadeddata',
//       () => {
//         video.currentTime = 1
//       },
//       { once: true }
//     )
//     video.addEventListener(
//       'seeked',
//       () => {
//         const canvas = document.createElement('canvas')
//         canvas.width = video.videoWidth
//         canvas.height = video.videoHeight
//         const ctx = canvas.getContext('2d')
//         if (!ctx) {
//           reject(new Error('Could not get 2D canvas context'))
//           return
//         }
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
//         const dataURL = canvas.toDataURL('image/png')
//         resolve(dataURL)
//       },
//       { once: true }
//     )

//     video.addEventListener('error', e => {
//       reject(e)
//     })
//   })
// }

// const DataPreview: React.FC<DataPreviewProps> = ({ formData, selectedFiles }) => {
//   const theme: Theme = useTheme()
//   const isLargeScreen = useMediaQuery(theme.breakpoints.up('sm'))

//   const [pdfThumbnails, setPdfThumbnails] = useState<Record<string, string>>({})
//   const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})
//   const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
//   const [isHoveringMedia, setIsHoveringMedia] = useState<boolean>(false)

//   // Image gallery navigation handlers
//   const handleNextImage = () => {
//     if (selectedFiles.length > 1) {
//       setCurrentImageIndex((prev) => (prev + 1) % selectedFiles.length)
//     }
//   }

//   const handlePrevImage = () => {
//     if (selectedFiles.length > 1) {
//       setCurrentImageIndex((prev) => (prev - 1 + selectedFiles.length) % selectedFiles.length)
//     }
//   }

//   // Reset image index when files change
//   useEffect(() => {
//     setCurrentImageIndex(0)
//   }, [selectedFiles.length])

//   // Get current display image (use index if multiple files, otherwise use featured or first)
//   const currentDisplayFile = selectedFiles.length > 0
//     ? selectedFiles[currentImageIndex]
//     : null

//   useEffect(() => {
//     selectedFiles.forEach(async file => {
//       if (isPDF(file.name) && !pdfThumbnails[file.id]) {
//         const thumbnail = await renderPDFThumbnail(file.url)
//         setPdfThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
//       }

//       if (isMP4(file.name) && !videoThumbnails[file.id]) {
//         try {
//           const thumbnail = await generateVideoThumbnail(file.url)
//           setVideoThumbnails(prev => ({ ...prev, [file.id]: thumbnail }))
//         } catch (error) {
//           console.error('Error generating video thumbnail:', error)
//           setVideoThumbnails(prev => ({
//             ...prev,
//             [file.id]: '/fallback-video.png'
//           }))
//         }
//       }
//     })
//   }, [selectedFiles, pdfThumbnails, videoThumbnails])

//   const handleNavigate = (url: string, target: string = '_self') => {
//     window.open(url, target)
//   }
//   const shouldDisplayUrl = (url: string): boolean => {
//     return !isGoogleDriveImageUrl(url)
//   }

//   const hasValidEvidence = formData.portfolio?.some(
//     (porto: { name: string; url: string }) => porto.name && porto.url
//   )

//   return (
//     <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
//       <Typography
//         sx={{
//           fontFamily: 'Inter',
//           fontSize: '24px',
//           fontWeight: 700,
//           textAlign: 'center',
//           background: 'linear-gradient(135deg, #003FE0 0%, #2563EB 100%)',
//           WebkitBackgroundClip: 'text',
//           WebkitTextFillColor: 'transparent',
//           backgroundClip: 'text'
//         }}
//       >
//         Here&apos;s what you&apos;ve created!
//       </Typography>
//       <StepTrackShape />

//       {/* Main Preview Card */}
//       <Box
//         sx={{
//           width: '100%',
//           bgcolor: '#FFFFFF',
//           borderRadius: '16px',
//           boxShadow: '0 8px 24px rgba(0, 63, 224, 0.1)',
//           overflow: 'hidden',
//           border: '1px solid #E5E7EB'
//         }}
//       >
//         {/* Header Section with Gradient */}
//         <Box
//           sx={{
//             background: 'linear-gradient(135deg, #003FE0 0%, #2563EB 100%)',
//             padding: { xs: '15px', sm: '10px' },
//             position: 'relative',
//             overflow: 'hidden',
//             '&::before': {
//               content: '""',
//               position: 'absolute',
//               top: 0,
//               right: 0,
//               width: '100px',
//               height: '100px',
//               background: 'rgba(255, 255, 255, 0.1)',
//               borderRadius: '50%',
//               transform: 'translate(50%, -50%)'
//             }
//           }}
//         >
//           <Typography
//             sx={{
//               fontFamily: 'Inter',
//               fontSize: { xs: '24px', sm: '24px' },
//               fontWeight: 700,
//               color: '#FFFFFF',
//               textAlign: 'center',
//               position: 'relative',
//               zIndex: 1,
//               textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
//             }}
//           >
//             {formData.credentialName}
//           </Typography>
//         </Box>

//         {/* Content Section */}
//         <Box sx={{ padding: { xs: '20px', sm: '24px' } }}>
//           {/* Media Carousel - Replacing Static Featured Image */}
//           {selectedFiles.length > 0 && currentDisplayFile && (
//             <Box
//               sx={{ marginBottom: '20px', position: 'relative' }}
//               onMouseEnter={() => setIsHoveringMedia(true)}
//               onMouseLeave={() => setIsHoveringMedia(false)}
//             >
//               <Box
//                 sx={{
//                   width: '100%',
//                   maxWidth: '400px',
//                   height: { xs: '200px', sm: '300px', md: '250px' },
//                   borderRadius: '12px',
//                   overflow: 'hidden',
//                   boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
//                   border: '2px solid #E5E7EB',
//                   position: 'relative',
//                   margin: '0 auto',
//                   bgcolor: '#F3F4F6',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}
//               >
//                 {isPDF(currentDisplayFile.name) ? (
//                   <img
//                     style={{
//                       width: '100%',
//                       height: '100%',
//                       objectFit: 'cover'
//                     }}
//                     src={pdfThumbnails[currentDisplayFile.id] ?? '/fallback-pdf-thumbnail.svg'}
//                     alt='PDF Preview'
//                   />
//                 ) : isMP4(currentDisplayFile.name) ? (
//                   <img
//                     style={{
//                       width: '100%',
//                       height: '100%',
//                       objectFit: 'cover'
//                     }}
//                     src={videoThumbnails[currentDisplayFile.id] ?? '/fallback-video.png'}
//                     alt='Video Thumbnail'
//                   />
//                 ) : (
//                   <img
//                     style={{
//                       width: '100%',
//                       height: '100%',
//                       objectFit: 'cover'
//                     }}
//                     src={currentDisplayFile.url}
//                     alt='Certification Evidence'
//                   />
//                 )}

//                 {/* Navigation Controls - Show only when hovering and multiple images */}
//                 {isHoveringMedia && selectedFiles.length > 1 && (
//                   <>
//                     {/* Previous Button */}
//                     <Box
//                       onClick={handlePrevImage}
//                       sx={{
//                         position: 'absolute',
//                         left: '12px',
//                         top: '50%',
//                         transform: 'translateY(-50%)',
//                         width: '40px',
//                         height: '40px',
//                         borderRadius: '50%',
//                         backgroundColor: 'rgba(0, 0, 0, 0.6)',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         cursor: 'pointer',
//                         color: '#ffffff',
//                         fontSize: '24px',
//                         fontWeight: 'bold',
//                         transition: 'all 0.2s',
//                         '&:hover': {
//                           backgroundColor: 'rgba(0, 0, 0, 0.8)',
//                           transform: 'translateY(-50%) scale(1.1)'
//                         },
//                         zIndex: 10
//                       }}
//                     >
//                       ‹
//                     </Box>

//                     {/* Next Button */}
//                     <Box
//                       onClick={handleNextImage}
//                       sx={{
//                         position: 'absolute',
//                         right: '12px',
//                         top: '50%',
//                         transform: 'translateY(-50%)',
//                         width: '40px',
//                         height: '40px',
//                         borderRadius: '50%',
//                         backgroundColor: 'rgba(0, 0, 0, 0.6)',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         cursor: 'pointer',
//                         color: '#ffffff',
//                         fontSize: '24px',
//                         fontWeight: 'bold',
//                         transition: 'all 0.2s',
//                         '&:hover': {
//                           backgroundColor: 'rgba(0, 0, 0, 0.8)',
//                           transform: 'translateY(-50%) scale(1.1)'
//                         },
//                         zIndex: 10
//                       }}
//                     >
//                       ›
//                     </Box>

//                     {/* Image Counter */}
//                     <Box
//                       sx={{
//                         position: 'absolute',
//                         bottom: '12px',
//                         left: '50%',
//                         transform: 'translateX(-50%)',
//                         backgroundColor: 'rgba(0, 0, 0, 0.6)',
//                         color: '#ffffff',
//                         padding: '4px 10px',
//                         borderRadius: '12px',
//                         fontSize: '12px',
//                         fontWeight: 500,
//                         fontFamily: 'Inter',
//                         zIndex: 10
//                       }}
//                     >
//                       {currentImageIndex + 1} / {selectedFiles.length}
//                     </Box>
//                   </>
//                 )}
//               </Box>
//             </Box>
//           )}

//           {/* Description Box */}
//           {formData.credentialDescription && (
//             <Box
//               sx={{
//                 backgroundColor: '#F9FAFB',
//                 borderRadius: '12px',
//                 padding: '20px',
//                 marginBottom: '20px',
//                 border: '1px solid #E5E7EB'
//               }}
//             >
//               <Typography
//                 sx={{
//                   fontFamily: 'Inter',
//                   fontSize: '12px',
//                   fontWeight: 600,
//                   color: '#000E40',
//                   marginBottom: '10px',
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.5px'
//                 }}
//               >
//                 Description
//               </Typography>
//               <Box
//                 sx={{
//                   fontFamily: 'Inter',
//                   fontSize: '15px',
//                   fontWeight: 400,
//                   color: '#1F2937',
//                   lineHeight: '24px',
//                   wordBreak: 'break-word',
//                   whiteSpace: 'pre-line',
//                   overflowWrap: 'anywhere'
//                 }}
//               >
//                 <span
//                   dangerouslySetInnerHTML={{
//                     __html: cleanHTML(formData.credentialDescription)
//                   }}
//                 />
//               </Box>
//             </Box>
//           )}

//           {/* How You Earned This */}
//           {formData?.description && (
//             <Box
//               sx={{
//                 backgroundColor: '#F9FAFB',
//                 borderRadius: '12px',
//                 padding: '18px',
//                 marginBottom: '16px',
//                 border: '1px solid #E5E7EB'
//               }}
//             >
//               <Typography
//                 sx={{
//                   fontFamily: 'Inter',
//                   fontSize: '12px',
//                   fontWeight: 600,
//                   color: '#000E40',
//                   marginBottom: '10px',
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.5px'
//                 }}
//               >
//                 How You Earned This
//               </Typography>
//               <Typography
//                 sx={{
//                   fontFamily: 'Inter',
//                   fontSize: '14px',
//                   fontWeight: 400,
//                   color: '#1F2937',
//                   lineHeight: '22px',
//                   wordBreak: 'break-word',
//                   whiteSpace: 'pre-line',
//                   overflowWrap: 'anywhere'
//                 }}
//               >
//                 <span
//                   dangerouslySetInnerHTML={{
//                     __html: cleanHTML(formData?.description as string)
//                   }}
//                 />
//               </Typography>
//             </Box>
//           )}

//           {/* Duration */}
//           {formData.credentialDuration && (
//             <Box
//               sx={{
//                 backgroundColor: '#EFF6FF',
//                 borderRadius: '12px',
//                 padding: '16px',
//                 marginBottom: '20px',
//                 border: '1px solid #DBEAFE',
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '12px'
//               }}
//             >

//               <Box>
//                 <Typography
//                   sx={{
//                     fontFamily: 'Inter',
//                     fontSize: '11px',
//                     fontWeight: 600,
//                     color: '#000E40',
//                     textTransform: 'uppercase',
//                     letterSpacing: '0.5px'
//                   }}
//                 >
//                   Duration
//                 </Typography>
//                 <Typography
//                   sx={{
//                     fontFamily: 'Inter',
//                     fontSize: '15px',
//                     fontWeight: 600,
//                     color: '#1F2937',
//                     marginTop: '2px'
//                   }}
//                 >
//                   {formData.credentialDuration}
//                 </Typography>
//               </Box>
//             </Box>
//           )}

//           {/* Evidence Section */}
//           {hasValidEvidence && (
//             <Box
//               sx={{
//                 backgroundColor: '#F0F9FF',
//                 borderRadius: '12px',
//                 padding: '18px',
//                 border: '1px solid #E0F2FE'
//               }}
//             >
//               <Typography
//                 sx={{
//                   fontFamily: 'Inter',
//                   fontSize: '12px',
//                   fontWeight: 600,
//                   color: '#000E40',
//                   marginBottom: '12px',
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.5px',
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: '8px'
//                 }}
//               >
//                 <span style={{ fontSize: '16px' }}>🔗</span>
//                 Supporting Evidence
//               </Typography>
//               <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                 {formData.evidenceLink &&
//                   shouldDisplayUrl(formData.evidenceLink as string) && (
//                     <Box
//                       component='a'
//                       href={ensureProtocol(formData.evidenceLink as string)}
//                       target='_blank'
//                       rel='noopener noreferrer'
//                       sx={{
//                         padding: '10px 14px',
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '10px',
//                         textDecoration: 'none',
//                         backgroundColor: '#FFFFFF',
//                         borderRadius: '8px',
//                         cursor: 'pointer',
//                         border: '1px solid #E0F2FE',
//                         transition: 'all 0.2s',
//                         '&:hover': {
//                           backgroundColor: '#F0F9FF',
//                           transform: 'translateX(4px)',
//                           borderColor: '#3B82F6'
//                         }
//                       }}
//                     >
//                       <Box
//                         sx={{
//                           width: '6px',
//                           height: '6px',
//                           borderRadius: '50%',
//                           backgroundColor: '#3B82F6',
//                           flexShrink: 0
//                         }}
//                       />
//                       <Typography
//                         sx={{
//                           fontFamily: 'Inter',
//                           fontSize: '13px',
//                           color: '#3B82F6',
//                           fontWeight: 500,
//                           wordBreak: 'break-all'
//                         }}
//                       >
//                         {formData.evidenceLink}
//                       </Typography>
//                     </Box>
//                   )}
//                 {formData.portfolio.map((porto: { name: string; url: string }) =>
//                   porto.name && porto.url ? (
//                     <Box
//                       key={porto.url}
//                       component='a'
//                       href={ensureProtocol(porto.url)}
//                       target='_blank'
//                       rel='noopener noreferrer'
//                       sx={{
//                         padding: '10px 14px',
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: '10px',
//                         textDecoration: 'none',
//                         backgroundColor: '#FFFFFF',
//                         borderRadius: '8px',
//                         cursor: 'pointer',
//                         border: '1px solid #E0F2FE',
//                         transition: 'all 0.2s',
//                         '&:hover': {
//                           backgroundColor: '#F0F9FF',
//                           transform: 'translateX(4px)',
//                           borderColor: '#3B82F6'
//                         }
//                       }}
//                     >
//                       <Box
//                         sx={{
//                           width: '6px',
//                           height: '6px',
//                           borderRadius: '50%',
//                           backgroundColor: '#3B82F6',
//                           flexShrink: 0
//                         }}
//                       />
//                       <Typography
//                         sx={{
//                           fontFamily: 'Inter',
//                           fontSize: '13px',
//                           color: '#3B82F6',
//                           fontWeight: 500,
//                           wordBreak: 'break-all'
//                         }}
//                       >
//                         {porto.name || porto.url}
//                       </Typography>
//                     </Box>
//                   ) : null
//                 )}
//               </Box>
//             </Box>
//           )}
//         </Box>
//       </Box>
//     </Box>
//   )
// }

// export default DataPreview
