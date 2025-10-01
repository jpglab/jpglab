/**
 * PTP Session Management
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Session and Transaction Management Types
 */

import { UINT16, UINT32 } from './basic-types';
import { SessionID, TransactionID } from './handles';
import { DeviceInfo } from './datasets';
import { OperationCode } from './operations';
import { ResponseCode, Response } from './responses';

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Session state
 */
export enum SessionState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  BUSY = 'BUSY'
}

/**
 * PTP Session interface
 */
export interface PTPSession {
  sessionID: SessionID;
  state: SessionState;
  deviceInfo: DeviceInfo;
  currentTransaction?: TransactionID;
  lastError?: ResponseCode;
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

/**
 * Transaction state
 */
export enum TransactionState {
  IDLE = 'IDLE',
  OPERATION_SENT = 'OPERATION_SENT',
  DATA_IN_PROGRESS = 'DATA_IN_PROGRESS',
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * PTP Transaction interface
 */
export interface PTPTransaction {
  transactionID: TransactionID;
  sessionID: SessionID;
  operation: OperationCode;
  state: TransactionState;
  parameters?: UINT32[];
  data?: Uint8Array;
  response?: Response;
}

// ============================================================================
// CONTAINER TYPES
// ============================================================================

/**
 * PTP Container structure (transport-agnostic)
 */
export interface PTPContainer {
  length: UINT32;                       // Container length
  type: UINT16;                         // Container type
  code: UINT16;                         // Operation/Response/Event code
  transactionID: TransactionID;          // Transaction ID
  payload?: Uint8Array;                 // Optional payload data
}

/**
 * Container types
 */
export enum ContainerType {
  UNDEFINED = 0,
  COMMAND = 1,
  DATA = 2,
  RESPONSE = 3,
  EVENT = 4
}

// ============================================================================
// TRANSPORT TYPES
// ============================================================================

/**
 * Transport types that may be used with PTP
 */
export enum TransportType {
  USB = 'USB',
  IEEE_1394 = 'IEEE_1394',
  TCP_IP = 'TCP_IP',
  BLUETOOTH = 'BLUETOOTH',
  WIRELESS_USB = 'WIRELESS_USB'
}