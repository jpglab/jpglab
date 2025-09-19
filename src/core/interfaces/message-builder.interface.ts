/**
 * Message builder interface for constructing and parsing PTP messages
 */
export interface MessageBuilderInterface {
    /**
     * Build a command message
     * @param operation - Operation code
     * @param parameters - Operation parameters
     * @returns Encoded message
     */
    buildCommand(operation: number, parameters?: number[]): Uint8Array

    /**
     * Build a data message
     * @param operation - Operation code
     * @param data - Data payload
     * @returns Encoded message
     */
    buildData(operation: number, data: Uint8Array): Uint8Array

    /**
     * Parse a response message
     * @param data - Raw response data
     * @returns Parsed response
     */
    parseResponse(data: Uint8Array): ParsedResponse

    /**
     * Parse an event message
     * @param data - Raw event data
     * @returns Parsed event
     */
    parseEvent(data: Uint8Array): ParsedEvent

    /**
     * Parse data payload
     * @param data - Raw data
     * @returns Parsed data
     */
    parseData(data: Uint8Array): ParsedData

    /**
     * Get next transaction ID
     */
    getNextTransactionId(): number

    /**
     * Reset transaction ID (for new sessions)
     */
    resetTransactionId(): void
}

/**
 * Parsed PTP response
 */
export interface ParsedResponse {
    code: number
    sessionId: number
    transactionId: number
    parameters: number[]
    type: MessageType
}

/**
 * Parsed PTP event
 */
export interface ParsedEvent {
    code: number
    sessionId: number
    transactionId: number
    parameters: number[]
}

/**
 * Parsed PTP data
 */
export interface ParsedData {
    sessionId: number
    transactionId: number
    payload: Uint8Array
}

/**
 * Message type enumeration
 */
export enum MessageType {
    COMMAND = 1,
    DATA = 2,
    RESPONSE = 3,
    EVENT = 4,
}

/**
 * Data converter interface for type conversions
 */
export interface DataConverterInterface {
    /**
     * Convert value to PTP format
     * @param value - Value to convert
     * @param dataType - Target data type
     */
    toPTPFormat(value: unknown, dataType: PTPDataType): Uint8Array

    /**
     * Convert from PTP format
     * @param data - PTP formatted data
     * @param dataType - Source data type
     */
    fromPTPFormat(data: Uint8Array, dataType: PTPDataType): unknown
}

/**
 * PTP data types
 */
export enum PTPDataType {
    UINT8 = 0x0001,
    UINT16 = 0x0003,
    UINT32 = 0x0005,
    UINT64 = 0x0007,
    INT8 = 0x0002,
    INT16 = 0x0004,
    INT32 = 0x0006,
    INT64 = 0x0008,
    STRING = 0xffff,
    ARRAY = 0x4000,
}
