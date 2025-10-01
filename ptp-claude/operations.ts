/**
 * PTP Operations
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Section 10: Operations
 */

import { UINT16, UINT32 } from './basic-types';
import { SessionID, TransactionID } from './handles';

// ============================================================================
// OPERATION REQUEST
// ============================================================================

/**
 * OperationRequest dataset (Section 9.3.3)
 */
export interface OperationRequest {
  operationCode: UINT16;                // Operation to perform
  sessionID: SessionID;                 // Current session ID
  transactionID: TransactionID;          // Transaction identifier
  parameter1?: UINT32;                  // Optional parameter 1
  parameter2?: UINT32;                  // Optional parameter 2
  parameter3?: UINT32;                  // Optional parameter 3
  parameter4?: UINT32;                  // Optional parameter 4
  parameter5?: UINT32;                  // Optional parameter 5
}

// ============================================================================
// OPERATION CODES
// ============================================================================

/**
 * OperationCodes (Table 22)
 * Bit 12 = 1, bits 13-14 = 0
 * Bit 15 = 1: vendor-defined
 */
export enum OperationCode {
  UNDEFINED = 0x1000,
  GET_DEVICE_INFO = 0x1001,
  OPEN_SESSION = 0x1002,
  CLOSE_SESSION = 0x1003,
  GET_STORAGE_IDS = 0x1004,
  GET_STORAGE_INFO = 0x1005,
  GET_NUM_OBJECTS = 0x1006,
  GET_OBJECT_HANDLES = 0x1007,
  GET_OBJECT_INFO = 0x1008,
  GET_OBJECT = 0x1009,
  GET_THUMB = 0x100A,
  DELETE_OBJECT = 0x100B,
  SEND_OBJECT_INFO = 0x100C,
  SEND_OBJECT = 0x100D,
  INITIATE_CAPTURE = 0x100E,
  FORMAT_STORE = 0x100F,
  RESET_DEVICE = 0x1010,
  SELF_TEST = 0x1011,
  SET_OBJECT_PROTECTION = 0x1012,
  POWER_DOWN = 0x1013,
  GET_DEVICE_PROP_DESC = 0x1014,
  GET_DEVICE_PROP_VALUE = 0x1015,
  SET_DEVICE_PROP_VALUE = 0x1016,
  RESET_DEVICE_PROP_VALUE = 0x1017,
  TERMINATE_OPEN_CAPTURE = 0x1018,
  MOVE_OBJECT = 0x1019,
  COPY_OBJECT = 0x101A,
  GET_PARTIAL_OBJECT = 0x101B,
  INITIATE_OPEN_CAPTURE = 0x101C,
  
  // PTP v1.1 operations
  START_ENUM_HANDLES = 0x101D,
  ENUM_HANDLES = 0x101E,
  STOP_ENUM_HANDLES = 0x101F,
  GET_VENDOR_EXTENSION_MAPS = 0x1020,
  GET_VENDOR_DEVICE_INFO = 0x1021,
  GET_RESIZED_IMAGE_OBJECT = 0x1022,
  GET_FILESYSTEM_MANIFEST = 0x1023,
  GET_STREAM_INFO = 0x1024,
  GET_STREAM = 0x1025
}