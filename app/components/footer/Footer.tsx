import { useTheme } from '@mui/material/styles'
import React from 'react'
import { Box, Typography, Container, Stack } from '@mui/material'
import Link from 'next/link'
import { LogoWhite, InfoIcon, PrivacyPolicyIcon } from '../../Assets/SVGs'

interface FooterItemProps {
  icon: React.ReactNode
  text: string
  href?: string
  isSourceCode?: boolean
}

const CCHeartIcon = () => (
  <Box
    sx={{
      width: '20px',
      height: '16px',
      backgroundImage: 'url(/icons/footer/ccheart_black.svg)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      flexShrink: 0
    }}
  />
)

const ApachePoweredByIcon = () => (
  <Box
    sx={{
      width: '20px',
      height: '20px',
      backgroundImage: 'url(/icons/footer/Apache_PoweredBy.svg)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      flexShrink: 0
    }}
  />
)

const GitHubIcon = () => (
  <Box
    sx={{
      width: '20px',
      height: '20px',
      backgroundImage: 'url(/icons/footer/github.svg)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      flexShrink: 0
    }}
  />
)

const EmailIcon = () => (
  <Box
    sx={{
      width: '20px',
      height: '15px',
      backgroundImage: 'url(/icons/footer/email.svg)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      flexShrink: 0
    }}
  />
)

const Footer = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#0F172A',
        color: 'white',
        py: { xs: 4, md: 8 },
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Container maxWidth='xl'>
        {/* Mobile Layout - Simple vertical stack */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column' }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CCHeartIcon />
              <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter' }}>
                Copyright, Creative Commons License BY 4.0
              </Typography>
            </Box>

            <Link href='https://www.apache.org/licenses/LICENSE-2.0' target='_blank' style={{ textDecoration: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ApachePoweredByIcon />
                <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter' }}>
                  Apache 2 License
                </Typography>
              </Box>
            </Link>

            <Link href='https://github.com/Cooperation-org/linked-claims-author' target='_blank' style={{ textDecoration: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <GitHubIcon />
                <Box>
                  <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter' }}>
                    Source Code: https://github.com/
                  </Typography>
                  <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter' }}>
                    Cooperation-org/linked-claims-author
                  </Typography>
                </Box>
              </Box>
            </Link>

            <Link href='https://linkedcreds.allskillscount.org/privacy' style={{ textDecoration: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PrivacyPolicyIcon />
                <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter' }}>
                  Privacy Policy
                </Typography>
              </Box>
            </Link>

            <Link href='mailto:support@lc.allskillscount.org' style={{ textDecoration: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon />
                <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter' }}>
                  support@lc.allskillscount.org
                </Typography>
              </Box>
            </Link>
          </Stack>
        </Box>

        {/* Tablet/Desktop Layout - Multi-column */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 4
          }}
        >
          {/* Column 1: Brand & Description */}
          <Box sx={{ maxWidth: '300px' }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', mb: 1, color: 'white',
              fontWeight: 600,
              fontSize: '18px',
              fontFamily: 'Inter'
            }}>
              <LogoWhite /> <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '18px', fontFamily: 'Inter' }}>LinkedCreds</Typography>
            </Box>
            <Typography
              sx={{
                color: '#94A3B8',
                fontSize: '16px',
                lineHeight: '24px',
                fontFamily: 'Inter'
              }}
            >
              Building trust and transparency in the talent marketplace through
              verifiable credentials.
            </Typography>
          </Box>

          {/* Column 2: Product */}
          <Box>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '18px',
                mb: 2,
                fontFamily: 'Inter'
              }}
            >
              Product
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CCHeartIcon />
                <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter' }}>
                  Copyright, Creative Commons License BY 4.0
                </Typography>
              </Box>
              <Link href='https://www.apache.org/licenses/LICENSE-2.0' target='_blank' style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ApachePoweredByIcon />
                  <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter', '&:hover': { textDecoration: 'underline' } }}>
                    Apache 2 License
                  </Typography>
                </Box>
              </Link>
              <Link href='https://github.com/Cooperation-org/linked-claims-author' target='_blank' style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <GitHubIcon />
                  <Box>
                    <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter' }}>
                      Source Code:
                    </Typography>
                    <Typography
                      sx={{
                        color: '#E2E8F0',
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        textDecoration: 'underline',
                        wordBreak: 'break-all'
                      }}
                    >
                      https://github.com/Cooperation-org/linked-claims-author
                    </Typography>
                  </Box>
                </Box>
              </Link>
            </Stack>
          </Box>

          {/* Column 3: About */}
          <Box>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '18px',
                mb: 2,
                fontFamily: 'Inter'
              }}
            >
              About
            </Typography>
            <Stack spacing={2}>
              {/* <Link href='/about' style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <InfoIcon />
                  <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter', '&:hover': { textDecoration: 'underline' } }}>
                    About LinkedCreds
                  </Typography>
                </Box>
              </Link>
              <Link href='/all-skills-count' style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <InfoIcon />
                  <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter', '&:hover': { textDecoration: 'underline' } }}>
                    All Skills Count
                  </Typography>
                </Box>
              </Link> */}
              <Link href='https://www.t3networkhub.org/' target='_blank' style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <InfoIcon />
                  <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter', '&:hover': { textDecoration: 'underline' } }}>
                    T3 Innovation Network
                  </Typography>
                </Box>
              </Link>
            </Stack>
          </Box>

          {/* Column 4: Legal */}
          <Box>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '18px',
                mb: 2,
                fontFamily: 'Inter'
              }}
            >
              Legal
            </Typography>
            <Stack spacing={2}>
              <Link href='https://linkedcreds.allskillscount.org/privacy' style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PrivacyPolicyIcon />
                  <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter', '&:hover': { textDecoration: 'underline' } }}>
                    Privacy Policy
                  </Typography>
                </Box>
              </Link>
              <Link href='mailto:support@lc.allskillscount.org' style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon />
                  <Typography sx={{ color: '#E2E8F0', fontSize: '14px', fontFamily: 'Inter', '&:hover': { textDecoration: 'underline' } }}>
                    support@lc.allskillscount.org
                  </Typography>
                </Box>
              </Link>
            </Stack>
          </Box>
        </Box>

        {/* Copyright - Hidden on mobile */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid #334155',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography sx={{ color: '#94A3B8', fontSize: '14px', fontFamily: 'Inter' }}>
            © 2026 LinkedCreds. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export { Footer as LandingFooter }
export default Footer
