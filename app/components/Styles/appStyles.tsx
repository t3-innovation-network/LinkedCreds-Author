import React from 'react'
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
  fontSize: '13px',
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
  maxWidth: '384px',
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

export const featuredImageBadgeStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 6px',
  gap: '4px',
  bgcolor: '#2563EB',
  color: '#FFFFFF',
  borderRadius: '4px',
  fontSize: '12px',
  fontFamily: 'Inter',
  letterSpacing: '-0.5px',
  lineHeight: '16px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  border: '1px solid #2563EB'
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
  fontFamily: 'Inter',
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

export const recommendationDividerStyles = {
  borderColor: '#B9F8CF',
  mr: '20px'
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
  maxWidth: '872px',
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

// Shared base for all badge pill variants
const baseBadgePillStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  maxWidth: 'fit-content',
  borderRadius: '8px',
  fontFamily: 'Inter',
  fontWeight: 'medium',
  fontSize: '13px',
  lineHeight: '16px',
  gap: '8px',

}

export const BadgePill = styled(Box)(() => ({
  ...baseBadgePillStyles,
  padding: '3px 12px',
  backgroundColor: '#DCFCE7',
  color: '#016630',
  borderRadius: '16777200px',
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
  fontWeight: 'regular',
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
  width: '100%',
  maxWidth: '700px',
  minHeight: '400px',
  margin: '0 auto',
  borderRadius: '10px',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: '#FFFFFF',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '10px',
  border: '1px solid #E2E8F0'
}))

export const Media = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasImage'
})<{ hasImage?: boolean }>(({ hasImage, theme }) => ({
  width: '100%',
  maxHeight: '450px',
  position: 'relative',
  backgroundImage: 'none',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  boxShadow: hasImage ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none'
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

// =============================================
// Recommendation Sidebar Styles
// =============================================

export const sidebarContainerStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '20px'
}

// Credential Preview Card
export const sidebarCredentialCardStyles = {
  ...credentialCardStyles,
  p: '20px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '16px'
}

export const sidebarHeaderStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}


// Blue pill (skills in sidebar credential preview)
export const SkillBadgePill = styled(Box)(() => ({
  ...baseBadgePillStyles,
  backgroundColor: '#2563EB',
  color: '#FFFFFF',
}))

// Green solid pill (recommendation preview skills)
export const RecommendationBadgePill = styled(Box)(() => ({
  ...baseBadgePillStyles,
  backgroundColor: '#00A63E',
  color: '#FFFFFF',
}))
export const sidebarChipsContainerStyles = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '6px',
  mt: '6px'
}

// Recommendation Preview Card
export const sidebarRecommendationCardStyles = {
  ...credentialCardStyles,
  p: '20px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
  borderColor: '#B9F8CF',
  backgroundColor: '#F0FDF4'
}

// =============================================
// Credential Preview Styles
// =============================================

export const recommendationListCardStyles = {
  border: '1px solid #EAECF0',
  borderRadius: '12px',
  mb: 2,
  bgcolor: '#FFFFFF',
  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
  overflow: 'hidden',
  transition: 'all 0.2s',
  '&:hover': {
    borderColor: '#003FE0',
    boxShadow: '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)'
  }
}

export const recommendationDetailLabelStyles = {
  color: '#344054',
  fontWeight: 600,
  mb: 0.5
}

export const recommendationDetailValueStyles = {
  color: '#475467'
}

export const recommendationSkillChipStyles = {
  backgroundColor: '#EFF8FF',
  color: '#175CD3',
  border: '1px solid #B2DDFF',
  py: 0.75,
  borderRadius: '8px',
  fontSize: '12px'
}

export const verificationBadgeBoxStyles = {
  mx: 3,
  mb: 2,
  p: 2,
  bgcolor: '#F6FEF9',
  border: '1px solid #D1FADF',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: 1.5
}

export const verificationBadgeTextStyles = {
  color: '#000E40',
  fontSize: '14px',
}

export const askRecommendationButtonStyles = {
  backgroundColor: '#003FE0',
  textTransform: 'none',
  borderRadius: '100px',
  width: { xs: 'fit-content', sm: '300px', md: '300px' }
}

export const minimizedCredentialCardStyles = {
  width: '100%',
  backgroundColor: '#fff',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

export const minimizedCredentialTitleStyles = {
  fontFamily: 'Inter',
  fontSize: '24px',
  fontWeight: 800,
  lineHeight: '32px',
  color: '#000E40'
}

export const previewDividerStyles = {
  borderColor: '#E2E8F0'
}

export const descriptionClampStyles = {
  ...sectionValueStyles,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}

export const viewMoreButtonStyles = {
  textTransform: 'none' as const,
  fontSize: '13px',
  padding: '4px 0',
  minWidth: 'auto',
  marginTop: '4px',
  color: '#2563EB',
  '&:hover': {
    backgroundColor: 'transparent',
    textDecoration: 'underline'
  }
}

export const previewMediaContainerStyles = {
  width: '100%',
  height: '160px',
  borderRadius: '12px',
  backgroundColor: '#FFFFFF',
  border: '1px dashed #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  position: 'relative' as const
}

export const carouselNavButtonStyles = {
  position: 'absolute' as const,
  top: '50%',
  transform: 'translateY(-50%)',
  minWidth: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  zIndex: 10,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  }
}

export const carouselCounterStyles = {
  position: 'absolute' as const,
  bottom: '8px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: '#ffffff',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
  zIndex: 10
}

export const skillRemoveButtonStyles = {
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: '16px',
  '&:hover': {
    opacity: 0.9
  }
}

export const manualSkillInputStyles: React.CSSProperties = {
  flex: 1,
  background: '#fff',
  color: '#000000ff',
  padding: '12px 16px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'Inter',
  outline: 'none'
}

export const addSkillButtonStyles = {
  width: '48px',
  height: '48px',
  background: '#2563EB',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '24px',
  color: '#ffffff',
  transition: 'all 0.2s',
  '&:hover': {
    background: '#1d4ed8'
  }
}

export const removedSkillPillStyles = {
  background: '#fefefeff',
  color: '#666666',
  px: 2,
  py: 0.75,
  borderRadius: '8px',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  cursor: 'pointer',
  border: '1px dashed #cccccc',
  transition: 'all 0.2s',
  textDecoration: 'line-through',
  '&:hover': {
    background: '#e0e0e0',
    borderColor: '#999999',
    color: '#333333'
  }
}

// =============================================
// Step2 Form Styles
// =============================================

export const pageTitleStyles = {
  fontFamily: 'Inter',
  fontSize: '28px',
  fontWeight: 700,
  color: '#000e40',
  lineHeight: '1.2'
}

export const formLabelRowStyles = {
  display: 'flex',
  alignItems: 'center',
}

export const tooltipIconStyles = {
  color: '#3B82F6',
  fontSize: '20px',
  cursor: 'pointer'
}

export const tipTextStyles = {
  fontFamily: 'Inter',
  fontSize: '14px',
  color: '#6B7280',
}

export const focusedTextFieldStyles = {
  ...TextFieldStyles,
  '& .MuiOutlinedInput-root': {
    ...TextFieldStyles['& .MuiOutlinedInput-root'],
    '&.Mui-focused fieldset': {
      borderColor: '#2DD4BF'
    }
  }
}

export const infoBannerStyles = {
  backgroundColor: '#EFF6FF',
  borderRadius: '8px',
  padding: '16px',
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  mb: '24px'
}

export const infoBannerTextStyles = {
  fontFamily: 'Inter',
  fontSize: '14px',
  color: '#1F2937'
}

export const sectionHeadingStyles = {
  fontFamily: 'Inter',
  fontSize: '16px',
  fontWeight: 700,
  color: '#000e40',
}

export const linkInputFieldStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    height: '48px',
    '& fieldset': { borderColor: '#E5E7EB' },
    '&:hover fieldset': { borderColor: '#9CA3AF' },
    '&.Mui-focused fieldset': { borderColor: '#2563EB' },
  },
  '& .MuiInputBase-input': {
    color: '#1F2937',
    fontFamily: 'Inter',
    paddingLeft: '12px'
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#9CA3AF',
    opacity: 1
  }
}

export const addLinkButtonBaseStyles = {
  minWidth: '80px',
  height: '48px',
  textTransform: 'none' as const,
  fontWeight: 600,
  fontFamily: 'Inter',
  borderRadius: '8px',
  borderColor: '#E5E7EB',
  color: '#374151',
  backgroundColor: '#F3F4F6'
}

export const addLinkButtonActiveStyles = {
  color: '#FFFFFF',
  borderColor: '#2563EB',
  backgroundColor: '#2563EB',
  '&:hover': {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8'
  }
}

export const addLinkButtonDisabledStyles = {
  color: '#9CA3AF',
  borderColor: '#F3F4F6',
  backgroundColor: '#FFFFFF'
}

export const savedLinkRowStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '0px 16px',
  backgroundColor: '#F3F4F6',
  borderRadius: '8px',
  width: '100%',
  height: '48px',
  border: '1px solid #E5E7EB'
}

export const savedLinkTextStyles = {
  flex: 1,
  fontFamily: 'Inter',
  fontSize: '14px',
  color: '#2563EB',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center'
}

export const linkDeleteButtonStyles = {
  color: '#6B7280',
  padding: '4px',
  '&:hover': {
    color: '#EF4444',
    backgroundColor: '#F3F4F6'
  }
}

export const uploadClickTextStyles = {
  color: '#3B82F6',
  fontWeight: 600,
  fontFamily: 'Inter',
  fontSize: '16px'
}

export const uploadDragTextStyles = {
  color: '#4B5563',
  fontFamily: 'Inter',
  fontSize: '16px'
}

export const uploadHintTextStyles = {
  color: '#6B7280',
  fontFamily: 'Inter',
  fontSize: '12px'
}

export const evidenceLinkContainerStyles = {
  backgroundColor: '#EFF6FF',
  p: '16px',
  borderRadius: '14px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px'
}


// =============================================
// Recommendation Form Container Styles
// =============================================

export const recFormOuterContainerStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '30px',
  bgcolor: '#f0f4f8',
  borderRadius: 2
}

export const recFormCardStyles = {
  width: '100%',
  bgcolor: 'white',
  p: '20px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '30px',
  borderRadius: 2
}

export const recSkillSectionStyles = {
  width: '100%',
  bgcolor: 'white',
  display: 'flex',
  flexDirection: 'column' as const
}

export const recSkillChipsContainerStyles = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '8px',
  mt: '10px',
  backgroundColor: '#F8FAFC',
  borderRadius: '10px',
  p: '12px',
  border: '1px solid #E2E8F0'
}

export const unselectedSkillPillStyles = {
  backgroundColor: '#F8FAFC',
  color: '#0A0A0A',
  border: '1px solid #E2E8F0'
}

// =============================================
// Evidence Section Redesign Styles
// =============================================

export const evidenceTipBoxStyles = {
  backgroundColor: '#CFF0FF',
  borderRadius: '8px',
  padding: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: 'auto'
}

export const evidenceTipBoxTextStyles = {
  fontFamily: 'Lato',
  fontSize: '16px',
  fontWeight: 'medium',
  color: '#1F2937',
  lineHeight: '1.2',
  letterSpacing: '0.5%',
}

export const CardStyle = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isDragActive'
})<{ isDragActive?: boolean }>(
  ({ isDragActive = false }) => ({
    padding: '40px 20px',
    cursor: 'default',
    width: '100%',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: '12px',
    gap: 2,
    border: isDragActive ? '2px dashed #2563EB' : '1px solid #D1D5DB',
    backgroundColor: isDragActive ? '#f0f9ff' : '#FFFFFF',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#9CA3AF'
    }
  })
)

export const StyledTipBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '24px',
  width: '100%',
  maxWidth: '872px',
  gap: '1rem',
  marginTop: theme.spacing(2),
  backgroundColor: '#DDF4FF',
  padding: '0.6rem 1rem',
  borderRadius: '1rem'
}))

export const recGrayTextFieldStyles = {
  bgcolor: '#FFFFFF', // Reverted to white per user request
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px', // Keep the premium rounded corners
    '& fieldset': {
      borderColor: '#E2E8F0',
    },
    '&:hover fieldset': {
      borderColor: '#CBD5E1',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2563EB',
    },
  },
}

export const primaryButtonStyles = {
  backgroundColor: '#155DFC',
  color: '#FFFFFF',
  borderRadius: '8px',
  px: 3,
  py: 1.5,
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 'Medium',
  fontFamily: 'Inter',
  lineHeight: '20px',
  letterSpacing: '-0.15px',
  '&:hover': {
    backgroundColor: '#1D4ED8'
  },
  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
}

export const secondaryButtonStyles = {
  backgroundColor: '#FFFFFF',
  color: '#OAOAOA',
  border: '1px solid #D1D5DC',
  borderRadius: '8px',
  px: 3,
  py: 1.5,
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 'Medium',
  fontFamily: 'Inter',
  letterSpacing: '-0.15px',
  lineHeight: '20px',
  '&:hover': {
    backgroundColor: '#DBEAFE',
    borderColor: '#1D4ED8'
  },
  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
}

export const estimatedTimeBannerStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#FFF530',
  padding: '15px',
  borderRadius: '10px',
  '& .MuiTypography-root': {
    fontSize: '16px',
    color: 't3BodyText',
    fontFamily: 'Inter'
  }
}

export const recSectionContainerStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '32px',
  width: '100%',
  alignItems: 'center'
}

// =============================================
// Navigation & Hamburger Menu Styles
// =============================================

export const navBarContainerStyles = {
  width: '100%',
  height: { xs: '27px', md: '100px' },
  display: 'flex',
  position: 'sticky',
  top: 0,
  alignItems: 'center',
  backgroundColor: 'white',
  justifyContent: 'space-between',
  my: { xs: '18px', md: '0px' },
  zIndex: 100,
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)'
}

export const navLogoContainerStyles = {
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  pl: { xs: '15px', md: '9.6vw' }
}

export const navLogoTypographyStyles = (theme: any) => ({
  fontWeight: '700',
  fontSize: { xs: '18px', md: '24px' },
  color: theme.palette.t3DarkSlateBlue,
  fontFamily: 'inter'
})

export const navLinksContainerStyles = {
  display: { xs: 'none', md: 'flex' },
  alignItems: 'center',
  justifyContent: 'flex-end',
  mr: { xs: '15px', md: '8vw' },
  gap: '3vw',
  textWrap: 'nowrap'
}

export const navLinkItemStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}

export const navLinkTypographyStyles = (theme: any, active: boolean) => ({
  fontSize: '16px',
  fontWeight: active ? '600' : '400',
  color: active ? '#2563EB' : theme.palette.t3DarkSlateBlue,
  cursor: 'pointer',
  fontFamily: 'Lato, sans-serif'
})

export const navActiveIndicatorStyles = {
  height: '2px',
  width: '100%',
  mt: '5px',
  backgroundColor: '#2563EB'
}

export const userProfileContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 8px 4px 4px',
  borderRadius: '100px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
}

export const userAvatarStyles = {
  width: 36,
  height: 36,
  bgcolor: '#DBEAFE',
  color: '#1E40AF',
  fontSize: '16px',
  fontWeight: 600,
  border: 'none',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
}

export const userNameTypographyStyles = {
  fontSize: '15px',
  fontWeight: 500,
  color: '#1E293B',
  fontFamily: 'Inter',
  ml: 0.5
}

export const userMenuMoreIconStyles = {
  color: '#64748B',
  ml: 0.5,
  fontSize: '20px',
  borderRadius: '8px',
}

export const logoutMenuItemStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    '& .logout-icon': {
      color: '#EF4444'
    }
  }
}

export const logoutIconStyles = {
  fontSize: '18px',
  color: '#64748B',
  transition: 'color 0.2s'
}

// Hamburger Menu Styles
export const hamburgerIconButtonStyles = {
  padding: '0px',
  mr: '15px'
}

export const hamburgerDrawerBoxStyles = {
  width: '300px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start'
}

export const hamburgerHeaderBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  height: '63px',
  paddingBottom: '15px',
  gap: '10px',
  alignSelf: 'stretch'
}

export const hamburgerLogoBoxStyles = {
  display: 'flex',
  alignItems: 'center'
}

export const hamburgerLogoTypographyStyles = {
  ml: '8px',
  fontWeight: 700,
  fontSize: '18px',
  color: '#000'
}

export const hamburgerDividerStyles = {
  width: 'calc(100% + 40px)',
  height: '1px',
  backgroundColor: '#9CA3AF',
  margin: '0 -20px',
  alignSelf: 'center'
}

export const hamburgerContentContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '22px',
  alignSelf: 'stretch',
  pt: '22px'
}

export const hamburgerNavLinkBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  justifyContent: 'space-between'
}

export const hamburgerNavLinkInnerBoxStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flex: 1
}

export const hamburgerNavLinkTypographyStyles = (active: boolean) => ({
  fontSize: '16px',
  fontWeight: active ? '600' : '400',
  color: active ? '#2563EB' : 'inherit',
  cursor: 'pointer',
  display: 'inline-block',
  position: 'relative',
  height: '22px',
  fontFamily: 'Lato, sans-serif'
})

export const hamburgerNavLinkActiveIndicatorStyles = {
  height: '2px',
  width: '100%',
  position: 'absolute',
  bottom: 0,
  left: 0,
  backgroundColor: '#2563EB'
}

export const hamburgerLoginDescriptionStyles = {
  fontWeight: 400,
  fontSize: '16px'
}

export const hamburgerFeatureTitleStyles = {
  fontSize: '13px',
  fontWeight: 400
}

export const hamburgerFeatureBoxStyles = {
  display: 'flex',
  alignItems: 'center'
}

export const hamburgerFeatureTypographyStyles = {
  ml: 1,
  fontSize: '13px',
  fontFamily: 'Inter'
}

export const hamburgerLoginButtonStyles = {
  width: '91.53%',
  borderRadius: '100px',
  height: '40px',
  textTransform: 'capitalize' as const,
  backgroundColor: '#003FE0',
  color: '#FFF',
  mb: '30px',
  '&:hover': {
    backgroundColor: '#003FE0'
  }
}

export const hamburgerAboutSupportContainerStyles = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '22px'
}

export const hamburgerAboutSupportLinkBoxStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  height: '22px',
  mt: '22px'
}

export const hamburgerSupportLinkBoxStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  pb: '6px'
}

export const hamburgerAboutSupportTypographyStyles = {
  fontWeight: 400,
  fontSize: '16px',
  height: '22px',
  fontFamily: 'Lato, sans-serif'
}

export const hamburgerLogoutButtonStyles = {
  width: '100%',
  borderRadius: '100px',
  textTransform: 'capitalize' as const,
  backgroundColor: '#003FE0',
  color: '#FFF',
  mt: 2,
  '&:hover': {
    backgroundColor: '#003FE0'
  }
}

export const recThumbnailContainerStyles = {
  width: '60px',
  height: '60px',
  borderRadius: '6px',
  overflow: 'hidden',
  cursor: 'pointer',
  border: '1px solid #E2E8F0',
  '&:hover': { transform: 'scale(1.05)', transition: 'transform 0.2s' }
}

export const recThumbnailImageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const
}

export const recEvidenceLinkRowStyles = {
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#2563EB',
  '&:hover': {
    textDecoration: 'underline'
  }
}

export const recEvidenceLinkTextStyles = {
  fontFamily: 'Inter',
  fontSize: '13px',
  fontWeight: 500,
  color: 'inherit'
}
