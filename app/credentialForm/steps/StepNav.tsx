'use client'

import React, { useState } from 'react'
import { Box, Tooltip, Snackbar, Alert, Button } from '@mui/material'
import { useSession } from 'next-auth/react'

import { SVGBack, SVGCompleteStep } from '@/Assets/SVGs'
import { parenStyle } from '@/components/Styles/appStyles'

import { useStepContext } from '../StepContext'

export function StepTrackShape() {
  const { activeStep, setActiveStep, handleBack, handleSkip } = useStepContext()
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const { data: session } = useSession()
  const accessToken = session?.accessToken

  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const TOTAL_STEPS = pathname.includes('/recommendations') ? 7 : 4

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setOpenSnackbar(false)
  }

  const renderStepBox = (step: number) => {
    let content
    let bgColor
    let textColor = 'black'
    let borderColor

    if (step + 1 < activeStep) {
      // **Completed Steps**
      content = <SVGCompleteStep />
    } else if (step + 1 === activeStep) {
      content = step + 1
      bgColor = '#002bb3'
      textColor = 'white'
      borderColor = '#002bb3'
    } else {
      content = step + 1
      bgColor = 'white'
      borderColor = '#002bb3'
    }
    const handleStepClick = () => {
      if (!accessToken) {
        setOpenSnackbar(true)
        return
      }

      if (step <= activeStep) {
        setActiveStep(step)
      } else {
        setOpenSnackbar(true)
      }
    }

    const isClickable = accessToken && step <= activeStep

    return (
      <Tooltip title={`Step ${step + 1}`} key={step}>
        <Box
          onClick={isClickable ? handleStepClick : undefined}
          sx={{
            width: '30px',
            height: '30px',
            bgcolor: bgColor,
            color: textColor,
            borderRadius: '50%',
            border: `1px solid ${borderColor}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '13px',
            fontFamily: 'SF Pro Display',
            flexShrink: 0,
            cursor: isClickable ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.3s, color 0.3s',
            '&:hover': {
              backgroundColor: isClickable ? '#002bb3' : bgColor
            }
          }}
        >
          {content}
        </Box>
      </Tooltip>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center'}}>
      {[...Array(TOTAL_STEPS)].map((_, i) =>
        <span key={i} {...(i + 1 <= activeStep && {style: {color:'#2563eb'}})}>● &nbsp;</span>
      )}
      <span style={parenStyle}>Step {activeStep} of {TOTAL_STEPS}</span>
      &nbsp; &nbsp; &nbsp;
      {activeStep >= 2 && activeStep <= 4 && (
        <Button
          onClick={handleBack}
          sx={{ textTransform: 'capitalize', p: '0' }}
        >← Previous</Button>
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
