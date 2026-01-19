'use client'

import React from 'react'
import { FormLabel, TextField, Box, Typography } from '@mui/material'
import {
  Controller,
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form'
import { useSession } from 'next-auth/react'

import { FormData } from '../types'
import { StepTrackShape } from './StepNav'
import {
  formLabelStyles,
  iconStyle,
  TextFieldStyles,
  parenStyle,
  subheadStyle,
} from '@/components/Styles/appStyles'
import { SVGSProfileName } from '@/Assets/SVGs'

interface Step1Props {
  control: any
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  watch: UseFormWatch<FormData>
  setValue: UseFormSetValue<FormData>
  handleNext: () => void
}

export function Step1({ control, register, errors, handleNext }: Readonly<Step1Props>) {
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
        mt: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'left',
        gap: '32px'
      }}
    >
      <Box sx={{ display: 'flex' }}>
        <Box sx={iconStyle}><SVGSProfileName /></Box>
        <Box>
          <Typography sx={{ fontSize: '24px', fontWeight: 400 }}>
            Confirm Your Name
          </Typography>
          <StepTrackShape />
        </Box>
      </Box>
      <Box sx={{ width: '100%' }}>
        <FormLabel sx={formLabelStyles} id='name-label'>
          Name:
          &nbsp; <span style={parenStyle}>(required)</span> &nbsp;
        </FormLabel>

        <Controller
          control={control}
          name='fullName'
          render={({field})=>(
            <TextField
              {...register('fullName', {
                required: 'Full name is required'
              })}
              placeholder='e.g., Maria Fernández or Kumar Enterprises'
              variant='outlined'
              sx={TextFieldStyles}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              onKeyDown={handleKeyDown}
            />
          )}
        />
        <span style={subheadStyle}>This name will appear on your credential as the recipient.</span>
      </Box>
    </Box>
  )
}
