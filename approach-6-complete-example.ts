/**
 * COMPLETE EXAMPLE: Approach 6 with `satisfies`
 *
 * This file demonstrates:
 * 1. Defining interfaces (schemas) for ALL PTP constructs:
 *    - OperationDefinition, PropertyDefinition
 *    - EventDefinition, FormatDefinition, ResponseDefinition
 * 2. Creating definitions with `satisfies` for all types
 * 3. Building registries with `satisfies { [key: string]: Interface }`
 * 4. Vendor extensions (Sony) for ALL definition types
 * 5. Implementing camera hierarchy (GenericCamera/SonyCamera/NikonCamera)
 * 6. Usage examples (individual and namespace imports)
 * 7. Error cases - ALL validation errors from test-protocol.ts:
 *    - Missing required parameters
 *    - Wrong parameter types
 *    - Invalid parameter names (typos)
 *    - Extra/unexpected parameters
 *    - Wrong property value types
 *    - Wrong variable type assignments
 *    - Camera hierarchy violations (Sony ops on Nikon camera)
 *    - Definition structure validation (by `satisfies`)
 *
 * ✅ Compiles successfully with all @ts-expect-error validations!
 * ✅ Demonstrates ALL 5 PTP definition types (operations, properties, events, formats, responses)
 */

// ============================================================================
// STEP 1: Define codec system
// ============================================================================

type CodecInstance<T> = {
    encode(value: T): Uint8Array
    decode(buffer: Uint8Array, offset?: number): { value: T; bytesRead: number }
}

type BaseCodecRegistry = {
    uint8: CodecInstance<number>
    uint32: CodecInstance<number>
    string: CodecInstance<string>
}

type CodecDefinition<T> = CodecInstance<T> | ((bc: BaseCodecRegistry) => CodecInstance<T>)

type CodecType<C> = C extends CodecDefinition<infer T> ? T : C extends (bc: any) => CodecInstance<infer T> ? T : never

// ============================================================================
// STEP 2: Define interfaces (the schema/contract)
// ============================================================================

export type DataDirection = 'none' | 'in' | 'out'

/**
 * All operations must satisfy this structure
 */
export interface OperationDefinition {
    code: number
    name: string
    description?: string
    operationParameters: readonly {
        name: string
        codec: CodecDefinition<any>
        required?: boolean
        description?: string
    }[]
    dataCodec?: CodecDefinition<any>
    dataDirection: DataDirection
    responseParameters?: readonly {
        name: string
        codec: CodecDefinition<any>
        description?: string
    }[]
}

export type PropertyAccess = 'Get' | 'GetSet'

/**
 * All properties must satisfy this structure
 */
export interface PropertyDefinition {
    code: number
    name: string
    description?: string
    codec: CodecDefinition<any>
    access: PropertyAccess
}

/**
 * All events must satisfy this structure
 */
export interface EventDefinition {
    code: number
    name: string
    description: string
    parameters: readonly {
        name: string
        description: string
        type: string
    }[]
}

/**
 * All formats must satisfy this structure
 */
export interface FormatDefinition {
    code: number
    name: string
    description: string
    category: 'non-image' | 'audio' | 'video' | 'image' | 'other'
}

/**
 * All responses must satisfy this structure
 */
export interface ResponseDefinition {
    code: number
    name: string
    description: string
}

// ============================================================================
// STEP 3: Define generic (standard PTP) operations
// ============================================================================

/** Get device information */
export const GetDeviceInfo = {
    code: 0x1001,
    name: 'GetDeviceInfo',
    description: 'Get device information',
    operationParameters: [],
    dataDirection: 'none',
} as const satisfies OperationDefinition

/** Open PTP session */
export const OpenSession = {
    code: 0x1002,
    name: 'OpenSession',
    description: 'Open session',
    operationParameters: [
        {
            name: 'SessionID',
            codec: (bc: BaseCodecRegistry) => bc.uint32,
            required: true,
            description: 'Session ID',
        },
    ],
    dataDirection: 'none',
} as const satisfies OperationDefinition

/** Get storage info */
export const GetStorageInfo = {
    code: 0x1005,
    name: 'GetStorageInfo',
    description: 'Get storage information',
    operationParameters: [
        {
            name: 'StorageID',
            codec: (bc: BaseCodecRegistry) => bc.uint32,
            required: true,
        },
    ],
    dataCodec: (bc: BaseCodecRegistry) => bc.string,
    dataDirection: 'out',
} as const satisfies OperationDefinition

// ============================================================================
// STEP 4: Define generic (standard PTP) properties
// ============================================================================

/** Battery level (0-100) */
export const BatteryLevel = {
    code: 0x5001,
    name: 'BatteryLevel',
    description: 'Battery percentage',
    codec: (bc: BaseCodecRegistry) => bc.uint8,
    access: 'Get',
} as const satisfies PropertyDefinition

/** Image size */
export const ImageSize = {
    code: 0x5003,
    name: 'ImageSize',
    description: 'Image dimensions',
    codec: (bc: BaseCodecRegistry) => bc.string,
    access: 'GetSet',
} as const satisfies PropertyDefinition

/** Aperture f-number */
export const FNumber = {
    code: 0x5007,
    name: 'FNumber',
    description: 'Aperture setting',
    codec: (bc: BaseCodecRegistry) => bc.string,
    access: 'GetSet',
} as const satisfies PropertyDefinition

// ============================================================================
// STEP 4B: Define generic events
// ============================================================================

/** ObjectAdded event */
export const ObjectAdded = {
    code: 0x4002,
    name: 'ObjectAdded',
    description: 'New object added to device',
    parameters: [
        {
            name: 'ObjectHandle',
            description: 'Handle of the new object',
            type: 'ObjectHandle',
        },
    ],
} as const satisfies EventDefinition

/** DevicePropChanged event */
export const DevicePropChanged = {
    code: 0x4006,
    name: 'DevicePropChanged',
    description: 'Device property value changed',
    parameters: [
        {
            name: 'DevicePropCode',
            description: 'Property code that changed',
            type: 'DevicePropCode',
        },
    ],
} as const satisfies EventDefinition

// ============================================================================
// STEP 4C: Define generic formats
// ============================================================================

/** JPEG format */
export const JPEG = {
    code: 0x3801,
    name: 'JPEG',
    description: 'JPEG image',
    category: 'image',
} as const satisfies FormatDefinition

/** MP4 format */
export const MP4 = {
    code: 0x300d,
    name: 'MP4',
    description: 'MPEG-4 video',
    category: 'video',
} as const satisfies FormatDefinition

// ============================================================================
// STEP 4D: Define generic responses
// ============================================================================

/** OK response */
export const OK = {
    code: 0x2001,
    name: 'OK',
    description: 'Operation completed successfully',
} as const satisfies ResponseDefinition

/** GeneralError response */
export const GeneralError = {
    code: 0x2002,
    name: 'GeneralError',
    description: 'Operation failed with unknown error',
} as const satisfies ResponseDefinition

/** SessionNotOpen response */
export const SessionNotOpen = {
    code: 0x2003,
    name: 'SessionNotOpen',
    description: 'Session is not currently open',
} as const satisfies ResponseDefinition

// ============================================================================
// STEP 5: Create generic registries with `satisfies`
// ============================================================================

export const genericOperationRegistry = {
    GetDeviceInfo,
    OpenSession,
    GetStorageInfo,
} as const satisfies { [key: string]: OperationDefinition }

export const genericPropertyRegistry = {
    BatteryLevel,
    ImageSize,
    FNumber,
} as const satisfies { [key: string]: PropertyDefinition }

export const genericEventRegistry = {
    ObjectAdded,
    DevicePropChanged,
} as const satisfies { [key: string]: EventDefinition }

export const genericFormatRegistry = {
    JPEG,
    MP4,
} as const satisfies { [key: string]: FormatDefinition }

export const genericResponseRegistry = {
    OK,
    GeneralError,
    SessionNotOpen,
} as const satisfies { [key: string]: ResponseDefinition }

// Extract types from registries
type GenericOperationDef = (typeof genericOperationRegistry)[keyof typeof genericOperationRegistry]
type GenericPropertyDef = (typeof genericPropertyRegistry)[keyof typeof genericPropertyRegistry]
type GenericEventDef = (typeof genericEventRegistry)[keyof typeof genericEventRegistry]
type GenericFormatDef = (typeof genericFormatRegistry)[keyof typeof genericFormatRegistry]
type GenericResponseDef = (typeof genericResponseRegistry)[keyof typeof genericResponseRegistry]

// ============================================================================
// STEP 6: Define Sony vendor extensions
// ============================================================================

/** Sony open session with function mode */
export const SDIO_OpenSession = {
    code: 0x9201,
    name: 'SDIO_OpenSession',
    description: 'Sony session with function mode',
    operationParameters: [
        {
            name: 'SessionID',
            codec: (bc: BaseCodecRegistry) => bc.uint32,
            required: true,
        },
        {
            name: 'FunctionMode',
            codec: (bc: BaseCodecRegistry) => bc.uint32,
            required: true,
            description: 'Function mode',
        },
    ],
    dataDirection: 'none',
} as const satisfies OperationDefinition

/** Sony extended property value */
export const SDIO_GetExtDevicePropValue = {
    code: 0x9209,
    name: 'SDIO_GetExtDevicePropValue',
    description: 'Get extended property',
    operationParameters: [
        {
            name: 'DevicePropCode',
            codec: (bc: BaseCodecRegistry) => bc.uint32,
            required: true,
        },
    ],
    dataCodec: (bc: BaseCodecRegistry) => bc.string,
    dataDirection: 'out',
} as const satisfies OperationDefinition

/** Sony live view quality */
export const LiveViewImageQuality = {
    code: 0xd223,
    name: 'LiveViewImageQuality',
    description: 'Live view quality',
    codec: (bc: BaseCodecRegistry) => bc.uint8,
    access: 'GetSet',
} as const satisfies PropertyDefinition

/** Sony captured event */
export const SDIE_CapturedEvent = {
    code: 0xc206,
    name: 'SDIE_CapturedEvent',
    description: 'Notify a captured event',
    parameters: [],
} as const satisfies EventDefinition

/** Sony object added event */
export const SDIE_ObjectAdded = {
    code: 0xc201,
    name: 'SDIE_ObjectAdded',
    description: 'Notify that a shot file is ready to transfer',
    parameters: [
        {
            name: 'ObjectHandle',
            description: 'Handle of the added object',
            type: 'ObjectHandle',
        },
    ],
} as const satisfies EventDefinition

/** Sony RAW format */
export const RAW = {
    code: 0xb101,
    name: 'RAW',
    description: 'Sony RAW image file',
    category: 'image',
} as const satisfies FormatDefinition

/** Sony HEIF format */
export const HEIF = {
    code: 0xb110,
    name: 'HEIF',
    description: 'High Efficiency Image Format',
    category: 'image',
} as const satisfies FormatDefinition

/** Sony authentication failed response */
export const AuthenticationFailed = {
    code: 0xa101,
    name: 'AuthenticationFailed',
    description: 'Authentication failed or version mismatch',
} as const satisfies ResponseDefinition

/** Sony temporary storage full response */
export const TemporaryStorageFull = {
    code: 0xa105,
    name: 'TemporaryStorageFull',
    description: 'Temporary storage is full',
} as const satisfies ResponseDefinition

// ============================================================================
// STEP 7: Create Sony registries (generic + Sony)
// ============================================================================

export const sonyOperationRegistry = {
    ...genericOperationRegistry,
    SDIO_OpenSession,
    SDIO_GetExtDevicePropValue,
} as const satisfies { [key: string]: OperationDefinition }

export const sonyPropertyRegistry = {
    ...genericPropertyRegistry,
    LiveViewImageQuality,
} as const satisfies { [key: string]: PropertyDefinition }

export const sonyEventRegistry = {
    ...genericEventRegistry,
    SDIE_CapturedEvent,
    SDIE_ObjectAdded,
} as const satisfies { [key: string]: EventDefinition }

export const sonyFormatRegistry = {
    ...genericFormatRegistry,
    RAW,
    HEIF,
} as const satisfies { [key: string]: FormatDefinition }

export const sonyResponseRegistry = {
    ...genericResponseRegistry,
    AuthenticationFailed,
    TemporaryStorageFull,
} as const satisfies { [key: string]: ResponseDefinition }

type SonyOperationDef = (typeof sonyOperationRegistry)[keyof typeof sonyOperationRegistry]
type SonyPropertyDef = (typeof sonyPropertyRegistry)[keyof typeof sonyPropertyRegistry]
type SonyEventDef = (typeof sonyEventRegistry)[keyof typeof sonyEventRegistry]
type SonyFormatDef = (typeof sonyFormatRegistry)[keyof typeof sonyFormatRegistry]
type SonyResponseDef = (typeof sonyResponseRegistry)[keyof typeof sonyResponseRegistry]

// ============================================================================
// STEP 8: Define Nikon vendor extensions
// ============================================================================

/** Nikon extended property descriptor */
export const GetDevicePropDescEx = {
    code: 0x9209,
    name: 'GetDevicePropDescEx',
    description: 'Get property descriptor',
    operationParameters: [
        {
            name: 'DevicePropCode',
            codec: (bc: BaseCodecRegistry) => bc.uint32,
            required: true,
        },
    ],
    dataCodec: (bc: BaseCodecRegistry) => bc.string,
    dataDirection: 'out',
} as const satisfies OperationDefinition

// Nikon uses generic events, formats, responses (no vendor extensions in this example)
// In a real implementation, add Nikon-specific definitions here if needed

export const nikonOperationRegistry = {
    ...genericOperationRegistry,
    GetDevicePropDescEx,
} as const satisfies { [key: string]: OperationDefinition }

export const nikonPropertyRegistry = {
    ...genericPropertyRegistry,
} as const satisfies { [key: string]: PropertyDefinition }

export const nikonEventRegistry = {
    ...genericEventRegistry,
} as const satisfies { [key: string]: EventDefinition }

export const nikonFormatRegistry = {
    ...genericFormatRegistry,
} as const satisfies { [key: string]: FormatDefinition }

export const nikonResponseRegistry = {
    ...genericResponseRegistry,
} as const satisfies { [key: string]: ResponseDefinition }

type NikonOperationDef = (typeof nikonOperationRegistry)[keyof typeof nikonOperationRegistry]
type NikonPropertyDef = (typeof nikonPropertyRegistry)[keyof typeof nikonPropertyRegistry]
type NikonEventDef = (typeof nikonEventRegistry)[keyof typeof nikonEventRegistry]
type NikonFormatDef = (typeof nikonFormatRegistry)[keyof typeof nikonFormatRegistry]
type NikonResponseDef = (typeof nikonResponseRegistry)[keyof typeof nikonResponseRegistry]

// ============================================================================
// STEP 9: Type helpers for camera implementation
// ============================================================================

type BuildParamObject<Params extends readonly any[], Acc = {}> = Params extends readonly []
    ? Acc
    : Params extends readonly [infer Head, ...infer Tail]
      ? Head extends { name: infer N extends string; codec: infer C; required: true }
          ? BuildParamObject<Tail, Acc & Record<N, CodecType<C>>>
          : Head extends { name: infer N extends string; codec: infer C }
            ? BuildParamObject<Tail, Acc & Partial<Record<N, CodecType<C>>>>
            : BuildParamObject<Tail, Acc>
      : Acc

type OperationParams<Op extends { operationParameters: readonly any[] }> = Op['operationParameters'] extends readonly []
    ? Record<string, never>
    : BuildParamObject<Op['operationParameters']>

type OperationResponse<Op> = Op extends { dataCodec: infer C } ? { code: number; data: CodecType<C> } : { code: number }

// ============================================================================
// STEP 10: Implement camera hierarchy (strict type checking)
// ============================================================================

/**
 * GenericCamera - accepts generic (standard PTP) operations/properties only
 */
export class GenericCamera {
    async send<Op extends GenericOperationDef>(
        operation: Op,
        params: OperationParams<Op>
    ): Promise<OperationResponse<Op>> {
        const op = operation as any
        console.log(`[Generic] ${op.name} (0x${op.code.toString(16)})`)
        return { code: 0x2001 } as any
    }

    async get<P extends GenericPropertyDef>(property: P): Promise<CodecType<P['codec']>> {
        const prop = property as any
        console.log(`[Generic] Get ${prop.name}`)
        return null as any
    }

    async set<P extends GenericPropertyDef>(property: P, value: CodecType<P['codec']>): Promise<void> {
        const prop = property as any
        console.log(`[Generic] Set ${prop.name} = ${value}`)
    }
}

/**
 * SonyCamera - accepts generic + Sony operations/properties
 */
export class SonyCamera {
    async send<Op extends SonyOperationDef>(
        operation: Op,
        params: OperationParams<Op>
    ): Promise<OperationResponse<Op>> {
        const op = operation as any
        console.log(`[Sony] ${op.name} (0x${op.code.toString(16)})`)
        return { code: 0x2001 } as any
    }

    async get<P extends SonyPropertyDef>(property: P): Promise<CodecType<P['codec']>> {
        const prop = property as any
        console.log(`[Sony] Get ${prop.name}`)
        return null as any
    }

    async set<P extends SonyPropertyDef>(property: P, value: CodecType<P['codec']>): Promise<void> {
        const prop = property as any
        console.log(`[Sony] Set ${prop.name} = ${value}`)
    }
}

/**
 * NikonCamera - accepts generic + Nikon operations/properties
 */
export class NikonCamera {
    async send<Op extends NikonOperationDef>(
        operation: Op,
        params: OperationParams<Op>
    ): Promise<OperationResponse<Op>> {
        const op = operation as any
        console.log(`[Nikon] ${op.name} (0x${op.code.toString(16)})`)
        return { code: 0x2001 } as any
    }

    async get<P extends NikonPropertyDef>(property: P): Promise<CodecType<P['codec']>> {
        const prop = property as any
        console.log(`[Nikon] Get ${prop.name}`)
        return null as any
    }

    async set<P extends NikonPropertyDef>(property: P, value: CodecType<P['codec']>): Promise<void> {
        const prop = property as any
        console.log(`[Nikon] Set ${prop.name} = ${value}`)
    }
}

// ============================================================================
// STEP 11: Usage examples (individual imports)
// ============================================================================

async function exampleIndividualImports() {
    // In real code:
    // import { GetDeviceInfo, OpenSession } from '@ptp/definitions/operation-definitions'
    // import { BatteryLevel, ImageSize } from '@ptp/definitions/property-definitions'

    const genericCamera = new GenericCamera()

    // ✅ Valid: Generic operations
    await genericCamera.send(GetDeviceInfo, {})
    await genericCamera.send(OpenSession, { SessionID: 123 })

    // ✅ Valid: Generic properties (type inferred!)
    const battery = await genericCamera.get(BatteryLevel) // Type: number
    await genericCamera.set(ImageSize, '1920x1080') // Type: string
}

// ============================================================================
// STEP 12: Usage examples (namespace imports - recommended!)
// ============================================================================

async function exampleNamespaceImports() {
    // In real code:
    // import * as Operations from '@ptp/definitions/operation-definitions'
    // import * as Properties from '@ptp/definitions/property-definitions'
    // import * as SonyOps from '@ptp/definitions/vendors/sony/sony-operation-definitions'
    // import * as SonyProps from '@ptp/definitions/vendors/sony/sony-property-definitions'

    const sonyCamera = new SonyCamera()

    // Type "Operations." for autocomplete!
    // await sonyCamera.send(Operations.GetDeviceInfo, {})
    // await sonyCamera.get(Properties.BatteryLevel)

    // Type "SonyOps." for Sony operations!
    // await sonyCamera.send(SonyOps.SDIO_OpenSession, { SessionID: 123, FunctionMode: 1 })
    // await sonyCamera.get(SonyProps.LiveViewImageQuality)
}

// ============================================================================
// STEP 13: Camera hierarchy type safety
// ============================================================================

async function exampleCameraHierarchy() {
    const genericCamera = new GenericCamera()
    const sonyCamera = new SonyCamera()
    const nikonCamera = new NikonCamera()

    // ✅ GenericCamera: Generic operations work
    await genericCamera.send(GetDeviceInfo, {})
    await genericCamera.send(OpenSession, { SessionID: 123 })
    await genericCamera.get(BatteryLevel)

    // ✅ SonyCamera: Generic operations work
    await sonyCamera.send(GetDeviceInfo, {})
    await sonyCamera.get(BatteryLevel)

    // ✅ SonyCamera: Sony operations work
    await sonyCamera.send(SDIO_OpenSession, { SessionID: 123, FunctionMode: 1 })
    await sonyCamera.get(LiveViewImageQuality)

    // ✅ NikonCamera: Generic operations work
    await nikonCamera.send(GetDeviceInfo, {})
    await nikonCamera.get(BatteryLevel)

    // ✅ NikonCamera: Nikon operations work
    await nikonCamera.send(GetDevicePropDescEx, { DevicePropCode: BatteryLevel.code })

    // ❌ ERROR: GenericCamera cannot use Sony operations
    // @ts-expect-error - SDIO_OpenSession not valid for GenericCamera
    await genericCamera.send(SDIO_OpenSession, { SessionID: 123, FunctionMode: 1 })

    // ❌ ERROR: GenericCamera cannot use Sony properties
    // @ts-expect-error - LiveViewImageQuality not valid for GenericCamera
    await genericCamera.get(LiveViewImageQuality)

    // ❌ ERROR: SonyCamera cannot use Nikon operations
    // @ts-expect-error - GetDevicePropDescEx not valid for SonyCamera
    await sonyCamera.send(GetDevicePropDescEx, { DevicePropCode: 0x5001 })

    // ❌ ERROR: NikonCamera cannot use Sony operations
    // @ts-expect-error - SDIO_OpenSession not valid for NikonCamera
    await nikonCamera.send(SDIO_OpenSession, { SessionID: 123, FunctionMode: 1 })
}

// ============================================================================
// STEP 14: Validation errors - all caught at compile time!
// ============================================================================

async function exampleValidationErrors() {
    const genericCamera = new GenericCamera()
    const sonyCamera = new SonyCamera()
    const nikonCamera = new NikonCamera()

    // ❌ ERROR: Missing required parameters
    // @ts-expect-error - Missing SessionID parameter
    await genericCamera.send(OpenSession, {})

    // @ts-expect-error - Missing StorageID parameter
    await genericCamera.send(GetStorageInfo, {})

    // ❌ ERROR: Wrong parameter types
    // @ts-expect-error - SessionID should be number, not string
    await genericCamera.send(OpenSession, { SessionID: 'not-a-number' })

    // @ts-expect-error - StorageID should be number, not string
    await genericCamera.send(GetStorageInfo, { StorageID: 'not-a-number' })

    // ❌ ERROR: Invalid parameter names (typos caught!)
    // @ts-expect-error - sessionId (lowercase s) is wrong
    await genericCamera.send(OpenSession, { sessionId: 123 })

    // @ts-expect-error - SessionId (lowercase i) is wrong
    await genericCamera.send(OpenSession, { SessionId: 123 })

    // ❌ ERROR: Extra/invalid parameters
    // @ts-expect-error - GetDeviceInfo takes no parameters
    await genericCamera.send(GetDeviceInfo, { ExtraParam: 123 })

    // @ts-expect-error - InvalidParam not valid
    await genericCamera.send(OpenSession, { SessionID: 123, InvalidParam: 456 })

    // ❌ ERROR: Wrong property value types
    // @ts-expect-error - ImageSize expects string, not number
    await genericCamera.set(ImageSize, 123)

    // @ts-expect-error - FNumber expects string, not number
    await genericCamera.set(FNumber, 2.8)

    // @ts-expect-error - BatteryLevel expects number, not string
    await genericCamera.set(BatteryLevel, 'not-a-number')

    // ❌ ERROR: Wrong variable type assignments
    // @ts-expect-error - BatteryLevel returns number, not string
    const wrongBattery: string = await genericCamera.get(BatteryLevel)

    // @ts-expect-error - ImageSize returns string, not number
    const wrongSize: number = await genericCamera.get(ImageSize)

    // @ts-expect-error - FNumber returns string, not number
    const wrongFNumber: number = await genericCamera.get(FNumber)

    console.log('✅ All validation errors caught at compile time!')
}

// ============================================================================
// STEP 15: Definition validation (caught by `satisfies`)
// ============================================================================

// These would cause compile errors if uncommented:

// ❌ ERROR: Missing required 'code' field
// const InvalidOp1 = {
//     name: 'Invalid',
//     operationParameters: [],
// } as const satisfies OperationDefinition

// ❌ ERROR: Missing required 'name' field
// const InvalidOp2 = {
//     code: 0x9999,
//     operationParameters: [],
// } as const satisfies OperationDefinition

// ❌ ERROR: Wrong type for 'code'
// const InvalidOp3 = {
//     code: 'not-a-number',
//     name: 'Invalid',
//     operationParameters: [],
// } as const satisfies OperationDefinition

// ❌ ERROR: Missing required 'codec' field
// const InvalidProp1 = {
//     code: 0x9999,
//     name: 'Invalid',
// } as const satisfies PropertyDefinition

// ============================================================================
// Summary
// ============================================================================

console.log(`
✅ APPROACH 6 WITH SATISFIES - COMPLETE

Key Features:
1. Interfaces define the schema for all PTP constructs
   - OperationDefinition, PropertyDefinition
   - EventDefinition, FormatDefinition, ResponseDefinition
2. Definitions use "as const satisfies Interface"
3. Registries use "as const satisfies { [key: string]: Interface }"
4. Camera hierarchy with 3 classes (GenericCamera, SonyCamera, NikonCamera)
5. Full type safety - no assertions needed
6. Excellent IntelliSense with hover documentation
7. Compile-time validation of all usage

Definition Types Demonstrated:
✅ Operations (with parameters and data codecs)
✅ Properties (with value codecs)
✅ Events (with parameters)
✅ Formats (with categories)
✅ Responses (status codes)

Vendor Extensions Shown:
✅ Sony operations (SDIO_OpenSession, SDIO_GetExtDevicePropValue)
✅ Sony properties (LiveViewImageQuality)
✅ Sony events (SDIE_CapturedEvent, SDIE_ObjectAdded)
✅ Sony formats (RAW, HEIF)
✅ Sony responses (AuthenticationFailed, TemporaryStorageFull)
✅ Nikon operations (GetDevicePropDescEx)

Usage Patterns:
- Individual imports: import { BatteryLevel } from '...'
- Namespace imports: import * as Properties from '...'

Camera Hierarchy (3 classes with strict type checking):
- GenericCamera: Generic operations/properties/events/formats/responses only
- SonyCamera: Generic + Sony for all definition types
- NikonCamera: Generic + Nikon for all definition types
  (Each camera has send/get/set methods with full type validation)

Error Detection (all caught at compile time):
✅ Invalid operations/properties (wrong camera)
✅ Missing required parameters
✅ Wrong parameter types (string instead of number, etc.)
✅ Invalid parameter names (typos like sessionId vs SessionID)
✅ Extra/unexpected parameters
✅ Wrong property value types
✅ Wrong variable type assignments
✅ Invalid definition structure (caught by satisfies)

All errors from test-protocol.ts are validated!
All PTP definition types (operations, properties, events, formats, responses) demonstrated!
`)

exampleIndividualImports()
exampleNamespaceImports()
exampleCameraHierarchy()
exampleValidationErrors()
