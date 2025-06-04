// frontend/src/components/ResumeUpload.tsx - Modern Mantine UI

import { useState, useEffect } from 'react'
import { 
  Text, 
  Group, 
  Button, 
  Stack, 
  Alert, 
  Badge, 
  Progress,
  Box,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Title
} from '@mantine/core'
import { Dropzone, type FileWithPath } from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import { 
  IconUpload, 
  IconX, 
  IconFileTypePdf, 
  IconCheck, 
  IconRefresh,
  IconUser,
  IconMail,
  IconBriefcase,
  IconSchool,
  IconCode,
  IconRocket
} from '@tabler/icons-react'

interface ParsedResumeData {
  personal_info: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
  }
  skills: {
    technical_skills: string[]
    tools: string[]
    languages: string[]
  }
  experience: Array<{
    company: string
    role: string
    duration: string
    location?: string
    responsibilities: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    duration: string
    location?: string
  }>
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    duration?: string
  }>
  certifications: string[]
  summary?: string
}

interface Props {
  onResumeUploaded: (resumeData: ParsedResumeData) => void
}

export default function ResumeUpload({ onResumeUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [currentResume, setCurrentResume] = useState<ParsedResumeData | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDrop = async (files: FileWithPath[]) => {
    const file = files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      notifications.show({
        title: 'Invalid File Type',
        message: 'Please upload a PDF file',
        color: 'red',
        icon: <IconX size={16} />,
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/resume/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error('Failed to upload resume')
      }

      const data = await response.json()
      setCurrentResume(data.parsed_data)
      onResumeUploaded(data.parsed_data)

      notifications.show({
        title: 'Resume Uploaded Successfully! 🎉',
        message: 'Your resume has been parsed and is ready to use',
        color: 'green',
        icon: <IconCheck size={16} />,
      })
      
    } catch (err) {
      notifications.show({
        title: 'Upload Failed',
        message: 'Failed to upload and parse resume. Please try again.',
        color: 'red',
        icon: <IconX size={16} />,
      })
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const fetchCurrentResume = async () => {
    try {
      const response = await fetch('http://localhost:8000/resume/current')
      if (response.ok) {
        const data = await response.json()
        setCurrentResume(data.parsed_data)
        onResumeUploaded(data.parsed_data)
      }
    } catch (err) {
      console.log('No current resume found')
    }
  }

  useEffect(() => {
    fetchCurrentResume()
  }, [])

  const handleReset = () => {
    setCurrentResume(null)
    setUploadProgress(0)
  }

  if (!currentResume) {
    return (
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3} c="dark.7">📄 Resume Manager</Title>
        </Group>
        
        <Text c="dimmed" size="sm">
          Upload your master resume to get started. Our AI will parse it and help you customize it for each job application.
        </Text>

        <Dropzone
          onDrop={handleDrop}
          onReject={() => {
            notifications.show({
              title: 'File Rejected',
              message: 'Please upload a PDF file under 10MB',
              color: 'red',
            })
          }}
          maxSize={10 * 1024 ** 2}
          accept={['application/pdf']}
          loading={uploading}
          styles={{
            root: {
              border: '2px dashed var(--mantine-color-blue-3)',
              borderRadius: 'var(--mantine-radius-md)',
              backgroundColor: 'var(--mantine-color-blue-0)',
              '&:hover': {
                backgroundColor: 'var(--mantine-color-blue-1)',
              },
            },
            inner: {
              padding: 'var(--mantine-spacing-xl)',
            },
          }}
        >
          <Group justify="center" gap="xl" style={{ minHeight: 120 }}>
            <Dropzone.Accept>
              <IconUpload size={52} color="var(--mantine-color-blue-6)" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={52} color="var(--mantine-color-red-6)" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileTypePdf size={52} color="var(--mantine-color-blue-6)" />
            </Dropzone.Idle>

            <Stack gap="xs" ta="center">
              <Text size="xl" fw={600} c="blue.7">
                Drop your resume here
              </Text>
              <Text size="sm" c="dimmed">
                or click to select a PDF file
              </Text>
              <Text size="xs" c="dimmed">
                Maximum file size: 10MB
              </Text>
            </Stack>
          </Group>
        </Dropzone>

        {uploading && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Parsing resume...</Text>
              <Text size="sm" c="dimmed">{uploadProgress}%</Text>
            </Group>
            <Progress value={uploadProgress} size="lg" radius="md" />
          </Box>
        )}
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={3} c="dark.7">📄 Resume Manager</Title>
        <Tooltip label="Upload new resume">
          <ActionIcon 
            variant="light" 
            color="gray" 
            size="lg"
            onClick={handleReset}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Alert 
        icon={<IconCheck size={16} />} 
        color="green" 
        variant="light"
        styles={{
          root: {
            backgroundColor: 'var(--mantine-color-green-0)',
            border: '1px solid var(--mantine-color-green-3)',
          },
        }}
      >
        <Group justify="space-between">
          <Stack gap={4}>
            <Text fw={600} c="green.8">Resume Loaded Successfully!</Text>
            <Text size="sm" c="green.7">
              {currentResume.personal_info.name && (
                <>👤 {currentResume.personal_info.name}</>
              )}
              {currentResume.personal_info.email && (
                <> • 📧 {currentResume.personal_info.email}</>
              )}
            </Text>
          </Stack>
          <Badge color="green" variant="filled" size="lg">
            Active
          </Badge>
        </Group>
      </Alert>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Box 
          p="md" 
          style={{ 
            backgroundColor: 'var(--mantine-color-blue-0)',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--mantine-color-blue-2)',
          }}
        >
          <Group mb="xs">
            <IconUser size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={600} c="blue.8">Profile Summary</Text>
          </Group>
          <Stack gap={6}>
            <Group gap="xs">
              <IconBriefcase size={14} />
              <Text size="sm">{currentResume.experience.length} work experiences</Text>
            </Group>
            <Group gap="xs">
              <IconRocket size={14} />
              <Text size="sm">{currentResume.projects.length} projects</Text>
            </Group>
            <Group gap="xs">
              <IconSchool size={14} />
              <Text size="sm">{currentResume.education.length} education entries</Text>
            </Group>
          </Stack>
        </Box>

        <Box 
          p="md"
          style={{ 
            backgroundColor: 'var(--mantine-color-violet-0)',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--mantine-color-violet-2)',
          }}
        >
          <Group mb="xs">
            <IconCode size={20} color="var(--mantine-color-violet-6)" />
            <Text fw={600} c="violet.8">Top Skills</Text>
          </Group>
          <Group gap={4}>
            {currentResume.skills.technical_skills.slice(0, 4).map((skill, index) => (
              <Badge 
                key={index} 
                size="sm" 
                color="violet" 
                variant="light"
              >
                {skill}
              </Badge>
            ))}
            {currentResume.skills.technical_skills.length > 4 && (
              <Badge size="sm" color="gray" variant="light">
                +{currentResume.skills.technical_skills.length - 4} more
              </Badge>
            )}
          </Group>
        </Box>
      </SimpleGrid>

      <Button 
        leftSection={<IconRefresh size={16} />}
        variant="light" 
        color="gray"
        onClick={handleReset}
        fullWidth
      >
        Upload New Resume
      </Button>
    </Stack>
  )
}