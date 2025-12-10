'use client'

import React, { useState } from 'react'
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
import { UseFormRegister, FieldErrors, Controller } from 'react-hook-form'
import { FormData } from '../types/Types'
import { StepTrackShape } from '../widgets/StepTrackShape'
import { SVGDescribeBadge } from '../../../Assets/SVGs'

interface Step2Props {
  register: UseFormRegister<FormData>
  watch: (field: string) => any
  errors: FieldErrors<FormData>
  control: any
  setSkills: (s: string[]) => any
}

// Example list of skills for auto-search
const skillsList = [
  'Leadership',
  'Customer Service',
  'Landscape Design',
  'Software Development'
]

export function Step2({ register, watch, control, errors, setSkills }: Readonly<Step2Props>) {
  const [wordCount, setWordCount] = useState(0)

  const skillsDict = {}
  var s:string = ''
  skillsEx.forEach(s => skillsDict[s.toLowerCase()] = true)

  function extractSkills(text: string) {
    var words = text.toLowerCase().split(' ')
    var newCount = words.length
    if(newCount == wordCount) return

    setWordCount(newCount)
    var skills = []
    words.forEach(s =>{
      if(skillsDict[s]) skills.push(s)
    })
    setSkills(skills)
  }

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'left' }}
    >
      <Box sx={{ display: 'flex' }}>
        <SVGDescribeBadge />
        <Box>
          <Typography sx={{ fontSize: '24px', fontWeight: 400 }}>
            Document Your Skill
          </Typography>
          <StepTrackShape />
        </Box>
      </Box>
      <Box sx={{ width: '100%' }}>
        <FormLabel sx={formLabelStyles} id='name-label'>
          What skill do you want to claim? (required) ⓘ
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
                  sx={TextFieldStyles}
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
        <FormLabel sx={formLabelStyles} id='duration-label'>
          Time spent acquiring this skill:{' '}
        </FormLabel>
        <TextField
          {...register('credentialDuration')}
          placeholder='Example: 3 years'
          variant='outlined'
          sx={TextFieldStyles}
          aria-labelledby='duration-label'
          inputProps={{
            'aria-label': 'weight',
            style: inputPropsStyles
          }}
          error={!!errors.credentialDuration}
          helperText={errors.credentialDuration?.message}
        />
      </Box>

      <Box position='relative' width='100%'>
        <FormLabel sx={formLabelStyles} id='description-label'>
          Skill description (required):{' '}
        </FormLabel>
        <CustomTextField
          {...register('credentialDescription', {
            required: 'Credential Description is required'
          })}
          sx={customTextFieldStyles}
          multiline
          rows={11}
          variant='outlined'
          placeholder={
            'Example:\nWatering and feeding on a routine schedule, diagnosing plant sickness, over/under watering, removing dead leaves, and cultivating rich soil.'
          }
          FormHelperTextProps={{
            className: 'MuiFormHelperText-root'
          }}
          inputProps={{ maxLength: 294 }}
          error={!!errors.credentialDescription}
          helperText={
            errors.credentialDescription?.message
              ? `${errors.credentialDescription.message}`
              : `${watch('credentialDescription').length}/${294} characters`
          }
          onChange={e => extractSkills(e.target.value)}
        />
      </Box>
    </Box>
  )
}

const skillsEx: string[] = ['Python', 'CSS', 'React', 'TypeScript', 'UX', 'Scrum', 'Git', 'GCS', 'Next.js']
