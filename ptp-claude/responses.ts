/**
 * PTP Responses
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Section 11: Responses
 */

import { UINT16, UINT32 } from './basic-types';
import { SessionID, TransactionID } from './handles';

// ============================================================================
// RESPONSE DATASET
// ============================================================================

/**
 * Response dataset (Section 9.3.5)
 */
export interface Response {
  responseCode: UINT16;                 // Response code
  sessionID: SessionID;                 // Session ID from request
  transactionID: TransactionID;          // Transaction ID from request
  parameter1?: UINT32;                  // Optional response parameter 1
  parameter2?: UINT32;                  // Optional response parameter 2
  parameter3?: UINT32;                  // Optional response parameter 3
  parameter4?: UINT32;                  // Optional response parameter 4
  parameter5?: UINT32;                  // Optional response parameter 5
}

// ============================================================================
// RESPONSE CODES
// ============================================================================

/**
 * ResponseCodes (Table 27)
 * Bits 13-14 = 1, bit 12 = 0
 * Bit 15 = 1: vendor-defined
 */
export enum ResponseCode {
  UNDEFINED = 0x2000,
  OK = 0x2001,
  GENERAL_ERROR = 0x2002,
  SESSION_NOT_OPEN = 0x2003,
  INVALID_TRANSACTION_ID = 0x2004,
  OPERATION_NOT_SUPPORTED = 0x2005,
  PARAMETER_NOT_SUPPORTED = 0x2006,
  INCOMPLETE_TRANSFER = 0x2007,
  INVALID_STORAGE_ID = 0x2008,
  INVALID_OBJECT_HANDLE = 0x2009,
  DEVICE_PROP_NOT_SUPPORTED = 0x200A,
  INVALID_OBJECT_FORMAT_CODE = 0x200B,
  STORE_FULL = 0x200C,
  OBJECT_WRITE_PROTECTED = 0x200D,
  STORE_READ_ONLY = 0x200E,
  ACCESS_DENIED = 0x200F,
  NO_THUMBNAIL_PRESENT = 0x2010,
  SELF_TEST_FAILED = 0x2011,
  PARTIAL_DELETION = 0x2012,
  STORE_NOT_AVAILABLE = 0x2013,
  SPECIFICATION_BY_FORMAT_UNSUPPORTED = 0x2014,
  NO_VALID_OBJECT_INFO = 0x2015,
  INVALID_CODE_FORMAT = 0x2016,
  UNKNOWN_VENDOR_CODE = 0x2017,
  CAPTURE_ALREADY_TERMINATED = 0x2018,
  DEVICE_BUSY = 0x2019,
  INVALID_PARENT_OBJECT = 0x201A,
  INVALID_DEVICE_PROP_FORMAT = 0x201B,
  INVALID_DEVICE_PROP_VALUE = 0x201C,
  INVALID_PARAMETER = 0x201D,
  SESSION_ALREADY_OPEN = 0x201E,
  TRANSACTION_CANCELLED = 0x201F,
  SPECIFICATION_OF_DESTINATION_UNSUPPORTED = 0x2020,
  
  // PTP v1.1 response codes
  INVALID_ENUM_HANDLE = 0x2021,
  NO_STREAM_ENABLED = 0x2022,
  INVALID_DATASET = 0x2023
}