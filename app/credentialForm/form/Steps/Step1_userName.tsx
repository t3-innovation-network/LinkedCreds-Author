'use client'

import React from 'react'
import { FormLabel, TextField, Box, Typography } from '@mui/material'
import {
  formLabelStyles,
  TextFieldStyles,
  textFieldInputProps
} from '../../../components/Styles/appStyles'
import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue
} from 'react-hook-form'
import { FormData } from '../types/Types'
import { useSession } from 'next-auth/react'
import { SVGDescribeBadge } from '../../../Assets/SVGs'
import { StepTrackShape } from '../fromTexts & stepTrack/StepTrackShape'

interface Step1Props {
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  watch: UseFormWatch<FormData>
  setValue: UseFormSetValue<FormData>
  handleNext: () => void
}

export function Step1({ register, errors, handleNext }: Readonly<Step1Props>) {
  const { data: session } = useSession()

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const isValid = !errors.fullName && register('fullName').name

      if (isValid) {
        handleNext()
      }
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        width: '100%',
        maxWidth: '100%',
        padding: '32px 32px 0px 32px'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start', }}>
        <SVGDescribeBadge width="56" height="56" />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Typography sx={{ fontFamily: 'Inter', fontSize: '28px', fontWeight: 700, color: '#000e40', lineHeight: '1.2' }}>
            Document Your Skill
          </Typography>
          <StepTrackShape />
        </Box>
      </Box>

      <Box sx={{ width: '100%' }}>
        <FormLabel sx={{ ...formLabelStyles, mb: '8px', display: 'block' }} id='name-label'>
          What is your name? (required)
        </FormLabel>
        <TextField
          {...register('fullName', {
            required: 'Full name is required'
          })}
          placeholder={
            session?.user?.name ?? 'e.g., Maria Fernández or Kumar Enterprises'
          }
          variant='outlined'
          sx={{
            ...TextFieldStyles,
            '& .MuiOutlinedInput-root': {
              ...TextFieldStyles['& .MuiOutlinedInput-root'],
              '&.Mui-focused fieldset': {
                borderColor: '#2DD4BF'
              }
            }
          }}
          aria-labelledby='name-label'
          inputProps={textFieldInputProps}
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
          onKeyDown={handleKeyDown}
          fullWidth
        />
        <Typography sx={{ fontFamily: 'Inter', fontSize: '14px', color: '#6A7282', mb: '8px' }}>
          This name will appear on your credential as the recipient.
        </Typography>
      </Box>
    </Box>
  )
}
