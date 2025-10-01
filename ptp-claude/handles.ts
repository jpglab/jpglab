/**
 * PTP Handle and ID Types
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Sections 5.3.3, 8.1, 9.2.2, 9.3.2
 */

import { UINT16, UINT32 } from './basic-types';

// ============================================================================
// HANDLE TYPES
// ============================================================================

/**
 * Handle types - 32-bit device-unique unsigned integers
 * 0x00000000 and 0xFFFFFFFF are reserved for special meanings
 */
export type ObjectHandle = UINT32;
export type StorageID = UINT32;
export type SessionID = UINT32;
export type TransactionID = UINT32;

// ============================================================================
// STORAGE ID COMPONENTS
// ============================================================================

/**
 * StorageID components (Section 8.1)
 */
export interface StorageIDComponents {
  physicalStorageID: UINT16;  // Most significant 16 bits
  logicalStorageID: UINT16;   // Least significant 16 bits
}

// ============================================================================
// SPECIAL HANDLE VALUES
// ============================================================================

/**
 * Special handle values
 */
export const SPECIAL_HANDLES = {
  INVALID: 0x00000000,
  ALL: 0xFFFFFFFF,
  ROOT_PARENT: 0x00000000
} as const;

// ============================================================================
// HANDLE UTILITIES
// ============================================================================

/**
 * Helper function to split StorageID into components
 */
export function splitStorageID(storageID: StorageID): StorageIDComponents {
  return {
    physicalStorageID: (storageID >> 16) & 0xFFFF,
    logicalStorageID: storageID & 0xFFFF
  };
}

/**
 * Helper function to combine StorageID components
 */
export function combineStorageID(components: StorageIDComponents): StorageID {
  return (components.physicalStorageID << 16) | components.logicalStorageID;
}

/**
 * Helper function to check if a handle is valid
 */
export function isValidHandle(handle: UINT32): boolean {
  return handle !== 0x00000000 && handle !== 0xFFFFFFFF;
}