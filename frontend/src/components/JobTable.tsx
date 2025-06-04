// frontend/src/components/JobTable.tsx - Modern Mantine UI

import { useEffect, useState } from 'react'
import { 
  Table, 
  Badge, 
  Button, 
  Group, 
  Text, 
  ActionIcon, 
  Stack,
  Box,
  Card,
  Grid,
  Anchor,
  Select,
  Tooltip,
  Title,
  Alert,
  LoadingOverlay
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { 
  IconTarget, 
  IconFileText, 
  IconTrash, 
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconBriefcase,
  IconCalendar,
  IconBuilding,
  IconAlertCircle
} from '@tabler/icons-react'
import InterviewPrep from './InterviewPrep'
import ResumeCustomization from './ResumeCustomization'

export interface Job {
    id: string
    title: string
    company: string
    description: string
    url: string
    status: string
    date_applied: string
}

interface Props {
    hasResume: boolean
    onJobsChange: (jobs: Job[]) => void
}

export default function JobTable({ hasResume, onJobsChange }: Props) {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedJobForInterview, setSelectedJobForInterview] = useState<Job | null>(null)
    const [selectedJobForResume, setSelectedJobForResume] = useState<Job | null>(null)
    const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchJobs()
    }, [])

    const fetchJobs = async () => {
        try {
            const response = await fetch('http://localhost:8000/jobs')
            const data = await response.json()
            setJobs(data)
            onJobsChange(data)
        } catch (error) {
            notifications.show({
                title: 'Error Loading Jobs',
                message: 'Failed to fetch job applications',
                color: 'red',
            })
        } finally {
            setLoading(false)
        }
    }

    const toggleDescription = (jobId: string) => {
        const newExpanded = new Set(expandedDescriptions)
        if (newExpanded.has(jobId)) {
            newExpanded.delete(jobId)
        } else {
            newExpanded.add(jobId)
        }
        setExpandedDescriptions(newExpanded)
    }

    const handleDelete = (job: Job) => {
        modals.openConfirmModal({
            title: 'Delete Job Application',
            children: (
                <Text size="sm">
                    Are you sure you want to delete the application for <strong>{job.title}</strong> at <strong>{job.company}</strong>? 
                    This action cannot be undone.
                </Text>
            ),
            labels: { confirm: 'Delete', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await fetch(`http://localhost:8000/jobs/${job.id}`, {
                        method: 'DELETE',
                    })
                    await fetchJobs()
                    notifications.show({
                        title: 'Job Deleted',
                        message: 'Application removed successfully',
                        color: 'green',
                    })
                } catch (error) {
                    notifications.show({
                        title: 'Delete Failed',
                        message: 'Failed to delete job application',
                        color: 'red',
                    })
                }
            },
        })
    }

    const handleStatusChange = async (jobId: string, newStatus: string) => {
        try {
            await fetch(`http://localhost:8000/jobs/${jobId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            await fetchJobs()
            notifications.show({
                title: 'Status Updated',
                message: 'Job status updated successfully',
                color: 'blue',
            })
        } catch (error) {
            notifications.show({
                title: 'Update Failed',
                message: 'Failed to update job status',
                color: 'red',
            })
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Applied': return 'blue'
            case 'Interview': return 'green'
            case 'Rejected': return 'red'
            default: return 'gray'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Applied': return '📝'
            case 'Interview': return '🎯'
            case 'Rejected': return '❌'
            default: return '📋'
        }
    }

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength) + "..."
    }

    if (selectedJobForInterview) {
        return (
            <InterviewPrep 
                jobId={selectedJobForInterview.id}
                jobTitle={selectedJobForInterview.title}
                company={selectedJobForInterview.company}
                onClose={() => setSelectedJobForInterview(null)}
            />
        )
    }

    if (selectedJobForResume) {
        return (
            <ResumeCustomization 
                job={selectedJobForResume}
                onClose={() => setSelectedJobForResume(null)}
            />
        )
    }

    if (loading) {
        return (
            <Box pos="relative" h={200}>
                <LoadingOverlay visible />
            </Box>
        )
    }

    if (jobs.length === 0) {
        return (
            <Stack gap="md" ta="center" py="xl">
                <IconBriefcase size={64} color="var(--mantine-color-gray-4)" />
                <Title order={3} c="dimmed">No Job Applications Yet</Title>
                <Text c="dimmed">
                    Add your first job application above to get started with tracking your applications!
                </Text>
            </Stack>
        )
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <Title order={3} c="dark.7">🎯 Your Applications ({jobs.length})</Title>
                <Badge size="lg" variant="light" color="blue">
                    {jobs.filter(job => job.status === 'Applied').length} Active
                </Badge>
            </Group>

            {!hasResume && (
                <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    color="orange" 
                    variant="light"
                >
                    <Text size="sm">
                        💡 Upload your resume to unlock AI-powered resume customization for each application!
                    </Text>
                </Alert>
            )}

            {/* Mobile Card View */}
            <Box hiddenFrom="md">
                <Stack gap="md">
                    {jobs.map(job => {
                        const isExpanded = expandedDescriptions.has(job.id)
                        const shortDescription = truncateText(job.description, 100)
                        
                        return (
                            <Card key={job.id} withBorder>
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Stack gap={4}>
                                            <Text fw={600} size="lg">{job.title}</Text>
                                            <Group gap="xs">
                                                <IconBuilding size={14} />
                                                <Text size="sm" c="dimmed">{job.company}</Text>
                                            </Group>
                                        </Stack>
                                        <Badge 
                                            color={getStatusColor(job.status)} 
                                            variant="light"
                                            leftSection={<span style={{ fontSize: '10px' }}>{getStatusIcon(job.status)}</span>}
                                        >
                                            {job.status}
                                        </Badge>
                                    </Group>

                                    <Box>
                                        <Text size="sm" c="dimmed" lineClamp={isExpanded ? undefined : 2}>
                                            {isExpanded ? job.description : shortDescription}
                                        </Text>
                                        {job.description.length > 100 && (
                                            <Button 
                                                variant="subtle" 
                                                size="xs" 
                                                p={0}
                                                onClick={() => toggleDescription(job.id)}
                                            >
                                                {isExpanded ? 'Show less' : 'Show more'}
                                            </Button>
                                        )}
                                    </Box>

                                    <Group justify="space-between">
                                        <Group gap="xs">
                                            <IconCalendar size={14} />
                                            <Text size="sm" c="dimmed">{formatDate(job.date_applied)}</Text>
                                        </Group>
                                        <Anchor 
                                            href={job.url} 
                                            target="_blank" 
                                            size="sm"
                                            c="blue"
                                        >
                                            View Job <IconExternalLink size={12} />
                                        </Anchor>
                                    </Group>

                                    <Group grow>
                                        <Button
                                            leftSection={<IconFileText size={16} />}
                                            variant="light"
                                            color="blue"
                                            size="sm"
                                            disabled={!hasResume}
                                            onClick={() => setSelectedJobForResume(job)}
                                        >
                                            Resume
                                        </Button>
                                        <Button
                                            leftSection={<IconTarget size={16} />}
                                            variant="light"
                                            color="green"
                                            size="sm"
                                            onClick={() => setSelectedJobForInterview(job)}
                                        >
                                            Interview
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        )
                    })}
                </Stack>
            </Box>

            {/* Desktop Table View */}
            <Box visibleFrom="md">
                <Table highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Position</Table.Th>
                            <Table.Th>Company</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Applied</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {jobs.map(job => {
                            const isExpanded = expandedDescriptions.has(job.id)
                            const shortDescription = truncateText(job.description, 150)
                            
                            return (
                                <Table.Tr key={job.id}>
                                    <Table.Td>
                                        <Stack gap={4}>
                                            <Text fw={600}>{job.title}</Text>
                                            <Anchor 
                                                href={job.url} 
                                                target="_blank" 
                                                size="xs"
                                                c="blue"
                                            >
                                                View Posting <IconExternalLink size={10} />
                                            </Anchor>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text>{job.company}</Text>
                                    </Table.Td>
                                    <Table.Td style={{ maxWidth: 300 }}>
                                        <Text size="sm" c="dimmed">
                                            {isExpanded ? job.description : shortDescription}
                                        </Text>
                                        {job.description.length > 150 && (
                                            <Button 
                                                variant="subtle" 
                                                size="xs" 
                                                p={0}
                                                onClick={() => toggleDescription(job.id)}
                                                leftSection={isExpanded ? <IconEyeOff size={12} /> : <IconEye size={12} />}
                                            >
                                                {isExpanded ? 'Less' : 'More'}
                                            </Button>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Select
                                            value={job.status}
                                            onChange={(value) => value && handleStatusChange(job.id, value)}
                                            data={[
                                                { value: 'Applied', label: '📝 Applied' },
                                                { value: 'Interview', label: '🎯 Interview' },
                                                { value: 'Rejected', label: '❌ Rejected' },
                                            ]}
                                            size="sm"
                                            styles={{
                                                input: { 
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    fontWeight: 500,
                                                },
                                            }}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatDate(job.date_applied)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Tooltip label={hasResume ? "Customize resume for this role" : "Upload resume first"}>
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    color="blue"
                                                    disabled={!hasResume}
                                                    onClick={() => setSelectedJobForResume(job)}
                                                    leftSection={<IconFileText size={14} />}
                                                >
                                                    Resume
                                                </Button>
                                            </Tooltip>
                                            
                                            <Tooltip label="Practice interview questions">
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    color="green"
                                                    onClick={() => setSelectedJobForInterview(job)}
                                                    leftSection={<IconTarget size={14} />}
                                                >
                                                    Interview
                                                </Button>
                                            </Tooltip>
                                            
                                            <Tooltip label="Delete application">
                                                <ActionIcon
                                                    color="red"
                                                    variant="light"
                                                    onClick={() => handleDelete(job)}
                                                >
                                                    <IconTrash size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            )
                        })}
                    </Table.Tbody>
                </Table>
            </Box>
        </Stack>
    )
}