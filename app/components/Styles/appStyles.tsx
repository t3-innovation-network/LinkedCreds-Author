import { styled, TextField, Theme } from '@mui/material'
import { SxProps } from '@mui/material/styles'

const spacing = '1rem'

export const iconStyle = {
  marginRight: '.7em',
}

export const cardStyle = {
  borderRadius: '15px',
  padding: '32px',
  backgroundColor: '#fff',
}
export const cardStyleSm = {
  borderRadius: '15px',
  backgroundColor: '#fff',
  padding: '24px',
}

export const infoBoxStyle = {
  marginBottom: '1.5rem',
  borderRadius: '10px',
  border: '1px solid #bedbff',
  backgroundColor: 'oklch(.97 .014 254.604)',
  padding: spacing,
  display: 'flex',
  gap: '.75rem',
  '& .icon': { flexShrink: 0 },
}

export const dividerStyle = {
  height: '2rem',
  marginTop: '2rem',
  border: '1px solid #e2e8f0',
  borderWidth: '1px 0 0 0',
}

export const CustomTextField = styled(TextField)({
  '& .MuiInputBase-root': { position: 'relative' },
  '& .MuiFormHelperText-root': {
    position: 'absolute',
    bottom: 8,
    right: 16,
    fontSize: '0.75rem',
  }
})

export const formLabelStyles = {
  color: 'black',
  '& *': { verticalAlign: 'middle' },
}

export const parenStyle = {
  color: '#a1a1a1',
  fontSize: '.75rem',
}

export const subheadStyle = {
  color: '#6a7282',
  fontSize: '.875rem',
}

export const smallButtonStyle = {
  fontSize: 'small',
  height:'1.2ex',
  marginRight: '1ex',
  padding: '10px',
}

export const TextFieldStyles = {
}

export const tooltipStyle = { '& .MuiTooltip-tooltip': {
  backgroundColor: 'black',
  color: 'white',
} }

export const inputPropsStyles = {
  color: 'black',
  fontSize: '15px',
  fontStyle: 'italic',
  letterSpacing: '0.075px'
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
    fontStyle: 'italic',
    letterSpacing: '0.075px'
  }
}

export const addAnotherButtonStyles = (theme: Theme) => ({
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
