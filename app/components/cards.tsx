import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import Image from 'next/image'
import { QrCodeHome } from '../Assets/SVGs'
import VerifiedIcon from '@mui/icons-material/Verified'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
interface CardProps {
  title?: string
  description?: string
  criteria?: string[]
  duration?: string
  evidence?: string[]
  width?: string
  height?: string
  rotation?: string
  image?: string
  showPlayButton?: boolean
  showTimer?: boolean
  showDuration?: boolean
  showEvidence?: boolean
}

const Card = ({
  title = 'barista',
  description = 'I am able to demonstrate advanced skills in coffee preparation, customer service, and knowledge of coffee origins and brewing techniques.',
  criteria = [
    'Took 12 hours of barista classes',
    'Received positive customer surveys',
    'Received positive teacher feedback'
  ],
  duration = '2 Days',
  evidence = [
    'Video of the Perfect Pour',
    'Coffee Portfolio',
    'Training Campus Certification',
    'Scent training',
    'IMG_0624',
    'Tamping',
    'IMG_0640'
  ],
  width = '195px',
  height = '410px',
  rotation = 'rotate(0deg)',
  image = '/coffee.jpeg',
  showPlayButton = true,
  showTimer = true,
  showDuration = true,
  showEvidence = true
}: CardProps) => {
  return (
    <Box
      sx={{
        width,
        height,
        transform: rotation,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #2563EB',
        padding: '7.5px',
        position: 'relative',
        filter: 'drop-shadow(0px 0px 6px rgba(0, 0, 0, 0.3))'
      }}
    >
      <Box
        sx={{
          height: '100%',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '3px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '1.5px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '1.5px'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Image src='/Badge.svg' alt='Badge' height={24} width={20} />
          <Typography
            sx={{
              color: '#202E5B',
              // fontSize: '14px',
              // fontWeight: 600,
              flex: 1,
              ml: '5.5px',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontWeight: 700,
              // lineHeight: normal,
              letterSpacing: '0.12px',
              textTransform: 'capitalize'
            }}
          >
            {title}
          </Typography>
          <KeyboardDoubleArrowDownIcon sx={{ color: '#666', fontSize: '16px' }} />
        </Box>

        <Typography
          sx={{
            color: '#202E5B',
            fontFamily: 'Inter',
            fontSize: '9px',
            mb: 1,
            lineHeight: '12px'
          }}
        >
          {description}
        </Typography>

        <Box
          sx={{
            position: 'relative',
            height: '100px',
            borderRadius: '6px',
            overflow: 'hidden',
            mb: 1
          }}
        >
          <Box
            component='img'
            src={image}
            alt='Card media'
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />

          {showPlayButton && (
            <Box
              component='img'
              src='/play-circle.svg'
              alt='Play'
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '28px',
                height: '28px',
                filter: 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3))'
              }}
            />
          )}

          {showTimer && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                background: '#2563EB',
                borderRadius: '4px',
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <Typography
                sx={{
                  color: 'white',
                  fontSize: '10px',
                  lineHeight: 1
                }}
              >
                1:36
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography
            sx={{
              color: '#000E40',
              fontSize: '10px',
              fontFamily: 'Inter',
              fontWeight: 400,
              mb: 0.25
            }}
          >
            Earning criteria:
          </Typography>
          {criteria.map((item, index) => (
            <Typography
              key={`criteria-${index}`}
              sx={{
                color: '#000E40',
                fontSize: '9px',
                fontFamily: 'Inter',
                fontWeight: 400,
                pl: 1,
                lineHeight: 1.2
              }}
            >
              • {item}
            </Typography>
          ))}
        </Box>

        {showDuration && (
          <Box sx={{ mb: 1 }}>
            <Typography
              sx={{
                color: '#000E40',
                fontSize: '10px',
                fontFamily: 'Inter',
                fontWeight: 400,
                mb: 0.25
              }}
            >
              Duration:
            </Typography>
            <Typography
              sx={{
                color: '#000E40',
                fontSize: '9px',
                fontFamily: 'Inter',
                pl: 1
              }}
            >
              • {duration}
            </Typography>
          </Box>
        )}

        {showEvidence && (
          <Box>
            <Typography
              sx={{
                color: '#000E40',
                fontSize: '10px',
                fontWeight: 400,
                fontFamily: 'Inter',
                mb: 0.25
              }}
            >
              Supporting Evidence:
            </Typography>
            {evidence.map((item, index) => (
              <Typography
                key={`evidence-${index}`}
                sx={{
                  color: '#000E40',
                  fontSize: '9px',
                  fontFamily: 'Inter',
                  pl: 1,
                  lineHeight: 1.2
                }}
              >
                •{' '}
                <span
                  style={{
                    color: '#2563EB',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  {item}
                </span>
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}


export const HeroCard = () => {
  return (
    <Box
      sx={{
        width: '100%',
        mx: 'auto',
        maxWidth: {
          xs: '100%',
          md: '450px', // Default fallback for MD
        },
        '@media (min-width: 1097px)': { maxWidth: '450px' },
        '@media (min-width: 1440px)': { maxWidth: '630px' },
        '@media (min-width: 1920px)': { maxWidth: '680px' },
        backgroundColor: '#FFFFFF',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0px 25px 50px 0px rgba(0, 0, 0, 0.25)',
        padding: '24px 24px 0 24px',
        border: '1px 1px 0 1px solid #F2F4F7'
      }}
    >
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Chip
            label="Self-issued"
            size="small"
            sx={{
              backgroundColor: '#ECFDF5',
              color: '#027A48',
              fontWeight: 500,
              fontSize: '12px',
              height: '24px',
              mb: 1,
              borderRadius: '16px 16px 0 0',
              '& .MuiChip-label': { padding: '0 8px' }
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <VerifiedIcon sx={{ color: '#2563EB', fontSize: '20px' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '20px', fontFamily: 'Inter', color: '#101828' }}>
              Barista
            </Typography>
          </Box>
          <Typography sx={{ color: '#344054', fontSize: '14px', fontFamily: 'Inter', mt: 0.5 }}>
            Alice Parker
          </Typography>
          <Typography sx={{ color: '#475467', fontSize: '12px', fontFamily: 'Inter' }}>
            5 years of experience
          </Typography>
        </Box>
        <Box
          sx={{
            border: '1px solid #EAECF0',
            borderRadius: '8px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { width: '48px', height: '48px' }
          }}
        >
          <QrCodeHome />
        </Box>
      </Box>

      {/* Description */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#344054', mb: 0.5, fontFamily: 'Inter' }}>
          Skill Description
        </Typography>
        <Typography sx={{ fontSize: '12px', color: '#475467', lineHeight: '18px', fontFamily: 'Inter' }}>
          Demonstrated advanced skills in coffee preparation, customer service, and
          knowledge of coffee origins and brewing techniques.
        </Typography>
      </Box>

      {/* Image with Play Button */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '220px',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden'
        }}
      >
        <Box
          component="img"
          src="/coffee.jpeg"
          alt="Barista skills evidence"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '80%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <PlayArrowIcon sx={{ color: '#FFFFFF', fontSize: '24px' }} />
        </Box>

      </Box>
    </Box>
  )
}

export default Card