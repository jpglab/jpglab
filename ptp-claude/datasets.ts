/**
 * PTP Data Sets
 * Based on ISO 15740:2013(E) - PTP v1.1
 * Section 5.5: Data Sets
 */

import { UINT8, UINT16, UINT32, UINT64, STR, DateTimeString } from './basic-types';
import { ObjectHandle, StorageID } from './handles';

// ============================================================================
// DEVICE INFO
// ============================================================================

/**
 * DeviceInfo dataset (Section 5.5.2)
 * Contains device description and capabilities
 */
export interface DeviceInfo {
  standardVersion: UINT16;              // PTP version (100 = v1.0, 110 = v1.1)
  vendorExtensionID: UINT32;            // Vendor extension context
  vendorExtensionVersion: UINT16;       // Vendor extension version
  vendorExtensionDesc: STR;             // Human-readable vendor extension description
  functionalMode: UINT16;               // Current functional mode
  operationsSupported: UINT16[];        // Array of supported OperationCodes
  eventsSupported: UINT16[];            // Array of supported EventCodes
  devicePropertiesSupported: UINT16[];  // Array of supported DevicePropCodes
  captureFormats: UINT16[];             // Array of supported capture ObjectFormatCodes
  imageFormats: UINT16[];               // Array of supported image ObjectFormatCodes
  manufacturer: STR;                    // Device manufacturer
  model: STR;                           // Device model
  deviceVersion: STR;                   // Firmware/software version
  serialNumber: STR;                    // Unique serial number
}

/**
 * Functional mode values (Table 8)
 */
export enum FunctionalMode {
  STANDARD_MODE = 0x0000,
  SLEEP_STATE = 0x0001,
  // Bit 15 set to 1 indicates vendor-defined modes
}

// ============================================================================
// OBJECT INFO
// ============================================================================

/**
 * ObjectInfo dataset (Section 5.5.3)
 * Defines information about data objects in persistent storage
 */
export interface ObjectInfo {
  storageID: StorageID;                 // Storage location
  objectFormat: UINT16;                 // ObjectFormatCode
  protectionStatus: UINT16;             // Write-protection status
  objectCompressedSize: UINT32;         // Size in bytes
  thumbFormat: UINT16;                  // Thumbnail ObjectFormatCode
  thumbCompressedSize: UINT32;          // Thumbnail size in bytes
  thumbPixWidth: UINT32;                // Thumbnail width in pixels
  thumbPixHeight: UINT32;               // Thumbnail height in pixels
  imagePixWidth: UINT32;                // Image width in pixels
  imagePixHeight: UINT32;               // Image height in pixels
  imageBitDepth: UINT32;                // Bits per pixel
  parentObject: ObjectHandle;           // Parent association handle
  associationType: UINT16;              // AssociationCode
  associationDesc: UINT32;              // Association descriptor
  sequenceNumber: UINT32;               // Sequence position
  filename: STR;                        // Filename without path
  captureDate: DateTimeString;          // Capture timestamp
  modificationDate: DateTimeString;     // Last modification timestamp
  keywords: STR;                        // Space-separated keywords
}

/**
 * Protection status values (Table 10)
 */
export enum ProtectionStatus {
  NO_PROTECTION = 0x0000,
  READ_ONLY = 0x0001
}

// ============================================================================
// STORAGE INFO
// ============================================================================

/**
 * StorageInfo dataset (Section 5.5.4)
 * Holds state information for a storage device
 */
export interface StorageInfo {
  storageType: UINT16;                  // Storage type (ROM/RAM, Fixed/Removable)
  filesystemType: UINT16;               // Filesystem type
  accessCapability: UINT16;             // Read-write capability
  maxCapacity: UINT64;                  // Total capacity in bytes
  freeSpaceInBytes: UINT64;             // Available space in bytes
  freeSpaceInImages: UINT32;            // Estimated remaining image capacity
  storageDescription: STR;              // Human-readable storage description
  volumeLabel: STR;                     // Volume label
}

/**
 * Storage types (Table 12)
 */
export enum StorageType {
  UNDEFINED = 0x0000,
  FIXED_ROM = 0x0001,
  REMOVABLE_ROM = 0x0002,
  FIXED_RAM = 0x0003,
  REMOVABLE_RAM = 0x0004
}

/**
 * Filesystem types (Table 13)
 */
export enum FilesystemType {
  UNDEFINED = 0x0000,
  GENERIC_FLAT = 0x0001,
  GENERIC_HIERARCHICAL = 0x0002,
  // Bit 15 set to 1 indicates vendor-defined types
}

/**
 * Access capability values (Table 14)
 */
export enum AccessCapability {
  READ_WRITE = 0x0000,
  READ_ONLY_WITHOUT_DELETE = 0x0001,
  READ_ONLY_WITH_DELETE = 0x0002
}

// ============================================================================
// VENDOR EXTENSION (PTP v1.1)
// ============================================================================

/**
 * VendorExtensionMap dataset (PTP v1.1) (Section 5.5.5)
 * Maps vendor extended datacodes for multiple vendor extension support
 */
export interface VendorExtensionMap {
  nativeCode: UINT16;                   // Code in default vendor extension space
  mappedCode: UINT16;                   // Code in non-default extension space
  mappedVendorExtensionID: UINT32;      // VendorExtensionID for mapped code
}

// ============================================================================
// OBJECT FILESYSTEM INFO (PTP v1.1)
// ============================================================================

/**
 * ObjectFilesystemInfo dataset (PTP v1.1) (Section 5.5.6)
 * Subset of ObjectInfo for fast filesystem characterization
 */
export interface ObjectFilesystemInfo {
  objectHandle: ObjectHandle;           // Object handle
  storageID: StorageID;                 // Storage location
  objectFormat: UINT16;                 // ObjectFormatCode
  protectionStatus: UINT16;             // Write-protection status
  objectCompressedSize64: UINT64;       // Size in bytes (64-bit)
  parentObject: ObjectHandle;           // Parent association handle
  associationType: UINT16;              // AssociationCode
  associationDesc: UINT32;              // Association descriptor
  sequenceNumber: UINT32;               // Sequence position
  filename: STR;                        // Filename without path
  modificationDate: DateTimeString;     // Last modification timestamp
}

// ============================================================================
// STREAM INFO (PTP v1.1)
// ============================================================================

/**
 * StreamInfo dataset (PTP v1.1) (Section 5.5.7)
 * Stream configuration information
 */
export interface StreamInfo {
  datasetSize: UINT32;                  // Size of this dataset
  timeResolution: UINT32;               // Time unit in nanoseconds
  frameHeaderSize: UINT32;              // Frame header size in bytes
  frameMaxSize: UINT32;                 // Maximum frame size in bytes
  packetHeaderSize: UINT32;             // Packet header size in bytes
  packetMaxSize: UINT32;                // Maximum packet size in bytes
  packetAlignment: UINT32;              // Packet alignment in bytes
}

// ============================================================================
// DEVICE PROPERTY DESCRIPTOR
// ============================================================================

/**
 * DevicePropDesc dataset - Base structure (Table 30)
 */
export interface DevicePropDescBase {
  devicePropertyCode: UINT16;           // DevicePropCode
  datatype: UINT16;                     // Datatype code
  getSet: UINT8;                        // 0x00 = Get, 0x01 = Get/Set
  factoryDefaultValue: any;             // Type depends on datatype
  currentValue: any;                    // Type depends on datatype
  formFlag: UINT8;                      // 0x00 = None, 0x01 = Range, 0x02 = Enum
}

/**
 * DevicePropDesc with Range form (Table 31)
 */
export interface DevicePropDescRange extends DevicePropDescBase {
  formFlag: 0x01;
  minimumValue: any;                    // Type depends on datatype
  maximumValue: any;                    // Type depends on datatype
  stepSize: any;                        // Type depends on datatype
}

/**
 * DevicePropDesc with Enumeration form (Table 32)
 */
export interface DevicePropDescEnum extends DevicePropDescBase {
  formFlag: 0x02;
  numberOfValues: UINT16;
  supportedValues: any[];                // Type depends on datatype
}

/**
 * DevicePropDesc with no form
 */
export interface DevicePropDescNone extends DevicePropDescBase {
  formFlag: 0x00;
}

/**
 * Union type for all DevicePropDesc variants
 */
export type DevicePropDesc = DevicePropDescNone | DevicePropDescRange | DevicePropDescEnum;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for DevicePropDescRange
 */
export function isDevicePropDescRange(desc: DevicePropDesc): desc is DevicePropDescRange {
  return desc.formFlag === 0x01;
}

/**
 * Type guard for DevicePropDescEnum
 */
export function isDevicePropDescEnum(desc: DevicePropDesc): desc is DevicePropDescEnum {
  return desc.formFlag === 0x02;
}

/**
 * Type guard for DevicePropDescNone
 */
export function isDevicePropDescNone(desc: DevicePropDesc): desc is DevicePropDescNone {
  return desc.formFlag === 0x00;
}