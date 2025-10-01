/**
 * PTP ISO 15740 Protocol - Complete TypeScript Type System
 * Guarantees type safety for all protocol objects and operations
 */

// ============================================================================
// PRIMITIVE TYPES
// ============================================================================

/** 8-bit signed integer */
type INT8 = number & { readonly __brand: 'INT8' };

/** 16-bit signed integer */
type INT16 = number & { readonly __brand: 'INT16' };

/** 32-bit signed integer */
type INT32 = number & { readonly __brand: 'INT32' };

/** 64-bit signed integer */
type INT64 = bigint & { readonly __brand: 'INT64' };

/** 128-bit signed integer */
type INT128 = bigint & { readonly __brand: 'INT128' };

/** 8-bit unsigned integer */
type UINT8 = number & { readonly __brand: 'UINT8' };

/** 16-bit unsigned integer */
type UINT16 = number & { readonly __brand: 'UINT16' };

/** 32-bit unsigned integer */
type UINT32 = number & { readonly __brand: 'UINT32' };

/** 64-bit unsigned integer */
type UINT64 = bigint & { readonly __brand: 'UINT64' };

/** 128-bit unsigned integer */
type UINT128 = bigint & { readonly __brand: 'UINT128' };

/** UTF-16 String with max 255 characters */
type PTPString = string & { readonly __brand: 'PTPString' };

/** DateTime in ISO 8601 format: YYYYMMDDThhmmss.s */
type DateTime = string & { readonly __brand: 'DateTime'; readonly __pattern: 'YYYYMMDDThhmmss.s' };

// ============================================================================
// ARRAY TYPES
// ============================================================================

/** Array with UINT32 element count */
interface PTPArray<T> {
  readonly count: UINT32;
  readonly elements: ReadonlyArray<T>;
  readonly __brand: 'PTPArray';
}

/** Data set array with UINT64 element count (PTP v1.1) */
interface PTPDataSetArray<T> {
  readonly count: UINT64;
  readonly elements: ReadonlyArray<T>;
  readonly __brand: 'PTPDataSetArray';
}

// ============================================================================
// CORE IDENTIFIERS
// ============================================================================

/** 32-bit Object Handle */
type ObjectHandle = UINT32 & { readonly __type: 'ObjectHandle' };

/** Special ObjectHandle values */
const enum SpecialObjectHandle {
  Invalid = 0x00000000,
  AllObjects = 0xFFFFFFFF,
  Root = 0xFFFFFFFF
}

/** 32-bit Storage ID combining Physical and Logical IDs */
interface StorageID {
  readonly value: UINT32;
  readonly physicalID: UINT16; // bits 31-16
  readonly logicalID: UINT16;  // bits 15-0
  readonly __type: 'StorageID';
}

/** Special StorageID values */
const enum SpecialStorageID {
  AllStores = 0xFFFFFFFF,
  AllLogicalStores = 0x0000FFFF
}

/** 32-bit Session ID */
type SessionID = UINT32 & { readonly __type: 'SessionID'; readonly __nonZero: true };

/** 32-bit Transaction ID */
type TransactionID = UINT32 & { readonly __type: 'TransactionID' };

// ============================================================================
// DATA CODES (16-bit with MSN indicating type)
// ============================================================================

/** Base type for all 16-bit data codes */
interface DataCode<T extends string> {
  readonly value: UINT16;
  readonly type: T;
  readonly isVendor: boolean; // bit 15
}

/** Operation Code (0x1000-0x1FFF standard, bit 15=1 for vendor) */
type OperationCode = DataCode<'Operation'> & {
  readonly __range: '0x1000-0x1FFF' | 'vendor';
};

/** Response Code (0x2000-0x2FFF standard, bit 15=1 for vendor) */
type ResponseCode = DataCode<'Response'> & {
  readonly __range: '0x2000-0x2FFF' | 'vendor';
};

/** Event Code (0x4000-0x4FFF standard, bit 15=1 for vendor) */
type EventCode = DataCode<'Event'> & {
  readonly __range: '0x4000-0x4FFF' | 'vendor';
};

/** Device Property Code (0x5000-0x5FFF standard, bit 15=1 for vendor) */
type DevicePropCode = DataCode<'DeviceProp'> & {
  readonly __range: '0x5000-0x5FFF' | 'vendor';
};

/** Object Format Code */
type ObjectFormatCode = UINT16 & { readonly __type: 'ObjectFormatCode' };

// ============================================================================
// STANDARD OPERATION CODES
// ============================================================================

const enum StandardOperationCode {
  // Session
  GetDeviceInfo = 0x1001,
  OpenSession = 0x1002,
  CloseSession = 0x1003,
  
  // Storage
  GetStorageIDs = 0x1004,
  GetStorageInfo = 0x1005,
  GetNumObjects = 0x1006,
  GetObjectHandles = 0x1007,
  
  // Object Management
  GetObjectInfo = 0x1008,
  GetObject = 0x1009,
  GetThumb = 0x100A,
  DeleteObject = 0x100B,
  SendObjectInfo = 0x100C,
  SendObject = 0x100D,
  
  // Capture
  InitiateCapture = 0x100E,
  FormatStore = 0x100F,
  ResetDevice = 0x1010,
  SelfTest = 0x1011,
  SetObjectProtection = 0x1012,
  PowerDown = 0x1013,
  
  // Properties
  GetDevicePropDesc = 0x1014,
  GetDevicePropValue = 0x1015,
  SetDevicePropValue = 0x1016,
  ResetDevicePropValue = 0x1017,
  
  // PTP v1.1
  TerminateOpenCapture = 0x1018,
  MoveObject = 0x1019,
  CopyObject = 0x101A,
  GetPartialObject = 0x101B,
  InitiateOpenCapture = 0x101C,
  GetStreamInfo = 0x1024,
  GetStream = 0x1025
}

// ============================================================================
// STANDARD RESPONSE CODES
// ============================================================================

const enum StandardResponseCode {
  Undefined = 0x2000,
  OK = 0x2001,
  GeneralError = 0x2002,
  SessionNotOpen = 0x2003,
  InvalidTransactionID = 0x2004,
  OperationNotSupported = 0x2005,
  ParameterNotSupported = 0x2006,
  IncompleteTransfer = 0x2007,
  InvalidStorageID = 0x2008,
  InvalidObjectHandle = 0x2009,
  DevicePropNotSupported = 0x200A,
  InvalidObjectFormatCode = 0x200B,
  StoreFull = 0x200C,
  ObjectWriteProtected = 0x200D,
  StoreReadOnly = 0x200E,
  AccessDenied = 0x200F,
  NoThumbnailPresent = 0x2010,
  SelfTestFailed = 0x2011,
  PartialDeletion = 0x2012,
  StoreNotAvailable = 0x2013,
  SpecificationByFormatUnsupported = 0x2014,
  NoValidObjectInfo = 0x2015,
  InvalidCodeFormat = 0x2016,
  UnknownVendorCode = 0x2017,
  CaptureAlreadyTerminated = 0x2018,
  DeviceBusy = 0x2019,
  InvalidParentObject = 0x201A,
  InvalidDevicePropFormat = 0x201B,
  InvalidDevicePropValue = 0x201C,
  InvalidParameter = 0x201D,
  SessionAlreadyOpen = 0x201E,
  TransactionCancelled = 0x201F,
  SpecificationOfDestinationUnsupported = 0x2020
}

// ============================================================================
// STANDARD EVENT CODES
// ============================================================================

const enum StandardEventCode {
  Undefined = 0x4000,
  CancelTransaction = 0x4001,
  ObjectAdded = 0x4002,
  ObjectRemoved = 0x4003,
  StoreAdded = 0x4004,
  StoreRemoved = 0x4005,
  DevicePropChanged = 0x4006,
  ObjectInfoChanged = 0x4007,
  DeviceInfoChanged = 0x4008,
  RequestObjectTransfer = 0x4009,
  StoreFull = 0x400A,
  DeviceReset = 0x400B,
  StorageInfoChanged = 0x400C,
  CaptureComplete = 0x400D,
  UnreportedStatus = 0x400E
}

// ============================================================================
// STANDARD DEVICE PROPERTY CODES
// ============================================================================

const enum StandardDevicePropCode {
  Undefined = 0x5000,
  BatteryLevel = 0x5001,
  FunctionalMode = 0x5002,
  ImageSize = 0x5003,
  CompressionSetting = 0x5004,
  WhiteBalance = 0x5005,
  RGBGain = 0x5006,
  FNumber = 0x5007,
  FocalLength = 0x5008,
  FocusDistance = 0x5009,
  FocusMode = 0x500A,
  ExposureMeteringMode = 0x500B,
  FlashMode = 0x500C,
  ExposureTime = 0x500D,
  ExposureProgramMode = 0x500E,
  ExposureIndex = 0x500F,
  ExposureBiasCompensation = 0x5010,
  DateTime = 0x5011,
  CaptureDelay = 0x5012,
  StillCaptureMode = 0x5013,
  Contrast = 0x5014,
  Sharpness = 0x5015,
  DigitalZoom = 0x5016,
  EffectMode = 0x5017,
  BurstNumber = 0x5018,
  BurstInterval = 0x5019,
  TimelapseNumber = 0x501A,
  TimelapseInterval = 0x501B,
  FocusMeteringMode = 0x501C,
  UploadURL = 0x501D,
  Artist = 0x501E,
  CopyrightInfo = 0x501F,
  
  // PTP v1.1 Streaming
  SupportedStreams = 0x5020,
  EnabledStreams = 0x5021,
  VideoFormat = 0x5022,
  VideoResolution = 0x5023,
  VideoQuality = 0x5024,
  VideoFrameRate = 0x5025,
  VideoContrast = 0x5026,
  VideoBrightness = 0x5027
}

// ============================================================================
// STANDARD OBJECT FORMAT CODES
// ============================================================================

const enum StandardObjectFormatCode {
  Undefined = 0x3000,
  Association = 0x3001,
  Script = 0x3002,
  Executable = 0x3003,
  Text = 0x3004,
  HTML = 0x3005,
  DPOF = 0x3006,
  AIFF = 0x3007,
  WAV = 0x3008,
  MP3 = 0x3009,
  AVI = 0x300A,
  MPEG = 0x300B,
  ASF = 0x300C,
  
  // Image Formats
  EXIF_JPEG = 0x3801,
  TIFF_EP = 0x3802,
  FlashPix = 0x3803,
  BMP = 0x3804,
  CIFF = 0x3805,
  GIF = 0x3807,
  JFIF = 0x3808,
  PCD = 0x3809,
  PICT = 0x380A,
  PNG = 0x380B,
  TIFF = 0x380D,
  TIFF_IT = 0x380E,
  JP2 = 0x380F,
  JPX = 0x3810,
  DNG = 0x3811
}

// ============================================================================
// FUNCTIONAL MODE
// ============================================================================

interface FunctionalMode {
  readonly value: UINT16;
  readonly isStandard: boolean; // 0x0000
  readonly isSleep: boolean;    // 0x0001
  readonly isVendor: boolean;   // bit 15 = 1
}

const enum StandardFunctionalMode {
  Standard = 0x0000,
  Sleep = 0x0001
}

// ============================================================================
// PROTECTION STATUS
// ============================================================================

const enum ProtectionStatus {
  NoProtection = 0x0000,
  ReadOnly = 0x0001,
  ReadOnlyData = 0x8002,
  NonTransferable = 0x8003
}

// ============================================================================
// ASSOCIATION TYPE
// ============================================================================

const enum AssociationType {
  Undefined = 0x0000,
  GenericFolder = 0x0001,
  Album = 0x0002,
  TimeSequence = 0x0003,
  HorizontalPanoramic = 0x0004,
  VerticalPanoramic = 0x0005,
  Panoramic2D = 0x0006,
  AncillaryData = 0x0007
}

// ============================================================================
// DATA SETS
// ============================================================================

/** DeviceInfo Dataset */
interface DeviceInfo {
  readonly StandardVersion: UINT16;
  readonly VendorExtensionID: UINT32;
  readonly VendorExtensionVersion: UINT16;
  readonly VendorExtensionDesc: PTPString;
  readonly FunctionalMode: FunctionalMode;
  readonly OperationsSupported: PTPArray<OperationCode>;
  readonly EventsSupported: PTPArray<EventCode>;
  readonly DevicePropertiesSupported: PTPArray<DevicePropCode>;
  readonly CaptureFormats: PTPArray<ObjectFormatCode>;
  readonly ImageFormats: PTPArray<ObjectFormatCode>;
  readonly Manufacturer: PTPString;
  readonly Model: PTPString;
  readonly DeviceVersion: PTPString;
  readonly SerialNumber: PTPString;
}

/** ObjectInfo Dataset */
interface ObjectInfo {
  readonly StorageID: StorageID;
  readonly ObjectFormat: ObjectFormatCode;
  readonly ProtectionStatus: ProtectionStatus;
  readonly ObjectCompressedSize: UINT32;
  readonly ThumbFormat: ObjectFormatCode;
  readonly ThumbCompressedSize: UINT32;
  readonly ThumbPixWidth: UINT32;
  readonly ThumbPixHeight: UINT32;
  readonly ImagePixWidth: UINT32;
  readonly ImagePixHeight: UINT32;
  readonly ImageBitDepth: UINT32;
  readonly ParentObject: ObjectHandle;
  readonly AssociationType: AssociationType;
  readonly AssociationDesc: UINT32;
  readonly SequenceNumber: UINT32;
  readonly Filename: PTPString;
  readonly CaptureDate: DateTime;
  readonly ModificationDate: DateTime;
  readonly Keywords: PTPString;
}

/** StorageInfo Dataset */
interface StorageInfo {
  readonly StorageType: StorageType;
  readonly FilesystemType: FilesystemType;
  readonly AccessCapability: AccessCapability;
  readonly MaxCapacity: UINT64;
  readonly FreeSpaceInBytes: UINT64;
  readonly FreeSpaceInImages: UINT32;
  readonly StorageDescription: PTPString;
  readonly VolumeLabel: PTPString;
}

/** Storage Type */
const enum StorageType {
  Undefined = 0x0000,
  FixedROM = 0x0001,
  RemovableROM = 0x0002,
  FixedRAM = 0x0003,
  RemovableRAM = 0x0004
}

/** Filesystem Type */
const enum FilesystemType {
  Undefined = 0x0000,
  GenericFlat = 0x0001,
  GenericHierarchical = 0x0002,
  DCF = 0x0003
}

/** Access Capability */
const enum AccessCapability {
  ReadWrite = 0x0000,
  ReadOnlyWithoutDelete = 0x0001,
  ReadOnlyWithDelete = 0x0002
}

// ============================================================================
// DEVICE PROPERTY DESCRIPTOR
// ============================================================================

/** Device Property Descriptor */
interface DevicePropDesc<T = any> {
  readonly DevicePropCode: DevicePropCode;
  readonly Datatype: DataType;
  readonly GetSet: GetSetFlag;
  readonly FactoryDefaultValue: T;
  readonly CurrentValue: T;
  readonly FormFlag: FormFlag;
  readonly Form: PropertyForm<T> | null;
}

/** Data Types */
const enum DataType {
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

/** Get/Set Flag */
const enum GetSetFlag {
  ReadOnly = 0x00,
  ReadWrite = 0x01
}

/** Form Flag */
const enum FormFlag {
  None = 0x00,
  Range = 0x01,
  Enumeration = 0x02
}

/** Property Form */
type PropertyForm<T> = RangeForm<T> | EnumerationForm<T>;

/** Range Form */
interface RangeForm<T> {
  readonly type: 'range';
  readonly MinimumValue: T;
  readonly MaximumValue: T;
  readonly StepSize: T;
}

/** Enumeration Form */
interface EnumerationForm<T> {
  readonly type: 'enumeration';
  readonly NumberOfValues: UINT16;
  readonly SupportedValues: ReadonlyArray<T>;
}

// ============================================================================
// PROTOCOL MESSAGES
// ============================================================================

/** Operation Request (30 bytes) */
interface OperationRequest {
  readonly OperationCode: OperationCode;
  readonly SessionID: SessionID | 0;
  readonly TransactionID: TransactionID;
  readonly Parameter1?: UINT32;
  readonly Parameter2?: UINT32;
  readonly Parameter3?: UINT32;
  readonly Parameter4?: UINT32;
  readonly Parameter5?: UINT32;
}

/** Operation Response (30 bytes) */
interface OperationResponse {
  readonly ResponseCode: ResponseCode;
  readonly SessionID: SessionID | 0;
  readonly TransactionID: TransactionID;
  readonly Parameter1?: UINT32;
  readonly Parameter2?: UINT32;
  readonly Parameter3?: UINT32;
  readonly Parameter4?: UINT32;
  readonly Parameter5?: UINT32;
}

/** Event (22 bytes) */
interface Event {
  readonly EventCode: EventCode;
  readonly SessionID: SessionID | 0xFFFFFFFF;
  readonly TransactionID: TransactionID | 0xFFFFFFFF;
  readonly Parameter1?: UINT32;
  readonly Parameter2?: UINT32;
  readonly Parameter3?: UINT32;
}

// ============================================================================
// TRANSACTION
// ============================================================================

/** Complete Transaction */
interface Transaction<TData = unknown> {
  readonly request: OperationRequest;
  readonly data?: TData;
  readonly response: OperationResponse;
  readonly state: TransactionState;
}

/** Transaction State */
const enum TransactionState {
  Pending = 'pending',
  RequestSent = 'request_sent',
  DataPhase = 'data_phase',
  ResponseReceived = 'response_received',
  Cancelled = 'cancelled',
  Error = 'error'
}

// ============================================================================
// STREAMING (PTP v1.1)
// ============================================================================

/** Stream Info Dataset */
interface StreamInfo {
  readonly StreamType: StreamType;
  readonly StreamFormat: StreamFormat;
  readonly Width: UINT32;
  readonly Height: UINT32;
  readonly FrameRate: UINT32;
  readonly BitRate: UINT32;
  readonly SampleRate: UINT32;
  readonly Channels: UINT8;
  readonly BitsPerSample: UINT8;
}

/** Stream Type */
const enum StreamType {
  Undefined = 0x0000,
  LiveView = 0x0001,
  Recording = 0x0002,
  Audio = 0x0003
}

/** Stream Format */
const enum StreamFormat {
  Undefined = 0x0000,
  JPEG = 0x0001,
  MJPEG = 0x0002,
  H264 = 0x0003,
  PCM = 0x0004,
  AAC = 0x0005
}

/** Stream Packet Header */
interface StreamPacketHeader {
  readonly StreamID: UINT16;
  readonly SequenceNumber: UINT32;
  readonly Timestamp: UINT64;
  readonly PayloadSize: UINT32;
  readonly Flags: StreamPacketFlags;
}

/** Stream Packet Flags */
interface StreamPacketFlags {
  readonly isFirstFragment: boolean;
  readonly isLastFragment: boolean;
  readonly isKeyFrame: boolean;
}

// ============================================================================
// VENDOR EXTENSIONS
// ============================================================================

/** Vendor Extension */
interface VendorExtension {
  readonly VendorExtensionID: UINT32;
  readonly VendorExtensionVersion: UINT16;
  readonly VendorExtensionDesc: PTPString;
  readonly VendorOperations: PTPArray<OperationCode>;
  readonly VendorEvents: PTPArray<EventCode>;
  readonly VendorProperties: PTPArray<DevicePropCode>;
  readonly VendorFormats: PTPArray<ObjectFormatCode>;
}

/** Vendor Extension Map (PTP v1.1) */
interface VendorExtensionMap {
  readonly VendorExtensionID: UINT32;
  readonly FunctionalMode: FunctionalMode;
  readonly Operations: Map<OperationCode, OperationCode>;
  readonly Events: Map<EventCode, EventCode>;
  readonly Properties: Map<DevicePropCode, DevicePropCode>;
  readonly Formats: Map<ObjectFormatCode, ObjectFormatCode>;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/** PTP Session */
interface PTPSession {
  readonly sessionID: SessionID;
  readonly initiator: PTPInitiator;
  readonly responder: PTPResponder;
  readonly state: SessionState;
  readonly transactionCounter: number;
  readonly openHandles: Set<ObjectHandle>;
  readonly activeStreams: Map<UINT16, StreamInfo>;
}

/** Session State */
const enum SessionState {
  Closed = 'closed',
  Opening = 'opening',
  Open = 'open',
  Closing = 'closing',
  Error = 'error'
}

/** PTP Initiator */
interface PTPInitiator {
  readonly role: 'initiator';
  sendOperation(op: OperationRequest): Promise<void>;
  sendData<T>(data: T): Promise<void>;
  receiveData<T>(): Promise<T>;
  receiveResponse(): Promise<OperationResponse>;
  receiveEvent(): Promise<Event>;
}

/** PTP Responder */
interface PTPResponder {
  readonly role: 'responder';
  receiveOperation(): Promise<OperationRequest>;
  receiveData<T>(): Promise<T>;
  sendData<T>(data: T): Promise<void>;
  sendResponse(resp: OperationResponse): Promise<void>;
  sendEvent(event: Event): Promise<void>;
}

// ============================================================================
// TRANSPORT LAYER
// ============================================================================

/** Transport Interface */
interface PTPTransport {
  readonly type: TransportType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendPacket(packet: Uint8Array): Promise<void>;
  receivePacket(): Promise<Uint8Array>;
  supportsAsyncEvents(): boolean;
  getMaxPacketSize(): number;
}

/** Transport Type */
const enum TransportType {
  USB = 'USB',
  TCP_IP = 'TCP/IP',
  IEEE1394 = 'IEEE1394',
  Bluetooth = 'Bluetooth'
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/** PTP Error */
class PTPError extends Error {
  constructor(
    public readonly code: ResponseCode,
    public readonly operation?: OperationCode,
    public readonly parameters?: ReadonlyArray<UINT32>
  ) {
    super(`PTP Error: ${StandardResponseCode[code as any] || `0x${code.toString(16)}`}`);
    this.name = 'PTPError';
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/** Type guard for valid ObjectHandle */
function isValidObjectHandle(handle: number): handle is ObjectHandle {
  return handle !== SpecialObjectHandle.Invalid && 
         handle > 0 && 
         handle <= 0xFFFFFFFF;
}

/** Type guard for valid SessionID */
function isValidSessionID(id: number): id is SessionID {
  return id > 0 && id <= 0xFFFFFFFF;
}

/** Type guard for valid StorageID */
function isValidStorageID(id: number): boolean {
  return id >= 0 && id <= 0xFFFFFFFF;
}

/** Type guard for vendor code */
function isVendorCode(code: number): boolean {
  return (code & 0x8000) !== 0; // bit 15 set
}

/** Type guard for standard operation code */
function isStandardOperationCode(code: number): code is StandardOperationCode {
  return code >= 0x1000 && code <= 0x1FFF && !isVendorCode(code);
}

/** Type guard for standard response code */
function isStandardResponseCode(code: number): code is StandardResponseCode {
  return code >= 0x2000 && code <= 0x2FFF && !isVendorCode(code);
}

/** Type guard for standard event code */
function isStandardEventCode(code: number): code is StandardEventCode {
  return code >= 0x4000 && code <= 0x4FFF && !isVendorCode(code);
}

/** Type guard for standard device property code */
function isStandardDevicePropCode(code: number): code is StandardDevicePropCode {
  return code >= 0x5000 && code <= 0x5FFF && !isVendorCode(code);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Extract physical storage ID from StorageID */
function getPhysicalStorageID(storageID: StorageID): UINT16 {
  return ((storageID.value >> 16) & 0xFFFF) as UINT16;
}

/** Extract logical storage ID from StorageID */
function getLogicalStorageID(storageID: StorageID): UINT16 {
  return (storageID.value & 0xFFFF) as UINT16;
}

/** Create StorageID from physical and logical IDs */
function createStorageID(physicalID: UINT16, logicalID: UINT16): StorageID {
  return {
    value: ((physicalID << 16) | logicalID) as UINT32,
    physicalID,
    logicalID,
    __type: 'StorageID'
  };
}

/** Parse DateTime string */
function parseDateTime(dt: string): Date | null {
  const match = dt.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d)$/);
  if (!match) return null;
  
  const [_, year, month, day, hour, minute, second, tenth] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second),
    parseInt(tenth) * 100
  );
}

/** Format Date to PTP DateTime */
function formatDateTime(date: Date): DateTime {
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  const tenth = Math.floor(date.getMilliseconds() / 100).toString();
  
  return `${year}${month}${day}T${hour}${minute}${second}.${tenth}` as DateTime;
}

// ============================================================================
// OPERATION BUILDERS
// ============================================================================

/** Builder for type-safe operation requests */
class OperationBuilder {
  static getDeviceInfo(transactionID: TransactionID): OperationRequest {
    return {
      OperationCode: StandardOperationCode.GetDeviceInfo as OperationCode,
      SessionID: 0,
      TransactionID: transactionID
    };
  }
  
  static openSession(sessionID: SessionID): OperationRequest {
    return {
      OperationCode: StandardOperationCode.OpenSession as OperationCode,
      SessionID: 0,
      TransactionID: 0x00000000 as TransactionID,
      Parameter1: sessionID
    };
  }
  
  static closeSession(sessionID: SessionID, transactionID: TransactionID): OperationRequest {
    return {
      OperationCode: StandardOperationCode.CloseSession as OperationCode,
      SessionID: sessionID,
      TransactionID: transactionID
    };
  }
  
  static getObjectInfo(
    sessionID: SessionID,
    transactionID: TransactionID,
    objectHandle: ObjectHandle
  ): OperationRequest {
    return {
      OperationCode: StandardOperationCode.GetObjectInfo as OperationCode,
      SessionID: sessionID,
      TransactionID: transactionID,
      Parameter1: objectHandle
    };
  }
  
  static getObject(
    sessionID: SessionID,
    transactionID: TransactionID,
    objectHandle: ObjectHandle
  ): OperationRequest {
    return {
      OperationCode: StandardOperationCode.GetObject as OperationCode,
      SessionID: sessionID,
      TransactionID: transactionID,
      Parameter1: objectHandle
    };
  }
  
  static initiateCapture(
    sessionID: SessionID,
    transactionID: TransactionID,
    storageID?: StorageID,
    objectFormatCode?: ObjectFormatCode
  ): OperationRequest {
    return {
      OperationCode: StandardOperationCode.InitiateCapture as OperationCode,
      SessionID: sessionID,
      TransactionID: transactionID,
      Parameter1: storageID?.value,
      Parameter2: objectFormatCode
    };
  }
}

// ============================================================================
// COMPLETE PTP CLIENT INTERFACE
// ============================================================================

/** Complete PTP Client with type safety */
interface PTPClient {
  // Session management
  connect(transport: PTPTransport): Promise<void>;
  disconnect(): Promise<void>;
  openSession(): Promise<SessionID>;
  closeSession(): Promise<void>;
  
  // Device information
  getDeviceInfo(): Promise<DeviceInfo>;
  getDevicePropDesc(prop: DevicePropCode): Promise<DevicePropDesc>;
  getDevicePropValue<T>(prop: DevicePropCode): Promise<T>;
  setDevicePropValue<T>(prop: DevicePropCode, value: T): Promise<void>;
  
  // Storage operations
  getStorageIDs(): Promise<PTPArray<StorageID>>;
  getStorageInfo(storageID: StorageID): Promise<StorageInfo>;
  formatStore(storageID: StorageID, filesystemType?: FilesystemType): Promise<void>;
  
  // Object operations
  getNumObjects(
    storageID?: StorageID,
    objectFormat?: ObjectFormatCode,
    parentObject?: ObjectHandle
  ): Promise<UINT32>;
  
  getObjectHandles(
    storageID?: StorageID,
    objectFormat?: ObjectFormatCode,
    parentObject?: ObjectHandle
  ): Promise<PTPArray<ObjectHandle>>;
  
  getObjectInfo(handle: ObjectHandle): Promise<ObjectInfo>;
  getObject(handle: ObjectHandle): Promise<Uint8Array>;
  getThumb(handle: ObjectHandle): Promise<Uint8Array>;
  deleteObject(handle: ObjectHandle, objectFormat?: ObjectFormatCode): Promise<void>;
  
  sendObjectInfo(
    info: ObjectInfo,
    storageID?: StorageID,
    parentObject?: ObjectHandle
  ): Promise<ObjectHandle>;
  
  sendObject(data: Uint8Array): Promise<void>;
  
  // Capture operations
  initiateCapture(
    storageID?: StorageID,
    objectFormat?: ObjectFormatCode
  ): Promise<void>;
  
  initiateOpenCapture(
    storageID?: StorageID,
    objectFormat?: ObjectFormatCode
  ): Promise<void>;
  
  terminateOpenCapture(transactionID: TransactionID): Promise<void>;
  
  // Event handling
  onEvent(callback: (event: Event) => void): void;
  offEvent(callback: (event: Event) => void): void;
  
  // Streaming (v1.1)
  getStreamInfo(streamType: StreamType): Promise<StreamInfo>;
  getStream(streamType: StreamType): AsyncIterable<Uint8Array>;
}

// ============================================================================
// EXPORT ALL PUBLIC TYPES
// ============================================================================

export type {
  // Primitive types
  INT8, INT16, INT32, INT64, INT128,
  UINT8, UINT16, UINT32, UINT64, UINT128,
  PTPString, DateTime,
  
  // Arrays
  PTPArray, PTPDataSetArray,
  
  // Core identifiers
  ObjectHandle, StorageID, SessionID, TransactionID,
  
  // Data codes
  DataCode, OperationCode, ResponseCode, EventCode,
  DevicePropCode, ObjectFormatCode,
  
  // Functional mode
  FunctionalMode,
  
  // Data sets
  DeviceInfo, ObjectInfo, StorageInfo,
  DevicePropDesc, PropertyForm, RangeForm, EnumerationForm,
  
  // Protocol messages
  OperationRequest, OperationResponse, Event,
  
  // Transactions
  Transaction,
  
  // Streaming
  StreamInfo, StreamPacketHeader, StreamPacketFlags,
  
  // Vendor extensions
  VendorExtension, VendorExtensionMap,
  
  // Session management
  PTPSession, PTPInitiator, PTPResponder,
  
  // Transport
  PTPTransport,
  
  // Client interface
  PTPClient
};

export {
  // Enums
  SpecialObjectHandle, SpecialStorageID,
  StandardOperationCode, StandardResponseCode, StandardEventCode,
  StandardDevicePropCode, StandardObjectFormatCode,
  StandardFunctionalMode, ProtectionStatus, AssociationType,
  StorageType, FilesystemType, AccessCapability,
  DataType, GetSetFlag, FormFlag,
  TransactionState, SessionState, StreamType, StreamFormat, TransportType,
  
  // Error handling
  PTPError,
  
  // Type guards
  isValidObjectHandle, isValidSessionID, isValidStorageID,
  isVendorCode, isStandardOperationCode, isStandardResponseCode,
  isStandardEventCode, isStandardDevicePropCode,
  
  // Utilities
  getPhysicalStorageID, getLogicalStorageID, createStorageID,
  parseDateTime, formatDateTime,
  
  // Builders
  OperationBuilder
};