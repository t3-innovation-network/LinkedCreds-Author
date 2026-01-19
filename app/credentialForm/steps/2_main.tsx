'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  FormLabel,
  Autocomplete,
  TextField,
  Box,
  Typography,
  Tooltip,
} from '@mui/material'
import { UseFormRegister, FieldErrors, Controller } from 'react-hook-form'

import {
  inputPropsStyles,
  iconStyle,
  tooltipStyle,
  TextFieldStyles,
  formLabelStyles,
  CustomTextField,
  parenStyle,
  subheadStyle,
  dividerStyle,
} from '@/components/Styles/appStyles'
import { SVGInfoIcon } from '@/Assets/SVGs'

import { FormData } from '../types'
import { StepTrackShape } from './StepNav'

interface Step2Props {
  register: UseFormRegister<FormData>
  watch: (field: string) => any
  errors: FieldErrors<FormData>
  control: any
  setSkills: (s: string[]) => any
  removedSkills: string[]
}

// Example list of skills for auto-search
const skillsList = [
  'Leadership',
  'Customer Service',
  'Landscape Design',
  'Software Development'
]

export function Step2({ register, watch, control, errors, setSkills, removedSkills }: Readonly<Step2Props>) {
  const [wordCount, setWordCount] = useState(0)

  const skillsDict = {}
  var s:string = ''
  skillsEx.forEach(s => skillsDict[s.toLowerCase()] = true)

  function extractSkills(text: string) {
    var words = text.toLowerCase().split(' ')
    var newCount = words.length
    if(newCount == wordCount) return

    setWordCount(newCount)
    var skills = []
    words.forEach(s =>{
      if(skillsDict[s]) {
        if(removedSkills.includes(s)) return
        skills.push(s)
      }
    })
    setSkills(skills)
  }

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'left' }}
    >
      <Box sx={{ display: 'flex' }}>
        <Image style={iconStyle} src='/images/describe-icon.png' width={60} height={60}/>
        <Box>
          <Typography sx={{ fontSize: '24px', fontWeight: 400 }}>
            Document Your Skill
            &nbsp;
            <Tooltip title='AI detects and highlights skills as you type' arrow>
              <span><SVGInfoIcon size='1rem' /></span>
            </Tooltip>
          </Typography>
          <StepTrackShape />
        </Box>
      </Box>

      <Box sx={dividerStyle} />

      <FormLabel sx={formLabelStyles} id='name-label'>
        What skill do you want to claim?
        &nbsp; <span style={parenStyle}>(required)</span> &nbsp;
        <Tooltip title={
          <Box sx={{ textAlign: 'left' }}>
            <p style={{ margin: '8px 0' }}>A skill is an ability or expertise you've developed. Examples:</p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', listStyleType: 'disc' }}>
              <li>Technical: "JavaScript Programming"</li>
              <li>Trade: "Automotive Repair"</li>
              <li>Creative: "Graphic Design"</li>
              <li>Professional: "Project Management"</li>
              <li>Specific: "Oil Changes" or "CPR"</li>
            </ul>
            <p style={{ margin: '8px 0' }}>Enter a single skill you can demonstrate. Be specific – instead of "computers," try "Computer Repair" or "Excel Data Analysis."</p>
          </Box>
        } arrow>
          <span><SVGInfoIcon size='1rem' /></span>
        </Tooltip>
      </FormLabel>

      <Controller
        name='credentialName'
        control={control}
        rules={{ required: 'Skill name is required' }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Autocomplete
            freeSolo
            options={skillsList}
            value={value || ''}
            onChange={(event, newValue) => {
              onChange(newValue)
            }}
            onInputChange={(event, newInputValue) => {
              onChange(newInputValue)
            }}
            renderInput={params => (
              <TextField
                {...params}
                placeholder='Example: Caring for (cultivating) healthy plants'
                aria-labelledby='name-label'
                inputProps={{
                  ...params.inputProps,
                  'aria-label': 'skill-name',
                  style: inputPropsStyles
                }}
                error={!!error}
                helperText={error ? error.message : ''}
              />
            )}
          />
        )}
      /><br/>

      <FormLabel sx={formLabelStyles} id='duration-label'>
        Years of Experience:
        &nbsp; <span style={parenStyle}>(required)</span> &nbsp;
      </FormLabel>
      <TextField
        {...register('credentialDuration')}
        placeholder='Example: 3 years'
        sx={TextFieldStyles}
        aria-labelledby='duration-label'
        inputProps={{
          'aria-label': 'weight',
          style: inputPropsStyles
        }}
        error={!!errors.credentialDuration}
        helperText={errors.credentialDuration?.message}
      /><br/>

      <FormLabel sx={formLabelStyles} id='description-label'>
        Skill description:
        &nbsp; <span style={parenStyle}>(required)</span> &nbsp;<br/>
        <span style={subheadStyle}>Tip: For best results, mention skills, tools, and technologies.</span>
      </FormLabel>
      <CustomTextField
        {...register('credentialDescription', {
          required: 'Credential Description is required'
        })}
        sx={TextFieldStyles}
        multiline
        rows={11}
        variant='outlined'
        placeholder={
          'Example:\nWatering and feeding on a routine schedule, diagnosing plant sickness, over/under watering, removing dead leaves, and cultivating rich soil.'
        }
        FormHelperTextProps={{
          className: 'MuiFormHelperText-root'
        }}
        error={!!errors.credentialDescription}
        helperText={errors.credentialDescription?.message}
        onChange={e => extractSkills(e.target.value)}
      /><br/>

      <FormLabel sx={formLabelStyles} id='description-label'>
        Describe how you earned this skill:
        &nbsp; <span style={parenStyle}>(required)</span> &nbsp;<br/>
      </FormLabel>
      <CustomTextField
        {...register('description', {
          required: 'Description is required'
        })}
        multiline
        rows={4}
        variant='outlined'
        placeholder={
          'Example:\nI have been a weekly volunteer at the Beloved NC garden for the past 3 years in addition to caring for my own personal garden.'
        }
        FormHelperTextProps={{
          className: 'MuiFormHelperText-root'
        }}
        error={!!errors.description}
        helperText={errors.description?.message}
      />
    </Box>
  )
}

const skillsEx: string[] = ['Python', 'CSS', 'React', 'TypeScript', 'UX', 'Scrum', 'Git', 'GCS', 'Next.js']
