'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, Tooltip } from '@mui/material'
import { UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { FormData } from '../../../../credentialForm/form/types/Types'
import { SVGFolder, SVGSinfo } from '../../../../Assets/SVGs'
import { signIn, useSession } from 'next-auth/react'
import LoadingOverlay from '../../../../components/Loading/LoadingOverlay'
import { recSectionContainerStyles } from '../../../../components/Styles/appStyles'

interface Step1Props {
  watch: UseFormWatch<FormData>
  setValue: UseFormSetValue<FormData>
  handleNext: () => void
  fullName: string
}

const Step1: React.FC<Step1Props> = ({ handleNext, fullName }) => {
  const displayName = fullName || ''
  const { data: session } = useSession()
  const accessToken = session?.accessToken
  const [loading, setLoading] = useState(false)
  const hasAdvanced = React.useRef(false)

  const connectToGoogleDrive = async () => {
    if (accessToken) {
      setLoading(true)
      handleNext()
      return
    }

    try {
      await signIn('google', {
        callbackUrl: `${window.location.origin}${window.location.pathname}?step=1`
      })
      setLoading(true)
    } catch (error) {
      console.error('Error connecting to Google Drive:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken && !hasAdvanced.current) {
      hasAdvanced.current = true
      handleNext()
    }
  }, [accessToken, handleNext])

  return (
    <Box sx={recSectionContainerStyles}>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          textAlign: 'center',
          height: '40vh',
          width: '100%'
        }}
      >
        {/* Google Drive Icon */}
        <Box
          sx={{
            width: 100,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <SVGFolder />
        </Box>

        {/* Main text */}
        <Typography
          sx={{
            fontSize: 24,
            maxWidth: '400px'
          }}
        >
          Login with Google Drive
        </Typography>

        {/* Connect to Google Drive Button */}
        {!accessToken && (
          <Button
            variant='actionButton'
            color='primary'
            onClick={connectToGoogleDrive}
          >
            Login {' '}
            <Tooltip title='You must have a Google Drive account and be able to login. This is where your recommendation will be saved.'>
              <Box sx={{ ml: 2, mt: '2px' }}>
                <SVGSinfo />
              </Box>
            </Tooltip>
          </Button>
        )}

        <LoadingOverlay text='Connecting...' open={loading} />
      </Box>
    </Box>
  )
}

export default Step1
