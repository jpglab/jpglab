/**
 * Sony-specific PTP constants
 * Migrated from src/vendors/sony/sony-codes.ts
 */

import { PTPOperations, PTPDeviceProperties } from '../../../core/ptp/ptp-constants'

// Sony Operation Codes
export const SonyOperations = {
    ...PTPOperations,
    // Sony-specific operations (0x9201-0x92FF)
    SDIO_CONNECT: 0x9201,
    SDIO_GET_EXT_DEVICE_INFO: 0x9202,
    SET_DEVICE_PROPERTY_VALUE: 0x9205,
    CONTROL_DEVICE_PROPERTY: 0x9207,
    GET_ALL_EXT_DEVICE_PROP_INFO: 0x9209,
    SDIO_GET_OSD_IMAGE: 0x9238,
} as const

// Sony Device Properties
export const SonyDeviceProperties = {
    ...PTPDeviceProperties,
    // Standard PTP properties used by Sony
    F_NUMBER: 0x5007, // Aperture value
    ISO_STANDARD: 0x500f, // Standard PTP ISO property
    // Sony-specific device properties
    STILL_CAPTURE_MODE: 0x5013,
    OSD_IMAGE_MODE: 0xd207,
    SHUTTER_SPEED: 0xd20d, // Shutter speed
    CAPTURE_STATUS: 0xd215,
    ISO_SENSITIVITY_ALT1: 0xd21d, // Alternative ISO property 1
    ISO_SENSITIVITY: 0xd21e, // ISO sensitivity (main)
    ISO_SENSITIVITY_ALT2: 0xd21f, // Alternative ISO property 2
    ISO_SENSITIVITY_ALT3: 0xd220, // Alternative ISO property 3
    LIVE_VIEW_STATUS: 0xd221,
    SAVE_MEDIA: 0xd222,
    DIAL_MODE: 0xd25a,
    SHUTTER_BUTTON_CONTROL: 0xd2c1,
    FOCUS_BUTTON_CONTROL: 0xd2c2,
    LIVE_VIEW_CONTROL: 0xd313,
} as const

// SDIO Connect Phases
export const SDIOPhases = {
    INITIAL_HANDSHAKE: 0x01,
    CAPABILITY_EXCHANGE: 0x02,
    FINAL_AUTHENTICATION: 0x03,
} as const

export type SDIOPhase = (typeof SDIOPhases)[keyof typeof SDIOPhases]

// Sony Constants
export const SonyConstants = {
    VENDOR_ID: 0x054c,
    PRODUCT_ID: 0x096f, // Sony camera (detected via list-devices)
    PRODUCT_ID_ALPHA: 0x0e78, // Alpha series cameras (alternative)
    PROTOCOL_VERSION: 0x012c, // Version 3.00
    DEVICE_PROPERTY_OPTION: 0x00000001, // Enable extended properties
    LIVE_VIEW_IMAGE_HANDLE: 0xffffc002, // Object handle for live view images
    OSD_IMAGE_HANDLE: 0xffffc004, // Potential object handle for OSD images
    LIVE_VIEW_ENABLE: 0x0002, // Enable live view
    LIVE_VIEW_DISABLE: 0x0001, // Disable live view

    // Dataset type codes
    SHOT_IMAGE_DATASET: 0xffffc003,
    OSD_DATASET: 0xffffc006,

    // Shutter/Focus control values
    SHUTTER_HALF_PRESS: 0x0002,
    SHUTTER_FULL_PRESS: 0x0001,
    FOCUS_HALF_PRESS: 0x0002,
    FOCUS_RELEASE: 0x0001,

    // Property values
    DIAL_MODE_HOST: 0x01,
    STILL_CAPTURE_MODE: 0x01,
    SAVE_MEDIA_HOST: 0x01,
    OSD_MODE_ON: 0x01,
    OSD_MODE_OFF: 0x00,

    // Error codes
    ACCESS_DENIED: 0x200f,

    // Recent image handle
    RECENT_IMAGE_HANDLE: 0xffffc001,

    // Extended properties parameters
    GET_ALL_DATA: 0x00000000,
    ENABLE_EXTENDED: 0x00000001,

    // Data type ranges
    DATA_TYPE_MIN: 0x0001,
    DATA_TYPE_MAX: 0x000a,
    DATA_TYPE_ARRAY_MIN: 0x4001,
    DATA_TYPE_ARRAY_MAX: 0x400a,
    DATA_TYPE_STRING: 0xffff,

    // Property code ranges
    PTP_PROP_MIN: 0x5000,
    PTP_PROP_MAX: 0x5fff,
    VENDOR_PROP_MIN: 0xd000,
    VENDOR_PROP_MAX: 0xdfff,
} as const

// Helper functions for Sony value formatting

/**
 * Format Sony F-Number (aperture) value
 */
export function formatFNumber(value: number): string {
    // Sony encodes f-number as value * 100
    return `f/${(value / 100).toFixed(1)}`
}

/**
 * Format Sony shutter speed value
 */
export function formatShutterSpeed(value: number): string {
    if (value === 0x00000000) return 'BULB'
    if (value === 0xffffffff) return 'N/A'

    const numerator = (value >> 16) & 0xffff
    const denominator = value & 0xffff

    if (denominator === 0x000a) {
        // Real number display (e.g., 1.5")
        return `${numerator / 10}"`
    } else if (numerator === 0x0001) {
        // Fraction display (e.g., 1/1000)
        return `1/${denominator}`
    } else {
        return `${numerator}/${denominator}`
    }
}

/**
 * Format Sony ISO sensitivity value
 */
export function formatISO(value: number): string {
    // Special AUTO values
    if (value === 0x00ffffff) return 'ISO AUTO'
    if (value === 0x01ffffff) return 'Multi Frame NR ISO AUTO'
    if (value === 0x02ffffff) return 'Multi Frame NR High ISO AUTO'

    // Check for Multi Frame NR modes (prefix byte)
    const prefix = (value >> 24) & 0xff
    let mode = ''
    if (prefix === 0x01) {
        mode = 'Multi Frame NR '
    } else if (prefix === 0x02) {
        mode = 'Multi Frame NR High '
    }

    // Extract the actual ISO value (lower 24 bits)
    const isoValue = value & 0xffffff

    // Sony uses direct decimal values for ISO
    if (isoValue >= 10 && isoValue <= 1000000) {
        return `${mode}ISO ${isoValue}`
    }

    return 'ISO Unknown'
}
