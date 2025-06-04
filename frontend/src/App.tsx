// frontend/src/App.tsx - Modern Mantine UI with Bento Box Design

import { useState } from 'react'
import { MantineProvider, AppShell, Container, Title, Grid, Card, Text, Box, Group, Badge, Stack } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { IconBriefcase, IconFileText, IconTarget, IconSparkles } from '@tabler/icons-react'
import JobTable, {type Job} from './components/JobTable'
import AddJobForm from './components/AddJobForm'
import ResumeUpload from './components/ResumeUpload'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dropzone/styles.css'

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

function App() {
  const [reload, setReload] = useState(false)
  const [resumeData, setResumeData] = useState<ParsedResumeData | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])

  const handleResumeUploaded = (data: ParsedResumeData) => {
    setResumeData(data)
  }

  return (
    <MantineProvider 
      theme={{
        primaryColor: 'blue',
        fontFamily: 'Inter, system-ui, sans-serif',
        headings: { fontFamily: 'Inter, system-ui, sans-serif' },
        components: {
          Card: {
            defaultProps: {
              shadow: 'sm',
              radius: 'md',
              withBorder: true,
            },
          },
        },
      }}
    >
      <Notifications position="top-right" />
      <AppShell
        padding={0}
        styles={{
          main: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh',
          },
        }}
      >
        <Container size="xl" py="xl" style={{ position: 'relative' }}>
          {/* Hero Section */}
          <Box mb="xl" ta="center">
            <Title 
              size="3.5rem" 
              fw={800} 
              c="white" 
              mb="sm"
              style={{
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                letterSpacing: '-0.02em'
              }}
            >
              🚀 Job Tracker Pro
            </Title>
            <Text 
              size="xl" 
              c="white" 
              opacity={0.9}
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.2)' }}
            >
              AI-Powered Resume Builder & Interview Prep Platform
            </Text>
          </Box>

          {/* Stats Cards - Bento Box Style */}
          <Grid mb="xl" gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card 
                h={120} 
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                <Group justify="space-between" h="100%">
                  <Stack gap={4}>
                    <Text c="white" size="lg" fw={600}>Applications</Text>
                    <Text c="white" size="2rem" fw={800}>{jobs.length}</Text>
                  </Stack>
                  <IconBriefcase size={32} color="white" opacity={0.8} />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card 
                h={120}
                style={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none'
                }}
              >
                <Group justify="space-between" h="100%">
                  <Stack gap={4}>
                    <Text c="white" size="lg" fw={600}>Resume</Text>
                    <Badge 
                      color={resumeData ? 'green' : 'gray'} 
                      size="lg"
                      variant="filled"
                    >
                      {resumeData ? 'Active' : 'Not Set'}
                    </Badge>
                  </Stack>
                  <IconFileText size={32} color="white" opacity={0.8} />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card 
                h={120}
                style={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  border: 'none'
                }}
              >
                <Group justify="space-between" h="100%">
                  <Stack gap={4}>
                    <Text c="white" size="lg" fw={600}>Interview Prep</Text>
                    <Text c="white" size="sm">AI Generated</Text>
                  </Stack>
                  <IconTarget size={32} color="white" opacity={0.8} />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card 
                h={120}
                style={{ 
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  border: 'none'
                }}
              >
                <Group justify="space-between" h="100%">
                  <Stack gap={4}>
                    <Text c="white" size="lg" fw={600}>AI Features</Text>
                    <Text c="white" size="sm">Smart & Fast</Text>
                  </Stack>
                  <IconSparkles size={32} color="white" opacity={0.8} />
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Main Content - Bento Grid Layout */}
          <Grid gutter="md">
            {/* Resume Upload - Large Card */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Card 
                h="auto"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <ResumeUpload onResumeUploaded={handleResumeUploaded} />
              </Card>
            </Grid.Col>

            {/* Add Job Form */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Card 
                h="auto"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <AddJobForm onJobAdded={() => setReload(prev => !prev)} />
              </Card>
            </Grid.Col>

            {/* Job Table - Full Width */}
            <Grid.Col span={12}>
              <Card 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <JobTable 
                  key={reload.toString()} 
                  hasResume={!!resumeData}
                  onJobsChange={setJobs}
                />
              </Card>
            </Grid.Col>
          </Grid>

          {/* Floating Elements for Visual Appeal */}
          <Box
            style={{
              position: 'absolute',
              top: '10%',
              right: '5%',
              width: '100px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              filter: 'blur(40px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '10%',
              width: '150px',
              height: '150px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              filter: 'blur(50px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </Container>
      </AppShell>
    </MantineProvider>
  )
}

export default App