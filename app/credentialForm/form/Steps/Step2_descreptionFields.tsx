'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  FormLabel,
  Autocomplete,
  TextField,
  Box,
  Typography,
  Tooltip,
  Card,
  styled,
  Button,
  InputAdornment,
  IconButton
} from '@mui/material'
import {
  inputPropsStyles,
  TextFieldStyles,
  formLabelStyles,
  CustomTextField,
  customTextFieldStyles,
  requiredLabelStyles,
  UseAIStyles,
  sectionValueStyles,
  pageTitleStyles,
  formLabelRowStyles,
  tooltipIconStyles,
  tipTextStyles,
  focusedTextFieldStyles,
  infoBannerStyles,
  infoBannerTextStyles,
  sectionHeadingStyles,
  linkInputFieldStyles,
  addLinkButtonBaseStyles,
  addLinkButtonActiveStyles,
  addLinkButtonDisabledStyles,
  savedLinkRowStyles,
  savedLinkTextStyles,
  linkDeleteButtonStyles,
  uploadClickTextStyles,
  uploadDragTextStyles,
  uploadHintTextStyles,
  evidenceLinkContainerStyles,
  evidenceTipBoxStyles,
  evidenceTipBoxTextStyles,
  CardStyle,
  StyledTipBox,
  featuredImageBadgeStyles
} from '../../../components/Styles/appStyles'
import StarIcon from '@mui/icons-material/Star'
import { HighlightedTextArea } from '../../../components/inputs/HighlightedTextArea'
import { UseFormRegister, FieldErrors, Controller } from 'react-hook-form'
import { FormData, FileItem } from '../types/Types'
import { StepTrackShape } from '../fromTexts & stepTrack/StepTrackShape'
import {
  SVGDescribeBadge,
  SVGSparkles,
  SVGUploadMedia,
  LightbulbSVG,
  InsertLinkIcon
} from '../../../Assets/SVGs'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import { useStepContext } from '../StepContext'
import useGoogleDrive from '../../../hooks/useGoogleDrive'
import { useAppDid } from '../../../contexts/AppDidContext'
import { useHandleUpload } from '../../../hooks/handleUpload'
import { useDropzone } from 'react-dropzone'
import FileListDisplay from '../../../components/FileList'
import LoadingOverlay from '../../../components/Loading/LoadingOverlay'
import { GoogleDriveStorage } from '@cooperation/vc-storage'
import { ensureProtocol, handleUrlValidation } from '../../../utils/urlValidation'

export interface LinkItem {
  id: string
  name: string
  url: string
}

interface Step2Props {
  register: UseFormRegister<FormData>
  watch: (field: string) => any
  handleTextEditorChange: (value: any) => void
  errors: FieldErrors<FormData>
  control: any
  activeSkills: string[]
  setValue: (field: string, value: any, options?: any) => void
  selectedFiles: any[]
  setSelectedFiles: React.Dispatch<React.SetStateAction<any[]>>
  handleBack: () => void
}

// Example list of skills for auto-search
const skillsList = [
  'Leadership',
  'Customer Service',
  'Landscape Design',
  'Software Development'
]

export function Step2({
  register,
  watch,
  control,
  errors,
  activeSkills,
  setValue,
  selectedFiles,
  setSelectedFiles,
  handleBack
}: Readonly<Step2Props>) {
  const { loading, setUploadImageFn } = useStepContext()
  const { storage } = useGoogleDrive()
  const { appInstanceDid, hasZcap } = useAppDid()
  const [files, setFiles] = useState<FileItem[]>([...selectedFiles])
  const [links, setLinks] = useState<LinkItem[]>([
    { id: crypto.randomUUID(), name: '', url: '' }
  ])
  const [urlErrors, setUrlErrors] = useState<string[]>([])
  const maxFiles = 10
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setFiles([...selectedFiles])
  }, [selectedFiles])

  useEffect(() => {
    const evidence = watch('evidence')
    if (
      evidence &&
      Array.isArray(evidence) &&
      links.length === 1 &&
      links[0].url === ''
    ) {
      const manualLinks = evidence.filter((item: any) => !item.googleId && !item.wasId)

      if (manualLinks.length > 0) {
        const restoredLinks = manualLinks.map((item: any) => ({
          id: crypto.randomUUID(),
          name: item.name || '',
          url: item.url || ''
        }))
        restoredLinks.push({ id: crypto.randomUUID(), name: '', url: '' })
        setLinks(restoredLinks)
      }
    }
  }, [])

  const handleFilesSelected = useCallback(
    (newFiles: FileItem[]) => {
      setFiles(newFiles)
      setSelectedFiles(newFiles)
    },
    [setSelectedFiles]
  )

  const handleReorder = useCallback(
    (reorderedFiles: FileItem[]) => {
      // Ensure the first item is always the featured one
      const updatedFiles = reorderedFiles.map((file, idx) => ({
        ...file,
        isFeatured: idx === 0
      }))
      setFiles(updatedFiles)
      setSelectedFiles(updatedFiles)
    },
    [setSelectedFiles]
  )

  const handleUpload = useHandleUpload({
    selectedFiles: selectedFiles as FileItem[],
    setValue,
    setSelectedFiles,
    watch,
    appInstanceDid,
    hasZcap,
    storage: storage as GoogleDriveStorage,
    useWas: !!hasZcap
  })

  useEffect(() => {
    setUploadImageFn(handleUpload)
  }, [handleUpload, setUploadImageFn])

  const handleAddLink = useCallback(() => {
    setLinks(prev => [...prev, { id: crypto.randomUUID(), name: '', url: '' }])
  }, [])

  const handleRemoveLink = useCallback((index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleLinkChange = useCallback(
    async (index: number, field: 'name' | 'url', value: string) => {
      setLinks(prev =>
        prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
      )

      if (field === 'url') {
        const fakeEvent = { target: { value } } as React.ChangeEvent<HTMLInputElement>
        handleUrlValidation(fakeEvent, setUrlErrors, index, urlErrors)
      }
    },
    [urlErrors]
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
      const updatedFiles = files
        .map(file => ({ ...file, isFeatured: file.id === id }))
        .sort((a, b) => (a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1))
      setFiles(updatedFiles)
      setSelectedFiles(updatedFiles)
    },
    [files, setSelectedFiles]
  )

  const matchesId = useCallback(
    (file: FileItem, id: string) =>
      file.googleId === id || file.wasId === id || file.id === id,
    []
  )

  const withoutId = useCallback(
    (list: FileItem[], id: string) => list.filter(file => !matchesId(file, id)),
    [matchesId]
  )

  const wasFirstFile = useCallback(
    (list: FileItem[], id: string) => (list[0] ? matchesId(list[0], id) : false),
    [matchesId]
  )

  const handleDelete = useCallback(
    (event: React.MouseEvent, id: string) => {
      event.stopPropagation()
      setFiles(prev => {
        const updated = withoutId(prev, id)
        const deletedFeatured = wasFirstFile(prev, id)
        if (deletedFeatured && updated.length > 0) {
          updated[0].isFeatured = true
        }
        return updated
      })
      setSelectedFiles(prev => withoutId(prev, id))
    },
    [setSelectedFiles, withoutId, wasFirstFile]
  )

  useEffect(() => {
    const fileItems = files
      .filter(file => file.googleId || file.wasId)
      .map(file => ({
        name: file.name,
        url:
          file.wasId ||
          (file.googleId
            ? `https://drive.google.com/uc?export=view&id=${file.googleId}`
            : ''),
        googleId: file.googleId,
        wasId: file.wasId
      }))

    const linkItems = links
      .filter(l => l.name || l.url)
      .map(l => ({
        name: l.name,
        url: ensureProtocol(l.url)
      }))

    setValue('evidence', [...fileItems, ...linkItems])

    const featuredFile = files.find(f => f.googleId || f.wasId)
    if (featuredFile) {
      setValue(
        'evidenceLink',
        featuredFile.wasId ||
          (featuredFile.googleId
            ? `https://drive.google.com/uc?export=view&id=${featuredFile.googleId}`
            : '')
      )
    } else {
      setValue('evidenceLink', '')
    }
  }, [files, links, setValue])

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

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Only add if it's the last item and has content
      if (index === links.length - 1 && links[index].url.trim() !== '') {
        handleAddLink()
      }
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          alignItems: 'flex-start',
          width: '100%'
        }}
      >
        <SVGDescribeBadge width='56' height='56' />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Typography sx={pageTitleStyles}>Document Your Skill</Typography>
          <StepTrackShape />
        </Box>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={formLabelRowStyles}>
          <FormLabel sx={{ ...formLabelStyles, mb: 0 }} id='name-label'>
            What skill do you want to claim?{' '}
            <span style={requiredLabelStyles}>(required)</span>
          </FormLabel>
          <Tooltip title='Enter the name of the skill you want to verify'>
            <InfoOutlinedIcon sx={tooltipIconStyles} />
          </Tooltip>
        </Box>

        <Controller
          name='credentialName'
          control={control}
          rules={{ required: 'Skill name is required' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Autocomplete
              freeSolo
              options={skillsList}
              value={value || ''}
              onChange={(event, newValue) => {
                onChange(newValue)
              }}
              onInputChange={(event, newInputValue) => {
                onChange(newInputValue)
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder='e.g., Welding, Customer Service...'
                  variant='outlined'
                  sx={{
                    ...focusedTextFieldStyles,
                    '& .MuiInputBase-input::placeholder': {}
                  }}
                  aria-labelledby='name-label'
                  inputProps={{
                    ...params.inputProps,
                    'aria-label': 'skill-name',
                    style: inputPropsStyles
                  }}
                  error={!!error}
                  helperText={error ? error.message : ''}
                />
              )}
            />
          )}
        />
      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={formLabelRowStyles}>
          <FormLabel sx={formLabelStyles} id='duration-label'>
            Years of Experience <span style={requiredLabelStyles}>(required)</span>
          </FormLabel>
          <Tooltip title='Enter the years of experience you had with this skill'>
            <InfoOutlinedIcon sx={tooltipIconStyles} />
          </Tooltip>
        </Box>
        <TextField
          {...register('credentialDuration')}
          id='credentialDuration'
          placeholder='e.g., <1 year, 5 years, etc.'
          variant='outlined'
          sx={{
            ...focusedTextFieldStyles,
            '& .MuiInputBase-input::placeholder': {}
          }}
          aria-labelledby='duration-label'
          inputProps={{
            'aria-label': 'duration',
            style: inputPropsStyles
          }}
          error={!!errors.credentialDuration}
          helperText={errors.credentialDuration?.message}
        />
      </Box>

      <Box
        position='relative'
        width='100%'
        sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={formLabelRowStyles}>
            <FormLabel sx={{ ...formLabelStyles }} id='description-label'>
              Skill Description <span style={requiredLabelStyles}>(required)</span>
            </FormLabel>
          </Box>
          <Typography sx={tipTextStyles}>
            Tip: For best results, mention skills, tools, and technologies.
          </Typography>
        </Box>
        <Box sx={evidenceTipBoxStyles}>
          <LightbulbSVG />
          <Typography sx={evidenceTipBoxTextStyles}>
            As you enter your skill description, skill suggestions are generated using AI
            processing on LinkedCreds-hosted infrastructure. Your narrative is not sent to
            external AI providers and we do not retain any of your data.
          </Typography>
        </Box>
        <Controller
          name='credentialDescription'
          control={control}
          rules={{ required: 'Skill description is required' }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <HighlightedTextArea
              value={value || ''}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={
                'Example:\nWatering and feeding on a routine schedule, diagnosing plant sickness, over/under watering, removing dead leaves, and cultivating rich soil.'
              }
              sx={{
                '& textarea::placeholder': {}
              }}
              error={!!error}
              helperText={error?.message}
              keywords={activeSkills}
              focusColor='#2DD4BF'
            />
          )}
        />
      </Box>

      {/* Evidence Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={sectionHeadingStyles}>
              Evidence <span style={{ color: '#6B7280' }}>(optional)</span>
            </Typography>
            <Typography sx={{ ...tipTextStyles }}>
              Adding evidence helps others verify your skills, you can skip this step, but
              will not be able to add evidence later.
            </Typography>
          </Box>

          <Box sx={evidenceTipBoxStyles}>
            <LightbulbSVG />
            <Typography sx={evidenceTipBoxTextStyles}>
              Use the arrows to change the order of an image or place it in the first
              position as a featured image. Featured images serve as the main image for
              your skill and may also serve as supporting evidence unless you elect to
              exclude them.
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
            <Box width='100%'>
              <CardStyle
                variant='outlined'
                {...getRootProps()}
                isDragActive={isDragActive}
                onClick={open}
                sx={{ cursor: 'pointer' }}
              >
                <input {...getInputProps()} />
                <Box
                  sx={{
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <SVGUploadMedia />
                  <Box>
                    <Typography component='span' sx={uploadClickTextStyles}>
                      Click to upload
                    </Typography>
                    <Typography component='span' sx={uploadDragTextStyles}>
                      {' '}
                      or drag and drop
                    </Typography>
                  </Box>
                  <Typography sx={uploadHintTextStyles}>
                    PDF, Images, or Documents (max 10MB each)
                  </Typography>
                </Box>
              </CardStyle>

              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <FileListDisplay
                    files={[...selectedFiles]}
                    onDelete={handleDelete}
                    onNameChange={handleNameChange}
                    onSetAsFeatured={setAsFeatured}
                    onReorder={handleReorder}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <Box sx={evidenceLinkContainerStyles}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography sx={{ ...formLabelStyles }}>Add Evidence Link</Typography>
          </Box>
          {(() => {
            const index = links.length - 1
            const link = links[index]
            const isActive = link?.url.trim() !== ''

            if (!link) return null

            return (
              <Box
                key={link.id}
                sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {/* Link Title Field */}
                <TextField
                  fullWidth
                  placeholder="Link title (e.g., 'LinkedIn Profile')"
                  value={link.name}
                  onChange={e => handleLinkChange(index, 'name', e.target.value)}
                  variant='outlined'
                  sx={linkInputFieldStyles}
                />
                {/* URL Field + Add Button */}
                <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    placeholder="URL (e.g., 'https://...')"
                    value={link.url}
                    onChange={e => handleLinkChange(index, 'url', e.target.value)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    variant='outlined'
                    error={!!urlErrors[index]}
                    helperText={urlErrors[index]}
                    sx={linkInputFieldStyles}
                  />
                  <Button
                    onClick={handleAddLink}
                    disabled={!isActive}
                    variant='outlined'
                    sx={{
                      ...addLinkButtonBaseStyles,
                      ...(isActive && addLinkButtonActiveStyles),
                      ...(!isActive && addLinkButtonDisabledStyles)
                    }}
                  >
                    + Add
                  </Button>
                </Box>
              </Box>
            )
          })()}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {links.slice(0, links.length - 1).map((link, index) => (
            <Box key={link.id} sx={savedLinkRowStyles}>
              <InsertLinkIcon />
              <Typography sx={savedLinkTextStyles}>
                <a
                  href={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {link.name || link.url}
                </a>
              </Typography>
              <IconButton
                onClick={() => handleRemoveLink(index)}
                sx={linkDeleteButtonStyles}
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>

      <LoadingOverlay text='Uploading files...' open={loading} />
    </Box>
  )
}
