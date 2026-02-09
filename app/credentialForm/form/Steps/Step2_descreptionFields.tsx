'use client'

import React from 'react'
import {
  FormLabel,
  Autocomplete,
  TextField,
  Box,
  Typography,
  Tooltip
} from '@mui/material'
import {
  inputPropsStyles,
  TextFieldStyles,
  formLabelStyles,
  CustomTextField,
  customTextFieldStyles,
  UseAIStyles
} from '../../../components/Styles/appStyles'
import { HighlightedTextArea } from '../../../components/inputs/HighlightedTextArea'
import { UseFormRegister, FieldErrors, Controller } from 'react-hook-form'
import { FormData } from '../types/Types'
import { StepTrackShape } from '../fromTexts & stepTrack/StepTrackShape'
import { SVGDescribeBadge, SVGSparkles } from '../../../Assets/SVGs'

interface Step2Props {
  register: UseFormRegister<FormData>
  watch: (field: string) => any
  handleTextEditorChange: (value: any) => void
  errors: FieldErrors<FormData>
  control: any
  activeSkills: string[]
}

// Example list of skills for auto-search
const skillsList = [
  'Leadership',
  'Customer Service',
  'Landscape Design',
  'Software Development'
]

export function Step2({ register, watch, control, errors, activeSkills }: Readonly<Step2Props>) {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}
    >
      <SVGDescribeBadge />
      <Typography sx={{ fontFamily: 'Lato', fontSize: '24px', fontWeight: 400 }}>
        Step 2
      </Typography>
      <Typography
        sx={{
          fontFamily: 'Lato',
          fontSize: '16px',
          fontWeight: 400,
          maxWidth: '360px',
          textAlign: 'center'
        }}
      >
        Now take a moment to describe the skill or experience you want to document.{' '}
      </Typography>
      <StepTrackShape />
      <Box sx={{ width: '100%' }}>
        <FormLabel sx={formLabelStyles} id='name-label'>
          Skill Name (required):
        </FormLabel>

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
                  placeholder='Example: Caring for (cultivating) healthy plants'
                  variant='outlined'
                  sx={{
                    ...TextFieldStyles,
                    '& .MuiInputBase-input::placeholder': {
                      fontStyle: 'italic'
                    }
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

      <Box position='relative' width='100%'>
        <FormLabel sx={formLabelStyles} id='description-label'>
          Skill description (required):{' '}
        </FormLabel>
        <Controller
          name="credentialDescription"
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
                '& textarea::placeholder': {
                  fontStyle: 'italic'
                }
              }}
              maxLength={1000}
              error={!!error}
              helperText={
                error?.message
                  ? error.message
                  : `${(value || '').length}/1000 characters`
              }
              keywords={activeSkills}
            />
          )}
        />

      </Box>
      <Box position='relative' width='100%'>
        <FormLabel sx={formLabelStyles} id='description-label'>
          Describe how you earned this skill (required):{' '}
        </FormLabel>
        <CustomTextField
          {...register('description', {
            required: 'Description is required'
          })}
          sx={{
            ...customTextFieldStyles,
            '& .MuiInputBase-input::placeholder': {
              fontStyle: 'italic'
            }
          }}
          multiline
          rows={10}
          variant='outlined'
          placeholder={
            'Example:\nI have been a weekly volunteer at the Beloved NC garden for the past 3 years in addition to caring for my own personal garden.'
          }
          FormHelperTextProps={{
            className: 'MuiFormHelperText-root'
          }}
          inputProps={{ maxLength: 1000 }}
          error={!!errors.description}
          helperText={
            errors.description?.message
              ? `${errors.description.message}`
              : `${watch('description').length}/1000 characters`
          }
        />
      </Box>

      <Box sx={{ width: '100%' }}>
        <FormLabel sx={formLabelStyles} id='duration-label'>
          Time spent acquiring this skill:{' '}
        </FormLabel>
        <TextField
          {...register('credentialDuration')}
          placeholder='Example: 3 years'
          variant='outlined'
          sx={{
            ...TextFieldStyles,
            '& .MuiInputBase-input::placeholder': {
              fontStyle: 'italic'
            }
          }}
          aria-labelledby='duration-label'
          inputProps={{
            'aria-label': 'weight',
            style: inputPropsStyles
          }}
          error={!!errors.credentialDuration}
          helperText={errors.credentialDuration?.message}
        />
      </Box>
    </Box>
  )
}
