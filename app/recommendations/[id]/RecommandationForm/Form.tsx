'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { FormControl, Box, Link, Typography } from '@mui/material'
import { useParams } from 'next/navigation'
import { FormData, SelectedSkill } from '../../../credentialForm/form/types/Types'
import { textGuid } from './fromTexts/FormTextSteps'
import Step1 from './Steps/Step1'
import Step2 from './Steps/Step2'
import DataPreview from './Steps/dataPreview'
import SuccessPage from './Steps/SuccessPage'
import { Buttons } from './buttons/Buttons'
import useLocalStorage from '../../../hooks/useLocalStorage'
import { useStepContext } from '../../../credentialForm/form/StepContext'
import { GoogleDriveStorage, saveToGoogleDrive } from '@cooperation/vc-storage'
import { createDID, signCred } from '../../../utils/credential'
import { useSession } from 'next-auth/react'
import { Logo } from '../../../Assets/SVGs'
import useGoogleDrive from '../../../hooks/useGoogleDrive'
import { storeFileTokens } from '../../../firebase/storage'
import { leftColumnStyles } from '../../../components/Styles/appStyles'
interface FormProps {
  fullName: string  // This is the recipient's name
  email: string
  skills: SelectedSkill[]
  credentialSubject?: any
  originalEvidence?: any[]
  onFormDataChange?: (data: { recommenderName: string; selectedSkills: SelectedSkill[]; recommendationText: string; howKnow: string; qualifications: string; evidence: any[]; selectedFiles: any[] }) => void
}

const Form: React.FC<FormProps> = ({ fullName: recipientName, email, skills, credentialSubject, originalEvidence = [], onFormDataChange }) => {
  const { activeStep, handleNext, handleBack, setActiveStep } = useStepContext()
  const { data: session } = useSession()
  const accessToken = session?.accessToken
  const refreshToken = session?.refreshToken

  const [storedValue, setStoreNewValue, clearValue] = useLocalStorage('formData', {
    storageOption: 'Google Drive',
    fullName: '',
    howKnow: '',
    recommendationText: '',
    evidence: [{ name: '', url: '', type: ['Evidence'] }],
    qualifications: '',
    explainAnswer: '',
    selectedSkills: []
  })
  const [submittedFullName, setSubmittedFullName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tooltipText, setTooltipText] = useState('saving your recommendation')
  const [recId, setRecId] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<any[]>(() => {
    // Reconstruct selectedFiles from persisted evidence on initial load
    const storedEvidence = storedValue?.evidence || []
    return storedEvidence
      .filter((item: any) => (item.googleId || item.wasId) && item.url)
      .map((item: any) => ({
        id: item.googleId || item.wasId,
        name: item.name || 'Untitled',
        url: item.url,
        googleId: item.googleId,
        wasId: item.wasId,
        isFeatured: item.isFeatured || false,
        uploaded: true
      }))
  })

  const defaultValues: FormData = storedValue

  const methods = useForm<FormData>({
    defaultValues,
    mode: 'onChange'
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isValid }
  } = methods

  const formData = watch()
  const params = useParams()
  const VSFileId = params?.id as string

  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(storedValue)) {
      setStoreNewValue(formData)
    }
  }, [formData, storedValue, setStoreNewValue])

  // Separate effect for sidebar updates to avoid infinite loops
  const prevSidebarRef = useRef('')
  useEffect(() => {
    if (!onFormDataChange) return
    const sidebarPayload = {
      recommenderName: String(formData.fullName || ''),
      selectedSkills: (formData.selectedSkills as SelectedSkill[]) || [],
      recommendationText: String(formData.recommendationText || ''),
      howKnow: String(formData.howKnow || ''),
      qualifications: String(formData.qualifications || ''),
      evidence: formData.evidence || [],
      selectedFiles: selectedFiles || []
    }
    const key = JSON.stringify(sidebarPayload)
    if (key !== prevSidebarRef.current) {
      prevSidebarRef.current = key
      onFormDataChange(sidebarPayload)
    }
  }, [formData.fullName, formData.selectedSkills, formData.recommendationText, formData.howKnow, formData.qualifications, formData.evidence, selectedFiles])

  const { storage } = useGoogleDrive()

  const customHandleBack = () => {
    if (activeStep === 2 && session?.accessToken) {
      setActiveStep(0)
    } else {
      handleBack()
    }
  }

  const saveAndAddComment = async () => {
    try {
      if (!accessToken) {
        throw new Error('No access token provided.')
      }
      // Step 1: Create DID
      const newDid = await createDID(accessToken)
      const { didDocument, keyPair, issuerId } = newDid

      // Save the DID document and keyPair to Google Drive
      const file = await saveToGoogleDrive({
        storage: storage as GoogleDriveStorage,
        data: {
          didDocument,
          keyPair
        },
        type: 'DID'
      })

      // Step 3: Sign the credential (recommendation)
      // Add recipient name to formData before signing
      const dataWithRecipient = {
        ...formData,
        recipientName: recipientName
      }

      const signedCred = await signCred(
        accessToken,
        dataWithRecipient,
        issuerId,
        keyPair,
        'RECOMMENDATION',
        VSFileId
      )

      // Step 4: Save the signed recommendation to Google Drive
      const savedRecommendation = await saveToGoogleDrive({
        storage: storage as GoogleDriveStorage,
        data: signedCred,
        type: 'RECOMMENDATION'
      })
      await storeFileTokens({
        googleFileId: savedRecommendation.id,
        tokens: {
          accessToken,
          refreshToken: refreshToken as string
        }
      })
      setRecId(savedRecommendation.id)
      return signedCred
    } catch (error: any) {
      console.error('Error during signing process:', error.message)
      throw error
    }
  }

  const handleFormSubmit = handleSubmit(async (data: FormData) => {
    try {
      setIsLoading(true)
      setTooltipText('saving your recommendation')
      setTimeout(() => {
        setTooltipText('wait while we link your recommendation to the claim')
      }, 500)

      setSubmittedFullName(data.fullName)
      await saveAndAddComment()
      clearValue()
      setSelectedFiles([])
      reset({
        storageOption: 'Google Drive',
        fullName: '',
        howKnow: '',
        recommendationText: '',
        evidence: [{ name: '', url: '', type: ['Evidence'] }],
        qualifications: '',
        explainAnswer: '',
        selectedSkills: []
      })
      setActiveStep(4)
    } catch (error) {
      console.error('Error during form submission:', error)
    } finally {
      setIsLoading(false)
    }
  })

  // New function to handle form data updates from DataPreview
  const handleUpdateFormData = (newData: FormData) => {
    Object.keys(newData).forEach(key => {
      return setValue(key as any, newData[key as keyof FormData])
    })
  }

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        sx={{
          ...leftColumnStyles,
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          alignItems: 'center',
          marginTop: '5px',
          width: { xs: '100%', md: '872px' },
          maxWidth: '872px',
          minWidth: '320px',
          margin: '0 auto',
          marginBottom: '20px',
          boxSizing: 'border-box'
        }}
        onSubmit={handleFormSubmit}
      >

        <Box sx={{ width: '100%' }}>
          <FormControl sx={{ width: '100%' }}>
            {activeStep === 1 && (
              <Step1 watch={watch} setValue={setValue} handleNext={handleNext} fullName={recipientName} />
            )}
            {activeStep === 2 && (
              <Step2
                register={register}
                watch={watch}
                errors={errors}
                setValue={setValue}
                fullName={recipientName}
                control={control}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                skills={skills}
              />
            )}
            {activeStep === 3 && (
              <DataPreview
                formData={formData}
                fullName={recipientName}
                handleNext={handleNext}
                handleBack={customHandleBack}
                handleSign={saveAndAddComment}
                isLoading={isLoading}
                onUpdateFormData={newValue => {
                  reset(newValue)
                  setStoreNewValue(newValue)
                }}
                selectedFiles={selectedFiles}
                originalEvidence={originalEvidence}
                credentialSubject={credentialSubject}
                skills={skills}
              />
            )}
            {activeStep === 4 && (
              <SuccessPage
                formData={formData}
                submittedFullName={submittedFullName}
                fullName={recipientName}
                email={email}
                handleBack={customHandleBack}
                recId={recId}
                credentialSubject={credentialSubject}
                skills={skills}
              />
            )}
          </FormControl>
        </Box>

        <Buttons
          activeStep={activeStep}
          maxSteps={textGuid(recipientName).length}
          handleNext={handleNext}
          handleSign={handleFormSubmit}
          handleBack={customHandleBack}
          isValid={isValid}
          isLoading={isLoading}
          tooltipText={tooltipText}
        />
      </Box>
    </FormProvider>
  )
}

export default Form
