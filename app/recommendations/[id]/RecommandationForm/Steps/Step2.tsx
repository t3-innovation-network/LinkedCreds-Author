'use client'

import React, { useState } from 'react'
import { Autocomplete, Box, FormLabel, TextField, Typography, Chip } from '@mui/material'
import {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  Controller
} from 'react-hook-form'
import TextEditor from '../TextEditor/Texteditor'
import {
  formLabelStyles,
  inputPropsStyles,
  TextFieldStyles
} from '../../../../components/Styles/appStyles'
import Step3 from './Step3'
import { SelectedSkill, FormData } from '../../../../credentialForm/form/types/Types'

interface Step2Props {
  register: UseFormRegister<FormData>
  watch: (field: string) => any
  setValue: UseFormSetValue<FormData>
  errors: FieldErrors<FormData>
  fullName: string
  control: any
  selectedFiles: any
  setSelectedFiles: any
  skills: SelectedSkill[]
}

const options = [
  'Friend',
  'Professional colleague',
  'Volunteered together',
  'College'
]

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

  const handleEditorChange = (field: string) => (value: string) => {
    setValue(field, value)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        bgcolor: '#f0f4f8',
        borderRadius: 2
      }}
    >
      <Box
        sx={{
          width: '100%',
          bgcolor: 'white',
          p: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          borderRadius: 2
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Typography sx={{ fontSize: '32px', mb: '20px' }}>
            Recommendation Details
          </Typography>
          <FormLabel sx={formLabelStyles} id='full-name-label'>
            Name (required):
          </FormLabel>
          <TextField
            {...register('fullName', {
              required: 'Full name is required'
            })}
            placeholder='Firstname Lastname'
            variant='outlined'
            sx={TextFieldStyles}
            aria-labelledby='full-name-label'
            inputProps={{
              'aria-label': 'Full Name',
              style: inputPropsStyles
            }}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
          />
        </Box>

        <Box>
          <FormLabel sx={formLabelStyles} id='relationship-label'>
            How do you know {displayName} (required)?
          </FormLabel>

          <Controller
            name='howKnow'
            control={control}
            rules={{ required: 'Relationship is required' }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Autocomplete
                freeSolo
                options={options}
                value={value || ''}
                onChange={(event, newValue) => {
                  onChange(newValue || '')
                }}
                onInputChange={(event, newInputValue, reason) => {
                  // Always update the value when user types
                  if (reason === 'input') {
                    onChange(newInputValue)
                  }
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder='Select your relationship'
                    variant='outlined'
                    sx={TextFieldStyles}
                    aria-labelledby='relationship-label'
                    inputProps={{
                      ...params.inputProps,
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

        <Box
          sx={{
            width: '100%',
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>
            Select skills to recommend
          </Typography>
          <Typography sx={{ fontSize: '14px', color: 'text.secondary', mt: '2px' }}>
            Choose one or more skills that you&apos;re recommending for {displayName}.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: '10px', backgroundColor: '#f6f6f6ff', borderRadius: 2, p: '10px' }}>
            {skills?.length > 0 ? (
              skills.map((skill: SelectedSkill, idx: number) => {
                const currentSelected: SelectedSkill[] = watch('selectedSkills') || []
                const isSelected = currentSelected.some(s => s.uuid === skill.uuid)

                return (
                  <Chip
                    key={`${skill.uuid}-${idx}`}
                    label={skill.targetName}
                    clickable
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() => {
                      const newSelected = isSelected
                        ? currentSelected.filter(s => s.uuid !== skill.uuid)
                        : [...currentSelected, skill]
                      console.log('Selected Skills (Step 2):', newSelected)
                      setValue('selectedSkills', newSelected)
                    }}
                    variant={isSelected ? 'filled' : 'outlined'}
                  />
                )
              })
            ) : (
              <Typography sx={{ fontSize: '14px', fontStyle: 'italic' }}>
                No skills found in this credential.
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography sx={formLabelStyles} id='recommendation-text-label'>
            write your recommendation here to support or confirm the requestor&apos;s
            skill claims.
          </Typography>
          <TextEditor
            value={watch('recommendationText') || ''}
            onChange={handleEditorChange('recommendationText')}
            placeholder={`I've worked with ${displayName} for about two years, managing her at The Coffee Place. She is an excellent worker, prompt, and applies the skills she learned in Barista training on a daily basis. —This is just an example of how the recommendation might begin.`}
          />
          {errors.recommendationText && (
            <Typography color='error'>{errors.recommendationText.message}</Typography>
          )}
        </Box>

        {/* Qualifications */}
        <Box>
          <Typography sx={formLabelStyles} id='qualifications-label'>
            Your Qualifications (optional):
          </Typography>
          <Typography sx={{ marginBottom: '10px', fontSize: '14px' }}>
            Please share how you are qualified to provide this recommendation. Sharing
            your qualifications will further increase the value of this recommendation.
          </Typography>
          <TextEditor
            value={watch('qualifications') || ''}
            onChange={handleEditorChange('qualifications')}
            placeholder={`e.g., I have over 10 years of experience in the field and have worked closely with ${displayName}.`}
          />
          {errors.qualifications && (
            <Typography color='error'>{errors.qualifications.message}</Typography>
          )}
        </Box>
      </Box>

      <Step3
        watch={watch}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        setValue={setValue}
      />
    </Box>
  )
}
export default Step2
