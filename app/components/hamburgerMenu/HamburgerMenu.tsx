import React from 'react'
import { Box, Typography, Button, Drawer, IconButton, Divider } from '@mui/material'
import { SVGCheckMarks, HamburgerMenuSVG, CloseIcon } from '../../Assets/SVGs'
import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '../../Assets/SVGs/index'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

const features = [
  { id: 1, name: 'Capture any skill or experience' },
  { id: 2, name: 'Add supporting evidence' },
  { id: 3, name: 'Request references from others' },
  { id: 4, name: 'Share with employers & on LinkedIn' }
]

import {
  hamburgerIconButtonStyles,
  hamburgerDrawerBoxStyles,
  hamburgerHeaderBoxStyles,
  hamburgerLogoBoxStyles,
  hamburgerLogoTypographyStyles,
  hamburgerDividerStyles,
  hamburgerContentContainerStyles,
  hamburgerNavLinkBoxStyles,
  hamburgerNavLinkInnerBoxStyles,
  hamburgerNavLinkTypographyStyles,
  hamburgerNavLinkActiveIndicatorStyles,
  hamburgerLoginDescriptionStyles,
  hamburgerFeatureTitleStyles,
  hamburgerFeatureBoxStyles,
  hamburgerFeatureTypographyStyles,
  hamburgerLoginButtonStyles,
  hamburgerAboutSupportContainerStyles,
  hamburgerAboutSupportLinkBoxStyles,
  hamburgerSupportLinkBoxStyles,
  hamburgerAboutSupportTypographyStyles,
  hamburgerLogoutButtonStyles
} from '../Styles/appStyles'

const HamburgerMenu = () => {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()

  const toggleDrawer = () => {
    setIsOpen(!isOpen)
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      <IconButton
        sx={hamburgerIconButtonStyles}
        onClick={toggleDrawer}
        aria-label='Open menu'
      >
        <HamburgerMenuSVG />
      </IconButton>
      <Drawer anchor='left' open={isOpen} onClose={toggleDrawer}>
        <Box sx={hamburgerDrawerBoxStyles}>
          {/* Header Section */}
          <Box sx={hamburgerHeaderBoxStyles}>
            <Link href='/'>
              <Box sx={hamburgerLogoBoxStyles}>
                <Logo />
                <Typography sx={hamburgerLogoTypographyStyles}>
                  LinkedCreds
                </Typography>
              </Box>
            </Link>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={hamburgerDividerStyles} />

          {/* Content based on session state */}
          <Box sx={hamburgerContentContainerStyles}>
            {session ? (
              <>
                {/* Links with underline effect */}
                <Link href='/credentialForm' passHref style={{ width: '100%' }}>
                  <Box sx={hamburgerNavLinkBoxStyles}>
                    <Box sx={hamburgerNavLinkInnerBoxStyles}>
                      <Typography sx={hamburgerNavLinkTypographyStyles(isActive('/credentialForm'))}>
                        Add a New Skill
                        {isActive('/credentialForm') && (
                          <Box sx={hamburgerNavLinkActiveIndicatorStyles} />
                        )}
                      </Typography>
                    </Box>
                    <ArrowForwardIosIcon fontSize='small' />
                  </Box>
                </Link>
                <Link href='/claims' passHref style={{ width: '100%' }}>
                  <Box sx={hamburgerNavLinkBoxStyles}>
                    <Box sx={hamburgerNavLinkInnerBoxStyles}>
                      <Typography sx={hamburgerNavLinkTypographyStyles(isActive('/claims'))}>
                        My Skills
                        {isActive('/claims') && (
                          <Box sx={hamburgerNavLinkActiveIndicatorStyles} />
                        )}
                      </Typography>
                    </Box>
                    <ArrowForwardIosIcon fontSize='small' />
                  </Box>
                </Link>
                <Link href='/analytics' passHref style={{ width: '100%' }}>
                  <Box sx={hamburgerNavLinkBoxStyles}>
                    <Box sx={hamburgerNavLinkInnerBoxStyles}>
                      <Typography sx={hamburgerNavLinkTypographyStyles(isActive('/analytics'))}>
                        Analytics
                        {isActive('/analytics') && (
                          <Box sx={hamburgerNavLinkActiveIndicatorStyles} />
                        )}
                      </Typography>
                    </Box>
                    <ArrowForwardIosIcon fontSize='small' />
                  </Box>
                </Link>
                <Link href='/credentialImportForm' passHref style={{ width: '100%' }}>
                  <Box sx={hamburgerNavLinkBoxStyles}>
                    <Box sx={hamburgerNavLinkInnerBoxStyles}>
                      <Typography sx={hamburgerNavLinkTypographyStyles(isActive('/credentialImportForm'))}>
                        Import Skill Credential
                      </Typography>
                      {isActive('/credentialImportForm') && (
                        <Box
                          sx={{
                            ...hamburgerNavLinkActiveIndicatorStyles,
                            position: 'static',
                            mt: '5px'
                          }}
                        />
                      )}
                    </Box>
                    <ArrowForwardIosIcon fontSize='small' />
                  </Box>
                </Link>
              </>
            ) : (
              <>
                {/* Login description and features */}
                <Typography variant='h6' sx={hamburgerLoginDescriptionStyles}>
                  Login to access your LinkedCreds
                </Typography>
                <Typography sx={hamburgerFeatureTitleStyles}>
                  With LinkedCreds, you can:
                </Typography>
                {features.map(feature => (
                  <Box key={feature.id} sx={hamburgerFeatureBoxStyles}>
                    <SVGCheckMarks />
                    <Typography sx={hamburgerFeatureTypographyStyles}>
                      {feature.name}
                    </Typography>
                  </Box>
                ))}

                {/* Login Button */}
                <Button
                  sx={hamburgerLoginButtonStyles}
                  onClick={() => {
                    signIn()
                    toggleDrawer()
                  }}
                >
                  Sign up or Login
                </Button>
              </>
            )}
          </Box>

          {/* About and Support Links */}
          <Box sx={hamburgerAboutSupportContainerStyles}>
            <Link href='/help' passHref>
              <Box sx={hamburgerAboutSupportLinkBoxStyles}>
                <Typography sx={hamburgerAboutSupportTypographyStyles}>
                  Help & FAQ
                </Typography>
                <ArrowForwardIosIcon fontSize='small' />
              </Box>
            </Link>
            <Link href='mailto:support@linkedcreds.allskillscount.org' passHref>
              <Box sx={hamburgerSupportLinkBoxStyles}>
                <Typography sx={{ ...hamburgerAboutSupportTypographyStyles, fontFamily: 'inherit' }}>
                  Support
                </Typography>
                <ArrowForwardIosIcon fontSize='small' />
              </Box>
            </Link>
          </Box>

          {/* Logout Button */}
          {session && (
            <Button
              sx={hamburgerLogoutButtonStyles}
              onClick={() => {
                signOut()
                toggleDrawer()
              }}
            >
              Logout
            </Button>
          )}
        </Box>
      </Drawer>

    </>
  )
}

export default HamburgerMenu
