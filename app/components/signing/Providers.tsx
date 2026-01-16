'use client'
import { AppDidProvider } from '@/contexts/AppDidContext'
import { SessionProvider } from 'next-auth/react'
import Theme from '@/theme'
import React, { ReactNode } from 'react'
import { ThemeProvider } from '@emotion/react'

interface Props {
  children: ReactNode
}

const Providers = (props: Props) => {
  return (
    <ThemeProvider theme={Theme}>
      <SessionProvider>
        <AppDidProvider>{props.children}</AppDidProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}

export default Providers
