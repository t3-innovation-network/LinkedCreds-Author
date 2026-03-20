'use client'

import React, { useState } from 'react'
import { Box, Card, Link, Typography, IconButton, TextField } from '@mui/material'
import { Edit } from 'lucide-react'
import { QuoteSVG } from '../../../../Assets/SVGs'
import LoadingOverlay from '../../../../components/Loading/LoadingOverlay'
import { FormData } from '../../../../credentialForm/form/types/Types'
import { SVGRecommendBadge } from '../../../../Assets/SVGs'
import { StepTrackShape } from '../../../../credentialForm/form/fromTexts & stepTrack/StepTrackShape'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Tooltip } from '@mui/material'
import { recSectionContainerStyles, pageTitleStyles, tooltipIconStyles, sidebarContainerStyles } from '../../../../components/Styles/appStyles'
import RecommenderPreview from './RecommenderPreview'
import { SelectedSkill } from '../../../../credentialForm/form/types/Types'

interface DataPreviewProps {
  formData: FormData
  fullName: string
  handleNext: () => void
  handleBack: () => void
  handleSign: () => void
  isLoading: boolean
  onUpdateFormData: (newData: any) => void
  selectedFiles?: any[]
  originalEvidence?: any[]
  credentialSubject?: any
  skills?: SelectedSkill[]
}

const cleanHTML = (htmlContent: any): string => {
  if (typeof htmlContent !== 'string') {
    return ''
  }
  return htmlContent
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p><\/p>/g, '')
    .replace(/<br>/g, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
}

const EditableCard = ({
  title,
  content,
  onSave,
  multiline = false,
  icon,
  isQuote = false
}: {
  title: string
  content: string
  onSave: (newContent: string) => void
  multiline?: boolean
  icon?: React.ReactNode
  isQuote?: boolean
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  const handleBlur = () => {
    setIsEditing(false)
    if (editedContent !== content) {
      onSave(editedContent)
    }
  }

  return (
    <Card
      variant='outlined'
      sx={{
        p: '10px',
        mb: '10px',
        mt: title === 'Your name' ? '10px' : '0px',
        border: '1px solid #003fe0',
        borderRadius: '10px'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <Typography
          variant='subtitle1'
          sx={{
            fontWeight: 'bold',
            fontSize: '15px',
            letterSpacing: '0.01em'
          }}
        >
          {title}
        </Typography>
        <IconButton
          size='small'
          onClick={() => setIsEditing(true)}
          sx={{
            ml: 1,
            padding: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 63, 224, 0.04)'
            }
          }}
        >
          <Edit size={16} color='#003fe0' />
        </IconButton>
      </Box>

      {isEditing ? (
        <TextField
          fullWidth
          multiline={multiline}
          minRows={multiline ? 3 : 1}
          value={editedContent}
          onChange={e => setEditedContent(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          variant='outlined'
          size='small'
          sx={{
            mt: 1,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#003fe0'
              },
              '&:hover fieldset': {
                borderColor: '#003fe0'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#003fe0'
              }
            }
          }}
        />
      ) : (
        <>
          {title === 'Your name' ? (
            <Typography
              sx={{
                fontSize: '15px',
                letterSpacing: '0.01em',
                position: 'relative'
              }}
            >
              {content}
            </Typography>
          ) : (
            <Box display='flex' alignItems={isQuote ? 'center' : 'flex-start'}>
              {icon && icon}
              <Typography
                variant='body2'
                sx={{
                  ml: isQuote ? 1 : 0,
                  fontSize: '15px',
                  lineHeight: '24px',
                  color: isQuote ? '#202e5b' : '#000e40',
                  letterSpacing: '0.01em',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-line',
                  overflowWrap: 'anywhere'
                }}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: cleanHTML(content)
                  }}
                />
              </Typography>
            </Box>
          )}
        </>
      )}
    </Card>
  )
}

const DataPreview: React.FC<DataPreviewProps> = ({
  formData,
  fullName,
  isLoading,
  onUpdateFormData,
  selectedFiles = [],
  originalEvidence = [],
  credentialSubject,
  skills: originalSkills
}) => {
  const handleUpdateField = (field: keyof FormData, value: string) => {
    onUpdateFormData({
      ...formData,
      [field]: value
    })
  }

  return (
    <Box sx={recSectionContainerStyles}>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start', width: '100%' }}>
        <SVGRecommendBadge width="56" height="56" />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography sx={pageTitleStyles}>
              Review before signing
            </Typography>
            <Tooltip title="Review your recommendation details before final submission">
              <InfoOutlinedIcon sx={tooltipIconStyles} />
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <StepTrackShape />
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'inline' }}>
              If everything looks good, select{' '}
              <Link
                href='#'
                sx={{
                  color: 'primary.main',
                  textDecoration: 'underline',
                  fontWeight: 500,
                  display: 'inline'
                }}
                onClick={e => {
                  e.preventDefault()
                  console.log('Save & Exit clicked')
                }}
              >
                Save & Exit
              </Link>{' '}
              to complete your recommendation.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          width: '100%',
          maxWidth: '872px',
        }}
      >
        <RecommenderPreview
          fullName={fullName}
          credentialSubject={credentialSubject || formData.credentialSubject}
          originalEvidence={originalEvidence}
          skills={originalSkills || (formData.skills as any[]) || []}
          recommenderName={(formData.fullName as string) || ''}
          selectedSkills={(formData.selectedSkills as SelectedSkill[]) || []}
          recommendationText={(formData.recommendationText as string) || ''}
          howKnow={(formData.howKnow as string) || ''}
          qualifications={(formData.qualifications as string) || ''}
          evidence={(formData.evidence as any[]) || []}
          selectedFiles={selectedFiles}
          showOnlyRecommendation={true}
        />

        <LoadingOverlay text='Saving your recommendation...' open={isLoading} />
      </Box>
    </Box>
  )
}

export default DataPreview
