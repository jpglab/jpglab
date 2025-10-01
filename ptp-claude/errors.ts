/**
 * PTP Error Handling
 * Based on ISO 15740:2013(E) - PTP v1.1
 */

import { ResponseCode } from './responses';
import { OperationCode } from './operations';
import { TransactionID } from './handles';

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * PTP Error class
 */
export class PTPError extends Error {
  constructor(
    public code: ResponseCode,
    public operation?: OperationCode,
    public transactionID?: TransactionID,
    message?: string
  ) {
    super(message || `PTP Error: ${ResponseCode[code]}`);
    this.name = 'PTPError';
  }
}