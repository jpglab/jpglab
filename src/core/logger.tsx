import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { render, Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { Operation, Response } from '@constants/types'

// Base log entry interface
type BaseLogEntry = {
    status: 'pending' | 'succeeded' | 'failed'
    message: string
}

type USBTransferEntry = BaseLogEntry & {
    type: 'usb_transfer'
    direction: 'send' | 'receive'
    bytes: number
    endpoint: 'bulkIn' | 'bulkOut' | 'interrupt'
    endpointAddress: string
}

type PTPOperationEntry = BaseLogEntry & {
    type: 'ptp_operation'
    operation: Operation
    response?: Response
}

type PTPSessionEntry = BaseLogEntry & {
    type: 'ptp_session'
    sessionId?: number
}

type ErrorEntry = BaseLogEntry & {
    type: 'error'
    details?: string[]
}

type InfoEntry = BaseLogEntry & {
    type: 'info'
}

type WarningEntry = BaseLogEntry & {
    type: 'warning'
}

// before instantiated in the logger it will not have id and timestamp
type NewLogEntry = USBTransferEntry | PTPOperationEntry | PTPSessionEntry | ErrorEntry | InfoEntry | WarningEntry
type LogEntry = NewLogEntry & { id: number; timestamp: number }

export interface LoggerInterface {
    addLog(entry: NewLogEntry): number
    updateEntry(id: number, updates: Partial<LogEntry>): number
}

const getRandomId = (): number => {
    return Date.now() + Math.round(Math.random() * 1000)
}

const LoggerDisplay = forwardRef<LoggerInterface, { maxEntries?: number }>(({ maxEntries = 100 }, ref) => {
    const [logs, setLogs] = useState<{ [key: string]: LogEntry }>({})
    const [nextId, setNextId] = useState<number>(getRandomId())

    const addLog = useCallback(
        (entry: Omit<LogEntry, 'id' | 'timestamp'>): number => {
            const newId = getRandomId()
            setNextId(newId)
            const newEntry = { ...entry, id: newId, timestamp: Date.now() } as LogEntry
            setLogs(prevLogs => ({ ...prevLogs, [newId]: newEntry }))
            return newId
        },
        [nextId]
    )

    const updateEntry = useCallback((id: number, updates: Partial<LogEntry>): number => {
        setLogs(prevLogs => ({
            ...prevLogs,
            [id]: { ...prevLogs[id], ...updates } as LogEntry,
        }))
        return id
    }, [])

    useImperativeHandle(
        ref,
        () => ({
            addLog,
            updateEntry,
        }),
        [addLog, updateEntry]
    )

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    const getTypeColor = (entry: LogEntry) => {
        switch (entry.type) {
            case 'ptp_session':
                return 'magenta'
            case 'ptp_operation':
                return 'cyan'
            case 'usb_transfer':
                return entry.direction === 'send' ? 'cyan' : 'green'
            case 'error':
                return 'red'
            case 'info':
                return 'blue'
            default:
                return 'white'
        }
    }

    const getTypeIcon = (entry: LogEntry) => {
        // Show spinner for pending status
        if (entry.status === 'pending') {
            return <Spinner type="dots" />
        }

        switch (entry.type) {
            case 'ptp_session':
                return '⚡'
            case 'ptp_operation':
                return entry.status === 'failed' ? '✗' : '⚡'
            case 'usb_transfer':
                if (entry.status === 'failed') return '✗'
                return entry.direction === 'send' ? '↗' : '↙'
            case 'error':
                return '✗'
            case 'info':
                return 'ℹ'
            default:
                return '•'
        }
    }

    const getSourcePrefix = (entry: LogEntry) => {
        switch (entry.type) {
            case 'usb_transfer':
                return 'USB'
            case 'ptp_operation':
            case 'ptp_session':
                return 'PTP'
            case 'error':
            case 'info':
            default:
                return 'SYS'
        }
    }

    const formatMessage = (entry: LogEntry) => {
        switch (entry.type) {
            case 'usb_transfer':
                return `${entry.message} [using ${entry.endpoint}: ${entry.endpointAddress}] (${entry.bytes} bytes) `
            case 'ptp_operation':
                return `${entry.message} ${entry.operation.code.toString(16)} [${entry.operation.code}]`
            case 'ptp_session':
            case 'error':
            case 'info':
            default:
                return entry.message
        }
    }

    return (
        <Box flexDirection="column">
            {Object.values(logs).map(entry => (
                <Box key={entry.id} marginBottom={0}>
                    <Text dimColor>{formatTime(entry.timestamp)}</Text>
                    <Text color={getSourcePrefix(entry) === 'USB' ? 'yellow' : 'cyan'} bold>
                        {' '}
                        [{getSourcePrefix(entry)}]{' '}
                    </Text>
                    <Text color={getTypeColor(entry)} bold>
                        {getTypeIcon(entry)}{' '}
                    </Text>
                    <Text color={getTypeColor(entry)}>{formatMessage(entry)}</Text>
                </Box>
            ))}
        </Box>
    )
})

class Logger implements LoggerInterface {
    private loggerRef = React.createRef<LoggerInterface>()

    constructor() {
        render(<LoggerDisplay ref={this.loggerRef} />)
    }

    addLog(entry: NewLogEntry): number {
        if (this.loggerRef.current) {
            return this.loggerRef.current.addLog(entry)
        }
        return -1
    }

    updateEntry(id: number, updates: Partial<LogEntry>): number {
        if (this.loggerRef.current) {
            return this.loggerRef.current.updateEntry(id, updates)
        }
        return -1 // Return invalid ID if ref not available
    }
}

export { Logger }
export type { LogEntry }
