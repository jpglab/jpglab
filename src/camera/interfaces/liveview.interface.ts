/**
 * Live view frame interface
 */
export interface LiveViewFrame {
    data: Uint8Array
    width: number
    height: number
    format: FrameFormat
    timestamp: number
    metadata?: FrameMetadata
}

/**
 * Frame format enumeration
 */
export enum FrameFormat {
    JPEG = 'jpeg',
    YUV = 'yuv',
    RGB = 'rgb',
    RAW = 'raw',
}

/**
 * Frame metadata
 */
export interface FrameMetadata {
    focusInfo?: FocusInfo
    exposureInfo?: ExposureInfo
    whiteBalance?: WhiteBalanceInfo
    faces?: FaceInfo[]
}

/**
 * Focus information
 */
export interface FocusInfo {
    focusMode: string
    focusAreas: FocusArea[]
    focusStatus: FocusStatus
}

/**
 * Focus area
 */
export interface FocusArea {
    x: number
    y: number
    width: number
    height: number
    active: boolean
}

/**
 * Focus status enumeration
 */
export enum FocusStatus {
    IDLE = 'idle',
    FOCUSING = 'focusing',
    FOCUSED = 'focused',
    FAILED = 'failed',
}

/**
 * Exposure information
 */
export interface ExposureInfo {
    aperture: string
    shutterSpeed: string
    iso: number
    exposureCompensation: string
    exposureMode: string
}

/**
 * White balance information
 */
export interface WhiteBalanceInfo {
    mode: string
    colorTemperature?: number
    tint?: number
}

/**
 * Face detection information
 */
export interface FaceInfo {
    x: number
    y: number
    width: number
    height: number
    confidence: number
    id?: number
}
