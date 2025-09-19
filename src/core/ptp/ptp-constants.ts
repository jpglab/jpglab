/**
 * PTP Protocol Constants
 * ISO 15740:2013 Picture Transfer Protocol
 */

/**
 * Container Types (PTP Protocol Section 9.3.1)
 */
export const ContainerTypes = {
    COMMAND_BLOCK: 0x0001,
    DATA_BLOCK: 0x0002,
    RESPONSE_BLOCK: 0x0003,
    EVENT_BLOCK: 0x0004,
} as const

export type ContainerType = (typeof ContainerTypes)[keyof typeof ContainerTypes]

/**
 * PTP Operation Codes (Standard Operations 0x1000-0x1FFF)
 */
export const PTPOperations = {
    // Session operations
    GET_DEVICE_INFO: 0x1001,
    OPEN_SESSION: 0x1002,
    CLOSE_SESSION: 0x1003,

    // Storage operations
    GET_STORAGE_IDS: 0x1004,
    GET_STORAGE_INFO: 0x1005,
    GET_NUM_OBJECTS: 0x1006,
    GET_OBJECT_HANDLES: 0x1007,

    // Object operations
    GET_OBJECT_INFO: 0x1008,
    GET_OBJECT: 0x1009,
    GET_THUMB: 0x100a,
    DELETE_OBJECT: 0x100b,
    SEND_OBJECT_INFO: 0x100c,
    SEND_OBJECT: 0x100d,

    // Capture operations
    INITIATE_CAPTURE: 0x100e,
    FORMAT_STORE: 0x100f,
    RESET_DEVICE: 0x1010,
    SELF_TEST: 0x1011,

    // Property operations
    SET_OBJECT_PROTECTION: 0x1012,
    POWER_DOWN: 0x1013,
    GET_DEVICE_PROP_DESC: 0x1014,
    GET_DEVICE_PROP_VALUE: 0x1015,
    SET_DEVICE_PROP_VALUE: 0x1016,
    RESET_DEVICE_PROP_VALUE: 0x1017,
    TERMINATE_OPEN_CAPTURE: 0x1018,

    // Object manipulation
    MOVE_OBJECT: 0x1019,
    COPY_OBJECT: 0x101a,
    GET_PARTIAL_OBJECT: 0x101b,
    INITIATE_OPEN_CAPTURE: 0x101c,
} as const

export type PTPOperationCode = (typeof PTPOperations)[keyof typeof PTPOperations]

/**
 * PTP Response Codes (Standard Responses 0x2000-0x2FFF)
 */
export const PTPResponses = {
    UNDEFINED: 0x2000,
    OK: 0x2001,
    GENERAL_ERROR: 0x2002,
    SESSION_NOT_OPEN: 0x2003,
    INVALID_TRANSACTION_ID: 0x2004,
    OPERATION_NOT_SUPPORTED: 0x2005,
    PARAMETER_NOT_SUPPORTED: 0x2006,
    INCOMPLETE_TRANSFER: 0x2007,
    INVALID_STORAGE_ID: 0x2008,
    INVALID_OBJECT_HANDLE: 0x2009,
    DEVICE_PROP_NOT_SUPPORTED: 0x200a,
    INVALID_OBJECT_FORMAT_CODE: 0x200b,
    STORAGE_FULL: 0x200c,
    OBJECT_WRITE_PROTECTED: 0x200d,
    STORE_READ_ONLY: 0x200e,
    ACCESS_DENIED: 0x200f,
    NO_THUMBNAIL_PRESENT: 0x2010,
    SELF_TEST_FAILED: 0x2011,
    PARTIAL_DELETION: 0x2012,
    STORE_NOT_AVAILABLE: 0x2013,
    SPECIFICATION_BY_FORMAT_UNSUPPORTED: 0x2014,
    NO_VALID_OBJECT_INFO: 0x2015,
    INVALID_CODE_FORMAT: 0x2016,
    UNKNOWN_VENDOR_CODE: 0x2017,
    CAPTURE_ALREADY_TERMINATED: 0x2018,
    DEVICE_BUSY: 0x2019,
    INVALID_PARENT_OBJECT: 0x201a,
    INVALID_DEVICE_PROP_FORMAT: 0x201b,
    INVALID_DEVICE_PROP_VALUE: 0x201c,
    INVALID_PARAMETER: 0x201d,
    SESSION_ALREADY_OPEN: 0x201e,
    TRANSACTION_CANCELLED: 0x201f,
    SPECIFICATION_OF_DESTINATION_UNSUPPORTED: 0x2020,
} as const

export type PTPResponseCode = (typeof PTPResponses)[keyof typeof PTPResponses]

/**
 * PTP Event Codes (Standard Events 0x4000-0x4FFF)
 */
export const PTPEvents = {
    UNDEFINED: 0x4000,
    CANCEL_TRANSACTION: 0x4001,
    OBJECT_ADDED: 0x4002,
    OBJECT_REMOVED: 0x4003,
    STORE_ADDED: 0x4004,
    STORE_REMOVED: 0x4005,
    DEVICE_PROP_CHANGED: 0x4006,
    OBJECT_INFO_CHANGED: 0x4007,
    DEVICE_INFO_CHANGED: 0x4008,
    REQUEST_OBJECT_TRANSFER: 0x4009,
    STORE_FULL: 0x400a,
    DEVICE_RESET: 0x400b,
    STORAGE_INFO_CHANGED: 0x400c,
    CAPTURE_COMPLETE: 0x400d,
    UNREPORTED_STATUS: 0x400e,
} as const

export type PTPEventCode = (typeof PTPEvents)[keyof typeof PTPEvents]

/**
 * PTP Device Properties (Standard Properties 0x5000-0x5FFF)
 */
export const PTPDeviceProperties = {
    UNDEFINED: 0x5000,
    BATTERY_LEVEL: 0x5001,
    FUNCTIONAL_MODE: 0x5002,
    IMAGE_SIZE: 0x5003,
    COMPRESSION_SETTING: 0x5004,
    WHITE_BALANCE: 0x5005,
    RGB_GAIN: 0x5006,
    F_NUMBER: 0x5007,
    FOCAL_LENGTH: 0x5008,
    FOCUS_DISTANCE: 0x5009,
    FOCUS_MODE: 0x500a,
    EXPOSURE_METERING_MODE: 0x500b,
    FLASH_MODE: 0x500c,
    EXPOSURE_TIME: 0x500d,
    EXPOSURE_PROGRAM_MODE: 0x500e,
    EXPOSURE_INDEX: 0x500f,
    EXPOSURE_BIAS_COMPENSATION: 0x5010,
    DATE_TIME: 0x5011,
    CAPTURE_DELAY: 0x5012,
    STILL_CAPTURE_MODE: 0x5013,
    CONTRAST: 0x5014,
    SHARPNESS: 0x5015,
    DIGITAL_ZOOM: 0x5016,
    EFFECT_MODE: 0x5017,
    BURST_NUMBER: 0x5018,
    BURST_INTERVAL: 0x5019,
    TIMELAPSE_NUMBER: 0x501a,
    TIMELAPSE_INTERVAL: 0x501b,
    FOCUS_METERING_MODE: 0x501c,
    UPLOAD_URL: 0x501d,
    ARTIST: 0x501e,
    COPYRIGHT_INFO: 0x501f,
} as const

export type PTPDevicePropertyCode = (typeof PTPDeviceProperties)[keyof typeof PTPDeviceProperties]

/**
 * Create reverse lookup maps for debugging
 */
export const PTPOperationNames = Object.entries(PTPOperations).reduce(
    (acc, [name, code]) => {
        acc[code] = name
        return acc
    },
    {} as Record<number, string>
)

export const PTPResponseNames = Object.entries(PTPResponses).reduce(
    (acc, [name, code]) => {
        acc[code] = name
        return acc
    },
    {} as Record<number, string>
)

export const PTPEventNames = Object.entries(PTPEvents).reduce(
    (acc, [name, code]) => {
        acc[code] = name
        return acc
    },
    {} as Record<number, string>
)

export const PTPDevicePropertyNames = Object.entries(PTPDeviceProperties).reduce(
    (acc, [name, code]) => {
        acc[code] = name
        return acc
    },
    {} as Record<number, string>
)

/**
 * Helper function to get human-readable code name
 */
export function getCodeName(code: number, type: ContainerType): string {
    switch (type) {
        case ContainerTypes.COMMAND_BLOCK:
            return PTPOperationNames[code] || `Unknown Operation 0x${code.toString(16).padStart(4, '0')}`
        case ContainerTypes.RESPONSE_BLOCK:
            return PTPResponseNames[code] || `Unknown Response 0x${code.toString(16).padStart(4, '0')}`
        case ContainerTypes.EVENT_BLOCK:
            return PTPEventNames[code] || `Unknown Event 0x${code.toString(16).padStart(4, '0')}`
        default:
            return `0x${code.toString(16).padStart(4, '0')}`
    }
}

/**
 * PTP Error class for protocol errors
 */
export class PTPError extends Error {
    constructor(
        public readonly code: number,
        message: string,
        public readonly operation?: string
    ) {
        super(message)
        this.name = 'PTPError'
    }
}
