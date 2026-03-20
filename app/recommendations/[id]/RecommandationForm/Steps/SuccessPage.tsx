'use client'

import React, { useState } from 'react'
import { Box, Typography, Button, Snackbar, Alert, Divider } from '@mui/material'
import { SVGDescribeBadge } from '../../../../Assets/SVGs'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { FormData } from '../../../../credentialForm/form/types/Types'
import ComprehensiveClaimDetails from '../../../../view/[id]/ComprehensiveClaimDetails'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { StepTrackShape } from '../../../../credentialForm/form/fromTexts & stepTrack/StepTrackShape'
import {
  recSectionContainerStyles,
  SectionHeader,
  publicLinkBoxStyles,
  publicLinkInputStyles,
  copyButtonStyles,
  CredentialContent,
  infoBannerStyles,
  infoBannerTextStyles
} from '../../../../components/Styles/appStyles'

interface SuccessPageProps {
  formData: FormData //NOSONAR
  submittedFullName: string | null
  fullName: string
  email: string
  handleBack: () => void //NOSONAR
  recId: string | null
  credentialSubject: any
  skills: any[]
}

const SuccessPage: React.FC<SuccessPageProps> = ({
  submittedFullName,
  fullName,
  email,
  recId
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const [tooltipEmail, setTooltipEmail] = useState('Copy')
  const [tooltipSubject, setTooltipSubject] = useState('Copy')
  const [tooltipMessage, setTooltipMessage] = useState('Copy')

  const params = useParams()
  const id = params.id

  const homUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${homUrl}/rec?vcId=${id}&recId=${recId}`
  const subject = 'Recommendation Complete'
  const message = submittedFullName
    ? `Hi ${fullName},\n\nI've completed the recommendation you requested. You can view it by opening this URL:\n\n${link}\n\n- ${submittedFullName}`
    : 'Loading...'

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const copyToClipboard = async (
    text: string,
    type: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    try {
      await navigator.clipboard.writeText(text)
      setter('Copied')
      showNotification(`${type} copied to clipboard!`, 'success')
      setTimeout(() => setter('Copy'), 1500)
    } catch (err) {
      showNotification('Failed to copy text', 'error')
    }
  }

  return (
    <Box sx={recSectionContainerStyles}>
      {/* Centered Success Header */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center' }}>
        <SVGDescribeBadge width="60" height="60" />
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1E293B',
            fontFamily: 'Inter',
            lineHeight: 1.2,
            maxWidth: '700px'
          }}
        >
          You&apos;ve successfully completed a recommendation for {fullName}!
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            color: '#64748B',
            fontFamily: 'Inter'
          }}
        >
          Your recommendation has been submitted and is ready to share.
        </Typography>
      </Box>

      <CredentialContent
        sx={{
          alignItems: 'center',
          width: '100%',
          maxWidth: '872px'
        }}
      >
        {/* Recommendation URL Section */}
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SectionHeader>
            Recommendation URL
          </SectionHeader>
          <Typography
            sx={{
              fontSize: '15px',
              color: '#6A7282',
              fontFamily: 'Inter'
            }}
          >
            {fullName} can access her recommendation using this link:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: '12px',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <Box
              sx={{
                flex: 1,
                backgroundColor: '#F8FAFC',
                p: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <Typography sx={{ color: '#0F172A', fontSize: '14px', fontFamily: 'Inter' }}>
                {link}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => copyToClipboard(link, 'URL', setTooltipSubject)}
              sx={{
                textTransform: 'none',
                backgroundColor: '#2563EB',
                borderRadius: '8px',
                px: 3,
                py: 1.5,
                fontSize: '15px',
                fontWeight: 600,
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#1D4ED8'
                }
              }}
            >
              Copy URL
            </Button>
          </Box>
        </Box>

        {/* Persistence Note */}
        {/* <Box sx={{ ...infoBannerStyles, width: '100%', border: '1px solid #BFDBFE', mb: 0 }}>
          <Typography sx={{ ...infoBannerTextStyles, color: '#1E40AF', fontWeight: 500 }}>
            Note: This sharing link is only available once. Please copy or share it before closing this page.
          </Typography>
        </Box> */}

        {/* Email Message Section */}
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SectionHeader>
            Email Message
          </SectionHeader>
          <Typography
            sx={{
              fontSize: '15px',
              color: '#6A7282',
              fontFamily: 'Inter'
            }}
          >
            Copy and paste this message into your email, text message, Slack, or any other communication method to notify {fullName}.
          </Typography>

          <Box
            sx={{
              backgroundColor: '#F8FAFC',
              p: 3,
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              minHeight: '150px'
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Inter',
                color: '#334155',
                fontSize: '15px',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6
              }}
            >
              {message}
            </Typography>
          </Box>

          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={() => copyToClipboard(message, 'Message', setTooltipMessage)}
              sx={{
                textTransform: 'none',
                backgroundColor: '#2563EB',
                borderRadius: '8px',
                px: 4,
                py: 1.5,
                fontSize: '16px',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#1D4ED8'
                }
              }}
            >
              Copy Message
            </Button>
          </Box>
        </Box>

        <Divider sx={{ width: '100%', my: 0 }} />

        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            component={Link}
            href='/credentialForm'
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#2563EB',
              borderRadius: '8px',
              px: 4,
              py: 1.5,
              fontSize: '16px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#1D4ED8'
              }
            }}
          >
            Claim a Skill
          </Button>
        </Box>
      </CredentialContent>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SuccessPage
