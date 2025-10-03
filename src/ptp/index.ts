/**
 * PTP Protocol Implementation
 * Single source of truth with automatic type inference
 */

// Main protocol implementation
export { GenericCamera } from '@camera/generic-camera'
export type { OperationName, PropertyName, PropertyValue, PTPEventData } from '@camera/generic-camera'

// Core type definitions
export * from '@ptp/types/codec'
export * from '@ptp/types/datatype'
export * from '@ptp/types/event'
export * from '@ptp/types/operation'
export * from '@ptp/types/parameter'
export * from '@ptp/types/property'
export * from '@ptp/types/response'

// Definition arrays (single source of truth)
export * from '@ptp/definitions/datatype-definitions'
export * from '@ptp/definitions/operation-definitions'
export * from '@ptp/definitions/property-definitions'
export * from '@ptp/definitions/event-definitions'
export * from '@ptp/definitions/response-definitions'
export * from '@ptp/definitions/format-definitions'

// Data sets (PTP datasets with codecs)
export * from '@ptp/datasets'

// Vendor extensions
export * from '@ptp/definitions/vendors/sony/sony-operation-definitions'
export * from '@ptp/definitions/vendors/sony/sony-property-definitions'
