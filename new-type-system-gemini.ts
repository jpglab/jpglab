/**
 * ============================================================================
 * PTP ISO 15740 - Type System
 * ============================================================================
 *
 * This file defines a comprehensive TypeScript type system for the Picture
 * Transfer Protocol (PTP) as specified in ISO 15740. It aims to provide
 * type safety for all data structures, datasets, codes, and operations
 * described in the standard.
 *
 * @version 1.1.0
 * @see ISO 15740:2013(E)
 */

// ============================================================================
// 1. Primitive Data Types
// ============================================================================

// Signed Integers
export type INT8 = number;
export type INT16 = number;
export type INT32 = number;
export type INT64 = bigint;
export type INT128 = bigint;

// Unsigned Integers
export type UINT8 = number;
export type UINT16 = number;
export type UINT32 = number;
export type UINT64 = bigint;
export type UINT128 = bigint;

// String Types
/** A string representing a date and time in "YYYYMMDDThhmmss.s" format. */
export type DateTimeString = string;

/** A variable-length UTF-16 string, max 255 characters including null terminator. */
export type PTPString = string;

// ============================================================================
// 2. Array Types
// ============================================================================

/**
 * Represents a PTP-defined array.
 * In the protocol, this is a UINT32 count followed by the elements.
 * In TypeScript, we represent it as a standard array.
 * @template T The type of elements in the array.
 */
export type PTPArray<T> = T[];

// ============================================================================
// 3. Core Identifiers and Handles
// ============================================================================

/** A 32-bit unique identifier for a data object, persistent within a session. */
export type ObjectHandle = UINT32;

/** A 32-bit identifier combining PhysicalStorageID (MSW) and LogicalStorageID (LSW). */
export type StorageID = UINT32;

/** A 32-bit identifier for a session, assigned by the initiator. */
export type SessionID = UINT32;

/** A 32-bit identifier for a transaction, incrementing sequentially. */
export type TransactionID = UINT32;

/** A 32-bit identifier for a vendor's extension namespace. */
export type VendorExtensionID = UINT32;

// ============================================================================
// 4. PTP Codes (Enums)
// ============================================================================

/**
 * Defines standard Object Format Codes used to identify file types.
 * Vendor-extended codes will have bit 15 set to 1.
 */
export enum ObjectFormatCode {
	Undefined = 0x3000,
	Association = 0x3001, // e.g., folder
	Script = 0x3002,
	Executable = 0x3003,
	Text = 0x3004,
	HTML = 0x3005,
	DPOF = 0x3006, // Digital Print Order Format
	AIFF = 0x3007, // Audio
	WAV = 0x3008, // Audio
	MP3 = 0x3009, // Audio
	AVI = 0x300a, // Video
	MPEG = 0x300b, // Video
	ASF = 0x300c, // Microsoft Advanced Streaming Format
	JPEG = 0x3801,
	TIFF_EP = 0x3802,
	FlashPix = 0x3803,
	BMP = 0x3804,
	CIFF = 0x3805, // Camera Image File Format
	GIF = 0x3807,
	JFIF = 0x3808,
	PCD = 0x3809, // PhotoCD Image Pac
	PICT = 0x380a,
	PNG = 0x380b,
	TIFF = 0x380d,
	TIFF_IT = 0x380e, // TIFF for Information Technology
	JP2 = 0x380f, // JPEG2000 Baseline
	JPX = 0x3810, // JPEG2000 Extended
	DNG = 0x3811, // Digital Negative
}

/**
 * Defines standard Operation Codes for PTP commands.
 * Vendor-extended codes will have bit 15 set to 1.
 */
export enum OperationCode {
	GetDeviceInfo = 0x1001,
	OpenSession = 0x1002,
	CloseSession = 0x1003,
	GetStorageIDs = 0x1004,
	GetStorageInfo = 0x1005,
	GetNumObjects = 0x1006,
	GetObjectHandles = 0x1007,
	GetObjectInfo = 0x1008,
	GetObject = 0x1009,
	GetThumb = 0x100a,
	DeleteObject = 0x100b,
	SendObjectInfo = 0x100c,
	SendObject = 0x100d,
	InitiateCapture = 0x100e,
	FormatStore = 0x100f,
	ResetDevice = 0x1010,
	GetDevicePropDesc = 0x1014,
	GetDevicePropValue = 0x1015,
	SetDevicePropValue = 0x1016,
	ResetDevicePropValue = 0x1017,
	TerminateOpenCapture = 0x1018,
	InitiateOpenCapture = 0x101c,
	PowerDown = 0x1013,
	// PTP v1.1
	GetStreamInfo = 0x1024,
	GetStream = 0x1025,
}

/**
 * Defines standard Response Codes for PTP command replies.
 * Vendor-extended codes will have bit 15 set to 1.
 */
export enum ResponseCode {
	OK = 0x2001,
	GeneralError = 0x2002,
	SessionNotOpen = 0x2003,
	InvalidTransactionID = 0x2004,
	OperationNotSupported = 0x2005,
	ParameterNotSupported = 0x2006,
	IncompleteTransfer = 0x2007,
	InvalidStorageID = 0x2008,
	InvalidObjectHandle = 0x2009,
	DevicePropNotSupported = 0x200a,
	InvalidObjectFormatCode = 0x200b,
	StoreFull = 0x200c,
	ObjectWriteProtected = 0x200d,
	StoreReadOnly = 0x200e,
	AccessDenied = 0x200f,
	NoThumbnailPresent = 0x2010,
	SelfTestFailed = 0x2011,
	PartialDeletion = 0x2012,
	StoreNotAvailable = 0x2013,
	SpecificationByFormatUnsupported = 0x2014,
	NoValidObjectInfo = 0x2015,
	InvalidCodeFormat = 0x2016,
	UnknownVendorCode = 0x2017,
	CaptureAborted = 0x2018,
	DeviceBusy = 0x2019,
	InvalidParentObject = 0x201a,
	InvalidDevicePropFormat = 0x201b,
	InvalidDevicePropValue = 0x201c,
	InvalidParameter = 0x201d,
	SessionAlreadyOpened = 0x201e,
	TransactionCanceled = 0x201f,
	SpecificationOfDestinationUnsupported = 0x2020,
}

/**
 * Defines standard Event Codes for asynchronous device-to-initiator messages.
 * Vendor-extended codes will have bit 15 set to 1.
 */
export enum EventCode {
	CancelTransaction = 0x4001,
	ObjectAdded = 0x4002,
	ObjectRemoved = 0x4003,
	StoreAdded = 0x4004,
	StoreRemoved = 0x4005,
	DevicePropChanged = 0x4006,
	ObjectInfoChanged = 0x4007,
	DeviceInfoChanged = 0x4008,
	RequestObjectTransfer = 0x4009,
	StoreFull = 0x400a,
	DeviceReset = 0x400b,
	StorageInfoChanged = 0x400c,
	CaptureComplete = 0x400d,
	UnreportedStatus = 0x400e,
}

/**
 * Defines standard Device Property Codes.
 * Vendor-extended codes will have bit 15 set to 1.
 */
export enum DevicePropCode {
	BatteryLevel = 0x5001,
	FunctionalMode = 0x5002,
	ImageSize = 0x5003,
	CompressionSetting = 0x5004,
	WhiteBalance = 0x5005,
	RGBGain = 0x5006,
	FNumber = 0x5007,
	FocalLength = 0x5008,
	FocusDistance = 0x5009,
	FocusMode = 0x500a,
	ExposureMeteringMode = 0x500b,
	FlashMode = 0x500c,
	ExposureTime = 0x500d,
	ExposureProgramMode = 0x500e,
	ExposureIndex = 0x500f, // ISO
	ExposureBiasCompensation = 0x5010,
	DateTime = 0x5011,
	CaptureDelay = 0x5012,
	StillCaptureMode = 0x5013,
	BurstNumber = 0x5018,
	BurstInterval = 0x5019,
	TimelapseNumber = 0x501a,
	TimelapseInterval = 0x501b,
	// PTP v1.1 Streaming
	SupportedStreams = 0x5020,
	EnabledStreams = 0x5021,
}

/** Data type codes for device properties. */
export enum DatatypeCode {
	INT8 = 0x0001,
	UINT8 = 0x0002,
	INT16 = 0x0003,
	UINT16 = 0x0004,
	INT32 = 0x0005,
	UINT32 = 0x0006,
	INT64 = 0x0007,
	UINT64 = 0x0008,
	INT128 = 0x0009,
	UINT128 = 0x000a,
	AINT8 = 0x4001,
	AUINT8 = 0x4002,
	AINT16 = 0x4003,
	AUINT16 = 0x4004,
	AINT32 = 0x4005,
	AUINT32 = 0x4006,
	AINT64 = 0x4007,
	AUINT64 = 0x4008,
	AINT128 = 0x4009,
	AUINT128 = 0x400a,
	String = 0xffff,
}

// ============================================================================
// 5. PTP Data Structures and Datasets
// ============================================================================

/**
 * Describes the capabilities of a PTP device.
 * Sent in response to a GetDeviceInfo operation.
 */
export interface DeviceInfo {
	StandardVersion: UINT16;
	VendorExtensionID: VendorExtensionID;
	VendorExtensionVersion: UINT16;
	VendorExtensionDesc: PTPString;
	FunctionalMode: UINT16;
	OperationsSupported: PTPArray<OperationCode>;
	EventsSupported: PTPArray<EventCode>;
	DevicePropertiesSupported: PTPArray<DevicePropCode>;
	CaptureFormats: PTPArray<ObjectFormatCode>;
	ImageFormats: PTPArray<ObjectFormatCode>;
	Manufacturer: PTPString;
	Model: PTPString;
	DeviceVersion: PTPString;
	SerialNumber: PTPString;
}

/**
 * Describes a single data object stored on the device.
 * Sent in response to a GetObjectInfo operation.
 */
export interface ObjectInfo {
	StorageID: StorageID;
	ObjectFormat: ObjectFormatCode;
	ProtectionStatus: UINT16;
	ObjectCompressedSize: UINT32;
	ThumbFormat: ObjectFormatCode;
	ThumbCompressedSize: UINT32;
	ThumbPixWidth: UINT32;
	ThumbPixHeight: UINT32;
	ImagePixWidth: UINT32;
	ImagePixHeight: UINT32;
	ImageBitDepth: UINT32;
	ParentObject: ObjectHandle;
	AssociationType: UINT16;
	AssociationDesc: UINT32;
	SequenceNumber: UINT32;
	Filename: PTPString;
	CaptureDate: DateTimeString;
	ModificationDate: DateTimeString;
	Keywords: PTPString;
}

/**
 * Describes a storage unit on the device.
 * Sent in response to a GetStorageInfo operation.
 */
export interface StorageInfo {
	StorageType: UINT16;
	FilesystemType: UINT16;
	AccessCapability: UINT16;
	MaxCapacity: UINT64;
	FreeSpaceInBytes: UINT64;
	FreeSpaceInImages: UINT32;
	StorageDescription: PTPString;
	VolumeLabel: PTPString;
}

/**
 * Describes a device property, including its type, current value, and allowed values.
 * Sent in response to a GetDevicePropDesc operation.
 */
export interface DevicePropDesc<T extends DevicePropValue = DevicePropValue> {
	DevicePropCode: DevicePropCode;
	Datatype: DatatypeCode;
	GetSet: 0x00 | 0x01; // 0x00=Get, 0x01=Get/Set
	FactoryDefaultValue: T;
	CurrentValue: T;
	FormFlag: FormFlag;
	Form: DevicePropForm<T> | null;
}

/** The value of a device property, which can be of any PTP primitive or array type. */
export type DevicePropValue =
	| INT8
	| UINT8
	| INT16
	| UINT16
	| INT32
	| UINT32
	| INT64
	| UINT64
	| INT128
	| UINT128
	| PTPArray<INT8>
	| PTPArray<UINT8>
	| PTPArray<INT16>
	| PTPArray<UINT16>
	| PTPArray<INT32>
	| PTPArray<UINT32>
	| PTPArray<INT64>
	| PTPArray<UINT64>
	| PTPArray<INT128>
	| PTPArray<UINT128>
	| PTPString;

/** Specifies the form of allowed values for a device property. */
export enum FormFlag {
	None = 0x00,
	Range = 0x01,
	Enum = 0x02,
}

/** Defines a range of allowed values for a numeric device property. */
export interface RangeForm<T extends number | bigint> {
	MinimumValue: T;
	MaximumValue: T;
	StepSize: T;
}

/** Defines a list of enumerated allowed values for a device property. */
export interface EnumForm<T extends DevicePropValue> {
	SupportedValues: PTPArray<T>;
}

/** A union type representing the form of allowed values for a device property. */
export type DevicePropForm<T extends DevicePropValue> = T extends number | bigint
	? RangeForm<T> | EnumForm<T>
	: EnumForm<T>;

// ============================================================================
// 6. Communication Protocol Structures
// ============================================================================

/** Base structure for PTP command and response packets. */
interface PTPPacket {
	SessionID: SessionID;
	TransactionID: TransactionID;
	Parameter1?: UINT32;
	Parameter2?: UINT32;
	Parameter3?: UINT32;
	Parameter4?: UINT32;
	Parameter5?: UINT32;
}

/** Represents an Operation Request packet sent from initiator to responder. */
export interface OperationRequest extends PTPPacket {
	OperationCode: OperationCode;
}

/** Represents a Response packet sent from responder to initiator. */
export interface Response extends PTPPacket {
	ResponseCode: ResponseCode;
}

/**
 * Represents an Event dataset sent from responder to initiator.
 */
export interface Event {
	EventCode: EventCode;
	SessionID: SessionID;
	TransactionID: TransactionID;
	Parameter1?: UINT32;
	Parameter2?: UINT32;
	Parameter3?: UINT32;
}

// ============================================================================
// 7. Type Guards and Utility Types
// ============================================================================

/**
 * A mapped type to associate DevicePropCodes with their corresponding data types.
 * This enables stronger type checking when getting/setting property values.
 * This is an illustrative example and would need to be fully populated.
 */
export type DevicePropMap = {
	[DevicePropCode.BatteryLevel]: UINT8;
	[DevicePropCode.FunctionalMode]: UINT16;
	[DevicePropCode.ImageSize]: PTPString;
	[DevicePropCode.CompressionSetting]: UINT8;
	[DevicePropCode.WhiteBalance]: UINT16;
	[DevicePropCode.RGBGain]: PTPString;
	[DevicePropCode.FNumber]: UINT16;
	[DevicePropCode.FocalLength]: UINT32;
	[DevicePropCode.FocusDistance]: UINT16;
	[DevicePropCode.FocusMode]: UINT16;
	[DevicePropCode.ExposureMeteringMode]: UINT16;
	[DevicePropCode.FlashMode]: UINT16;
	[DevicePropCode.ExposureTime]: UINT32;
	[DevicePropCode.ExposureProgramMode]: UINT16;
	[DevicePropCode.ExposureIndex]: UINT16;
	[DevicePropCode.ExposureBiasCompensation]: INT16;
	[DevicePropCode.DateTime]: DateTimeString;
	[DevicePropCode.CaptureDelay]: UINT32;
	[DevicePropCode.StillCaptureMode]: UINT16;
	[DevicePropCode.BurstNumber]: UINT16;
	[DevicePropCode.BurstInterval]: UINT32;
	[DevicePropCode.TimelapseNumber]: UINT16;
	[DevicePropCode.TimelapseInterval]: UINT32;
};

/**
 * A generic type for a Device Property Description that is strongly typed
 * based on the DevicePropCode.
 *
 * @example
 * const fNumberDesc: TypedDevicePropDesc<DevicePropCode.FNumber> = ...;
 * // fNumberDesc.CurrentValue is now of type UINT16
 */
export type TypedDevicePropDesc<C extends keyof DevicePropMap> = Omit<
	DevicePropDesc,
	'DevicePropCode' | 'FactoryDefaultValue' | 'CurrentValue' | 'Form'
> & {
	DevicePropCode: C;
	FactoryDefaultValue: DevicePropMap[C];
	CurrentValue: DevicePropMap[C];
	Form: DevicePropForm<DevicePropMap[C]> | null;
};

/**
 * Type guard to check if a device property has a range form.
 * @param desc The DevicePropDesc to check.
 * @returns True if the form is a RangeForm.
 */
export function hasRangeForm<T extends number | bigint>(
	desc: DevicePropDesc<T>
): desc is DevicePropDesc<T> & {Form: RangeForm<T>} {
	return desc.FormFlag === FormFlag.Range && desc.Form !== null;
}

/**
 * Type guard to check if a device property has an enum form.
 * @param desc The DevicePropDesc to check.
 * @returns True if the form is an EnumForm.
 */
export function hasEnumForm<T extends DevicePropValue>(
	desc: DevicePropDesc<T>
): desc is DevicePropDesc<T> & {Form: EnumForm<T>} {
	return desc.FormFlag === FormFlag.Enum && desc.Form !== null;
}
