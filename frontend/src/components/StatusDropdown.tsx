// frontend/src/components/StatusDropdown.tsx - Modern Mantine UI

import { useState } from 'react'
import { Select } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'

interface Props {
  jobId: string
  currentStatus: string
  onStatusChange: () => void
}

export default function StatusDropdown({ jobId, currentStatus, onStatusChange }: Props) {
  const [value, setValue] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  const statusOptions = [
    { 
      value: 'Applied', 
      label: '📝 Applied',
    },
    { 
      value: 'Interview', 
      label: '🎯 Interview',
    },
    { 
      value: 'Rejected', 
      label: '❌ Rejected',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'blue'
      case 'Interview': return 'green'
      case 'Rejected': return 'red'
      default: return 'gray'
    }
  }

  const handleChange = async (newStatus: string | null) => {
    if (!newStatus) return
    
    setLoading(true)
    const previousStatus = value
    setValue(newStatus) // Optimistic update

    try {
      const response = await fetch(`http://localhost:8000/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      onStatusChange() // Refresh parent component

      notifications.show({
        title: 'Status Updated ✅',
        message: `Changed to ${newStatus}`,
        color: getStatusColor(newStatus),
        icon: <IconCheck size={16} />,
        autoClose: 3000,
      })
      
    } catch (error) {
      // Revert on error
      setValue(previousStatus)
      
      notifications.show({
        title: 'Update Failed',
        message: 'Could not update job status',
        color: 'red',
        icon: <IconX size={16} />,
      })
      
      console.error('Status update error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select
      value={value}
      onChange={handleChange}
      data={statusOptions}
      disabled={loading}
      size="sm"
      styles={{
        input: {
          border: 'none',
          backgroundColor: 'transparent',
          fontWeight: 500,
          color: `var(--mantine-color-${getStatusColor(value)}-7)`,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: `var(--mantine-color-${getStatusColor(value)}-0)`,
          },
          '&:focus': {
            backgroundColor: `var(--mantine-color-${getStatusColor(value)}-0)`,
            borderColor: `var(--mantine-color-${getStatusColor(value)}-3)`,
          },
        },
        dropdown: {
          border: `1px solid var(--mantine-color-${getStatusColor(value)}-3)`,
        },
        option: {
          '&[data-selected]': {
            backgroundColor: `var(--mantine-color-${getStatusColor(value)}-1)`,
            color: `var(--mantine-color-${getStatusColor(value)}-8)`,
          },
          '&:hover': {
            backgroundColor: `var(--mantine-color-${getStatusColor(value)}-0)`,
          },
        },
      }}
      comboboxProps={{
        withinPortal: true,
        shadow: 'md',
        transitionProps: { duration: 200, transition: 'pop' },
      }}
    />
  )
}