/**
 * PTP Protocol interface for protocol-level operations
 */
export interface ProtocolInterface {
    /**
     * Open a new PTP session
     * @param sessionId - Session identifier
     */
    openSession(sessionId: number): Promise<void>

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
    getSessionId(): number | null

    /**
     * Check if session is active
     */
    isSessionOpen(): boolean

    /**
     * Reset the protocol state
     */
    reset(): Promise<void>
}

/**
 * PTP Operation
 */
export interface Operation {
    code: number
    parameters?: number[]
    data?: Uint8Array
    hasDataPhase?: boolean
    maxDataLength?: number // Maximum expected data length for data-in operations
}

/**
 * PTP Response
 */
export interface Response {
    code: number
    sessionId: number
    transactionId: number
    parameters?: number[]
    data?: Uint8Array
}

/**
 * PTP Event
 */
export interface Event {
    code: number
    sessionId: number
    transactionId: number
    parameters?: number[]
}
