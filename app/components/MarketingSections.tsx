import React from 'react'
import { Box, Typography, Link as MuiLink } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import {
  sectionDescriptionStyles,
  featureTitleStyles,
  featureTextStyles
} from './Styles/appStyles'

const JOB_SEEKER_FEATURES = [
  {
    display: 'Self-authored credentials',
    text: 'You own your professional story'
  },
  {
    display: 'Backed by proof',
    text: 'Upload evidence and get endorsements'
  },
  {
    display: 'Universally shareable',
    text: 'One credential, infinite opportunities'
  }
]

export const JobSeekersSection: React.FC<{ showCreatedByLine?: boolean }> = ({ showCreatedByLine = false }) => {
  return (
    <Box
      sx={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: { xs: '30px 15px', md: '60px 30px' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'grey gradient',
        gap: '40px'
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            backgroundColor: '#EEF5FF',
            color: '#1447E6',
            borderRadius: '100px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'Inter',
            marginBottom: '16px',
            display: 'inline-block'
          }}
        >
          Why LinkedCreds?
        </Box>
        <Typography
          sx={{
            fontSize: '48px',
            fontWeight: 800,
            fontFamily: 'Poppins',
            color: '#101828',
            textAlign: 'center',
            lineHeight: '48px',
            marginBottom: '40px'
          }}
          variant='h2'
        >
          Perfect for Job Seekers
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: '40px', md: '80px' },
          width: '100%'
        }}
      >
        {/* Left Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: { md: '550px' }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Typography
              sx={{
                fontSize: '48px',
                fontWeight: 'bold',
                fontFamily: 'Poppins',
                color: '#202E5B',
                lineHeight: '52px'
              }}
            >
              Built for the modern talent marketplace
            </Typography>
            {showCreatedByLine && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Box sx={{ width: '100%', height: '1px', backgroundColor: '#E5E7EB' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '1.5px solid #10B981',
                      flexShrink: 0
                    }}
                  >
                    <CheckIcon sx={{ color: '#10B981', fontSize: '14px', stroke: '#10B981', strokeWidth: 1 }} />
                  </Box>
                  <Typography sx={{ color: '#667085', fontSize: '13px', fontFamily: 'Inter' }}>
                    Created by the <MuiLink href="https://www.uschamberfoundation.org/t3-innovation" target="_blank" rel="noopener noreferrer" sx={{ color: '#667085', textDecoration: 'underline', '&:hover': { color: '#344054' } }}>US Chamber of Commerce Foundation T3 Innovation Network</MuiLink>
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          <Typography
            sx={sectionDescriptionStyles}
          >
            In a world where trust matters, LinkedCreds provides a way for people from all walks of life to document
            skills and collect the verification needed to showcase their true potential.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', mt: 1 }}>
            {JOB_SEEKER_FEATURES.map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <CheckIcon
                  sx={{
                    color: '#10B981',
                    width: '24px',
                    height: '24px',
                    flexShrink: 0,
                    backgroundColor: '#ECFDF5',
                    borderRadius: '50%',
                    padding: '4px'
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    sx={featureTitleStyles}
                  >
                    {feature.display}
                  </Typography>
                  <Typography
                    sx={featureTextStyles}
                  >
                    {feature.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right Content - Image */}
        <Box
          component='img'
          src='/images/desk.png'
          alt='Job seeker working at a desk'
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: '666px',
            borderRadius: '16px',
            boxShadow: '0px 20px 40px -10px rgba(0, 0, 0, 0.15)',
            objectFit: 'cover'
          }}
        />
      </Box>
    </Box>
  )
}

const FEATURES_LIST = [
  {
    icon: VerifiedUserOutlinedIcon,
    title: 'Verifiable & Trustworthy',
    description:
      'All credentials are cryptographically signed and tamper-proof, ensuring authenticity.',
    iconBg: '#DBEAFE', // Light Blue
    iconColor: '#2563EB' // Blue
  },
  {
    icon: GroupsOutlinedIcon,
    title: 'Peer Recommendations',
    description:
      'Request endorsements from colleagues, mentors, and managers to validate your skills.',
    iconBg: '#DBEAFE', // Indigo tint
    iconColor: '#2563EB' // Indigo
  },
  {
    icon: LinkOutlinedIcon,
    title: 'Easy Integration',
    description:
      'Seamlessly share credentials on LinkedIn, resumes, and professional portfolios.',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB'
  },
  {
    icon: BookmarkBorderOutlinedIcon,
    title: 'Comprehensive Portfolio',
    description:
      'Document all your achievements, from formal education to informal learning experiences.',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB'
  },
  {
    icon: LockOutlinedIcon,
    title: 'Privacy Control',
    description:
      'You decide what to share and with whom. Keep full control of your credentials.',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB'
  },
  {
    icon: BoltOutlinedIcon,
    title: 'Instant Verification',
    description:
      'Employers can verify your credentials instantly without lengthy background checks.',
    iconBg: '#E0F2FE',
    iconColor: '#2563EB'
  }
]

export const FeaturesGridSection: React.FC = () => {
  return (
    <Box
      sx={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: { xs: '30px 15px', md: '60px 30px' },
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)'
        },
        gap: '24px'
      }}
    >
      {FEATURES_LIST.map((feature, index) => {
        const IconComponent = feature.icon
        return (
          <Box
            key={index}
            sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '20px',
              boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0px 12px 16px -4px rgba(16, 24, 40, 0.08)'
              }
            }}
          >
            <Box
              sx={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: feature.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: feature.iconColor
              }}
            >
              <IconComponent sx={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#101828',
                  fontFamily: 'Inter',
                  marginBottom: '8px'
                }}
              >
                {feature.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: '16px',
                  color: '#475467',
                  fontFamily: 'Inter',
                  lineHeight: '24px'
                }}
              >
                {feature.description}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
