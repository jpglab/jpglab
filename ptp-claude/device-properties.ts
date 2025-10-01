/**
 * PTP Device Properties
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Section 13: Device Properties
 */

// ============================================================================
// DEVICE PROPERTY CODES
// ============================================================================

/**
 * DevicePropCodes (Table 33)
 * Bits 12 and 14 = 1, bit 13 = 0
 * Bit 15 = 1: vendor-defined
 */
export enum DevicePropCode {
  UNDEFINED = 0x5000,
  BATTERY_LEVEL = 0x5001,
  FUNCTIONAL_MODE = 0x5002,
  IMAGE_SIZE = 0x5003,
  COMPRESSION_SETTING = 0x5004,
  WHITE_BALANCE = 0x5005,
  RGB_GAIN = 0x5006,
  F_NUMBER = 0x5007,
  FOCAL_LENGTH = 0x5008,
  FOCUS_DISTANCE = 0x5009,
  FOCUS_MODE = 0x500A,
  EXPOSURE_METERING_MODE = 0x500B,
  FLASH_MODE = 0x500C,
  EXPOSURE_TIME = 0x500D,
  EXPOSURE_PROGRAM_MODE = 0x500E,
  EXPOSURE_INDEX = 0x500F,
  EXPOSURE_BIAS_COMPENSATION = 0x5010,
  DATE_TIME = 0x5011,
  CAPTURE_DELAY = 0x5012,
  STILL_CAPTURE_MODE = 0x5013,
  CONTRAST = 0x5014,
  SHARPNESS = 0x5015,
  DIGITAL_ZOOM = 0x5016,
  EFFECT_MODE = 0x5017,
  BURST_NUMBER = 0x5018,
  BURST_INTERVAL = 0x5019,
  TIMELAPSE_NUMBER = 0x501A,
  TIMELAPSE_INTERVAL = 0x501B,
  FOCUS_METERING_MODE = 0x501C,
  UPLOAD_URL = 0x501D,
  ARTIST = 0x501E,
  COPYRIGHT_INFO = 0x501F,
  
  // PTP v1.1 device properties
  SUPPORTED_STREAMS = 0x5020,
  ENABLED_STREAMS = 0x5021,
  VIDEO_FORMAT = 0x5022,
  VIDEO_RESOLUTION = 0x5023,
  VIDEO_QUALITY = 0x5024,
  VIDEO_FRAME_RATE = 0x5025,
  VIDEO_CONTRAST = 0x5026,
  VIDEO_BRIGHTNESS = 0x5027,
  AUDIO_FORMAT = 0x5028,
  AUDIO_BITRATE = 0x5029,
  AUDIO_SAMPLING_RATE = 0x502A,
  AUDIO_BIT_PER_SAMPLE = 0x502B,
  AUDIO_VOLUME = 0x502C
}

// ============================================================================
// DEVICE PROPERTY VALUE ENUMERATIONS
// ============================================================================

/**
 * White balance settings (Table 34)
 */
export enum WhiteBalance {
  UNDEFINED = 0x0000,
  MANUAL = 0x0001,
  AUTOMATIC = 0x0002,
  ONE_PUSH_AUTOMATIC = 0x0003,
  DAYLIGHT = 0x0004,
  FLUORESCENT = 0x0005,
  TUNGSTEN = 0x0006,
  FLASH = 0x0007
}

/**
 * Focus mode settings (Table 35)
 */
export enum FocusMode {
  UNDEFINED = 0x0000,
  MANUAL = 0x0001,
  AUTOMATIC = 0x0002,
  AUTOMATIC_MACRO = 0x0003
}

/**
 * Exposure metering mode settings (Table 36)
 */
export enum ExposureMeteringMode {
  UNDEFINED = 0x0000,
  AVERAGE = 0x0001,
  CENTER_WEIGHTED_AVERAGE = 0x0002,
  MULTI_SPOT = 0x0003,
  CENTER_SPOT = 0x0004
}

/**
 * Flash mode settings (Table 37)
 */
export enum FlashMode {
  UNDEFINED = 0x0000,
  AUTO_FLASH = 0x0001,
  FLASH_OFF = 0x0002,
  FILL_FLASH = 0x0003,
  RED_EYE_AUTO = 0x0004,
  RED_EYE_FILL = 0x0005,
  EXTERNAL_SYNC = 0x0006
}

/**
 * Exposure program mode settings
 */
export enum ExposureProgramMode {
  UNDEFINED = 0x0000,
  MANUAL = 0x0001,
  AUTOMATIC = 0x0002,
  APERTURE_PRIORITY = 0x0003,
  SHUTTER_PRIORITY = 0x0004,
  CREATIVE = 0x0005,
  ACTION = 0x0006,
  PORTRAIT = 0x0007
}

/**
 * Still capture mode settings
 */
export enum StillCaptureMode {
  UNDEFINED = 0x0000,
  SINGLE_SHOT = 0x0001,
  BURST = 0x0002,
  TIMELAPSE = 0x0003
}

/**
 * Effect mode settings
 */
export enum EffectMode {
  UNDEFINED = 0x0000,
  STANDARD = 0x0001,
  BLACK_WHITE = 0x0002,
  SEPIA = 0x0003
}

/**
 * Focus metering mode settings
 */
export enum FocusMeteringMode {
  UNDEFINED = 0x0000,
  CENTER_SPOT = 0x0001,
  MULTI_SPOT = 0x0002
}