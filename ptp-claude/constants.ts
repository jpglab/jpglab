/**
 * PTP Constants
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Common constants and limits used throughout the PTP protocol
 */

// ============================================================================
// VERSION CONSTANTS
// ============================================================================

/**
 * PTP Version constants
 */
export const PTP_VERSION = {
  V1_0: 100,  // PTP v1.0
  V1_1: 110   // PTP v1.1
} as const;

// ============================================================================
// MAXIMUM VALUES AND LIMITS
// ============================================================================

/**
 * Maximum values
 */
export const PTP_LIMITS = {
  MAX_STRING_LENGTH: 255,
  MAX_PARAMETERS: 5,
  MAX_UINT32: 0xFFFFFFFF,
  MAX_UINT16: 0xFFFF,
  MAX_UINT8: 0xFF
} as const;