'use client'

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { FormControl, Box, Slide, Button, Typography } from '@mui/material'
import { GoogleDriveStorage, saveToGoogleDrive } from '@cooperation/vc-storage'
import dynamic from 'next/dynamic'

import CredentialTracker from 'app/components/credentialTracker/Page'
import { cardStyle } from 'app/components/Styles/appStyles'
import { storeFileTokens } from 'app/firebase/storage'
import { handleSign } from 'app/utils/formUtils'
import { saveSession } from 'app/utils/saveSession'
import SnackMessage from 'app/components/SnackMessage'

import { FormData } from './types'
import { Step1 } from './steps/1_name'
import { Step2 } from './steps/2_main'
import FileUploadAndList from './steps/upload'
import DataComponent from './steps/preview'
import { Buttons } from './buttons'
import { createDID, signCred } from '../utils/signCred'
import { useSession } from 'next-auth/react'
import { useStepContext } from './StepContext'
import SuccessPage from './steps/SuccessPage'


const DynamicForm = dynamic(() => import('./form/Form'), {
  ssr: false,
  loading: () => <p></p>
})


const FormComponent = () => {
  const formRef = useRef<HTMLElement>(null)

  const handleScrollToTop = useCallback(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 10)
    }
  }, [formRef])

  //const [activeStep, setActiveStep] = useState(0)
  //const handleNext = ()=> setActiveStep(activeStep + 1)
  const { activeStep, handleNext, handleBack, setActiveStep, loading, handleSkip } =
    useStepContext()
  const [link, setLink] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const fooElementRef = useRef(null)
  const [hasSignedIn, setHasSignedIn] = useState(false)
  const [snackMessage, setSnackMessage] = useState('')
  const [userSessions, setUserSessions] = useState<{}[]>([])
  const [fileId, setFileId] = useState('')
  const [image, setImage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<any[]>([])
  const [res, setRes] = useState<any>(null)

  const characterLimit = 294
  const { data: session } = useSession()
  const accessToken = session?.accessToken
  const refreshToken = session?.refreshToken

  const storage = new GoogleDriveStorage(accessToken as string)

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
      portfolio: [],
      evidenceLink: '',
      description: ''
    },
    mode: 'onChange'
  })

  const handleFetchinguserSessions = async () => {
    try {
      if (!accessToken) return
      const sessionFiles = await storage.getAllFilesByType('SESSIONs')
      if (!sessionFiles || sessionFiles.length === 0) return
      console.log('userSessions', sessionFiles)
      if (sessionFiles.length > 0) {
        setUserSessions(sessionFiles)
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
    setValue('portfolio', session.portfolio)
    setValue('evidenceLink', session?.evidenceLink)
    setValue('description', session.description)

    // Close the dialog
  }

  useEffect(() => {
    handleScrollToTop()
  }, [activeStep])

  useEffect(() => {
    handleFetchinguserSessions()
  }, [])

  // Check for imported form data from credential import
  useEffect(() => {
    const importedData = localStorage.getItem('importedFormData')
    if (importedData) {
      try {
        const formData = JSON.parse(importedData)
        console.log('Loading imported form data:', formData)

        // Populate form fields with imported data
        if (formData.fullName) setValue('fullName', formData.fullName)
        if (formData.persons) setValue('persons', formData.persons)
        if (formData.credentialName) setValue('credentialName', formData.credentialName)
        if (formData.credentialDuration)
          setValue('credentialDuration', formData.credentialDuration)
        if (formData.credentialDescription)
          setValue('credentialDescription', formData.credentialDescription)
        if (formData.portfolio) setValue('portfolio', formData.portfolio)
        if (formData.evidenceLink) setValue('evidenceLink', formData.evidenceLink)
        if (formData.description) setValue('description', formData.description)
        if (formData.storageOption) setValue('storageOption', formData.storageOption)

        // Clear the imported data from localStorage after loading
        localStorage.removeItem('importedFormData')
      } catch (error) {
        console.error('Failed to parse imported form data:', error)
        localStorage.removeItem('importedFormData')
      }
    }
  }, [])

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

      const { didDocument, keyPair, issuerId } = await createDID(accessToken)

      const saveResponse = await saveToGoogleDrive({
        storage,
        data: {
          didDocument,
          keyPair
        },
        type: 'DID'
      })
      console.log('🚀 ~ sign ~ saveResponse:', saveResponse)

      const res = await signCred(accessToken, data, issuerId, keyPair, 'VC')
      const file = (await saveToGoogleDrive({
        storage,
        data: res,
        type: 'VC'
      })) as any
      try {
        const savedFile = await storeFileTokens({
          googleFileId: file.id,
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken as string
          }
        })

        localStorage.removeItem('vcs')
      } catch (error) {
        console.error('Error storing file tokens:', error)
        throw error
      }

      const folderIds = await storage?.getFileParents(file.id)
      const relationFile = await storage?.createRelationsFile({
        vcFolderId: folderIds[0]
      })
      setLink(`https://drive.google.com/file/d/${file.id}/view`)
      setFileId(`${file.id}`)

      console.log('🚀 ~ handleFormSubmit ~ res:', res)
      setRes(res)
      return res
    } catch (error: any) {
      console.error('Error during signing process:', error)
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

  const [skills, setSkills] = useState<string[]>([])

  const prevStep = useRef(0)
  const direction = useRef('left')
  const [slideTrigger, setSlideTrigger] = useState(true)
  useEffect(() => {
    setSlideTrigger(false)
    direction.current = activeStep > prevStep.current ? 'left' : 'right'
    setTimeout(() => setSlideTrigger(true), 0)
    prevStep.current = activeStep
  }, [activeStep])

  const steps: JSX.Element[] = [
    <Step1
        watch={watch}
        setValue={setValue}
        register={register}
        errors={errors}
        handleNext={handleNext}
    />,
    <>
      <Step2
        register={register}
        watch={watch}
        errors={errors}
        control={control}
        setSkills={setSkills}
      />
      <FileUploadAndList
        watch={watch}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        setValue={setValue}
      />
    </>,
    <DataComponent formData={watch()} selectedFiles={selectedFiles} />,
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
  ]

  return (
      <Box
        ref={formRef}
        sx={{
          m: { xs: '24px auto', sm: '40px auto', md: '120px auto' },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 3, md: '30px' },
          alignItems: { xs: 'stretch', md: 'flex-start' },
          justifyContent: 'center',
          width: '100%',
          maxWidth: { xs: '100%', md: '1500px' },
          px: { xs: 1, sm: 2, md: 0 },
        }}
      >
        <form onSubmit={handleFormSubmit} style={{overflow: 'hidden'}}>
          <Box sx={[{width: '720px'}, cardStyle]}>
            <FormControl sx={{ width: '100%' }}>
              <Slide
                in={slideTrigger} container={formRef.current} direction={direction.current}
                timeout={{ enter: 200, exit: 0 }} appear={false}
              >
                <div>{steps[activeStep]}</div>
              </Slide>
            </FormControl>

            <Box sx={{marginTop: '30px'}}>
              {activeStep !== 5 && (
                <Buttons
                  activeStep={activeStep}
                  handleNext={handleNext}
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
        </form>

        {activeStep < 4 && (
          <Box
            sx={{
              width: { xs: '100%', md: '420px' },
              mt: { xs: 4, md: 0 },
              alignSelf: { xs: 'stretch', md: 'auto' }
            }}
          >
            <CredentialTracker formData={watch()} selectedFiles={selectedFiles} skills={skills}/>
          </Box>
        )}
      </Box>
  )
}

export default FormComponent
