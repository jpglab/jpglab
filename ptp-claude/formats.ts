/**
 * PTP Object Format Codes
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Section 6: Object Format Codes
 */

import { UINT16 } from './basic-types';

// ============================================================================
// OBJECT FORMAT CODES
// ============================================================================

/**
 * ObjectFormatCodes (Table 18)
 * Bit 15 = 1: vendor-defined
 * Bit 14 = 1: image format
 */
export enum ObjectFormatCode {
  // Ancillary formats (non-image)
  UNDEFINED_NON_IMAGE = 0x3000,
  ASSOCIATION = 0x3001,
  SCRIPT = 0x3002,
  EXECUTABLE = 0x3003,
  TEXT = 0x3004,
  HTML = 0x3005,
  DPOF = 0x3006,
  AIFF = 0x3007,
  WAV = 0x3008,
  MP3 = 0x3009,
  AVI = 0x300A,
  MPEG = 0x300B,
  ASF = 0x300C,
  QUICKTIME = 0x300D,
  XML = 0x300E,
  
  // Image formats
  UNDEFINED_IMAGE = 0x3800,
  EXIF_JPEG = 0x3801,
  TIFF_EP = 0x3802,
  FLASHPIX = 0x3803,
  BMP = 0x3804,
  CIFF = 0x3805,
  GIF = 0x3807,
  JFIF = 0x3808,
  PCD = 0x3809,
  PICT = 0x380A,
  PNG = 0x380B,
  TIFF = 0x380D,
  TIFF_IT = 0x380E,
  JP2 = 0x380F,
  JPX = 0x3810,
  DNG = 0x3811  // Digital Negative (PTP v1.1)
}

// ============================================================================
// ASSOCIATION TYPES
// ============================================================================

/**
 * Association types (Table 19)
 */
export enum AssociationType {
  UNDEFINED = 0x0000,
  GENERIC_FOLDER = 0x0001,
  ALBUM = 0x0002,
  TIME_SEQUENCE = 0x0003,
  HORIZONTAL_PANORAMIC = 0x0004,
  VERTICAL_PANORAMIC = 0x0005,
  TWO_D_PANORAMIC = 0x0006,
  ANCILLARY_DATA = 0x0007,
  // Bit 15 set to 1 indicates vendor-defined types
}

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

/**
 * Helper function to check if an ObjectFormatCode represents an image
 */
export function isImageFormat(formatCode: UINT16): boolean {
  return (formatCode & 0x0800) !== 0;  // Bit 11 set
}