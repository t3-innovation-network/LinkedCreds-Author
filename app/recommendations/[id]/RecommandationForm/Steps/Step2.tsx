'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Autocomplete,
  Box,
  FormLabel,
  TextField,
  Typography,
  Button,
  IconButton,
  InputAdornment
} from '@mui/material'
import { InsertLinkIcon } from '../../../../Assets/SVGs'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import StarIcon from '@mui/icons-material/Star'
import {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  Controller
} from 'react-hook-form'
import dynamic from 'next/dynamic'
const TextEditor = dynamic(() => import('../TextEditor/Texteditor'), { ssr: false })
import {
  formLabelStyles,
  inputPropsStyles,
  TextFieldStyles,
  SkillBadgePill,
  pageTitleStyles,
  sectionHeadingStyles,
  tipTextStyles,
  sectionLabelStyles,
  recFormOuterContainerStyles,
  recFormCardStyles,
  recSkillSectionStyles,
  recSkillChipsContainerStyles,
  unselectedSkillPillStyles,
  evidenceTipBoxStyles,
  evidenceTipBoxTextStyles,
  uploadClickTextStyles,
  uploadDragTextStyles,
  uploadHintTextStyles,
  evidenceLinkContainerStyles,
  linkInputFieldStyles,
  addLinkButtonBaseStyles,
  addLinkButtonActiveStyles,
  addLinkButtonDisabledStyles,
  savedLinkRowStyles,
  savedLinkTextStyles,
  linkDeleteButtonStyles,
  CardStyle,
  StyledTipBox,
  featuredImageBadgeStyles
} from '../../../../components/Styles/appStyles'
import {
  SelectedSkill,
  FormData,
  FileItem
} from '../../../../credentialForm/form/types/Types'
import { useDropzone } from 'react-dropzone'
import FileListDisplay from '../../../../components/FileList'
import { useStepContext } from '../../../../credentialForm/form/StepContext'
import { useAppDid } from '../../../../contexts/AppDidContext'
import useGoogleDrive from '../../../../hooks/useGoogleDrive'
import { ensureProtocol, handleUrlValidation } from '../../../../utils/urlValidation'
import { useHandleUpload } from '../../../../hooks/handleUpload'
import LoadingOverlay from '../../../../components/Loading/LoadingOverlay'
import {
  SVGUploadMedia,
  LightbulbSVG,
  SVGRecommendBadge,
  SVGDescribeBadge
} from '../../../../Assets/SVGs'
import { StepTrackShape } from '../../../../credentialForm/form/fromTexts & stepTrack/StepTrackShape'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Tooltip, Link } from '@mui/material'
import {
  recSectionContainerStyles,
  recGrayTextFieldStyles,
  formLabelRowStyles,
  tooltipIconStyles,
  requiredLabelStyles
} from '../../../../components/Styles/appStyles'

interface Step2Props {
  register: UseFormRegister<FormData>
  watch: (field: any) => any
  setValue: UseFormSetValue<FormData>
  errors: FieldErrors<FormData>
  fullName: string
  control: any
  selectedFiles: FileItem[]
  setSelectedFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
  skills: SelectedSkill[]
}

const options = ['Friend', 'Professional colleague', 'Volunteered together', 'College']

interface LinkItem {
  id: string
  name: string
  url: string
}

interface EvidenceItem {
  name: string
  url: string
  googleId?: string
  wasId?: string
}

const Step2: React.FC<Step2Props> = ({
  register,
  watch,
  setValue,
  errors,
  fullName,
  control,
  selectedFiles,
  setSelectedFiles,
  skills
}) => {
  const displayName = fullName || ''
  const { loading, setUploadImageFn } = useStepContext()
  const { appInstanceDid, hasZcap } = useAppDid()
  const { storage } = useGoogleDrive()

  // --- Evidence States ---
  const [links, setLinks] = useState<LinkItem[]>([
    { id: crypto.randomUUID(), name: '', url: '' }
  ])
  const [urlErrors, setUrlErrors] = useState<string[]>([])
  const maxFiles = 10

  // Sync links from form data on mount
  useEffect(() => {
    const evidence = (watch('evidence') as EvidenceItem[]) || []
    if (evidence.length > 0) {
      const existingLinks = evidence
        .filter(item => !item.googleId && !item.wasId && (item.name || item.url))
        .map(item => ({
          id: crypto.randomUUID(),
          name: item.name || '',
          url: item.url || ''
        }))

      if (existingLinks.length > 0) {
        setLinks(prev => {
          const isInitial = prev.length === 1 && !prev[0].name && !prev[0].url
          return isInitial
            ? [...existingLinks, { id: crypto.randomUUID(), name: '', url: '' }]
            : prev
        })
      }
    }
  }, [])

  const handleEditorChange = (field: string) => (value: string) => {
    setValue(field as any, value)
  }

  // --- Evidence Handlers ---
  const handleReorder = useCallback(
    (reorderedFiles: FileItem[]) => {
      const updatedFiles = reorderedFiles.map((file, idx) => ({
        ...file,
        isFeatured: idx === 0
      }))
      setSelectedFiles(updatedFiles)

      // Sync with form
      const fileEvidence = updatedFiles
        .filter(f => f.googleId || f.wasId)
        .map(f => ({
          name: f.name,
          url:
            f.wasId ||
            (f.googleId
              ? `https://drive.google.com/uc?export=view&id=${f.googleId}`
              : ''),
          googleId: f.googleId,
          wasId: f.wasId
        }))

      const manualLinks = links
        .filter(l => l.url.trim() !== '')
        .map(l => ({ name: l.name, url: ensureProtocol(l.url) }))

      setValue('evidence', [...fileEvidence, ...manualLinks])

      if (updatedFiles.length > 0) {
        const featured = updatedFiles[0]
        const evidenceUrl =
          featured.wasId ||
          (featured.googleId
            ? `https://drive.google.com/uc?export=view&id=${featured.googleId}`
            : featured.url)
        setValue('evidenceLink', evidenceUrl)
      }
    },
    [setSelectedFiles, setValue, links]
  )

  const handleHandleUpload = useHandleUpload({
    selectedFiles,
    setValue,
    setSelectedFiles,
    watch,
    appInstanceDid,
    hasZcap,
    storage: storage as any,
    useWas: !!hasZcap
  })

  useEffect(() => {
    setUploadImageFn(handleHandleUpload)
  }, [handleHandleUpload, setUploadImageFn])

  const handleAddLink = useCallback(() => {
    const lastLink = links[links.length - 1]
    if (lastLink.url.trim() === '') return

    setLinks(prev => [...prev, { id: crypto.randomUUID(), name: '', url: '' }])
  }, [links])

  const handleRemoveLink = useCallback(
    (index: number) => {
      setLinks(prev => {
        const newLinks = prev.filter((_, i) => i !== index)
        // Sync with form
        const manualLinks = newLinks
          .filter(l => l.url.trim() !== '')
          .map(l => ({ name: l.name, url: ensureProtocol(l.url) }))

        const fileEvidence = ((watch('evidence') as EvidenceItem[]) || []).filter(
          item => item.googleId || item.wasId
        )

        setValue('evidence', [...fileEvidence, ...manualLinks])
        return newLinks
      })
    },
    [setValue, watch]
  )

  const handleLinkChange = useCallback(
    (index: number, field: 'name' | 'url', value: string) => {
      setLinks(prev => {
        const newLinks = [...prev]
        newLinks[index] = { ...newLinks[index], [field]: value }

        if (field === 'url') {
          const fakeEvent = { target: { value } } as React.ChangeEvent<HTMLInputElement>
          handleUrlValidation(fakeEvent, setUrlErrors, index, urlErrors)
        }

        // Update form data for all complete links
        const manualLinks = newLinks
          .filter(l => l.url.trim() !== '')
          .map(l => ({ name: l.name, url: ensureProtocol(l.url) }))

        const fileEvidence = ((watch('evidence') as EvidenceItem[]) || []).filter(
          item => item.googleId || item.wasId
        )

        setValue('evidence', [...fileEvidence, ...manualLinks])
        return newLinks
      })
    },
    [setValue, watch, urlErrors]
  )

  const handleDelete = useCallback(
    (event: React.MouseEvent, id: string) => {
      event.stopPropagation()
      setSelectedFiles(prev => {
        const updated = prev.filter(f => f.id !== id && f.googleId !== id)
        if (updated.length > 0) {
          updated[0].isFeatured = true
        }
        return updated
      })

      const currentEvidence = (watch('evidence') as EvidenceItem[]) || []
      const updatedEvidence = currentEvidence.filter(
        f => f.googleId !== id && f.wasId !== id
      )
      setValue('evidence', updatedEvidence)

      // Update featured link if needed
      const updatedFiles = selectedFiles.filter(f => f.id !== id && f.googleId !== id)
      if (updatedFiles.length > 0) {
        const featured = updatedFiles[0]
        setValue(
          'evidenceLink',
          featured.wasId ||
            (featured.googleId
              ? `https://drive.google.com/uc?export=view&id=${featured.googleId}`
              : featured.url)
        )
      } else {
        setValue('evidenceLink', '')
      }
    },
    [selectedFiles, setValue, watch, setSelectedFiles]
  )

  const handleNameChange = useCallback(
    (id: string, newName: string) => {
      setSelectedFiles(prev => prev.map(f => (f.id === id ? { ...f, name: newName } : f)))
    },
    [setSelectedFiles]
  )

  const setAsFeatured = useCallback(
    (id: string) => {
      setSelectedFiles(prev => {
        const updated = prev
          .map(f => ({ ...f, isFeatured: f.id === id }))
          .sort((a, b) => (a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1))

        if (updated.length > 0) {
          const featured = updated[0]
          setValue(
            'evidenceLink',
            featured.wasId ||
              (featured.googleId
                ? `https://drive.google.com/uc?export=view&id=${featured.googleId}`
                : featured.url)
          )
        }
        return updated
      })
    },
    [setSelectedFiles, setValue]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (selectedFiles.length + acceptedFiles.length > maxFiles) {
        alert(`Max ${maxFiles} files allowed`)
        return
      }

      const processFile = (file: File) =>
        new Promise<FileItem>(resolve => {
          const reader = new FileReader()
          reader.onload = e => {
            resolve({
              id: crypto.randomUUID(),
              file,
              name: file.name,
              url: e.target?.result as string,
              isFeatured: false,
              uploaded: false,
              fileExtension: file.name.split('.').pop() || ''
            })
          }
          reader.readAsDataURL(file)
        })

      Promise.all(acceptedFiles.map(processFile)).then(newItems => {
        setSelectedFiles(prev => {
          const updated = [...prev, ...newItems]
          if (updated.length > 0 && !updated.some(f => f.isFeatured)) {
            updated[0].isFeatured = true
          }
          return updated
        })
      })
    },
    [selectedFiles.length, setSelectedFiles]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: { 'image/*': [], 'video/*': [], 'application/pdf': [] }
  })

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLink()
    }
  }

  return (
    <Box sx={recSectionContainerStyles}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          alignItems: 'flex-start',
          width: '100%',
          mb: 1
        }}
      >
        <SVGDescribeBadge width='56' height='56' />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography sx={pageTitleStyles}>Recommend {displayName}</Typography>
            <Tooltip title={`Provide details for your recommendation of ${displayName}`}>
              <InfoOutlinedIcon sx={tooltipIconStyles} />
            </Tooltip>
          </Box>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
          >
            <StepTrackShape />
            <Typography
              variant='body2'
              sx={{ color: 'text.secondary', display: 'flex', gap: '4px' }}
            >
              You can also{' '}
              <Link
                href='#'
                sx={{
                  color: 'primary.main',
                  textDecoration: 'underline',
                  fontWeight: 500
                }}
                onClick={e => {
                  e.preventDefault()
                  console.log('Save & Exit clicked')
                }}
              >
                Save & Exit
              </Link>{' '}
              to keep this as a draft.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={formLabelRowStyles}>
            <FormLabel
              sx={{ ...formLabelStyles, fontWeight: 'bold', mb: 0 }}
              id='fullname-label'
            >
              Your Name (required):
            </FormLabel>
            <Tooltip title='Enter your full name'>
              <InfoOutlinedIcon sx={tooltipIconStyles} />
            </Tooltip>
          </Box>
          <TextField
            {...register('fullName', { required: 'Full name is required' })}
            id='fullName'
            placeholder='e.g., John Doe'
            variant='outlined'
            sx={recGrayTextFieldStyles}
            aria-labelledby='fullname-label'
            inputProps={{
              style: inputPropsStyles
            }}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
          />
        </Box>

        <Box sx={{ width: '100%' }}>
          <Box sx={formLabelRowStyles}>
            <FormLabel
              sx={{ ...formLabelStyles, fontWeight: 'bold', mb: 0 }}
              id='relationship-label'
            >
              How do you know {displayName}? (required):
            </FormLabel>
            <Tooltip title={`Select your relationship with ${displayName}`}>
              <InfoOutlinedIcon sx={tooltipIconStyles} />
            </Tooltip>
          </Box>
          <Controller
            name='howKnow'
            control={control}
            rules={{ required: 'Relationship is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Autocomplete
                freeSolo
                options={options}
                value={value || ''}
                onChange={(_, newValue) => onChange(newValue || '')}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input') onChange(newInputValue)
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder='Select your relationship'
                    variant='outlined'
                    sx={recGrayTextFieldStyles}
                    aria-labelledby='relationship-label'
                    inputProps={{ ...params.inputProps, style: inputPropsStyles }}
                    error={!!error}
                    helperText={error ? error.message : ''}
                  />
                )}
              />
            )}
          />
        </Box>

        <Box sx={{ ...recSkillSectionStyles }}>
          <Typography sx={sectionHeadingStyles}>Select skills to recommend</Typography>
          <Typography sx={{ ...tipTextStyles }}>
            Choose one or more skills that you&apos;re recommending for {displayName}.
          </Typography>
          <Box sx={{ ...recSkillChipsContainerStyles }}>
            {skills?.length > 0 ? (
              skills.map((skill: SelectedSkill, idx: number) => {
                const currentSelected: SelectedSkill[] = watch('selectedSkills') || []
                const skillId = (skill as any).id ?? skill.uuid
                const skillName = (skill as any).name ?? skill.targetName
                const isSelected = currentSelected.some(
                  s => ((s as any).id ?? s.uuid) === skillId
                )

                return (
                  <SkillBadgePill
                    key={`${skillId}-${idx}`}
                    onClick={() => {
                      const newSelected = isSelected
                        ? currentSelected.filter(
                            s => ((s as any).id ?? s.uuid) !== skillId
                          )
                        : [...currentSelected, skill]
                      setValue('selectedSkills', newSelected)
                    }}
                    sx={{
                      cursor: 'pointer',
                      ...(isSelected
                        ? {
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            '& .MuiSvgIcon-root': { color: '#FFFFFF' }
                          }
                        : unselectedSkillPillStyles)
                    }}
                  >
                    {skillName}
                    {isSelected && <CheckIcon sx={{ fontSize: '13px' }} />}
                  </SkillBadgePill>
                )
              })
            ) : (
              <Typography sx={{ ...tipTextStyles, fontStyle: 'italic', mb: 0 }}>
                No skills found in this credential.
              </Typography>
            )}
          </Box>
          {(watch('selectedSkills') || []).length > 0 && (
            <Typography
              sx={{
                ...sectionLabelStyles,
                mt: '12px',
                mb: 0,
                color: '#6B7280',
                fontSize: '14px'
              }}
            >
              {(watch('selectedSkills') || []).length} skill
              {(watch('selectedSkills') || []).length !== 1 ? 's' : ''} selected
            </Typography>
          )}
        </Box>

        <Box sx={{ width: '100%' }}>
          <Box sx={formLabelRowStyles}>
            <FormLabel
              sx={{ ...formLabelStyles, fontWeight: 'bold', mb: 0 }}
              id='recommendation-text-label'
            >
              Recommendation (required):
            </FormLabel>
            <Tooltip title="Write your recommendation here to support or confirm the requestor's skill claims">
              <InfoOutlinedIcon sx={tooltipIconStyles} />
            </Tooltip>
          </Box>
          <TextEditor
            value={watch('recommendationText') || ''}
            onChange={handleEditorChange('recommendationText')}
            placeholder={`I've worked with ${displayName} for about two years, managing her at The Coffee Place...`}
          />
          {errors.recommendationText && (
            <Typography color='error' sx={{ mt: 1, fontSize: '12px' }}>
              {errors.recommendationText.message}
            </Typography>
          )}
        </Box>

        <Box sx={{ width: '100%' }}>
          <Box sx={formLabelRowStyles}>
            <FormLabel
              sx={{ ...formLabelStyles, fontWeight: 'bold', mb: 0 }}
              id='qualifications-label'
            >
              Your Qualifications (optional):
            </FormLabel>
            <Tooltip title='Share how you are qualified to provide this recommendation'>
              <InfoOutlinedIcon sx={tooltipIconStyles} />
            </Tooltip>
          </Box>
          <Typography sx={{ ...tipTextStyles, mb: '12px' }}>
            Sharing your qualifications will further increase the value of this
            recommendation.
          </Typography>
          <TextEditor
            value={watch('qualifications') || ''}
            onChange={handleEditorChange('qualifications')}
            placeholder={`e.g., I have over 10 years of experience in the field...`}
          />
          {errors.qualifications && (
            <Typography color='error' sx={{ mt: 1, fontSize: '12px' }}>
              {errors.qualifications.message}
            </Typography>
          )}
        </Box>

        {/* Evidence Section */}
        <Box sx={{ width: '100%', gap: '8px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Typography sx={sectionHeadingStyles}>
              Evidence <span style={{ color: '#6B7280' }}>(optional)</span>
            </Typography>
            <Typography sx={{ ...tipTextStyles }}>
              Adding evidence makes your recommendation more credible. You can skip this
              step, but will not be able to add evidence later.
            </Typography>

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
        </Box>
        <Box sx={evidenceLinkContainerStyles}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography sx={{ ...formLabelStyles, fontWeight: 'bold' }}>
              Add Evidence Link:
            </Typography>
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

export default Step2
