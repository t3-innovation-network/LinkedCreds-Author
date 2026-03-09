'use client'

import React from 'react'
import { Box, Button, CircularProgress } from '@mui/material'

interface ButtonsProps {
  activeStep: number
  handleBack: React.MouseEventHandler<HTMLButtonElement> | undefined
  handleNext: React.MouseEventHandler<HTMLButtonElement> | undefined
  handleSkip?: React.MouseEventHandler<HTMLButtonElement> | undefined
  handleSign: React.MouseEventHandler<HTMLButtonElement> | undefined
  isValid: boolean
  handleSaveSession: () => void
  loading: boolean
}

export function Buttons({
  activeStep,
  handleNext,
  handleSign,
  handleBack,
  isValid,
  handleSaveSession,
  loading,
  handleSkip
}: Readonly<ButtonsProps>) {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}
    >
      <Box>
        {(activeStep === 2 || activeStep === 3) && (
          <Button
            onClick={handleBack}
            color='primary'
            variant='outlined'
            sx={{
              borderRadius: '9999px',
              textTransform: 'none',
              fontWeight: 600,
              minWidth: '100px'
            }}
          >
            Back
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {activeStep !== 0 && (
          <Button
            sx={{ minWidth: { xs: 'auto', sm: '130px' } }}
            onClick={handleSaveSession}
            color='secondary'
            variant='finishButton'
          >
            Save & Exit
          </Button>
        )}

        {(activeStep === 1) && (
          <Button
            onClick={handleNext}
            color='primary'
            disabled={!isValid}
            variant='nextButton'
          >
            Next
          </Button>
        )}
        {(activeStep === 2) && (
          <Button
            onClick={handleNext}
            color='primary'
            disabled={!isValid}
            variant='nextButton'
            sx={{ borderRadius: '9999px', textTransform: 'none', minWidth: { xs: 'auto', sm: '330px' }, width: { xs: '100%', sm: 'auto' } }}
          >
            Preview Credential
          </Button>
        )}

        {activeStep === 3 && (
          <Button variant='nextButton' onClick={handleSign} color='primary'>
            Finish & Sign
          </Button>
        )}
        {activeStep === 4 && (
          <Button
            onClick={handleNext}
            disabled={loading} // Disable button during loading
            color='primary'
            variant='nextButton'
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Uploading...
              </>
            ) : (
              'Preview'
            )}
          </Button>
        )}
      </Box>
    </Box>
  )
}
