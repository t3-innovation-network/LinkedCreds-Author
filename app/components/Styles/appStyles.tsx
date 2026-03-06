import { styled, TextField, Theme as MuiTheme, Box, Card, Typography } from '@mui/material'
import Theme from '../../theme'
import { SxProps } from '@mui/material/styles'
import { Underline } from 'lucide-react'

export const CustomTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    position: 'relative',
    // paddingRight: '20px', // Removed to align scrollbar to the edge
    width: '100%',
    height: '275px',
    marginTop: '3px',
    '& textarea': {
      // Scrollbar styles handled globally in globals.css
    }
  },
  '& .MuiFormHelperText-root': {
    position: 'absolute',
    bottom: 8,
    right: 16,
    fontSize: '16px',
    fontFamily: 'Inter',
    borderRadius: '28px'
  }
})

export const requiredLabelStyles = {
  fontFamily: 'Inter',
  fontSize: '12px',
  lineHeight: '16px',
  color: '#6A7282'
}

export const formLabelStyles = {
  color: 't3BodyText',
  fontFamily: 'Inter',
  fontSize: '16px',
  fontWeight: 'bold',
  letterSpacing: '-0.31px',
  lineHeight: '24px',
  mb: '7px',
  '&.Mui-focused': {
    color: 't3Black'
  }
}

export const TextFieldStyles = {
  bgcolor: '#FFF',
  width: '100%',
  mt: '3px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px'
  }
}

export const inputPropsStyles = {
  color: 'black',
  fontSize: '16px',
  letterSpacing: '-0.31px',
  lineHeight: 'auto',
}

export const UseAIStyles = {
  color: 't3BodyText',
  fontFamily: 'Inter',
  fontSize: '13px',
  textDecorationLine: 'underline',
  lineHeight: '24px',
  letterSpacing: '0.065px',
  fontWeight: 400,
  '&.Mui-focused': {
    color: '#000'
  }
}

export const commonTypographyStyles = {
  color: 't3BodyText',
  fontSize: '15px',
  fontWeight: 400,
  fontStyle: 'normal'
}

export const commonBoxStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  justifyContent: 'center'
}

export const evidenceListStyles = {
  marginLeft: '25px',
  textDecorationLine: 'underline',
  color: 'blue',
  backGroundColor: '#FFFFFF'
}

export const credentialBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  padding: '2px 5px',
  borderRadius: '5px',
  width: 'fit-content',
  mb: '10px'
}

export const textFieldInputProps = {
  'aria-label': 'weight',
  style: {
    color: 't3Black',
    fontSize: '15px',
    letterSpacing: '0.075px'
  }
}

export const customTextFieldStyles = {
  width: '100%',
  marginBottom: '3px',
  textAlign: 'left'
}

export const addAnotherButtonStyles = (theme: MuiTheme) => ({
  textTransform: 'none',
  width: '100%',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& .MuiButton-endIcon': {
    marginRight: '0'
  },
  '&:hover': {
    backgroundColor: 'transparent',
    textDecoration: 'underline'
  }
})

export const addAnotherIconStyles = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: `1px solid #2563EB`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '& .MuiSvgIcon-root': {
    fontSize: '16px'
  }
}

export const addAnotherBoxStyles = {
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-start'
}

export const sectionDescriptionStyles = {
  fontSize: '18px',
  color: Theme.palette.t3TextSlate,
  fontFamily: 'Inter',
  lineHeight: 1.6
}

export const featureTitleStyles = {
  fontSize: '16px',
  color: Theme.palette.t3TextDark,
  fontFamily: 'Inter'
}

export const featureTextStyles = {
  fontSize: '14px',
  color: Theme.palette.t3TextSlate,
  fontFamily: 'Inter'
}

export const callToActionButtonStyles = {
  backgroundColor: '#FFFFFF',
  color: '#2563EB',
  textTransform: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: 'Inter',
  lineHeight: '20px',
  letterSpacing: '-0.15px',
  '&:hover': {
    backgroundColor: '#F9FAFB'
  }
}

export const previewContainerStyles = {
  width: '100%',
  maxWidth: '350px',
  padding: '24px',
  backgroundColor: '#fff',
  borderRadius: '16px',
  boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
  border: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

export const sectionLabelStyles = {
  fontFamily: 'Inter',
  fontSize: '13px',
  color: '#62748E',
  marginBottom: '4px',
  lineHeight: '16px'
}

export const sectionValueStyles = {
  fontFamily: 'Inter',
  fontSize: '14px',
  color: '#000E40',
  lineHeight: '20px',
  letterSpacing: '-0.15px'
}

export const placeholderTextStyles = {
  fontFamily: 'Inter',
  fontSize: '14px',
  fontStyle: 'italic',
  color: '#90A1B9',
  lineHeight: '20px',
  letterSpacing: '-0.15px'
}

export const previewHeaderStyles = {
  display: 'flex',
  flexDirection: 'column'
}

export const previewTitleStyles = {
  fontFamily: 'Inter',
  fontSize: '14px',
  fontWeight: 600,
  color: '#62748E'
}

export const previewSubtitleStyles = {
  fontFamily: 'Inter',
  fontSize: '14px',
  color: '#90A1B9'
}
export const actionButtonTitleStyles = {
  fontFamily: 'Lato',
  fontSize: '24px',
  letterSpacing: '0%',
  lineHeight: 'auto',
  color: '#202E5B'
}

// Action Button Styles (matching app/page.tsx patterns)
export const actionButtonStyles = {
  backgroundColor: '#FFFFFF',
  color: '#2563EB',
  border: '1px solid #2563EB',
  borderRadius: '10px',
  padding: '15px',
  textTransform: 'none' as const,
  textAlign: 'top',
  fontFamily: 'Inter',
  textDecoration: 'underline',
  fontSize: '16px',
  lineHeight: '16px',
  letterSpacing: '0.5%',
  justifyContent: 'flex-start',
  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
  '&:hover': {
    backgroundColor: '#F9FAFB',
    borderColor: '#2563EB'
  }
}


// Success Page Specific Styles
export const successPageContainerStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'flex-start',
  maxWidth: '1240px',
  width: '100%',
  gap: '10px'
}

export const successMessageBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  p: '30px',
  borderRadius: 'mixed',
  backgroundColor: '#FFF'
}

export const twoColumnLayoutStyles = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' } as const,
  gap: 3,
  maxWidth: '1240px',
  width: '100%',
  backgroundColor: '#88ABE4',
  p: '30px',
  borderRadius: 'mixed'
}

export const leftColumnStyles = {
  flex: 1,
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  p: { xs: 3, md: 4 },
  border: '1px solid #E2E8F0',
  boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)'
}

export const rightColumnStyles = {
  width: { xs: '100%', md: '400px' },
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 3
}

export const actionSectionStyles = {
  backgroundColor: '#FFF',
  borderRadius: '14px',
  gap: '10px',
  p: '25px'
}

export const sectionTitleStyles = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#1E3A8A',
  fontFamily: 'Inter',
  mb: 2
}

// Styled Components for Success Page
export const PreviewCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: '800px',
  backgroundColor: '#fff',
  overflow: 'hidden',
}))

export const CredentialContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
}))

export const StepIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  color: '#6B7280',
  marginBottom: '4px'
}))

export const StepDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active?: boolean }>(({ active, theme }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: active ? '#2563EB' : '#E5E7EB'
}))

export const BadgePill = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 12px',
  maxWidth: 'fit-content',
  backgroundColor: '#DCFCE7',
  color: '#016630',
  borderRadius: '16777200px',
  fontFamily: 'Inter',
  fontWeight: 'medium',
  fontSize: '12px',
  lineHeight: '16px',
  gap: '10px'
}))

export const CredentialTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: '30px',
  fontWeight: 'bold',
  lineHeight: '36px',
  color: '#000E40',
  letterSpacing: '0.4px',
}))

export const RecipientName = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: '20px',
  color: '#4A5565',
}))

export const ExperienceText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: '16px',
  color: '#6A7282',
  lineHeight: '24px',
  letterSpacing: '-0.31px',
}))

export const SectionHeader = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: '18px',
  fontWeight: 600,
  color: '#000E40',
  lineHeight: '28px',
  letterSpacing: '-0.44px',
}))

export const DescriptionText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter',
  fontSize: '16px',
  fontWeight: 'regular',
  lineHeight: '26px',
  color: '#364153',
  letterSpacing: '-0.31px',
}))

export const MediaContainer = styled(Box)(({ theme }) => ({
  width: '75%',
  margin: '0 auto',
  borderRadius: '10px',
  overflow: 'hidden',
  position: 'relative',
  aspectRatio: '16/9',
  backgroundColor: '#F3F4F6',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}))

export const Media = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasImage'
})<{ hasImage?: boolean }>(({ hasImage, theme }) => ({
  width: '100%',
  maxWidth: theme.breakpoints.down('sm') ? '600px' : '500px',
  aspectRatio: hasImage ? '16/9' : 'auto',
  position: 'relative',
  backgroundImage: 'none',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '16px',
  boxShadow: hasImage ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
}))

export const EmptySkillsState = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: '#f2f8ff',
  borderRadius: '12px',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginTop: '8px'
}))

export const publicLinkBoxStyles = {
  backgroundColor: '#BAD7FF50', // Light blue background with opacity
  borderRadius: '14px',
  p: '15px',
  border: '1px solid #BEDBFF',
  gap: '8px',
  display: 'flex',
  flexDirection: 'column'
}

export const publicLinkInputStyles = {
  bgcolor: 'white',
  height: '32px',
  borderRadius: '8px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#bfdbfe'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#60a5fa'
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2563EB'
  },
  input: {
    py: 1, // Reduced padding for compact height
    fontSize: '14px',
    color: '#0A0A0A',
    fontFamily: 'Inter',
    lineHeight: '20px',
    letterSpacing: '-0.15px'
  }
}

export const copyButtonStyles = {
  textTransform: 'none',
  bgcolor: '#155DFC',
  color: 'white',
  boxShadow: 'none',
  maxWidth: '85px',
  height: '32px',
  px: 3,
  fontSize: '14px',
  whiteSpace: 'nowrap',
  borderRadius: '8px',
  '&:hover': {
    bgcolor: '#2563EB',
    boxShadow: 'none'
  }
}

export const qrCodeBoxStyles = {
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  p: '10px',
  bgcolor: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '110px',
  height: '110px',
  boxSizing: 'border-box',
  flexShrink: 0
}

export const credentialCardStyles = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  border: '1px solid #E2E8F0',
  boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)'
}

