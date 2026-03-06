'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  styled,
  IconButton,
  Tooltip
} from '@mui/material'
import Image from 'next/image'
import { FileItem } from '../credentialForm/form/types/Types'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import DeleteIcon from '@mui/icons-material/Delete'
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface FileListProps {
  files: FileItem[]
  onDelete: (event: React.MouseEvent, id: string) => void
  onNameChange: (id: string, newName: string) => void
  onSetAsFeatured: (id: string) => void
  onReorder: (files: FileItem[]) => void
}

const FileListContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  paddingBottom: '20px',
  marginTop: '1rem',
  width: '100%'
})

const isImage = (f: string) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f)
const isPDF = (f: string) => f.toLowerCase().endsWith('.pdf')
const isMP4 = (f: string) => f.toLowerCase().endsWith('.mp4')

const renderPDFThumbnail = async (file: FileItem) => {
  const pdf = await (await getDocument(file.url)).promise
  const page = await pdf.getPage(1)
  const vp = page.getViewport({ scale: 0.1 })
  const c = document.createElement('canvas')
  c.width = vp.width
  c.height = vp.height
  await page.render({ canvasContext: c.getContext('2d')!, viewport: vp }).promise
  return c.toDataURL()
}

const generateVideoThumbnail = (file: FileItem): Promise<string> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = file.url
    video.addEventListener('loadeddata', () => (video.currentTime = 1), { once: true })
    video.addEventListener(
      'seeked',
      () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error())
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      },
      { once: true }
    )
    video.addEventListener('error', () => reject(new Error()))
  })

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const FileListDisplay: React.FC<FileListProps> = ({
  files,
  onDelete
}) => {
  const [pdfThumbs, setPdfThumbs] = useState<Record<string, string>>({})
  const [vidThumbs, setVidThumbs] = useState<Record<string, string>>({})

  useEffect(() => {
    const generateThumbs = async () => {
      for (const f of files) {
        if (isPDF(f.name) && !pdfThumbs[f.id]) {
          const thumb = await renderPDFThumbnail(f)
          setPdfThumbs(prev => ({ ...prev, [f.id]: thumb }))
        }
        if (isMP4(f.name) && !vidThumbs[f.id]) {
          try {
            const thumb = await generateVideoThumbnail(f)
            setVidThumbs(prev => ({ ...prev, [f.id]: thumb }))
          } catch {
            setVidThumbs(prev => ({ ...prev, [f.id]: '/fallback-video.png' }))
          }
        }
      }
    }
    generateThumbs()
  }, [files, pdfThumbs, vidThumbs])

  return (
    <FileListContainer>
      {files.map((f) => {
        return (
          <Box
            key={f.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              backgroundColor: '#F9FAFB', // Lighter background
              borderRadius: '8px',
              width: '100%',
              height: '72px', // Slightly taller for two lines of text
              border: '1px solid #E5E7EB'
            }}
          >
            {/* Thumbnail Section */}
            {isImage(f.name) && (
              <Image
                src={f.url}
                alt={f.name}
                width={48}
                height={48}
                style={{ borderRadius: 6, objectFit: 'cover' }}
              />
            )}
            {isPDF(f.name) && (
              <Image
                src={pdfThumbs[f.id] ?? '/fallback-pdf-thumbnail.svg'}
                alt={f.name}
                width={48}
                height={48}
                style={{ borderRadius: 6, objectFit: 'cover' }}
              />
            )}
            {isMP4(f.name) && (
              <Image
                src={vidThumbs[f.id] ?? '/fallback-video.png'}
                alt={f.name}
                width={48}
                height={48}
                style={{ borderRadius: 6, objectFit: 'cover' }}
              />
            )}
            {!isImage(f.name) && !isPDF(f.name) && !isMP4(f.name) && (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#E5E7EB',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  color: '#6B7280',
                  fontWeight: 600
                }}
              >
                FILE
              </Box>
            )}

            {/* File Info (Name + Size) */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
              <Box
                sx={{
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  color: '#111827',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {f.name}
              </Box>
              {f.file?.size && (
                <Box
                  sx={{
                    fontFamily: 'Inter',
                    fontSize: '12px',
                    color: '#6B7280',
                    marginTop: '2px'
                  }}
                >
                  {formatBytes(f.file.size)}
                </Box>
              )}
            </Box>

            {/* Delete Action */}
            <Tooltip title='Delete media' arrow>
              <IconButton
                onClick={e => onDelete(e, f.googleId ?? f.id)}
                sx={{
                  color: '#9CA3AF',
                  padding: '8px',
                  '&:hover': {
                    color: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )
      })}
    </FileListContainer>
  )
}

export default FileListDisplay
