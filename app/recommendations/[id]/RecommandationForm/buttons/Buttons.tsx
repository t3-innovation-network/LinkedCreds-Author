'use client'

import React from 'react'
import { Box, Button } from '@mui/material'

interface ButtonsProps {
  activeStep: number
  handleBack: React.MouseEventHandler<HTMLButtonElement> | undefined
  handleNext: React.MouseEventHandler<HTMLButtonElement> | undefined
  handleSign: React.MouseEventHandler<HTMLButtonElement> | undefined
  maxSteps: number
  isValid: boolean
  isLoading?: boolean
  tooltipText?: string
}

export function Buttons({
  activeStep,
  handleNext,
  handleSign,
  handleBack,
  isValid,
  isLoading = false
}: Readonly<ButtonsProps>) {
  return (
    <Box
      sx={{
        width: { xs: '100%', md: '40%', lg: '40%' },
        height: 'auto',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        // flexDirection: activeStep === 3 ? 'column' : 'row',
        // alignItems: activeStep === 3 ? 'center' : 'flex-start'
      }}
    >
      {activeStep === 2 && (
        <Button variant='finishButton' type='submit' color='secondary'>
          Save & Exit
        </Button>
      )}

      {activeStep === 3 && handleSign && (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
          <Button
            onClick={handleBack}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              textDecoration: 'underline',
              '&:hover': {
                textDecoration: 'underline',
                backgroundColor: 'transparent',
                color: 'text.primary'
              }
            }}
          >
            Back
          </Button>
          <Button
            onClick={handleSign}
            color='primary'
            disabled={!isValid || isLoading}
            variant='finishButton'
            sx={{ width: 'auto', minWidth: '140px' }}
          >
            Finish & Sign
          </Button>
        </Box>
      )}
      {activeStep === 2 && (
        <Button
          variant='finishButton'
          onClick={handleNext}
          disabled={!isValid || isLoading}
          color='primary'
        >
          Preview
        </Button>
      )}
    </Box>
  )
}
export default Buttons
