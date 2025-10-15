import { LoggerConfig, defaultLoggerConfig } from './logger-config'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type DecodedData = number | bigint | string | Uint8Array | object | number[] | null | undefined

type BaseLog = {
    id: number
    timestamp: number
    level: LogLevel
}

type PTPOperationLog = BaseLog & {
    type: 'ptp_operation'
    sessionId: number
    transactionId: number

    requestPhase: {
        timestamp: number
        operationName: string
        encodedParams?: Uint8Array[]
        decodedParams: Record<string, number | bigint | string | object>
    }

    dataPhase?: {
        timestamp: number
        direction: 'in' | 'out'
        bytes: number
        encodedData?: Uint8Array
        decodedData?: DecodedData
        maxDataLength?: number
    }

    responsePhase?: {
        timestamp: number
        code: number
    }
}

type USBTransferLog = BaseLog & {
    type: 'usb_transfer'
    direction: 'send' | 'receive'
    bytes: number
    endpoint: 'bulkIn' | 'bulkOut' | 'interrupt'
    endpointAddress: string

    sessionId: number
    transactionId: number
    phase: 'request' | 'data' | 'response'
}

type ConsoleLog = BaseLog & {
    type: 'console'
    consoleLevel: 'log' | 'error' | 'info' | 'warn'
    args: (number | bigint | string | boolean | null | undefined | object)[]
}

type PTPTransferLog = Omit<PTPOperationLog, 'type'> & {
    type: 'ptp_transfer'
    objectHandle: number
    totalBytes: number
    transferredBytes: number
    chunks: Array<{
        transactionId: number
        timestamp: number
        offset: number
        bytes: number
    }>
}

type PTPEventLog = BaseLog & {
    type: 'ptp_event'
    sessionId: number
    eventCode: number
    eventName: string
    encodedParams: number[]
    decodedParams: Record<string, number | bigint | string>
}

type Log = PTPOperationLog | USBTransferLog | PTPTransferLog | ConsoleLog | PTPEventLog

type NewLog =
    | Omit<PTPOperationLog, 'id' | 'timestamp'>
    | Omit<USBTransferLog, 'id' | 'timestamp'>
    | Omit<PTPTransferLog, 'id' | 'timestamp'>
    | Omit<ConsoleLog, 'id' | 'timestamp'>
    | Omit<PTPEventLog, 'id' | 'timestamp'>

export class Logger {
    private logs: Map<string, Log[]> = new Map()
    private orderedTransactions: Array<{
        key: string
        timestamp: number
    }> = []
    private config: LoggerConfig
    private nextId: number = 1
    private changeListeners: Array<() => void> = []
    private notifyTimeout: NodeJS.Timeout | null = null
    private inkInstance: { unmount: () => void; waitUntilExit: () => Promise<void> } | null = null
    private activeTransfers: Map<number, number> = new Map()
    private originalConsole = {
        log: console.log.bind(console),
        error: console.error.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
    }

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = { ...defaultLoggerConfig, ...config }

        if (typeof window === 'undefined' && typeof process !== 'undefined') {
            this.captureConsole()
            this.setupInkRenderer()
        }
    }

    private captureConsole() {
        const createWrapper = (consoleLevel: 'log' | 'error' | 'info' | 'warn') => {
            return (...args: (number | bigint | string | boolean | null | undefined | object)[]) => {
                this.addLog({
                    type: 'console',
                    level: 'info',
                    consoleLevel,
                    args,
                })
            }
        }

        console.log = createWrapper('log')
        console.error = createWrapper('error')
        console.info = createWrapper('info')
        console.warn = createWrapper('warn')
    }

    private setupInkRenderer() {
        import('react')
            .then(React => {
                import('ink')
                    .then(({ render }) => {
                        import('./renderers/ink')
                            .then(({ InkLogger }) => {
                                this.inkInstance = render(React.createElement(InkLogger, { logger: this }), {
                                    patchConsole: false,
                                })
                            })
                            .catch(() => {})
                    })
                    .catch(() => {})
            })
            .catch(() => {})
    }

    onChange(listener: () => void) {
        this.changeListeners.push(listener)
    }

    private notifyChange() {
        if (this.notifyTimeout) {
            clearTimeout(this.notifyTimeout)
        }
        this.notifyTimeout = setTimeout(() => {
            for (const listener of this.changeListeners) {
                listener()
            }
            this.notifyTimeout = null
        }, 10)
    }

    private getKey(sessionId: number, transactionId: number): string {
        return `${sessionId}:${transactionId}`
    }

    addLog(log: NewLog): number {
        const id = this.nextId++
        const timestamp = Date.now()

        if (log.type === 'console') {
            const consoleLog: ConsoleLog = { ...log, id, timestamp }
            const key = `console:${id}`
            this.logs.set(key, [consoleLog])
            this.orderedTransactions.push({ key, timestamp })
        } else if (log.type === 'ptp_operation') {
            const ptpLog: PTPOperationLog = Object.assign({}, log, { id, timestamp })
            const key = this.getKey(log.sessionId, log.transactionId)
            const existing = this.logs.get(key)
            if (!existing) {
                this.logs.set(key, [ptpLog])
                this.orderedTransactions.push({ key, timestamp })
            } else {
                existing.push(ptpLog)
            }
        } else if (log.type === 'ptp_transfer') {
            const transferLog: PTPTransferLog = Object.assign({}, log, { id, timestamp })
            const key = this.getKey(log.sessionId, log.transactionId)
            const existing = this.logs.get(key)
            if (!existing) {
                this.logs.set(key, [transferLog])
                this.orderedTransactions.push({ key, timestamp })
            } else {
                existing.push(transferLog)
            }
        } else if (log.type === 'usb_transfer') {
            const usbLog: USBTransferLog = Object.assign({}, log, { id, timestamp })
            const key = this.getKey(log.sessionId, log.transactionId)
            const existing = this.logs.get(key)
            if (!existing) {
                this.logs.set(key, [usbLog])
                this.orderedTransactions.push({ key, timestamp })
            } else {
                existing.push(usbLog)
            }
        } else if (log.type === 'ptp_event') {
            const eventLog: PTPEventLog = { ...log, id, timestamp }
            const key = `event:${log.sessionId}:${id}`
            this.logs.set(key, [eventLog])
            this.orderedTransactions.push({ key, timestamp })
        }

        this.trimIfNeeded()
        this.notifyChange()
        return id
    }

    updateLog(id: number, updates: Partial<Log>): number {
        for (const logs of this.logs.values()) {
            const index = logs.findIndex(l => l.id === id)
            if (index !== -1) {
                logs[index] = Object.assign({}, logs[index], updates)
                this.notifyChange()
                break
            }
        }
        return id
    }

    getLogs(): Log[] {
        return Array.from(this.logs.values()).flat()
    }

    getLogById(id: number): Log | undefined {
        for (const logs of this.logs.values()) {
            const found = logs.find(l => l.id === id)
            if (found) return found
        }
        return undefined
    }

    getLogsByTransaction(sessionId: number, transactionId: number): Log[] {
        return this.logs.get(this.getKey(sessionId, transactionId)) || []
    }

    setConfig(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config }
    }

    getConfig(): LoggerConfig {
        return this.config
    }

    clear(): void {
        this.logs.clear()
        this.orderedTransactions = []
        this.activeTransfers.clear()
        this.nextId = 1
    }

    getActiveTransfer(objectHandle: number): number | undefined {
        return this.activeTransfers.get(objectHandle)
    }

    registerTransfer(objectHandle: number, logId: number): void {
        this.activeTransfers.set(objectHandle, logId)
    }

    completeTransfer(objectHandle: number): void {
        this.activeTransfers.delete(objectHandle)
    }

    private trimIfNeeded(): void {
        if (!this.config.maxLogs || this.orderedTransactions.length <= this.config.maxLogs) return

        const toDelete = this.orderedTransactions.slice(0, this.orderedTransactions.length - this.config.maxLogs)
        toDelete.forEach(({ key }) => this.logs.delete(key))
        this.orderedTransactions = this.orderedTransactions.slice(-this.config.maxLogs)
    }
}

export type { BaseLog, ConsoleLog, Log, LogLevel, NewLog, PTPEventLog, PTPOperationLog, PTPTransferLog, USBTransferLog }
