/**
 * PTP Utility Functions and Helper Types
 * Based on ISO 15740:2013(E) - PTP v1.1
 */

import { UINT16 } from './basic-types';

// ============================================================================
// DATACODE CATEGORIES
// ============================================================================

/**
 * Datacode category detection based on MSN (Most Significant Nibble)
 */
export enum DatacodeCategory {
  OPERATION = 0x1000,
  RESPONSE = 0x2000,
  OBJECT_FORMAT = 0x3000,
  EVENT = 0x4000,
  DEVICE_PROPERTY = 0x5000
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper function to determine if a code is vendor-defined
 */
export function isVendorDefined(code: UINT16): boolean {
  return (code & 0x8000) !== 0;  // Bit 15 set
}

/**
 * Helper function to get datacode category
 */
export function getDatacodeCategory(code: UINT16): DatacodeCategory | null {
  const msn = code & 0xF000;
  switch (msn) {
    case 0x1000: return DatacodeCategory.OPERATION;
    case 0x2000: return DatacodeCategory.RESPONSE;
    case 0x3000: return DatacodeCategory.OBJECT_FORMAT;
    case 0x4000: return DatacodeCategory.EVENT;
    case 0x5000: return DatacodeCategory.DEVICE_PROPERTY;
    default: return null;
  }
}