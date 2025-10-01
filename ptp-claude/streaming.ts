/**
 * PTP Streaming Support
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Streaming-related types and structures
 */

import { UINT8, UINT16, UINT32, UINT64 } from './basic-types';

// ============================================================================
// STREAMING SUPPORT (PTP v1.1)
// ============================================================================

/**
 * Stream packet header
 */
export interface StreamPacketHeader {
  packetSize: UINT32;
  packetType: UINT8;
  streamID: UINT8;
  reserved: UINT16;
}

/**
 * Stream frame header
 */
export interface StreamFrameHeader {
  frameSize: UINT32;
  frameNumber: UINT32;
  timestamp: UINT64;
}

/**
 * Stream types
 */
export enum StreamType {
  UNDEFINED = 0x00,
  VIDEO = 0x01,
  AUDIO = 0x02,
  METADATA = 0x03
}