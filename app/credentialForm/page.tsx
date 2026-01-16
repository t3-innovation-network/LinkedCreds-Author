'use client'

import React from 'react'
import { Container, Stack } from '@mui/material'

import { useSession } from 'next-auth/react'
import CredentialForm from './CredentialForm'
import LoadingOverlay from '@/components/Loading/LoadingOverlay'

const CredentialFormPage = () => {
  const { data: session, status } = useSession()

  return (
    <Container maxWidth='xl' sx={{ position: 'relative' }}>
      <LoadingOverlay open={status === 'loading'} />

      <Stack spacing={'sm'} py={4}>
        {status !== 'loading' && <CredentialForm session={session} />}
      </Stack>
    </Container>
  )
}

export default CredentialFormPage
