/**
 * PTP (Picture Transfer Protocol) Basic Data Types
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Section 5.3: Basic Data Types
 */

// ============================================================================
// BASIC INTEGER TYPES
// ============================================================================

/**
 * Basic integer types
 * These map to the fundamental data types used throughout PTP
 */
export type INT8 = number;    // -128 to 127
export type UINT8 = number;   // 0 to 255
export type INT16 = number;   // -32768 to 32767
export type UINT16 = number;  // 0 to 65535
export type INT32 = number;   // -2147483648 to 2147483647
export type UINT32 = number;  // 0 to 4294967295
export type INT64 = bigint;   // -9223372036854775808n to 9223372036854775807n
export type UINT64 = bigint;  // 0n to 18446744073709551615n
export type INT128 = bigint;  // 128-bit signed integer
export type UINT128 = bigint; // 128-bit unsigned integer

// ============================================================================
// ARRAY TYPES
// ============================================================================

/**
 * Array types for uniform arrays of fixed-length types
 */
export type AINT8 = INT8[];
export type AUINT8 = UINT8[];
export type AINT16 = INT16[];
export type AUINT16 = UINT16[];
export type AINT32 = INT32[];
export type AUINT32 = UINT32[];
export type AINT64 = INT64[];
export type AUINT64 = UINT64[];
export type AINT128 = INT128[];
export type AUINT128 = UINT128[];

// ============================================================================
// STRING TYPES
// ============================================================================

/**
 * String type - Variable-length unicode string (UTF-16, max 255 chars)
 */
export type STR = string;

/**
 * DateTime string format: "YYYYMMDDThhmmss.s[Z|±hhmm]"
 */
export type DateTimeString = string;

/**
 * PTP String structure (Section 5.3.5)
 */
export interface PTPString {
  numChars: UINT8;      // Number of characters including null terminator
  stringChars: string;  // Unicode null-terminated string
}

// ============================================================================
// DATATYPE CODES
// ============================================================================

/**
 * Datatype codes (Table 3)
 */
export enum DatatypeCode {
  UNDEF = 0x0000,
  INT8 = 0x0001,
  UINT8 = 0x0002,
  INT16 = 0x0003,
  UINT16 = 0x0004,
  INT32 = 0x0005,
  UINT32 = 0x0006,
  INT64 = 0x0007,
  UINT64 = 0x0008,
  INT128 = 0x0009,
  UINT128 = 0x000A,
  AINT8 = 0x4001,
  AUINT8 = 0x4002,
  AINT16 = 0x4003,
  AUINT16 = 0x4004,
  AINT32 = 0x4005,
  AUINT32 = 0x4006,
  AINT64 = 0x4007,
  AUINT64 = 0x4008,
  AINT128 = 0x4009,
  AUINT128 = 0x400A,
  STR = 0xFFFF
}

// ============================================================================
// SIMPLE DATA STRUCTURES
// ============================================================================

/**
 * Simple array structure (Section 5.4.1)
 */
export interface SimpleArray<T> {
  numElements: UINT32;
  elements: T[];
}

/**
 * Data set array structure (PTP v1.1) (Section 5.4.2)
 */
export interface DataSetArray<T> {
  numElements: UINT64;
  elements: T[];
}