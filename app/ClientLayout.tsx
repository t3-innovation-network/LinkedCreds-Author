'use client'

import { CssBaseline, Stack } from '@mui/material'
import NavBar from './components/navbar/NavBar'
import Footer from './components/footer/Footer'
import { StepProvider } from './credentialForm/StepContext'
import Providers from './components/signing/Providers'
import { useEffect } from 'react'
import { getOrCreateAppInstanceDid } from '@cooperation/vc-storage'

export default function ClientLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    const initializeAppDid = async () => {
      const did = await getOrCreateAppInstanceDid()
      console.log('App DID ready', did)
    }

    initializeAppDid().catch(console.error)
  }, [])

  return (
    <body>
      <Providers>
        <CssBaseline />

        <Stack minHeight='100vh' width='100vw' direction='column' spacing={0}>
          <NavBar />
          <Stack
            style={{
              flexGrow: 1,
              backgroundColor: '#F0F4F8'
            }}
          >
            <StepProvider>{children}</StepProvider>
          </Stack>
          <Footer />
        </Stack>
      </Providers>
    </body>
  )
}
