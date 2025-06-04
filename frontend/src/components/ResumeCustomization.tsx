// frontend/src/components/ResumeCustomization.tsx - Modern Mantine UI

import { useState } from 'react'
import { 
  Stack, 
  Group, 
  Button, 
  Text, 
  Card, 
  Badge, 
  Checkbox,
  ActionIcon,
  Box,
  Alert,
  Title,
  SimpleGrid,
  Divider,
  Container,
  LoadingOverlay,
  ScrollArea,
  List
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { 
  IconX, 
  IconFileText, 
  IconDownload,
  IconSparkles,
  IconRefresh,
  IconUser,
  IconBriefcase,
  IconRocket,
  IconCode,
  IconFileDescription,
  IconCheck
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

interface Job {
  id: string
  title: string
  company: string
  description: string
}

interface Props {
  job: Job
  onClose: () => void
}

export default function ResumeCustomization({ job, onClose }: Props) {
  const [selectedSections, setSelectedSections] = useState<string[]>(['skills', 'experience'])
  const [customizing, setCustomizing] = useState(false)
  const [customizedResume, setCustomizedResume] = useState<ParsedResumeData | null>(null)

  const availableSections = [
    { 
      id: 'skills', 
      label: 'Technical Skills', 
      description: 'Reorder and optimize technical skills for relevance',
      icon: IconCode,
      color: 'blue'
    },
    { 
      id: 'experience', 
      label: 'Work Experience', 
      description: 'Rewrite job descriptions to match the role',
      icon: IconBriefcase,
      color: 'green'
    },
    { 
      id: 'projects', 
      label: 'Projects', 
      description: 'Select and optimize most relevant projects',
      icon: IconRocket,
      color: 'purple'
    },
    { 
      id: 'summary', 
      label: 'Professional Summary', 
      description: 'Generate a targeted professional summary',
      icon: IconFileDescription,
      color: 'orange'
    }
  ]

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleCustomize = async () => {
    if (selectedSections.length === 0) {
      notifications.show({
        title: 'No Sections Selected',
        message: 'Please select at least one section to customize',
        color: 'orange',
      })
      return
    }

    setCustomizing(true)

    try {
      const response = await fetch('http://localhost:8000/resume/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.id,
          sections_to_update: selectedSections
        })
      })

      if (!response.ok) {
        throw new Error('Failed to customize resume')
      }

      const data = await response.json()
      setCustomizedResume(data.customized_data)
      
      notifications.show({
        title: 'Resume Customized! 🎉',
        message: `Updated ${selectedSections.length} sections for ${job.company}`,
        color: 'green',
        icon: <IconCheck size={16} />,
      })
      
    } catch (err) {
      notifications.show({
        title: 'Customization Failed',
        message: 'Please try again',
        color: 'red',
      })
      console.error('Customization error:', err)
    } finally {
      setCustomizing(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:8000/resume/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.id,
          sections_to_update: selectedSections
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_${job.company.replace(/\s+/g, '_')}_${job.title.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      notifications.show({
        title: 'PDF Downloaded! 📄',
        message: 'Your customized resume is ready',
        color: 'green',
      })
    } catch (err) {
      notifications.show({
        title: 'Download Failed',
        message: 'Please try again',
        color: 'red',
      })
    }
  }

  return (
    <Container size="xl" py="xl">
      <Card withBorder shadow="md" p="xl">
        <Group justify="space-between" mb="xl">
          <Stack gap="xs">
            <Title order={2}>📄 Customize Resume</Title>
            <Card withBorder p="sm" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
              <Text fw={500}>{job.title}</Text>
              <Text size="sm" c="dimmed">{job.company}</Text>
            </Card>
          </Stack>
          <ActionIcon variant="light" color="gray" onClick={onClose} size="lg">
            <IconX size={18} />
          </ActionIcon>
        </Group>

        {!customizedResume ? (
          <Stack gap="xl">
            <Alert icon={<IconSparkles size={16} />} color="blue" variant="light">
              Select which sections to customize for this specific role. Our AI will optimize your content to match the job requirements.
            </Alert>

            <Box>
              <Title order={4} mb="md">Select Sections to Customize:</Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {availableSections.map(section => {
                  const Icon = section.icon
                  const isSelected = selectedSections.includes(section.id)
                  
                  return (
                    <Card 
                      key={section.id} 
                      withBorder 
                      p="md"
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: isSelected ? `var(--mantine-color-${section.color}-0)` : 'transparent',
                        borderColor: isSelected ? `var(--mantine-color-${section.color}-3)` : 'var(--mantine-color-gray-3)',
                      }}
                      onClick={() => handleSectionToggle(section.id)}
                    >
                      <Group gap="md">
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => handleSectionToggle(section.id)}
                          color={section.color}
                        />
                        <Icon size={24} color={`var(--mantine-color-${section.color}-6)`} />
                        <Stack gap={4} style={{ flex: 1 }}>
                          <Text fw={500}>{section.label}</Text>
                          <Text size="sm" c="dimmed">{section.description}</Text>
                        </Stack>
                      </Group>
                    </Card>
                  )
                })}
              </SimpleGrid>
            </Box>

            <Card withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <Title order={5} mb="sm">📋 Job Description Preview</Title>
              <ScrollArea h={200}>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  {job.description}
                </Text>
              </ScrollArea>
            </Card>

            <Button
              onClick={handleCustomize}
              disabled={selectedSections.length === 0}
              loading={customizing}
              size="lg"
              fullWidth
              leftSection={<IconSparkles size={20} />}
              gradient={{ from: 'blue', to: 'purple', deg: 45 }}
            >
              {customizing ? "Customizing Resume..." : "Customize Resume"}
            </Button>
          </Stack>
        ) : (
          <Stack gap="xl">
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              <Group justify="space-between">
                <Text fw={500}>Resume customized successfully!</Text>
                <Badge color="green" variant="filled">
                  {selectedSections.length} sections updated
                </Badge>
              </Group>
            </Alert>

            <ScrollArea h={600}>
              <Stack gap="lg">
                {/* Personal Info */}
                {customizedResume.personal_info.name && (
                  <Card withBorder p="md">
                    <Group mb="sm">
                      <IconUser size={20} color="var(--mantine-color-blue-6)" />
                      <Text fw={600}>Personal Information</Text>
                    </Group>
                    <Text><strong>Name:</strong> {customizedResume.personal_info.name}</Text>
                    {customizedResume.personal_info.email && (
                      <Text><strong>Email:</strong> {customizedResume.personal_info.email}</Text>
                    )}
                    {customizedResume.personal_info.phone && (
                      <Text><strong>Phone:</strong> {customizedResume.personal_info.phone}</Text>
                    )}
                  </Card>
                )}

                {/* Summary */}
                {selectedSections.includes('summary') && customizedResume.summary && (
                  <Card withBorder p="md">
                    <Group mb="sm">
                      <IconFileDescription size={20} color="var(--mantine-color-orange-6)" />
                      <Text fw={600}>Professional Summary</Text>
                      <Badge color="orange" size="sm">Updated</Badge>
                    </Group>
                    <Text style={{ lineHeight: 1.6 }}>{customizedResume.summary}</Text>
                  </Card>
                )}

                {/* Skills */}
                {selectedSections.includes('skills') && (
                  <Card withBorder p="md">
                    <Group mb="sm">
                      <IconCode size={20} color="var(--mantine-color-blue-6)" />
                      <Text fw={600}>Technical Skills</Text>
                      <Badge color="blue" size="sm">Optimized</Badge>
                    </Group>
                    <Group gap="xs">
                      {customizedResume.skills.technical_skills.map((skill, index) => (
                        <Badge key={index} variant="light" color="blue">
                          {skill}
                        </Badge>
                      ))}
                    </Group>
                  </Card>
                )}

                {/* Experience */}
                {selectedSections.includes('experience') && customizedResume.experience.length > 0 && (
                  <Card withBorder p="md">
                    <Group mb="sm">
                      <IconBriefcase size={20} color="var(--mantine-color-green-6)" />
                      <Text fw={600}>Professional Experience</Text>
                      <Badge color="green" size="sm">Enhanced</Badge>
                    </Group>
                    <Stack gap="md">
                      {customizedResume.experience.map((exp, index) => (
                        <Box key={index}>
                          <Group justify="space-between" mb="xs">
                            <Text fw={500}>{exp.role}</Text>
                            <Text size="sm" c="dimmed">{exp.duration}</Text>
                          </Group>
                          <Text c="dimmed" mb="xs">
                            {exp.company} {exp.location && `• ${exp.location}`}
                          </Text>
                          <List size="sm" spacing={4}>
                            {exp.responsibilities.map((resp, respIndex) => (
                              <List.Item key={respIndex}>{resp}</List.Item>
                            ))}
                          </List>
                          {index < customizedResume.experience.length - 1 && <Divider my="md" />}
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                )}

                {/* Projects */}
                {selectedSections.includes('projects') && customizedResume.projects.length > 0 && (
                  <Card withBorder p="md">
                    <Group mb="sm">
                      <IconRocket size={20} color="var(--mantine-color-purple-6)" />
                      <Text fw={600}>Projects</Text>
                      <Badge color="purple" size="sm">Curated</Badge>
                    </Group>
                    <Stack gap="md">
                      {customizedResume.projects.map((project, index) => (
                        <Box key={index}>
                          <Group justify="space-between" mb="xs">
                            <Text fw={500}>{project.name}</Text>
                            {project.duration && <Text size="sm" c="dimmed">{project.duration}</Text>}
                          </Group>
                          <Text mb="xs" style={{ lineHeight: 1.5 }}>{project.description}</Text>
                          <Group gap="xs">
                            {project.technologies.map((tech, techIndex) => (
                              <Badge key={techIndex} size="sm" color="purple" variant="light">
                                {tech}
                              </Badge>
                            ))}
                          </Group>
                          {index < customizedResume.projects.length - 1 && <Divider my="md" />}
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                )}
              </Stack>
            </ScrollArea>

            <Group justify="center" gap="md">
              <Button
                onClick={handleDownload}
                size="lg"
                leftSection={<IconDownload size={20} />}
                gradient={{ from: 'green', to: 'teal', deg: 45 }}
              >
                Download PDF Resume
              </Button>
              <Button
                onClick={() => {
                  setCustomizedResume(null)
                  setSelectedSections(['skills', 'experience'])
                }}
                size="lg"
                variant="light"
                leftSection={<IconRefresh size={20} />}
              >
                Customize Again
              </Button>
            </Group>
          </Stack>
        )}
      </Card>
    </Container>
  )
}