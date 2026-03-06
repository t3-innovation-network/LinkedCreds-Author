'use client'

import React, { useState, useEffect } from 'react'
import { Typography, Box, useMediaQuery, Theme, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Credential from './viewCredential/Credential'
import { useStepContext } from '../../credentialForm/form/StepContext'
import useGoogleDrive from '../../hooks/useGoogleDrive'
import { useParams, useSearchParams } from 'next/navigation'
import Form from './RecommandationForm/Form'
import ComprehensiveClaimDetails from '../../view/[id]/ComprehensiveClaimDetails'
import { getFileViaFirebase } from '../../firebase/storage'
import { SelectedSkill } from '../../credentialForm/form/types/Types'

const CredentialData = () => {
  const { activeStep, setActiveStep } = useStepContext()
  const theme = useTheme<Theme>()
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('sm'))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [credentialSubject, setCredentialSubject] = useState<any>(null)
  const [skills, setSkills] = useState<SelectedSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSigned, setIsSigned] = useState(false)
  const { getContent, fetchFileMetadata, ownerEmail } = useGoogleDrive()
  const params = useParams()
  const idArray = Array.isArray(params?.id) ? params.id[0] : undefined
  const id = typeof params?.id === 'string' ? params.id : idArray
  const searchParams = useSearchParams()

  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam === '1') {
      setActiveStep(1)
    } else if (!stepParam) {
      // If no step param, start fresh unless specific logic dictates otherwise
      // This prevents 'Success Page' from persisting
      setActiveStep(0)
    }
  }, [searchParams, setActiveStep])

  const { storage } = useGoogleDrive()
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setErrorMessage('Error: Missing credential data.')
        setLoading(false)
        return
      }

      try {
        let vcData = await getFileViaFirebase(id)
        vcData = JSON.parse(vcData.body)

        const credentialSubject = vcData?.credentialSubject
        setCredentialSubject(credentialSubject)

        const personName = credentialSubject?.person?.name || credentialSubject?.name
        if (personName) {
          setFullName(personName)
        } else {
          setFullName('the credential holder')
        }

        const metadataResult = await fetchFileMetadata(id)
        if (metadataResult && !metadataResult.success) {
          console.warn('Could not fetch file metadata:', metadataResult.error)
          // Don't fail completely, just use default email
          setEmail('user@example.com')
        } else if (ownerEmail) {
          setEmail(ownerEmail)
        } else {
          setEmail('user@example.com')
        }

        // Support both new ISkillClaimCredential (credentialSubject.skill[]) and old OBv3 (achievement.alignment[])
        const achievement = credentialSubject?.achievement?.[0]
        let alignedSkills: SelectedSkill[] = []

        if (Array.isArray(credentialSubject?.skill) && credentialSubject.skill.length > 0) {
          // New format
          alignedSkills = credentialSubject.skill.map((skill: any, index: number) => ({
            id: skill.id || `temp-${index}-${Date.now()}`,
            name: skill.name,
            description: skill.description,
            source: skill.source,
            frameworkMatch: skill.frameworkMatch || []
          }))
        } else if (achievement?.alignment?.length) {
          // Old OBv3 format
          alignedSkills = achievement.alignment.map((align: any, index: number) => ({
            targetName: align.targetName,
            soc: Array.isArray(align.soc) ? align.soc : (align.soc ? [align.soc] : []),
            uuid: align.uuid || `temp-${index}-${Date.now()}`,
            score: align.score || 1.0
          }))
        }

        setSkills([...alignedSkills])


        if (
          (vcData?.proof || (vcData?.issuanceDate && vcData?.issuer)) &&
          vcData?.credentialSubject?.recommendationText
        ) {
          setIsSigned(true)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        setErrorMessage('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, getContent, fetchFileMetadata, ownerEmail, storage])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (errorMessage) {
    return (
      <Box sx={{ padding: '20px', textAlign: 'center' }}>
        <Typography variant='h6' color='error'>
          {errorMessage}
        </Typography>
      </Box>
    )
  }

  if (isSigned) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 5,
          px: 2
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '720px' }}>
          <ComprehensiveClaimDetails fileID={id} />
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isLargeScreen ? 'row' : 'column',
        justifyContent: 'center',
        overflow: 'auto',
        mx: 10,
        mt: 5,
        alignItems: 'flex-start',
        gap: '30px',
        px: '20px'
      }}
    >
      <Box
        sx={{
          flex: isLargeScreen ? '1 1 0' : 'none',
          width: isLargeScreen ? '0' : '100%',
          maxWidth: isLargeScreen ? '720px' : '100%',
          mt: '20px'
        }}
      >
        {activeStep === 0 && (
          <Credential
            setactivStep={setActiveStep}
            fullName={fullName}
            email={email}
            credentialSubject={credentialSubject}
          />
        )}
        {activeStep !== 0 && <Form fullName={fullName} email={email} skills={skills} />}
      </Box>

      {activeStep > 1 && activeStep < 3 && isLargeScreen && (
        <Box
          sx={{
            flex: '1 1 0',
            width: '0',
            maxWidth: '720px',
            position: 'sticky',
          }}
        >
          <ComprehensiveClaimDetails fileID={id} />
        </Box>
      )}

      {activeStep > 1 && activeStep < 3 && !isLargeScreen && (
        <Box
          sx={{
            width: '100%',
            mt: '20px'
          }}
        >
          <ComprehensiveClaimDetails fileID={id} />
        </Box>
      )}
    </Box>
  )
}

export default CredentialData
