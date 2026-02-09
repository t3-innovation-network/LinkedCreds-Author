'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, Tooltip } from '@mui/material'
import { UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { FormData } from '../../../../credentialForm/form/types/Types'
import { SVGFolder, SVGSinfo } from '../../../../Assets/SVGs'
import { signIn, useSession } from 'next-auth/react'
import LoadingOverlay from '../../../../components/Loading/LoadingOverlay'

interface Step1Props {
  watch: UseFormWatch<FormData>
  setValue: UseFormSetValue<FormData>
  handleNext: () => void
}

const Step1: React.FC<Step1Props> = ({ handleNext }) => {
  const { data: session } = useSession()
  const accessToken = session?.accessToken
  const [loading, setLoading] = useState(false)

  const connectToGoogleDrive = async () => {
    if (accessToken) {
      setLoading(true)
      handleNext()
      return
    }

    try {
      await signIn('google', {
        callbackUrl: `${window.location.href}`
      })
      setLoading(true)
    } catch (error) {
      console.error('Error connecting to Google Drive:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken) {
      handleNext()
    }
  }, [accessToken, handleNext])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        textAlign: 'center',
        height: '60vh',
        mt: 4
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
  )
}

export default Step1
