'use client'

import React, { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CreateIcon from '@mui/icons-material/Create'
import {
  recSectionContainerStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
  estimatedTimeBannerStyles
} from '../../../components/Styles/appStyles'
import { SVGCheckMarks } from '../../../Assets/SVGs'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { featuresRecommendations } from '../RecommandationForm/fromTexts/FormTextSteps'
import ComprehensiveClaimDetails from '../../../view/[id]/ComprehensiveClaimDetails'
import DeclineRequest from '../DeclineRequest/DeclineRequest'
import background from '../../../Assets/Images/Background.svg'
import { useParams } from 'next/navigation'
import { JobSeekersSection, FeaturesGridSection } from '../../../page'
import { useSession } from 'next-auth/react'

interface CredentialProps {
  setactivStep: (step: number) => void
  fullName: string
  email: string
  credentialSubject: any
}

const Credential: React.FC<CredentialProps> = ({ setactivStep, fullName, email, credentialSubject }) => {
  const [showDeclineRequest, setShowDeclineRequest] = useState(false)

  const params = useParams()
  const id =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : undefined

  if (!id) {
    console.error('Error: Missing credential data.')
    return (
      <Box sx={{ padding: '20px', textAlign: 'center' }}>
        <Typography variant='h6' color='error'>
          Error: Missing credential data.
        </Typography>
      </Box>
    )
  }
  const { data: session } = useSession()

  const handleClick = () => {
    if (session?.accessToken) {
      setactivStep(2)
    } else {
      setactivStep(1)
    }
  }

  const handleDeclineRequest = () => {
    setShowDeclineRequest(true)
  }

  const handleBack = () => {
    setShowDeclineRequest(false)
  }

  if (showDeclineRequest) {
    return <DeclineRequest fullName={fullName} email={email} handleBack={handleBack} />
  }

  return (
    <Box sx={{ width: '100%', backgroundColor: '#FFFFFF' }}>
      <Box
        sx={{
          width: '100%',
          minHeight: 'calc(100vh - 100px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          pt: '48px'
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '850px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '45px',

          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'Poppins',
                fontSize: { xs: '32px', sm: '48px' },
                fontWeight: 'bold',
                lineHeight: '48px',
                color: '#202E5B',
                maxWidth: '810px'
              }}
            >
              {fullName} has requested a recommendation from you!
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                color: '#4A5565',
                maxWidth: '810px',
                lineHeight: '28px',
                letterSpacing: '-0.44px',
                padding: '10px'
              }}
            >
              Your endorsement will help {fullName} showcase her skills and advance her career
            </Typography>

            <Box sx={{ ...estimatedTimeBannerStyles }}>
              <AccessTimeIcon sx={{ fontSize: '20px' }} />
              <Typography >
                <Box component='span' sx={{ fontWeight: 'bold' }}>
                  Estimated time:{' '}
                </Box>
                2-3 minutes
              </Typography>
            </Box>
          </Box>

          {/* Skill Claim Section */}
          <Box
            sx={{
              width: '100%',
              backgroundColor: '#F9F9F9',
              p: { xs: 3, sm: '30px' },
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '30px',
              textAlign: 'left'
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontSize: '24px',
                  fontWeight: 700,
                  lineHeight: 'auto',
                  color: 't3BodyText'
                }}
              >
                Verifiable skill claim
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontSize: '16px',
                  lineHeight: 'auto',
                  letterSpacing: '-0.15px',
                  color: '#4A5565'
                }}
              >
                Your recommendation will be publicly visible and add credibility to {fullName}’s skill claim.
              </Typography>
            </Box>

            <Box sx={{ width: '100%' }}>
              <ComprehensiveClaimDetails minimized={true} />
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: '24px',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <Button
              variant='contained'
              onClick={handleClick}
              startIcon={<CreateIcon />}
              sx={{
                ...primaryButtonStyles,
                minWidth: { sm: '300px' },
                height: '54px'
              }}
            >
              Write your recommendation
            </Button>
            <Button
              variant='outlined'
              onClick={handleDeclineRequest}
              sx={{
                ...secondaryButtonStyles,
                minWidth: { sm: '300px' },
              }}
            >
              Decline
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Sections imported from page.tsx */}
      <JobSeekersSection showCreatedByLine={true} />
      <FeaturesGridSection />
    </Box>
  )
}

export default Credential
