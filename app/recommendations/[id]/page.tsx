'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Typography, Box, useMediaQuery, Theme, CircularProgress, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useSession, signIn } from 'next-auth/react'
import Credential from './viewCredential/Credential'
import { useStepContext } from '../../credentialForm/form/StepContext'
import useGoogleDrive from '../../hooks/useGoogleDrive'
import { useParams, useSearchParams, usePathname } from 'next/navigation'
import Form from './RecommandationForm/Form'
import ComprehensiveClaimDetails from '../../view/[id]/ComprehensiveClaimDetails'
import RecommenderPreview from './RecommandationForm/Steps/RecommenderPreview'
import { getFileViaFirebase } from '../../firebase/storage'
import { SelectedSkill } from '../../credentialForm/form/types/Types'

const CredentialData = () => {
  const { activeStep, setActiveStep } = useStepContext()
  const theme = useTheme<Theme>()
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('sm'))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [credentialSubject, setCredentialSubject] = useState<any>(null)
  const [credentialEvidence, setCredentialEvidence] = useState<any[]>([])
  const [skills, setSkills] = useState<SelectedSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSigned, setIsSigned] = useState(false)
  const [sidebarData, setSidebarData] = useState({
    recommenderName: '',
    selectedSkills: [] as SelectedSkill[],
    recommendationText: '',
    howKnow: '',
    qualifications: '',
    evidence: [] as any[],
    selectedFiles: [] as any[]
  })
  const { getContent, fetchFileMetadata, ownerEmail } = useGoogleDrive()
  const params = useParams()
  const idArray = Array.isArray(params?.id) ? params.id[0] : undefined
  const id = typeof params?.id === 'string' ? params.id : idArray
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const { data: session, status } = useSession()

  const initialStepRef = useRef(false)
  useEffect(() => {
    // Don't make any step decisions while session is still loading
    if (status === 'loading' || initialStepRef.current) return

    const stepParam = searchParams.get('step')

    if (stepParam === '1') {
      if (session?.accessToken) {
        setActiveStep(2)
      } else {
        setActiveStep(1)
      }
      initialStepRef.current = true
    } else {
      setActiveStep(0)
      initialStepRef.current = true
    }
  }, [searchParams, setActiveStep, session, status])

  const { storage } = useGoogleDrive()
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setErrorMessage('Error: Missing credential data.')
        setLoading(false)
        return
      }

      try {
        let vcData = await getFileViaFirebase(id, session?.accessToken as string)
        if (!vcData) {
          throw new Error('No data found for this credential.')
        }

        if (typeof vcData === 'string') {
          vcData = JSON.parse(vcData)
        }

        if (vcData.body && typeof vcData.body === 'string') {
          vcData = JSON.parse(vcData.body)
        }

        const credentialSubject = vcData?.credentialSubject
        setCredentialSubject(credentialSubject)
        const topLevelEvidence = vcData?.evidence || []
        console.log('VC Top-level Evidence:', topLevelEvidence)
        setCredentialEvidence(topLevelEvidence)

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

  if ((session as any)?.error === 'RefreshAccessTokenError') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
          px: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant='h6' color='error'>
          Your Google Drive session has expired.
        </Typography>
        <Typography variant='body1'>
          To provide or view recommendations, please sign in again to refresh your permissions.
        </Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={() => signIn('google')}
          sx={{ borderRadius: '100px', textTransform: 'none', px: 4 }}
        >
          Sign In with Google
        </Button>
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
        <Box sx={{ width: '100%', maxWidth: '820px' }}>
          <ComprehensiveClaimDetails fileID={id} />
        </Box>
      </Box>
    )
  }

  if (activeStep === 0) {
    return (
      <Credential
        setactivStep={setActiveStep}
        fullName={fullName}
        email={email}
        credentialSubject={credentialSubject}
      />
    )
  }

  return (
    <Box
      sx={{
        m: { xs: '24px auto', sm: '40px auto', md: '80px auto' },
        display: 'flex',
        flexDirection: isLargeScreen ? 'row' : 'column',
        justifyContent: 'center',
        width: '100%',
        maxWidth: { xs: '100%', md: '1280px' },
        gap: '30px',
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          flex: isLargeScreen ? '1 1 auto' : 'none',
          width: isLargeScreen ? 'auto' : '100%',
          maxWidth: isLargeScreen ? '872px' : '100%',
          mt: '0px'
        }}
      >
        <Form
          fullName={fullName}
          email={email}
          skills={skills}
          credentialSubject={credentialSubject}
          originalEvidence={credentialEvidence}
          onFormDataChange={setSidebarData}
        />
      </Box>

      {activeStep === 2 && isLargeScreen && (
        <Box
          sx={{
            flex: '0 0 384px',
            width: '384px',
            maxWidth: '384px',
            position: 'sticky',
            top: '20px',
          }}
        >
          <RecommenderPreview
            fullName={fullName}
            credentialSubject={credentialSubject}
            skills={skills}
            recommenderName={sidebarData.recommenderName}
            selectedSkills={sidebarData.selectedSkills}
            recommendationText={sidebarData.recommendationText}
            howKnow={sidebarData.howKnow}
            qualifications={sidebarData.qualifications}
            evidence={sidebarData.evidence}
            selectedFiles={sidebarData.selectedFiles}
            originalEvidence={credentialEvidence}
          />
        </Box>
      )}

      {activeStep === 2 && !isLargeScreen && (
        <Box
          sx={{
            width: '100%',
            mt: '0px'
          }}
        >
          <RecommenderPreview
            fullName={fullName}
            credentialSubject={credentialSubject}
            skills={skills}
            recommenderName={sidebarData.recommenderName}
            selectedSkills={sidebarData.selectedSkills}
            recommendationText={sidebarData.recommendationText}
            howKnow={sidebarData.howKnow}
            qualifications={sidebarData.qualifications}
            evidence={sidebarData.evidence}
            selectedFiles={sidebarData.selectedFiles}
            originalEvidence={credentialEvidence}
          />
        </Box>
      )}
    </Box>
  )
}

export default CredentialData
