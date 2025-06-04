// frontend/src/components/AddJobForm.tsx - Complete Modern Mantine UI

import { useState } from 'react'
import { 
  TextInput, 
  Select, 
  Button, 
  Stack, 
  Group, 
  Text,
  Title,
  Alert,
  Box
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconBriefcase, 
  IconBuilding, 
  IconLink, 
  IconCalendar,
  IconPlus,
  IconCheck,
  IconX,
  IconSparkles,
  IconInfoCircle
} from '@tabler/icons-react'

interface JobFormData {
  title: string
  company: string
  url: string
  status: string
  date_applied: Date | null
}

interface Props {
  onJobAdded: () => void
}

export default function AddJobForm({ onJobAdded }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<JobFormData>({
    initialValues: {
      title: '',
      company: '',
      url: '',
      status: 'Applied',
      date_applied: new Date(),
    },
    validate: {
      title: (value: string) => (!value ? 'Job title is required' : null),
      company: (value: string) => (!value ? 'Company name is required' : null),
      url: (value: string) => {
        if (!value) return 'Job URL is required'
        try {
          new URL(value)
          return null
        } catch {
          return 'Please enter a valid URL'
        }
      },
      date_applied: (value: Date | null) => (!value ? 'Date applied is required' : null),
    },
  })

  const handleSubmit = async (values: JobFormData) => {
    setSubmitting(true)

    try {
      const response = await fetch('http://localhost:8000/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          date_applied: values.date_applied?.toISOString().split('T')[0],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add job')
      }

      form.reset()
      form.setFieldValue('date_applied', new Date())
      onJobAdded()

      notifications.show({
        title: 'Job Added Successfully! 🎉',
        message: 'Your job application has been saved and description generated',
        color: 'green',
        icon: <IconCheck size={16} />,
      })
    } catch (error) {
      notifications.show({
        title: 'Failed to Add Job',
        message: 'Please check your connection and try again',
        color: 'red',
        icon: <IconX size={16} />,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={3} c="dark.7">✨ Add New Application</Title>
      </Group>

      <Alert 
        icon={<IconSparkles size={16} />} 
        color="blue" 
        variant="light"
        styles={{
          root: {
            backgroundColor: 'var(--mantine-color-blue-0)',
            border: '1px solid var(--mantine-color-blue-3)',
          },
        }}
      >
        <Text size="sm" c="blue.8">
          🤖 AI will automatically generate a detailed job description from the URL you provide
        </Text>
      </Alert>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Job URL - Primary Field */}
          <Box 
            p="md"
            style={{
              backgroundColor: 'var(--mantine-color-blue-0)',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-blue-2)',
            }}
          >
            <TextInput
              label="Job URL"
              placeholder="https://company.com/careers/job-posting"
              leftSection={<IconLink size={16} />}
              required
              {...form.getInputProps('url')}
              styles={{
                label: { fontWeight: 600, color: 'var(--mantine-color-blue-8)' },
                input: { 
                  backgroundColor: 'white',
                  border: '1px solid var(--mantine-color-blue-3)',
                  '&:focus': {
                    borderColor: 'var(--mantine-color-blue-5)',
                  },
                },
              }}
            />
            <Text size="xs" c="blue.7" mt={4}>
              💡 Paste the job posting URL - we'll extract all the details automatically
            </Text>
          </Box>

          {/* Basic Info Grid */}
          <Group grow>
            <TextInput
              label="Job Title"
              placeholder="Software Engineer"
              leftSection={<IconBriefcase size={16} />}
              required
              {...form.getInputProps('title')}
              styles={{
                label: { fontWeight: 500 },
                input: { 
                  '&:focus': { borderColor: 'var(--mantine-color-blue-5)' }
                },
              }}
            />
            <TextInput
              label="Company"
              placeholder="Amazing Tech Co."
              leftSection={<IconBuilding size={16} />}
              required
              {...form.getInputProps('company')}
              styles={{
                label: { fontWeight: 500 },
                input: { 
                  '&:focus': { borderColor: 'var(--mantine-color-blue-5)' }
                },
              }}
            />
          </Group>

          {/* Status and Date */}
          <Group grow>
            <Select
              label="Application Status"
              data={[
                { value: 'Applied', label: '📝 Applied' },
                { value: 'Interview', label: '🎯 Interview' },
                { value: 'Rejected', label: '❌ Rejected' },
              ]}
              {...form.getInputProps('status')}
              styles={{
                label: { fontWeight: 500 },
                input: { 
                  '&:focus': { borderColor: 'var(--mantine-color-blue-5)' }
                },
              }}
            />
            <DateInput
              label="Date Applied"
              placeholder="Select date"
              leftSection={<IconCalendar size={16} />}
              required
              {...form.getInputProps('date_applied')}
              styles={{
                label: { fontWeight: 500 },
                input: { 
                  '&:focus': { borderColor: 'var(--mantine-color-blue-5)' }
                },
              }}
            />
          </Group>

          {/* Submit Button */}
          <Button
            type="submit"
            loading={submitting}
            leftSection={<IconPlus size={16} />}
            size="md"
            fullWidth
            gradient={{ from: 'blue', to: 'purple', deg: 45 }}
            styles={{
              root: {
                marginTop: 'var(--mantine-spacing-md)',
                height: '50px',
                fontSize: 'var(--mantine-fontsize-md)',
                fontWeight: 600,
              },
            }}
          >
            {submitting ? 'Adding Application...' : 'Add Job Application'}
          </Button>
        </Stack>
      </form>
    </Stack>
  )
}