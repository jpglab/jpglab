export type LoggerConfig = {
    minLevel: 'debug' | 'info' | 'warn' | 'error'
    excludeOperations?: string[]
    includeOperations?: string[]
    collapse: boolean
    expandOnError: boolean
    collapseUSB: boolean
    showEncodedData: boolean
    showDecodedData: boolean
    maxLogs?: number
}

export const defaultLoggerConfig: LoggerConfig = {
    minLevel: 'debug',
    collapse: false,
    expandOnError: true,
    collapseUSB: true,
    showEncodedData: false,
    showDecodedData: true,
}
