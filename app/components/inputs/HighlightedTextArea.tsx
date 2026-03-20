import React, { useRef } from 'react'
import { Box, Typography, Theme } from '@mui/material'
import { SxProps } from '@mui/material/styles'

interface HighlightedTextAreaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  maxLength?: number
  name?: string
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  error?: boolean
  helperText?: string
  rows?: number
  keywords?: string[]
  sx?: SxProps<Theme>
  focusColor?: string // Add new prop
}

// Case-insensitive highlighted text generator
const getHighlightedText = (text: string, keywords: string[] = []) => {
  if (!text) return text
  if (!keywords || keywords.length === 0) {
    return <span>{text}</span>
  }

  const sortedSkills = [...keywords].sort((a, b) => b.length - a.length)
  const escapeRegExp = (string: string) => string.replace(/[,.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `(?<!\\w)(${sortedSkills.map(escapeRegExp).join('|')})(?!\\w)`,
    'gi'
  )

  const parts = text.split(pattern)

  return parts.map((part, index) => {
    // Check if this part strictly matches one of the active keywords (case-insensitive)
    const isMatch = sortedSkills.some(skill => skill.toLowerCase() === part.toLowerCase())

    if (isMatch) {
      return (
        <span
          key={index}
          style={{
            backgroundColor: '#F8E4A8',
            color: 'transparent',
            borderRadius: '1px'
          }}
        >
          {part}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export const HighlightedTextArea: React.FC<HighlightedTextAreaProps> = ({
  value = '',
  onChange,
  placeholder,
  maxLength,
  name,
  onBlur,
  error,
  helperText,
  rows = 10,
  keywords = [],
  sx,
  focusColor = '#1976d2' // Default blue
}) => {
  const backdropRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  // Exact matching styles for overlay alignment
  const textStyles: React.CSSProperties = {
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    fontSize: '16px',
    lineHeight: '1.4375em',
    padding: '10px 4px 10px 14px',
    letterSpacing: 'normal',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    overflow: 'auto',
    border: 'none',
    margin: 0
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '275px',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
          '&:hover': {
            borderColor: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.87)'
          },
          '&:focus-within': {
            borderColor: error ? '#d32f2f' : focusColor,
            borderWidth: '1px',
            boxShadow: theme => `0 0 0 1px ${error ? '#d32f2f' : focusColor}`
          },
          backgroundColor: '#fff',
          overflow: 'hidden'
        }}
      >
        <div
          ref={backdropRef}
          style={{
            ...textStyles,
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            color: 'transparent',
            zIndex: 1,
            pointerEvents: 'none',
            borderColor: 'transparent'
          }}
          aria-hidden='true'
        >
          {getHighlightedText(value, keywords)}
          {value.endsWith('\n') && <br />}
        </div>

        <textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onScroll={handleScroll}
          placeholder={placeholder}
          maxLength={maxLength}
          style={{
            ...textStyles,
            position: 'relative',
            zIndex: 2,
            backgroundColor: 'transparent',
            color: '#4e4e4e',
            outline: 'none',
            border: 'none'
          }}
        />
      </Box>
      {/* Helper Text */}
      {(error || helperText) && (
        <Typography
          variant='caption'
          sx={{
            color: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.6)',
            mx: '14px',
            mt: '3px',
            fontSize: '0.75rem'
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  )
}
