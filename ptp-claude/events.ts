/**
 * PTP Events
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Section 12: Events
 */

import { UINT16, UINT32 } from './basic-types';
import { SessionID, TransactionID } from './handles';

// ============================================================================
// EVENT DATASET
// ============================================================================

/**
 * Event dataset (Section 12.3)
 */
export interface Event {
  eventCode: UINT16;                    // Event type
  sessionID: SessionID;                 // Associated session
  transactionID: TransactionID;          // Associated transaction (if any)
  parameter1?: UINT32;                  // Event-specific parameter 1
  parameter2?: UINT32;                  // Event-specific parameter 2
  parameter3?: UINT32;                  // Event-specific parameter 3
}

// ============================================================================
// EVENT CODES
// ============================================================================

/**
 * EventCodes (Section 12.5)
 * Bit 14 = 1, bits 12-13 = 0
 * Bit 15 = 1: vendor-defined
 */
export enum EventCode {
  UNDEFINED = 0x4000,
  CANCEL_TRANSACTION = 0x4001,
  OBJECT_ADDED = 0x4002,
  OBJECT_REMOVED = 0x4003,
  STORE_ADDED = 0x4004,
  STORE_REMOVED = 0x4005,
  DEVICE_PROP_CHANGED = 0x4006,
  OBJECT_INFO_CHANGED = 0x4007,
  DEVICE_INFO_CHANGED = 0x4008,
  REQUEST_OBJECT_TRANSFER = 0x4009,
  STORE_FULL = 0x400A,
  DEVICE_RESET = 0x400B,
  STORAGE_INFO_CHANGED = 0x400C,
  CAPTURE_COMPLETE = 0x400D,
  UNREPORTED_STATUS = 0x400E
}