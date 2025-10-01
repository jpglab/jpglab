/**
 * PTP (Picture Transfer Protocol) Type System
 * Based on ISO 15740:2013(E) - PTP v1.1
 * 
 * Main entry point for the PTP type system.
 * Re-exports all modules for convenient importing.
 */

// Basic data types
export * from './basic-types';

// Handles and IDs
export * from './handles';

// Data structures and datasets
export * from './datasets';

// Operations
export * from './operations';

// Responses
export * from './responses';

// Events
export * from './events';

// Device properties
export * from './device-properties';

// Object formats
export * from './formats';

// Session management
export * from './session';

// Streaming support (PTP v1.1)
export * from './streaming';

// Utility functions
export * from './utils';

// Constants
export * from './constants';

// Error handling
export * from './errors';

// Codec system
export * from './codec';

// Enum codec system
export * from './enum-codec';

// Inline codec factories
export * from './inline-codecs';

// Unified definition system
export * from './definitions';

// Standard PTP definitions with inline codecs
export { PTPStandardInline } from './ptp-standard-inline';

// Vendor extension system
export * from './vendor-registry';

// Type-safe client
export * from './ptp-client-final';

// Transport interfaces
export type { PTPTransport, PTPTransportResponse, PTPEvent } from './ptp-client-final';

// Mock transport for testing
export { MockPTPTransport } from './transport-mock';

// Example vendor extension
export { default as SonyVendorExtension } from './vendor-sony';