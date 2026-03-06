'use client'

import React, { useState } from 'react'
import { Box, Tooltip, Snackbar, Alert, Button, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useStepContext } from '../StepContext'
import { SVGBack, SVGCompleteStep } from '../../../Assets/SVGs'
import { useSession } from 'next-auth/react'

export function StepTrackShape() {
  const { activeStep, setActiveStep, handleBack, handleSkip } = useStepContext()
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const { data: session } = useSession()
  const accessToken = session?.accessToken

  const mappedStep = (() => {
    switch (activeStep) {
      case 1: return 1
      case 2: return 2
      case 3: return 3
      case 4: return 4
      default: return 0
    }
  })()

  // Always 4 steps for this flow
  const DISPLAY_TOTAL_STEPS = 4

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setOpenSnackbar(false)
  }

  const renderStepBox = (index: number) => {
    // index 0 -> Step 1
    // index 1 -> Step 2
    // index 2 -> Step 3
    // index 3 -> Step 4

    const stepNumber = index + 1
    let bgColor

    // Logic: 
    // If mappedStep > stepNumber -> Completed (Blue)
    // If mappedStep === stepNumber -> Active (Blue)
    // else -> Gray

    if (stepNumber <= mappedStep) {
      bgColor = '#2563EB'
    } else {
      bgColor = '#E0E0E0'
    }

    // Determine clickability (only if actual navigation is supported, but here it's complicated by the mapping)
    // For now, let's disable click to avoid jumping into "half-steps" like Evidence vs Description
    const isClickable = false

    return (
      <Tooltip title={`Step ${stepNumber}`} key={index}>
        <Box
          sx={{
            width: '8px',
            height: '8px',
            bgcolor: bgColor,
            borderRadius: '50%',
            cursor: isClickable ? 'pointer' : 'default',
            flexShrink: 0,
            transition: 'background-color 0.3s',
          }}
        />
      </Tooltip>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        justifyContent: 'flex-start'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}
      >
        {Array.from({ length: DISPLAY_TOTAL_STEPS }, (_, index) => renderStepBox(index))}
      </Box>

      <Typography sx={{ fontFamily: 'Inter', fontSize: '16px', fontWeight: 500, color: '#4D4D4D' }}>
        Step {mappedStep} of {DISPLAY_TOTAL_STEPS}
      </Typography>

      {mappedStep > 1 && (
        <Button
          onClick={handleBack}
          sx={{
            textTransform: 'none',
            fontSize: '12px',
            lineHeight: '16px',
            color: '#2563EB',
            fontFamily: 'Inter',
            '&:hover': {
              backgroundColor: 'transparent',
            }
          }}
          startIcon={<ArrowBackIcon sx={{ fontSize: '16px !important' }} />}
        >Previous
        </Button>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity='warning' sx={{ width: '100%' }}>
          {accessToken
            ? 'You cannot navigate to future steps.'
            : 'Please sign in to navigate between steps.'}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default StepTrackShape
