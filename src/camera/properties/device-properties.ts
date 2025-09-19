/**
 * Vendor-agnostic device properties enumeration
 */
export enum DeviceProperty {
    // Exposure properties
    APERTURE = 'aperture',
    SHUTTER_SPEED = 'shutterSpeed',
    ISO = 'iso',
    EXPOSURE_COMPENSATION = 'exposureCompensation',
    EXPOSURE_MODE = 'exposureMode',
    EXPOSURE_METERING_MODE = 'exposureMeteringMode',

    // Focus properties
    FOCUS_MODE = 'focusMode',
    FOCUS_AREA = 'focusArea',
    FOCUS_DISTANCE = 'focusDistance',
    AF_MODE = 'afMode',
    AF_AREA_MODE = 'afAreaMode',

    // Capture properties
    IMAGE_QUALITY = 'imageQuality',
    IMAGE_SIZE = 'imageSize',
    IMAGE_FORMAT = 'imageFormat',
    WHITE_BALANCE = 'whiteBalance',
    COLOR_SPACE = 'colorSpace',
    CAPTURE_MODE = 'captureMode',
    DRIVE_MODE = 'driveMode',
    BURST_NUMBER = 'burstNumber',
    BRACKETING_MODE = 'bracketingMode',

    // Flash properties
    FLASH_MODE = 'flashMode',
    FLASH_COMPENSATION = 'flashCompensation',
    FLASH_SYNC_MODE = 'flashSyncMode',

    // Device properties
    BATTERY_LEVEL = 'batteryLevel',
    DEVICE_NAME = 'deviceName',
    SERIAL_NUMBER = 'serialNumber',
    FIRMWARE_VERSION = 'firmwareVersion',
    DATE_TIME = 'dateTime',

    // Video properties
    VIDEO_QUALITY = 'videoQuality',
    VIDEO_FRAMERATE = 'videoFramerate',
    AUDIO_RECORDING = 'audioRecording',

    // Other properties
    CUSTOM_FUNCTION = 'customFunction',
    COPYRIGHT_INFO = 'copyrightInfo',
    ARTIST = 'artist',
}

/**
 * Property value type
 */
export type PropertyValue = string | number | boolean | Date | PropertyValue[]

/**
 * Property metadata
 */
export interface PropertyMetadata {
    property: DeviceProperty
    dataType: DataType
    unit?: PropertyUnit
    readable: boolean
    writable: boolean
    enumValues?: PropertyEnumValue[]
    range?: PropertyRange
}

/**
 * Property enumeration value
 */
export interface PropertyEnumValue {
    value: PropertyValue
    label: string
    vendorValue?: unknown
}

/**
 * Property range
 */
export interface PropertyRange {
    min: PropertyValue
    max: PropertyValue
    step?: PropertyValue
}

/**
 * Data type enumeration
 */
export enum DataType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    DATE = 'date',
    ARRAY = 'array',
    FRACTION = 'fraction',
    ENUM = 'enum',
}

/**
 * Property unit enumeration
 */
export enum PropertyUnit {
    SECONDS = 'seconds',
    FRACTION = 'fraction',
    F_STOP = 'fStop',
    ISO_VALUE = 'iso',
    PERCENTAGE = 'percentage',
    EV = 'ev',
    METERS = 'meters',
    KELVIN = 'kelvin',
    FRAMES_PER_SECOND = 'fps',
}
