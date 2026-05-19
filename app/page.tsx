'use client'
import React from 'react'
import { warmupSkillsApi } from './utils/skillsApi'
import { Box, Button, Typography, useTheme, useMediaQuery, Theme, Link as MuiLink } from '@mui/material'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import Link from 'next/link'
import Card, { HeroCard } from './components/cards'
import {
  sectionDescriptionStyles,
  featureTitleStyles,
  featureTextStyles,
  primaryButtonStyles,
  secondaryButtonStyles
} from './components/Styles/appStyles'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import CheckIcon from '@mui/icons-material/Check'
import { LandingFooter } from './components/footer/Footer'
import { CheckMarkHome } from './Assets/SVGs'
import { JobSeekersSection, FeaturesGridSection } from './components/MarketingSections'

interface SectionProps {
  theme: Theme //NOSONAR
}
const EXAMPLE_CARDS = [
  {
    id: 'caretaker',
    title: 'Elder Medical Carer',
    description:
      'I am able to attend to the care of an older adult with complex medical needs. This includes day-to-day care as well as basic medical care.',
    criteria: [
      'Solo caretaker certification',
      'Completed caretaker training program',
      'Basic medical care instructions',
      'Have CPR certification'
    ],
    duration: '5 Years',
    evidence: ['IMG_0630', 'IMG_0624', 'IMG_0640'],
    width: '195px',
    height: '385px',
    rotation: 'rotate(-8deg)', // Slightly more tilt for the bottom card
    image: '/caretaker.jpeg',
    showPlayButton: false,
    showTimer: false,
    showDuration: true,
    showEvidence: true
  },
  {
    id: 'barista',
    title: 'Barista',
    description:
      'I am able to demonstrate advanced skills in coffee preparation, customer service, and knowledge of coffee origins and brewing techniques.',
    criteria: [
      'Took 12 hours of barista classes',
      'Received positive customer surveys',
      'Received positive teacher feedback'
    ],
    duration: '2 Days',
    evidence: [
      'Video of the Perfect Pour',
      'Supporting Evidence',
      'Training Campus Certification',
      'Scent training'
    ],
    width: '195px',
    height: '410px',
    rotation: 'rotate(0deg)', // Center card stays straight
    image: '/coffee.jpeg',
    showPlayButton: true,
    showTimer: true,
    showDuration: true,
    showEvidence: true
  },
  {
    id: 'landscaper',
    title: 'Landscaper',
    description:
      'I am able to demonstrate advanced skills in landscaping, including hedge art, gardening, and outdoor hardscaping.',
    criteria: [
      'Worked 3 years as landscaper',
      'Received local landscaping award program',
      'Received positive client reviews'
    ],
    duration: '2 Weeks',
    evidence: [
      'Evidence of Design',
      'Design Evidence',
      'Hardscape Training',
      'IMG_0624'
    ],
    width: '195px',
    height: '400px',
    rotation: 'rotate(8deg)', // Mirror the tilt for the top card
    image: '/landscape.jpeg',
    showPlayButton: true,
    showTimer: true,
    showDuration: true,
    showEvidence: true
  }
]

const STEPS = [
  {
    id: 'capture',
    title: '1. Capture your skills',
    icon: '/Document.svg',
    description:
      'Add your experiences, from school activities, caregiving, volunteering, to special projects and more.'
  },
  {
    id: 'validate',
    title: '2. Add validation',
    icon: '/Human Insurance.svg',
    description:
      'Upload proof of your skills and request recommendations from trusted connections.'
  },
  {
    id: 'share',
    title: '3. Share',
    icon: '/Network.svg',
    description:
      'Share your skills with employers, add them to your resume, or to your LinkedIn profile.'
  }
]

const LinkedCreds_FEATURES = [
  { id: 'verifiable', text: 'Verifiable' },
  { id: 'shareable', text: 'Shareable' },
  { id: 'tamper-proof', text: 'Tamper proof' },
  { id: 'beautiful', text: 'Presented beautifully' },
  { id: 'ownership', text: 'Owned by you' },
  { id: 'control', text: 'You control access' },
  { id: 'no-degree', text: 'For everyone!' }
]

const HeroSection: React.FC<SectionProps & { showCards: boolean }> = ({ showCards }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  return (
    <Box
      sx={{
        width: '100%',
        background: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        pt: { xs: '30px', md: '60px' },
        pb: { xs: 4, md: 8 }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1400px',
          px: { xs: 2, md: 8 },
          position: 'relative'
        }}
      >
        {/* Left Content */}
        <Box sx={{ flex: 1, textAlign: 'left', mb: { xs: 6, md: 0 }, maxWidth: { md: '600px' } }}>
          <Typography
            variant='body1'
            sx={{
              color: '#2563EB',
              backgroundColor: '#EFF6FF',
              borderRadius: '16px',
              width: 'fit-content',
              fontSize: '14px',
              fontWeight: 500,
              px: '16px',
              py: '4px',
              mb: 3,
              fontFamily: 'Inter'
            }}
          >
            LinkedCreds is an open-source project
          </Typography>
          <Typography
            variant='h1'
            sx={{
              color: '#101828',
              mb: 3,
              fontFamily: 'Poppins',
              fontSize: { xs: '32px', md: '48px' }, // Reduced from 40/60
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}
          >
            Showcase the skills that{' '}
            <Box component="span" sx={{ color: '#2563EB' }}>
              define you
            </Box>
          </Typography>

          <Typography
            variant='body1'
            sx={{
              color: '#475467',
              fontSize: '18px',
              lineHeight: '28px',
              maxWidth: '560px',
              fontFamily: 'Inter',
              mb: 3 // Reduced from 5
            }}
          >
            Build verifiable credentials for your skills and experiences. Share proof
            of your expertise with employers, clients, and your professional
            network.
          </Typography>

          <Box sx={{ display: 'flex', mb: 3, gap: '16px', flexWrap: 'wrap' }}>
            <Link href='/credentialForm' passHref style={{ textDecoration: 'none' }}>
              <Button
                variant='contained'
                endIcon={<KeyboardArrowRightIcon />}
                sx={{
                  ...primaryButtonStyles,
                  backgroundColor: '#155DFC',
                  color: '#FFFFFF',
                  borderColor: '#155DFC',
                }}
                onClick={() => warmupSkillsApi()}
              >
                Build your first skill
              </Button>
            </Link>
            <Button
              variant='outlined'
              onClick={() => {
                const u = 'awinters';
                const d = 'us';
                const f = 'chambers'
                window.location.href = `mailto:${u}@${d}.${f}.com`;
              }}
              sx={{
                ...secondaryButtonStyles,
                color: '#0A0A0A',
                borderColor: '#D1D5DC',
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                  borderColor: '#D0D5DD'
                }
              }}
            >
              Request a demo
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <CheckMarkHome />
            <Typography
              sx={{
                fontSize: '14px',
                color: '#475467',
                fontFamily: 'Inter',
                lineHeight: '20px'
              }}
            >
              Created for you by the{' '}
              <Box
                component='a'
                href='https://www.uschamberfoundation.org/solutions/workforce-development-and-training/t3-innovation-network'
                target='_blank'
                rel='noopener noreferrer'
                sx={{
                  color: '#475467',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#2563EB'
                  }
                }}
              >
                US Chamber of Commerce Foundation T3 Innovation Network.
              </Box>
            </Typography>
          </Box>
        </Box>

        {/* Right Content: Single Credential Card */}
        {showCards && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              // Removed backgroundColor: '#FFFFFF' to avoid white box inside gradient/white background
            }}
          >
            {/* Background Blur/Glow Effect */}
            <Box
              sx={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                background: 'radial-gradient(50% 50% at 50% 50%, rgba(21, 93, 252, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
                filter: 'blur(40px)',
                zIndex: 0
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <HeroCard />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}



const StepsSection: React.FC<SectionProps> = ({ theme }) => (
  <Box sx={{ maxWidth: '1400px', mr: 'auto', ml: 'auto', textAlign: 'center' }}>
    <Box
      sx={{
        backgroundColor: '#EEF5FF',
        color: '#2563EB',
        borderRadius: '100px',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: 'Inter',
        marginBottom: '16px',
        display: 'inline-block',
        mt: { xs: '15px', md: '60px' },
      }}
    >
      Simple process
    </Box>
    <Typography
      variant='h2'
      sx={{
        fontSize: { xs: '32px', md: '48px' },
        fontWeight: 800,
        fontFamily: 'Poppins',
        color: '#101828',
        mb: '16px'
      }}
    >
      How it works
    </Typography>
    <Typography
      sx={{
        fontSize: '18px',
        color: '#475467',
        fontFamily: 'Inter',
        mb: '60px'
      }}
    >
      Create your first verifiable credential in just 3 simple steps
    </Typography>
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 3, md: 4 },
        px: { xs: '17.5px', md: 8 },
        mb: { xs: '15px', md: '0px' }
      }}
    >
      {STEPS.map(step => (
        <Box
          key={step.id}
          sx={{
            background: '#EEF5FF',
            borderRadius: '16px',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            textAlign: 'center'
          }}
        >
          <Box
            component='img'
            src={step.icon}
            alt={step.title}
            sx={{ mb: '15px', width: '60px', height: '60px' }}
          />
          <Typography
            sx={{
              color: theme.palette.t3BodyText,
              mb: '15px',
              fontSize: '18px',
              fontWeight: 700,
              lineHeight: '22px'
            }}
          >
            {step.title}
          </Typography>
          <Typography
            sx={sectionDescriptionStyles}
          >
            {step.description}
          </Typography>
        </Box>
      ))}
    </Box>
    <Link href='/credentialForm' passHref>
      <Button
        variant='contained'
        sx={{
          ...primaryButtonStyles,
          mx: 'auto',
          display: { xs: 'block', md: 'none' },
          mb: '30px',
          width: { xs: '100%', md: 'auto' },
          maxWidth: '360px'
        }}
        onClick={() => warmupSkillsApi()}
      >
        Start building your first skill
      </Button>
    </Link>
  </Box>
)



// Sections extracted to components/MarketingSections.tsx

const CallToActionSection: React.FC = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #2563EB 60%, #7C3AED 100%)',
        padding: { xs: '40px 15px', md: '60px 30px' }, // Reduced from 60/20 and 80/40
        marginTop: '60px', // Reduced from 80
        color: '#FFFFFF'
      }}
    >
      <Box
        sx={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: '40px', md: '80px' }
        }}
      >
        {/* Left Content */}
        <Box sx={{ flex: 1, maxWidth: { md: '560px' } }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: '100px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <AutoAwesomeIcon sx={{ color: '#FFFFFF', fontSize: '16px' }} />
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'Inter',
                color: '#FFFFFF 20%',
                lineHeight: '20px',
                letterSpacing: '-0.15px'
              }}
            >
              Start building today
            </Typography>
          </Box>
          <Typography
            variant='h2'
            sx={{
              fontSize: { xs: '36px', md: '48px' },
              fontWeight: 700,
              fontFamily: 'Poppins',
              lineHeight: '1.2',
              marginBottom: '24px',
              color: '#FFFFFF'
            }}
          >
            Ready to showcase your skills?
          </Typography>
          <Typography
            sx={{
              fontSize: '20px',
              fontFamily: 'Inter',
              lineHeight: '32.5px',
              letterSpacing: '-0.45px',
              color: '#DBEAFE',
              marginBottom: '40px'
            }}
          >
            Join other professionals who are already building their verifiable credential
            evidence. Create your first skill credential in minutes.
          </Typography>
          <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href='/credentialForm' passHref>
              <Button
                sx={{ ...secondaryButtonStyles, borderRadius: '8px' }}
                endIcon={<KeyboardArrowRightIcon />}
                onClick={() => warmupSkillsApi()}
              >
                Build your first skill
              </Button>
            </Link>
            <Link href='/help' passHref>
              <Button
                sx={{ ...secondaryButtonStyles, borderRadius: '8px' }}
              >
                Learn more
              </Button>
            </Link>
          </Box>
        </Box>

        {/* Right Content - Image */}
        <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              padding: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Box
              component='img'
              src='/images/group.png'
              alt='Trusted professionals'
              sx={{
                width: '100%',
                maxWidth: '550px',
                borderRadius: '16px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

const Page = () => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background:
          '#fafafa',
      }}
    >
      <HeroSection showCards={true} theme={theme} />
      <JobSeekersSection showCreatedByLine />
      <FeaturesGridSection />
      <StepsSection theme={theme} />
      <CallToActionSection />
      <LandingFooter />
    </Box>
  )
}

export default Page