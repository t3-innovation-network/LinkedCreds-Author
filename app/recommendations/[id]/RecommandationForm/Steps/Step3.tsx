'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Box, Typography, styled, Card } from '@mui/material'
import { useDropzone } from 'react-dropzone'

import FileListDisplay from '../../../../components/FileList'
import { GoogleDriveStorage, uploadToGoogleDrive } from '@cooperation/vc-storage'
import useGoogleDrive from '../../../../hooks/useGoogleDrive'
import { useStepContext } from '../../../../credentialForm/form/StepContext'
import { useAppDid } from '../../../../contexts/AppDidContext'
import LoadingOverlay from '../../../../components/Loading/LoadingOverlay'
import { TasksVector, SVGUplaodLink, SVGFolder, SVGUploadMedia, LightbulbSVG } from '../../../../Assets/SVGs'
import { FileItem } from '../../../../credentialForm/form/types/Types'
import LinkAdder from '../../../../components/LinkAdder'
import { formLabelStyles } from '../../../../components/Styles/appStyles'
import { useHandleUpload } from '../../../../hooks/handleUpload'
import { ensureProtocol } from '../../../../utils/urlValidation'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface LinkItem {
  id: string
  name: string
  url: string
}

interface PortfolioItem {
  name: string
  url: string
  googleId?: string
  wasId?: string
}

interface FileUploadAndListProps {
  readonly setValue: (field: string, value: any, options?: any) => void
  readonly selectedFiles: readonly FileItem[]
  readonly setSelectedFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  readonly watch: <T>(name: string) => T
}

const StyledTipBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '24px',
  width: '100%',
  maxWidth: '800px',
  gap: '1rem',
  marginTop: theme.spacing(2),
  backgroundColor: '#DDF4FF',
  padding: '0.6rem 1rem',
  borderRadius: '1rem'
}))

const FileUploadAndList: React.FC<FileUploadAndListProps> = ({
  setValue,
  selectedFiles,
  setSelectedFiles,
  watch
}) => {
  const { loading, setUploadImageFn } = useStepContext()
  const { appInstanceDid, hasZcap } = useAppDid()
  const [showLinkAdder, setShowLinkAdder] = useState(false)
  const { storage } = useGoogleDrive()
  const [files, setFiles] = useState<FileItem[]>([...selectedFiles])
  const [links, setLinks] = useState<LinkItem[]>([
    { id: crypto.randomUUID(), name: '', url: '' }
  ])
  const maxFiles = 10
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }
  const portfolio = watch<PortfolioItem[]>('portfolio')

  useEffect(() => {
    setFiles([...selectedFiles])
  }, [selectedFiles])

  // Initialize links from portfolio to handle persisted/updates data
  // We only update if 'links' is in its default (empty) state to avoid overwriting user edits.
  useEffect(() => {
    const currentPortfolio = portfolio || []
    if (currentPortfolio.length > 0) {
      const existingLinks = currentPortfolio
        .filter(item => !item.googleId && !item.wasId && (item.name || item.url))
        .map(item => ({
          id: crypto.randomUUID(),
          name: item.name || '',
          url: item.url || ''
        }))

      if (existingLinks.length > 0) {
        setLinks(prev => {
          // Only populate if we have exactly 1 item and it's the default empty one
          // AND we haven't already populated (check if prev matches existing?)
          // Simpler: Just check if we are in "initial" state.
          const isInitial = prev.length === 1 && !prev[0].name && !prev[0].url
          if (isInitial) {
            return existingLinks
          }
          return prev
        })
      }
    }
  }, [portfolio]) // React to portfolio changes (e.g. hydration), but guard updates


  const handleFilesSelected = useCallback(
    (newFiles: FileItem[]) => {
      setFiles(newFiles)
      setSelectedFiles(newFiles)
    },
    [setSelectedFiles]
  )

  const handleReorder = useCallback(
    (reorderedFiles: FileItem[]) => {
      // Update local state
      setFiles(reorderedFiles)
      setSelectedFiles(reorderedFiles)

      // Reconstruct file items for portfolio
      const newFileItems = reorderedFiles
        .filter(file => file.googleId || file.wasId)
        .map(file => {
          // Robust URL construction
          const url = file.wasId || (file.googleId ? `https://drive.google.com/uc?export=view&id=${file.googleId}` : '')
          return {
            name: file.name,
            url: url, // Use the constructed URL
            googleId: file.googleId,
            wasId: file.wasId
          }
        })

      // Reconstruct manual link items from the active links state
      const manualLinkItems = links
        .filter(l => l.name || l.url)
        .map(l => ({
          name: l.name,
          url: ensureProtocol(l.url)
        }))

      const newPortfolio = [...newFileItems, ...manualLinkItems]

      // If there's a featured file (first in the list), update the evidenceLink
      if (reorderedFiles[0]?.googleId || reorderedFiles[0]?.wasId) {
        const featuredFile = reorderedFiles[0]
        const evidenceUrl =
          featuredFile.wasId ||
          (featuredFile.googleId ? `https://drive.google.com/uc?export=view&id=${featuredFile.googleId}` : '')
        setValue('evidenceLink', evidenceUrl)
      }

      // Update the portfolio with the new merged list
      setValue('portfolio', newPortfolio)
    },
    [setValue, watch, setSelectedFiles, links]
  )

  const handleUpload = useHandleUpload({
    selectedFiles: selectedFiles as FileItem[],
    setValue,
    setSelectedFiles,
    watch,
    appInstanceDid,
    hasZcap,
    storage: storage as GoogleDriveStorage,
    useWas: !!hasZcap,
  })
  const handleAddLink = useCallback(() => {
    setLinks(prev => [...prev, { id: crypto.randomUUID(), name: '', url: '' }])
  }, [])
  const handleRemoveLink = useCallback(
    (index: number) => {
      setLinks(prev => {
        const newLinks = prev.filter((_, i) => i !== index)

        // Rebuild portfolio
        const fileItems = files
          .filter(file => file.googleId || file.wasId)
          .map(file => ({
            name: file.name,
            url:
              file.wasId || `https://drive.google.com/uc?export=view&id=${file.googleId}`,
            googleId: file.googleId,
            wasId: file.wasId
          }))

        const linkItems = newLinks
          .filter(l => l.name || l.url)
          .map(l => ({
            name: l.name,
            url: ensureProtocol(l.url)
          }))

        const newPortfolio = [...fileItems, ...linkItems]
        setValue('portfolio', newPortfolio)

        return newLinks
      })
    },
    [setValue, files]
  )

  const handleLinkChange = useCallback(
    (index: number, field: 'name' | 'url', value: string) => {
      setLinks(prev => {
        const newLinks = prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))

        // Rebuild portfolio to ensure sync and correct indexing
        const fileItems = files
          .filter(file => file.googleId || file.wasId)
          .map(file => ({
            name: file.name,
            url:
              file.wasId || `https://drive.google.com/uc?export=view&id=${file.googleId}`,
            googleId: file.googleId,
            wasId: file.wasId
          }))

        const linkItems = newLinks
          .filter(l => l.name || l.url)
          .map(l => ({
            name: l.name,
            url: ensureProtocol(l.url)
          }))

        const newPortfolio = [...fileItems, ...linkItems]
        setValue('portfolio', newPortfolio)

        return newLinks
      })
    },
    [setValue, files]
  )
  const handleNameChange = useCallback(
    (id: string, newName: string) => {
      const updateFiles = (prevFiles: FileItem[]) =>
        prevFiles.map(file => (file.id === id ? { ...file, name: newName } : file))
      setFiles(updateFiles)
      setSelectedFiles(updateFiles)
    },
    [setSelectedFiles]
  )
  const setAsFeatured = useCallback(
    (id: string) => {
      const updateFiles = (prevFiles: FileItem[]) =>
        prevFiles
          .map(file => ({ ...file, isFeatured: file.id === id }))
          .sort((a, b) => (a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1))
      setFiles(updateFiles)
      setSelectedFiles(updateFiles)
    },
    [setSelectedFiles]
  )
  const handleDelete = useCallback(
    (event: React.MouseEvent, id: string) => {
      event.stopPropagation()
      let isFeaturedFileDeleted = false
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.filter(
          file => file.googleId !== id && file.id !== id
        )
        isFeaturedFileDeleted = prevFiles[0]?.googleId === id || prevFiles[0]?.id === id
        if (isFeaturedFileDeleted && updatedFiles.length > 0) {
          updatedFiles[0].isFeatured = true
        }
        return updatedFiles
      })
      setSelectedFiles(prevFiles =>
        prevFiles.filter(file => file.googleId !== id && file.id !== id)
      )
      const currentPortfolio = watch<PortfolioItem[]>('portfolio') || []
      let updatedPortfolio = currentPortfolio.filter(
        file => file.googleId !== id && file.wasId !== id
      )
      const newFeaturedFile = files[1]
      if (isFeaturedFileDeleted && newFeaturedFile?.googleId) {
        setValue(
          'evidenceLink',
          `https://drive.google.com/uc?export=view&id=${newFeaturedFile.googleId}`
        )
        updatedPortfolio = updatedPortfolio.filter(
          file => file.googleId !== newFeaturedFile.googleId
        )
      }
      setValue('portfolio', updatedPortfolio)
    },
    [setValue, watch, files, setSelectedFiles]
  )
  useEffect(() => {
    setUploadImageFn(handleUpload)
  }, [handleUpload, setUploadImageFn])

  // Drag and drop functionality
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        alert(`You can only upload a maximum of ${maxFiles} files.`)
        return
      }

      const isAnyFileFeatured = files.some(file => file.isFeatured)
      let hasSetFeatured = isAnyFileFeatured

      const processFile = (file: File) => {
        return new Promise<FileItem>(resolve => {
          const reader = new FileReader()
          reader.onload = e => {
            const newFileItem: FileItem = {
              id: crypto.randomUUID(),
              file: file,
              name: file.name,
              url: e.target?.result as string,
              isFeatured: !hasSetFeatured && files.length === 0,
              uploaded: false,
              fileExtension: file.name.split('.').pop() ?? ''
            }

            if (newFileItem.isFeatured) hasSetFeatured = true
            resolve(newFileItem)
          }
          reader.readAsDataURL(file)
        })
      }

      Promise.all(acceptedFiles.map(processFile)).then(newFileItems => {
        const updatedFiles = [...files]
        newFileItems.forEach(newFile => {
          const duplicateIndex = updatedFiles.findIndex(f => f.name === newFile.name)
          if (duplicateIndex !== -1) {
            updatedFiles[duplicateIndex] = newFile
          } else {
            if (newFile.isFeatured) {
              updatedFiles.unshift(newFile)
            } else {
              updatedFiles.push(newFile)
            }
          }
        })
        handleFilesSelected(updatedFiles)
      })
    },
    [files, handleFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'image/*': [],
      'video/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'text/*': []
    },
    noClick: true
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files
    if (newFiles) {
      if (files.length + newFiles.length > maxFiles) {
        alert(`You can only upload a maximum of ${maxFiles} files.`)
        return
      }

      const filesArray = Array.from(newFiles)
      const isAnyFileFeatured = files.some(file => file.isFeatured)
      let hasSetFeatured = isAnyFileFeatured

      const processFile = (file: File) => {
        return new Promise<FileItem>(resolve => {
          const reader = new FileReader()
          reader.onload = e => {
            const newFileItem: FileItem = {
              id: crypto.randomUUID(),
              file: file,
              name: file.name,
              url: e.target?.result as string,
              isFeatured: !hasSetFeatured && files.length === 0,
              uploaded: false,
              fileExtension: file.name.split('.').pop() ?? ''
            }

            if (newFileItem.isFeatured) hasSetFeatured = true
            resolve(newFileItem)
          }
          reader.readAsDataURL(file)
        })
      }

      Promise.all(filesArray.map(processFile)).then(newFileItems => {
        const updatedFiles = [...files]
        newFileItems.forEach(newFile => {
          const duplicateIndex = updatedFiles.findIndex(f => f.name === newFile.name)
          if (duplicateIndex !== -1) {
            updatedFiles[duplicateIndex] = newFile
          } else {
            if (newFile.isFeatured) {
              updatedFiles.unshift(newFile)
            } else {
              updatedFiles.push(newFile)
            }
          }
        })
        handleFilesSelected(updatedFiles)
      })
    }
  }
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        gap: '24px',
        bgcolor: '#FFFFFF',
        borderRadius: 2,
        p: '20px'
      }}
    >

      <Box>
        <Typography sx={formLabelStyles} id='qualifications-label'>
          Supporting Documents and Links{' '}
        </Typography>
        <Typography sx={{ marginBottom: '10px', fontSize: '14px' }}>
          The strength of your recommendation is significantly enhanced when you provide
          supporting evidence of your qualifications.
        </Typography>
      </Box>
      <Box
        display='flex'
        flexDirection='column'
        bgcolor='#FFFFFF'
        gap={3}
        borderRadius={2}
        width='100%'
      >
        {/* Add Links Section */}

        <CardStyle variant='outlined' onClick={() => setShowLinkAdder(true)}>
          {showLinkAdder && (
            <Box mb={3} width='100%'>
              <LinkAdder
                fields={links}
                onAdd={handleAddLink}
                onRemove={handleRemoveLink}
                onNameChange={(index, value) => handleLinkChange(index, 'name', value)}
                onUrlChange={(index, value) => handleLinkChange(index, 'url', value)}
                maxLinks={5}
                nameLabel='Name'
                urlLabel='URL'
                namePlaceholder='(e.g., LinkedIn profile, github repo, etc.)'
                urlPlaceholder='https://'
              />{' '}
            </Box>
          )}
          <SVGUplaodLink />

          <Box
            onClick={(e) => {
              e.stopPropagation()
              if (!showLinkAdder) {
                setShowLinkAdder(true)
              } else {
                handleAddLink()
              }
            }}
            sx={{
              border: '1px solid #3B82F6', // Blue-500 equivalent
              borderRadius: '9999px', // Pill shape
              padding: '8px 24px',
              backgroundColor: '#EFF6FF', // Blue-50 equivalent
              color: '#3B82F6',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '8px',
              fontFamily: 'Inter',
              width: 'fit-content', // ensure it doesn't stretch 
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: '#DBEAFE', // Blue-100
                transform: 'scale(1.02)'
              }
            }}
          >
            Add More Links
          </Box>

          <Typography
            sx={{
              fontFamily: 'Inter',
              fontSize: '16px',
              fontWeight: 500,
              color: '#3B82F6',
              textAlign: 'center'
            }}
          >
            (social media, articles, your website, etc.)
          </Typography>
        </CardStyle>

        <Box width='100%'>

          <CardStyle variant='outlined' {...getRootProps()} isDragActive={isDragActive}>
            <input {...getInputProps()} />
            {/* Add Media Section */}
            <StyledTipBox>
              <LightbulbSVG />
              <Typography
                sx={{
                  fontFamily: 'Lato',
                  fontSize: '13px',
                  fontStyle: 'medium',
                  fontWeight: 500,
                  lineHeight: '14px',
                  letterSpacing: '0.02em',
                  color: '#1F2937'
                }}
              >
                Use the arrows to change the order of an image or place it in the first position as a
                featured image. Featured images serve as the main image for your skill and may also
                serve as supporting evidence unless you elect to exclude them.
              </Typography>
            </StyledTipBox>
            <FileListDisplay
              files={[...selectedFiles]}
              onDelete={handleDelete}
              onNameChange={handleNameChange}
              onSetAsFeatured={setAsFeatured}
              onReorder={handleReorder}
            />

            <Box onClick={open} sx={{ textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <SVGUploadMedia />
              <Box
                sx={{
                  border: '1px solid #3B82F6',
                  borderRadius: '9999px',
                  padding: '8px 24px',
                  backgroundColor: '#EFF6FF',
                  color: '#3B82F6',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  width: 'fit-content',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#DBEAFE',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                {isDragActive ? 'Drop files here...' : 'Add Media'}
              </Box>
              {!isDragActive && (
                <Typography
                  sx={{
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#3B82F6',
                    textAlign: 'center'
                  }}
                >
                  (images, documents, video)
                </Typography>
              )}
            </Box>
          </CardStyle>
        </Box>
      </Box>

      <LoadingOverlay text='Uploading files...' open={loading} />
    </Box>
  )
}
const CardStyle = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isDragActive'
})<{ isDragActive?: boolean }>(
  ({ isDragActive = false }) => ({
    padding: '40px 20px',
    cursor: 'default',
    width: '100%',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    p: 4,
    borderRadius: 2,
    gap: 2,
    border: isDragActive ? '2px dashed #2563EB' : '2px dashed #ccc',
    backgroundColor: isDragActive ? '#f0f9ff' : 'transparent',
    '&:hover': {
      borderColor: '#2563EB'
    }
  })
)

export default FileUploadAndList
