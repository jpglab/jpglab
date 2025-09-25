/**
 * PTP Protocol Implementation
 * Handles PTP protocol operations with injected transport
 */

import { TransportInterface } from '@transport/interfaces/transport.interface'
import { MessageBuilderInterface, MessageParserInterface } from '@core/messages'
import { PTPOperations } from '@constants/ptp/operations'
import { SonyOperations } from '@constants/vendors/sony/operations'
import { PTPResponses } from '@constants/ptp/responses'
import { PTPError } from '@constants/ptp/errors'
import { PTP_LIMITS } from '@constants/ptp/containers'
import { Operation, Response, Event, HexCode } from '@constants/types'
import { LoggerInterface } from '@core/logger'

/**
 * PTP Protocol interface for protocol-level operations
 */
export interface ProtocolInterface {
    /**
     * Open a new PTP session
     * @param sessionId - Session identifier
     */
    openSession(sessionId: HexCode): Promise<void>

    /**
     * Set the session open state (required for Sony)
     * @param isOpen - Whether the session is open
     */
    setSessionOpen(isOpen: boolean): Promise<void>

    /**
     * Close the current PTP session
     */
    closeSession(): Promise<void>

    /**
     * Send a PTP operation
     * @param operation - Operation to send
     * @returns Response from the operation
     */
    sendOperation(operation: Operation): Promise<Response>

    /**
     * Receive a PTP event
     * @returns Event data
     */
    receiveEvent(): Promise<Event>

    /**
     * Get current session ID
     */
    getSessionId(): HexCode | null

    /**
     * Check if session is active
     */
    isSessionOpen(): boolean

    /**
     * Reset the protocol state
     */
    reset(): Promise<void>
}

export class PTPProtocol implements ProtocolInterface {
    private sessionId: HexCode | null = null
    private isOpen = false

    constructor(
        private readonly transport: TransportInterface,
        private readonly messageBuilder: MessageBuilderInterface & MessageParserInterface,
        private readonly logger: LoggerInterface
    ) {}

    /**
     * Open a new PTP session
     */
    async openSession(sessionId: HexCode): Promise<void> {
        if (this.isOpen) {
            return // Don't throw, just return
        }

        // Build and send OpenSession command
        const command = this.messageBuilder.buildCommand(PTPOperations.OPEN_SESSION.code, [sessionId])

        await this.transport.send(command)

        // Receive response
        const responseData = await this.transport.receive(PTP_LIMITS.DEFAULT_RECEIVE_SIZE)
        const response = this.messageBuilder.parseResponse(responseData)

        // Check response code
        if (response.code === PTPResponses.SESSION_ALREADY_OPEN.code) {
            this.sessionId = sessionId
            this.isOpen = true
            return
        }

        if (response.code !== PTPResponses.OK.code) {
            throw new PTPError(
                response.code,
                `Failed to open session: 0x${response.code.toString(16).padStart(4, '0')}`,
                'OpenSession'
            )
        }

        this.sessionId = sessionId
        this.isOpen = true
    }

    async setSessionOpen(isOpen: boolean): Promise<void> {
        this.isOpen = isOpen
    }

    /**
     * Close the current PTP session
     */
    async closeSession(): Promise<void> {
        if (!this.isOpen) {
            return // Already closed
        }

        try {
            // Build and send CloseSession command
            const command = this.messageBuilder.buildCommand(PTPOperations.CLOSE_SESSION.code)

            await this.transport.send(command)

            // Receive response
            const responseData = await this.transport.receive(PTP_LIMITS.DEFAULT_RECEIVE_SIZE)
            const response = this.messageBuilder.parseResponse(responseData)

            // Check response code (be lenient on close)
            if (response.code !== PTPResponses.OK.code && response.code !== PTPResponses.SESSION_NOT_OPEN.code) {
            } else {
            }
        } finally {
            this.sessionId = null
            this.isOpen = false
        }
    }

    /**
     * Send a PTP operation
     */
    async sendOperation(operation: Operation): Promise<Response> {
        if (
            !this.isOpen &&
            operation.code !== PTPOperations.GET_DEVICE_INFO.code &&
            operation.code !== SonyOperations.SDIO_OPEN_SESSION.code
        ) {
            throw new PTPError(PTPResponses.SESSION_NOT_OPEN.code, 'Session not open', 'SendOperation')
        }

        // Find operation name and description
        const allOps = { ...PTPOperations, ...SonyOperations }
        const opDef = Object.entries(allOps).find(([_, op]) => op.code === operation.code)
        const opName = opDef ? opDef[0] : 'UNKNOWN'
        const opInfo = opDef ? opDef[1] : null

        const details: string[] = []

        if (opInfo?.description) {
            details.push(opInfo.description)
        }

        const dataMode = operation.respondsWithData
            ? 'expects data from device'
            : operation.expectsData
              ? 'sends data to device'
              : 'no data phase'
        details.push(`Data mode: ${dataMode}`)

        const parameters: string[] = []
        if (operation.parameters && operation.parameters.length > 0) {
            operation.parameters.forEach((param, i) => {
                parameters.push(`0x${param.toString(16).padStart(8, '0')}`)
                if (opInfo && 'parameters' in opInfo && opInfo.parameters) {
                    const paramDef = opInfo.parameters[i]
                    if (paramDef) {
                        details.push(`${paramDef.name}: 0x${param.toString(16)} (${param})`)
                        if (paramDef.description) {
                            details.push(`  ${paramDef.description}`)
                        }
                    }
                }
            })
        }

        const opId = this.logger.addLog({
            type: 'ptp_operation',
            message: 'Send operation',
            status: 'pending',
            operation,
        })
        const transactionId = this.messageBuilder.getNextTransactionId()

        try {
            // Send command phase
            // Convert parameters to runtime format if needed
            const runtimeParams =
                Array.isArray(operation.parameters) &&
                operation.parameters.length > 0 &&
                typeof operation.parameters[0] === 'number'
                    ? (operation.parameters as number[])
                    : []
            const command = this.messageBuilder.buildCommand(operation.code, runtimeParams)
            await this.transport.send(command)

            // Handle data phase if present
            let receivedData: Uint8Array | undefined

            if (operation.expectsData) {
                // Send data (data-out operation)
                const dataMessage = this.messageBuilder.buildData(operation.code, operation.data || new Uint8Array())
                await this.transport.send(dataMessage)
            } else if (operation.respondsWithData) {
                // Receive data (data-in operation)
                // Use maxDataLength if specified, otherwise use default
                const maxLength = operation.maxDataLength || PTP_LIMITS.DEFAULT_DATA_SIZE

                const dataResponse = await this.transport.receive(maxLength)

                const parsedData = this.messageBuilder.parseData(dataResponse)
                receivedData = parsedData.payload
            }

            // Receive response phase
            const responseData = await this.transport.receive(PTP_LIMITS.DEFAULT_RECEIVE_SIZE)
            const parsedResponse = this.messageBuilder.parseResponse(responseData)

            // Decode response code
            const respDef = Object.entries(PTPResponses).find(([_, resp]) => resp.code === parsedResponse.code)
            const respName = respDef ? respDef[0] : 'UNKNOWN'
            const respInfo = respDef ? respDef[1] : null

            const success = parsedResponse.code === PTPResponses.OK.code
            const statusMessage = success ? 'Operation completed' : `Operation failed`
            this.logger.updateEntry(opId, {
                message: statusMessage,
                status: success ? 'succeeded' : 'failed',
                response: parsedResponse,
            })

            // Build response object
            const response: Response = {
                code: parsedResponse.code,
                sessionId: this.sessionId || 0,
                transactionId,
                parameters: parsedResponse.parameters,
                data: receivedData,
            }

            return response
        } catch (error) {
            this.logger.updateEntry(opId, { message: `Operation failed: ${error}`, status: 'failed' })
            throw error
        }
    }

    /**
     * Receive a PTP event
     */
    async receiveEvent(): Promise<Event> {
        // Events would typically come from an interrupt endpoint
        // For now, this is a placeholder implementation
        // Real implementation would need to handle async event polling
        const eventData = await this.transport.receive(PTP_LIMITS.DEFAULT_RECEIVE_SIZE)
        const parsedEvent = this.messageBuilder.parseEvent(eventData)

        return {
            code: parsedEvent.code,
            sessionId: this.sessionId || 0,
            transactionId: parsedEvent.transactionId,
            parameters: parsedEvent.parameters,
        }
    }

    /**
     * Get current session ID
     */
    getSessionId(): HexCode | null {
        return this.sessionId
    }

    /**
     * Check if session is open
     */
    isSessionOpen(): boolean {
        return this.isOpen
    }

    /**
     * Reset the protocol state
     */
    async reset(): Promise<void> {
        if (this.isOpen) {
            await this.closeSession()
        }
        this.messageBuilder.resetTransactionId()
        this.sessionId = null
        this.isOpen = false
    }

    /**
     * Get device info (doesn't require open session)
     */
    async getDeviceInfo(): Promise<Response> {
        return this.sendOperation({
            code: PTPOperations.GET_DEVICE_INFO.code,
            respondsWithData: true,
        })
    }
}
