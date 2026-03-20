/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { FormControl, Box, Slide, Button, Typography } from '@mui/material'
import { FormData } from './types/Types'
import { Step0 } from './Steps/Step0_connectToGoogle'
import { Buttons } from './buttons/Buttons'
import { createDID, signCred } from '../../utils/credential'
import { ISkillClaimCredential } from 'hr-context'
import {
  GoogleDriveStorage,
  saveToGoogleDrive,
  CredentialEngine
} from '@cooperation/vc-storage'
import { useSession, signIn } from 'next-auth/react'
import { handleSign } from '../../utils/formUtils'
import { saveSession } from '../../utils/saveSession'
import SnackMessage from '../../components/SnackMessage'
import { useStepContext } from './StepContext'
import SuccessPage from './Steps/SuccessPage'
import { Step1 } from './Steps/Step1_userName'
import { Step2 } from './Steps/Step2_descreptionFields'
import { storeFileTokens } from '../../firebase/storage'
import CredentialTracker from '../../components/credetialTracker/Page'
import { StepTrackShape } from './fromTexts & stepTrack/StepTrackShape'
import { SkillMatch } from '../../utils/skillsApi'
import useGoogleDrive from '../../hooks/useGoogleDrive'
import { signSkillClaim } from '../../utils/signSkillClaim'
import CredentialPreview from '../../components/credetialTracker/CredentialPreview'

const Form = ({ onStepChange }: any) => {
  const { activeStep, handleNext, handleBack, setActiveStep, loading, handleSkip } =
    useStepContext()
  const [prevStep, setPrevStep] = useState(0)
  const [link, setLink] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [hasSignedIn, setHasSignedIn] = useState(false)
  const [snackMessage, setSnackMessage] = useState('')
  const [userSessions, setUserSessions] = useState<{}[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [fileId, setFileId] = useState('')
  const [image, setImage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<any[]>([])
  const [res, setRes] = useState<any>(null)
  const [activeSkills, setActiveSkills] = useState<SkillMatch[]>([])
  const [removedSkills, setRemovedSkills] = useState<SkillMatch[]>([])
  const [manuallyAddedSkills, setManuallyAddedSkills] = useState<SkillMatch[]>([])

  const { data: session } = useSession()
  const accessToken = session?.accessToken
  const refreshToken = session?.refreshToken

  const { storage } = useGoogleDrive()
  const engine = React.useMemo(
    () => (storage ? new CredentialEngine(storage) : null),
    [storage]
  )

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    trigger,
    formState: { errors, isValid }
  } = useForm<FormData>({
    defaultValues: {
      storageOption: 'Google Drive',
      fullName: session?.user?.name ?? '',
      persons: '',
      credentialName: '',
      credentialDuration: '',
      credentialDescription: '',
      evidence: [],
      evidenceLink: '',
      description: ''
    },
    mode: 'onChange'
  })

  useEffect(() => {
    setPrevStep(activeStep + 1)
  }, [activeStep])

  const direction = activeStep > prevStep ? 'left' : 'right'

  const handleFetchinguserSessions = async () => {
    try {
      if (!accessToken || !storage) return
      const sessionFiles = await storage.getAllFilesByType('SESSIONs')
      if (!sessionFiles || sessionFiles.length === 0) return
      if (sessionFiles.length > 0) {
        setUserSessions(sessionFiles)
        setOpenDialog(true)
      }
    } catch (err) {
      console.error('Failed to fetch userSessions:', err)
      setErrorMessage('Failed to fetch user sessions')
    }
  }

  const handleuserSessionselect = (session: any) => {
    // Set the selected session values into the form
    setValue('fullName', session.fullName)
    setValue('persons', session.persons)
    setValue('credentialName', session.credentialName)
    setValue('credentialDuration', session.credentialDuration)
    setValue('credentialDescription', session.credentialDescription)
    setValue('evidence', session.portfolio || session.evidence)
    setValue('evidenceLink', session?.evidenceLink)
    setValue('description', session.description)

    // Close the dialog
    setOpenDialog(false)
  }

  useEffect(() => {
    onStepChange()
  }, [activeStep])

  useEffect(() => {
    handleFetchinguserSessions()
  }, [storage])

  // Check for imported form data from credential import
  useEffect(() => {
    const loadData = () => {
      // 1. Try to load imported data first (highest priority for new import)
      const importedDataString = localStorage.getItem('importedFormData')
      if (importedDataString) {
        try {
          const formData = JSON.parse(importedDataString)
          console.log('Loading imported form data:', formData)

          // Populate form fields with imported data
          Object.keys(formData).forEach(key => {
            setValue(key as any, formData[key])
          })

          // Clear the imported data from localStorage after loading
          localStorage.removeItem('importedFormData')
          return // Stop here if we loaded imported data
        } catch (error) {
          console.error('Failed to parse imported form data:', error)
          localStorage.removeItem('importedFormData')
        }
      }

      // 2. If no imported data, try to load auto-saved session data
      const savedSessionString = localStorage.getItem('linkedCreds_autoSave_v1')
      if (savedSessionString) {
        try {
          const savedSession = JSON.parse(savedSessionString)
          console.log('Loading auto-saved session:', savedSession)

          // Restore Form Data
          if (savedSession.formData) {
            Object.keys(savedSession.formData).forEach(key => {
              setValue(key as any, savedSession.formData[key])
            })
          }

          // Restore Skills
          if (savedSession.activeSkills) setActiveSkills(savedSession.activeSkills)
          if (savedSession.removedSkills) setRemovedSkills(savedSession.removedSkills)
          if (savedSession.manuallyAddedSkills)
            setManuallyAddedSkills(savedSession.manuallyAddedSkills)
        } catch (error) {
          console.error('Failed to parse auto-saved session:', error)
        }
      }
    }

    loadData()
  }, [])

  // Auto-save form data to localStorage
  useEffect(() => {
    const currentFormData = watch()
    const autoSaveData = {
      formData: currentFormData,
      activeSkills,
      removedSkills,
      manuallyAddedSkills,
      timestamp: new Date().toISOString()
    }

    const saveToLocalStorage = () => {
      // Don't save if we're on the success step (step 4)
      if (activeStep === 4) {
        localStorage.removeItem('linkedCreds_autoSave_v1')
        localStorage.removeItem('activeStep')
        return
      }

      try {
        localStorage.setItem('linkedCreds_autoSave_v1', JSON.stringify(autoSaveData))
      } catch (error) {
        console.warn('Failed to auto-save to localStorage:', error)
      }
    }

    const timer = setTimeout(saveToLocalStorage, 500) // Debounce save by 1s
    return () => clearTimeout(timer)
  }, [watch(), activeSkills, removedSkills, manuallyAddedSkills, activeStep])

  const costumedHandleNextStep = async () => {
    if (
      activeStep === 0 &&
      watch('storageOption') === 'Google Drive' &&
      !accessToken &&
      !hasSignedIn
    ) {
      const signInSuccess = await signIn('google')
      if (!signInSuccess || !accessToken) return
      setHasSignedIn(true)
      handleNext()
    } else {
      handleNext()
    }
  }

  const costumedHandleBackStep = async () => {
    if (activeStep > 0) {
      handleBack()
      await trigger()
    }
  }

  const handleFormSubmit = handleSubmit(async (data: FormData) => {
    try {
      await sign(data)
    } catch (error: any) {
      if (error.message === 'MetaMask address could not be retrieved') {
        setErrorMessage('Please make sure you have MetaMask installed and connected.')
        return
      } else {
        console.log('Error during VC signing:', error)
        setErrorMessage('An error occurred during the signing process.')
      }
    }
  })

  const sign = async (data: any) => {
    try {
      if (!accessToken) {
        setErrorMessage('Access token is missing')
        return
      }
      if (!storage || !engine) {
        setErrorMessage('Storage not ready. Please wait or reconnect.')
        return
      }

      const { didDocument, keyPair, issuerId } = await createDID(accessToken)

      const saveResponse = await saveToGoogleDrive({
        storage,
        data: {
          didDocument,
          keyPair
        },
        type: 'DID'
      })

      const result = (await signCred(
        accessToken,
        {
          ...data,
          skills: activeSkills?.length ? activeSkills : undefined,
          removedSkills: removedSkills?.length ? removedSkills : undefined
        },
        issuerId,
        keyPair,
        'VC',
        undefined,
        true
      )) as { signedVC: ISkillClaimCredential; file: any }

      const res = result.signedVC
      const file = result.file
      try {
        const savedFile = await storeFileTokens({
          googleFileId: file.id,
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken as string
          }
        })

        // Clear auto-save data
        localStorage.removeItem('linkedCreds_autoSave_v1')
        localStorage.removeItem('vcs')
      } catch (error) {
        console.warn('Error storing file tokens:', error)
      }

      const folderIds = await storage?.getFileParents(file.id)
      const relationFile = await storage?.createRelationsFile({
        vcFolderId: folderIds[0]
      })
      setLink(`https://drive.google.com/file/d/${file.id}/view`)
      setFileId(`${file.id}`)

      setRes(res)
      return res
    } catch (error: any) {
      console.error('Error during signing process:', error)
      if (
        error.message?.includes('invalid authentication credentials') ||
        error.message?.includes('401')
      ) {
        setErrorMessage('Your Google session has expired. Please sign in again.')
      }
      throw error
    }
  }

  const handleSaveSession = async () => {
    try {
      const formData = watch() // Get the current form data
      setSnackMessage('Successfully saved in Your ' + formData.storageOption)
      if (!accessToken) {
        setErrorMessage('Access token is missing')
        return
      }
      await saveSession(formData, accessToken) // Save session data to Google Drive
    } catch (error: any) {
      setSnackMessage('Someting went wrong, please try agin later')
      console.error('Error saving session:', error)
    }
  }

  if ((session as any)?.error === 'RefreshAccessTokenError') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
          gap: 2,
          px: 4,
          textAlign: 'center',
          backgroundColor: '#FFF',
          borderRadius: '14px',
          boxShadow: '0 6px 6px rgba(0, 0, 0, 0.25)',
          m: { xs: '24px auto', sm: '40px auto', md: '80px auto' },
          maxWidth: '872px'
        }}
      >
        <Typography variant='h6' color='error'>
          Your Google Drive session has expired.
        </Typography>
        <Typography variant='body1'>
          To sign and save your credentials, please sign in again to refresh your
          permissions.
        </Typography>
        <Button
          variant='contained'
          onClick={() => signIn('google')}
          sx={{
            mt: 2,
            backgroundColor: '#2563EB',
            textTransform: 'none',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#1D4ED8'
            }
          }}
        >
          Sign In with Google
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        m: { xs: '24px auto', sm: '40px auto', md: '80px auto' },
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 3, md: '30px' },
        alignItems: { xs: 'stretch', md: 'flex-start' },
        justifyContent: 'center',
        width: '100%',
        maxWidth: { xs: '100%', md: '1280px' }
      }}
    >
      <Box
        sx={{
          flex: 1,
          maxWidth: activeStep === 4 ? '100%' : '872px',
          width: activeStep === 4 ? '100%' : { xs: '100%', md: '872px' }
        }}
      >
        <Box
          component='form'
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            borderRadius: activeStep === 4 ? '10px 10px 20px 20px' : '14px',
            alignItems: 'stretch',
            overflow: 'visible',
            width: '100%',
            padding:
              activeStep === 4 ? '0' : { xs: '20px 16px', sm: '32px 32px 32px 30px' },
            backgroundColor: '#FFF',
            boxShadow: '0 6px 6px rgba(0, 0, 0, 0.25)'
          }}
          onSubmit={handleFormSubmit}
        >
          <Box
            sx={{
              width: '100%',
              minWidth: { md: '400px' }
            }}
          >
            <FormControl sx={{ width: '100%' }}>
              {activeStep === 0 && (
                <Slide in={true} direction={direction} timeout={500}>
                  <Box>
                    <Step0 />
                  </Box>
                </Slide>
              )}
              {activeStep === 1 && (
                <Slide in={true} direction={direction} timeout={500}>
                  <Box>
                    <Step1
                      watch={watch}
                      setValue={setValue}
                      register={register}
                      errors={errors}
                      handleNext={handleNext}
                    />
                  </Box>
                </Slide>
              )}

              {activeStep === 2 && (
                <Slide in={true} direction={direction}>
                  <Box>
                    <Step2
                      register={register}
                      watch={watch}
                      handleTextEditorChange={value =>
                        setValue('credentialDescription', value ?? '')
                      }
                      errors={errors}
                      control={control}
                      activeSkills={activeSkills.map(s => s.name)}
                      setValue={setValue}
                      selectedFiles={selectedFiles}
                      setSelectedFiles={setSelectedFiles}
                      handleBack={costumedHandleBackStep}
                    />
                  </Box>
                </Slide>
              )}
              {activeStep === 3 && (
                <Slide in={true} direction={direction}>
                  <Box
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <CredentialTracker
                      formData={{
                        ...watch(),
                        skills: activeSkills,
                        removedSkills: removedSkills
                      }}
                      selectedFiles={selectedFiles}
                      onBack={costumedHandleBackStep}
                    />
                  </Box>
                </Slide>
              )}
              {activeStep === 4 && (
                <Slide in={true} direction={direction}>
                  <Box>
                    <SuccessPage
                      formData={watch()}
                      setActiveStep={setActiveStep}
                      reset={reset}
                      link={link}
                      setLink={setLink}
                      setFileId={setFileId}
                      fileId={fileId}
                      storageOption={watch('storageOption')}
                      selectedImage={image}
                      res={res}
                    />
                  </Box>
                </Slide>
              )}
            </FormControl>
          </Box>
          {activeStep !== 4 && (
            <Buttons
              activeStep={activeStep}
              handleNext={activeStep === 0 ? costumedHandleNextStep : () => handleNext()}
              handleSkip={handleSkip}
              handleSign={() => handleSign(activeStep, setActiveStep, handleFormSubmit)}
              handleBack={costumedHandleBackStep}
              isValid={isValid}
              handleSaveSession={handleSaveSession}
              loading={loading}
            />
          )}
          {errorMessage && (
            <div
              style={{
                color: errorMessage.includes('MetaMask') ? 'red' : 'black',
                textAlign: 'center',
                marginTop: '20px'
              }}
            >
              {errorMessage}
            </div>
          )}
          {snackMessage ? <SnackMessage message={snackMessage} /> : ''}
        </Box>
      </Box>

      {activeStep >= 1 && activeStep < 3 && (
        <Box
          sx={{
            width: { xs: '100%', md: '384px' },
            mt: { xs: 4, md: 0 },
            alignSelf: { xs: 'stretch', md: 'auto' }
          }}
        >
          {activeStep === 1 || activeStep === 2 ? (
            <CredentialPreview
              formData={watch()}
              selectedFiles={selectedFiles}
              activeSkills={activeSkills}
              removedSkills={removedSkills}
              manuallyAddedSkills={manuallyAddedSkills}
              onSkillsChange={setActiveSkills}
              onRemovedSkillsChange={setRemovedSkills}
              onManualSkillsChange={setManuallyAddedSkills}
              currentStep={activeStep}
            />
          ) : (
            <CredentialTracker
              formData={{
                ...watch(),
                skills: activeSkills,
                removedSkills: removedSkills
              }}
              selectedFiles={selectedFiles}
              onBack={costumedHandleBackStep}
            />
          )}
        </Box>
      )}
    </Box>
  )
}
export default Form
