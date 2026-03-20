import { useTheme } from '@mui/material/styles'
import React from 'react'
import {
  Box,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
// import { useRouter } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import HamburgerMenu from '../hamburgerMenu/HamburgerMenu'
import { Logo } from '../../Assets/SVGs'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import LogoutIcon from '@mui/icons-material/Logout'
// import router from 'next/router'

import {
  navBarContainerStyles,
  navLogoContainerStyles,
  navLogoTypographyStyles,
  navLinksContainerStyles,
  navLinkItemStyles,
  navLinkTypographyStyles,
  navActiveIndicatorStyles,
  userProfileContainerStyles,
  userAvatarStyles,
  userNameTypographyStyles,
  userMenuMoreIconStyles,
  logoutMenuItemStyles,
  logoutIconStyles
} from '../Styles/appStyles'

const NavBar = () => {
  const theme = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const isActive = (path: string): boolean => pathname === path
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      localStorage.clear()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      localStorage.clear()
      router.push('/')
    }
  }

  return (
    <Box sx={navBarContainerStyles}>
      {/* Logo and Name */}
      <Box sx={navLogoContainerStyles}>
        <Link href='/' aria-label='LinkedCreds Home'>
          <Box sx={{ display: 'flex', alignItems: 'center', marginRight: '0px' }}>
            <Logo />
          </Box>
        </Link>
        <Link href='/' aria-label='LinkedCreds Home'>
          <Typography sx={navLogoTypographyStyles(theme)}>LinkedCreds</Typography>
        </Link>
      </Box>
      <Box sx={{ flex: 1 }}></Box>

      {/* Navigation Links and Sign Button */}
      <Box sx={navLinksContainerStyles}>
        {session && (
          <>
            <Link href='/credentialForm#step1' passHref>
              <Box sx={navLinkItemStyles}>
                <Typography
                  sx={navLinkTypographyStyles(theme, isActive('/credentialForm'))}
                >
                  Add a New Skill
                </Typography>
                {isActive('/credentialForm') && <Box sx={navActiveIndicatorStyles} />}
              </Box>
            </Link>
            <Link href='/credentialImportForm' passHref>
              <Box sx={navLinkItemStyles}>
                <Typography
                  sx={navLinkTypographyStyles(theme, isActive('/credentialImportForm'))}
                >
                  Import Skill Credential
                </Typography>
                {isActive('/credentialImportForm') && (
                  <Box sx={navActiveIndicatorStyles} />
                )}
              </Box>
            </Link>
            <Link href='/claims' passHref>
              <Box sx={navLinkItemStyles}>
                <Typography sx={navLinkTypographyStyles(theme, isActive('/claims'))}>
                  My Skills
                </Typography>
                {isActive('/claims') && <Box sx={navActiveIndicatorStyles} />}
              </Box>
            </Link>
            <Link href='/analytics' passHref>
              <Box sx={navLinkItemStyles}>
                <Typography sx={navLinkTypographyStyles(theme, isActive('/analytics'))}>
                  Analytics
                </Typography>
                {isActive('/analytics') && <Box sx={navActiveIndicatorStyles} />}
              </Box>
            </Link>
            <Link href='/help' passHref>
              <Box sx={navLinkItemStyles}>
                <Typography sx={navLinkTypographyStyles(theme, isActive('/help'))}>
                  Help & FAQ
                </Typography>
                {isActive('/help') && <Box sx={navActiveIndicatorStyles} />}
              </Box>
            </Link>
          </>
        )}

        {/* User Profile Section or Sign In */}
        {session ? (
          <>
            <Box
              sx={userProfileContainerStyles}
              onClick={e => setAnchorEl(e.currentTarget)}
            >
              <Avatar sx={userAvatarStyles}>
                {session.user?.name ? session.user.name[0].toUpperCase() : 'U'}
              </Avatar>
              <Typography sx={userNameTypographyStyles}>{session.user?.name}</Typography>
              <MoreVertIcon sx={userMenuMoreIconStyles} />
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  minWidth: '150px'
                }
              }}
            >
              <MenuItem
                onClick={() => {
                  setAnchorEl(null)
                  handleSignOut()
                }}
                sx={logoutMenuItemStyles}
              >
                <LogoutIcon className='logout-icon' sx={logoutIconStyles} />
                Sign Out
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'center' }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'row', gap: '32px', alignItems: 'center' }}>
              <Link href='/privacy' passHref>
                <Box sx={navLinkItemStyles}>
                  <Typography sx={navLinkTypographyStyles(theme, false)}>
                    About LinkedCreds
                  </Typography>
                </Box>
              </Link>
              <Link href='/help' passHref>
                <Box sx={navLinkItemStyles}>
                  <Typography sx={navLinkTypographyStyles(theme, false)}>
                    Support
                  </Typography>
                </Box>
              </Link>
            </Box>
            <Button
              sx={{
                width: '148px',
                fontFamily: 'roboto',
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '20px',
                textAlign: 'center',
                justifyContent: 'center'
              }}
              variant='actionButton'
              onClick={() => signIn('google')}
            >
              Sign In
            </Button>
          </Box>
        )}
      </Box>

      {/* Small Screen - Hamburger Menu */}
      <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
        <HamburgerMenu aria-label='Open menu' />
      </Box>
    </Box>
  )
}

export default NavBar
