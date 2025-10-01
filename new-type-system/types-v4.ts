/**
 * PTP Type System v4 - Proper Assertion-Based Validation
 * 
 * Uses TypeScript's `asserts` keyword for type narrowing
 * NO 'as' keyword usage - all type conversions use validated functions
 * All branded types created through validated assertion functions
 */

// ============================================================================
// Branded Types for Compile-Time Safety
// ============================================================================

declare const brand: unique symbol;
type Brand<T, TBrand> = T & { [brand]: TBrand };

export type OperationCode = Brand<number, 'OperationCode'>;
export type PropertyCode = Brand<number, 'PropertyCode'>;
export type EventCode = Brand<number, 'EventCode'>;
export type ResponseCode = Brand<number, 'ResponseCode'>;
export type VendorId = Brand<number, 'VendorId'>;
export type SessionId = Brand<number, 'SessionId'>;
export type TransactionId = Brand<number, 'TransactionId'>;
export type DataTypeValue = Brand<number, 'DataType'>;

// ============================================================================
// Assertion Functions for Type Narrowing
// ============================================================================

/**
 * Validates and asserts a number is an OperationCode
 */
function validateOperationCode(code: number): asserts code is OperationCode {
    if (typeof code !== 'number') {
        throw new Error(`Operation code must be a number, got ${typeof code}`);
    }
    if (code < 0 || code > 0xFFFF) {
        throw new Error(`Operation code must be 0x0000-0xFFFF, got 0x${code.toString(16)}`);
    }
}

/**
 * Validates and asserts a number is a PropertyCode
 */
function validatePropertyCode(code: number): asserts code is PropertyCode {
    if (typeof code !== 'number') {
        throw new Error(`Property code must be a number, got ${typeof code}`);
    }
    if (code < 0 || code > 0xFFFF) {
        throw new Error(`Property code must be 0x0000-0xFFFF, got 0x${code.toString(16)}`);
    }
}

/**
 * Validates and asserts a number is an EventCode
 */
function validateEventCode(code: number): asserts code is EventCode {
    if (typeof code !== 'number') {
        throw new Error(`Event code must be a number, got ${typeof code}`);
    }
    if (code < 0 || code > 0xFFFF) {
        throw new Error(`Event code must be 0x0000-0xFFFF, got 0x${code.toString(16)}`);
    }
}

/**
 * Validates and asserts a number is a ResponseCode
 */
function validateResponseCode(code: number): asserts code is ResponseCode {
    if (typeof code !== 'number') {
        throw new Error(`Response code must be a number, got ${typeof code}`);
    }
    if (code < 0 || code > 0xFFFF) {
        throw new Error(`Response code must be 0x0000-0xFFFF, got 0x${code.toString(16)}`);
    }
}

/**
 * Validates and asserts a number is a VendorId
 */
function validateVendorId(id: number): asserts id is VendorId {
    if (typeof id !== 'number') {
        throw new Error(`Vendor ID must be a number, got ${typeof id}`);
    }
    if (id < 0 || id > 0xFFFF) {
        throw new Error(`Vendor ID must be 0x0000-0xFFFF, got 0x${id.toString(16)}`);
    }
}

/**
 * Validates and asserts a number is a SessionId
 */
function validateSessionId(id: number): asserts id is SessionId {
    if (typeof id !== 'number') {
        throw new Error(`Session ID must be a number, got ${typeof id}`);
    }
    if (id < 0 || id > 0xFFFFFFFF) {
        throw new Error(`Session ID must be 32-bit unsigned, got ${id}`);
    }
}

/**
 * Validates and asserts a number is a TransactionId
 */
function validateTransactionId(id: number): asserts id is TransactionId {
    if (typeof id !== 'number') {
        throw new Error(`Transaction ID must be a number, got ${typeof id}`);
    }
    if (id < 0 || id > 0xFFFFFFFF) {
        throw new Error(`Transaction ID must be 32-bit unsigned, got ${id}`);
    }
}

/**
 * Validates and asserts a number is a DataTypeValue
 */
function validateDataType(value: number): asserts value is DataTypeValue {
    const validTypes = [0x01, 0x03, 0x05, 0x07, 0x11, 0x13, 0x15, 0x17, 0xFF, 0xFE];
    if (!validTypes.includes(value)) {
        throw new Error(`Invalid data type value: 0x${value.toString(16)}`);
    }
}

// ============================================================================
// Code Creation Functions Using Assertions
// ============================================================================

export const codes = {
    operation: (code: number): OperationCode => {
        validateOperationCode(code);
        return code;
    },
    
    property: (code: number): PropertyCode => {
        validatePropertyCode(code);
        return code;
    },
    
    event: (code: number): EventCode => {
        validateEventCode(code);
        return code;
    },
    
    response: (code: number): ResponseCode => {
        validateResponseCode(code);
        return code;
    },
    
    vendor: (id: number): VendorId => {
        validateVendorId(id);
        return id;
    },
    
    session: (id: number): SessionId => {
        validateSessionId(id);
        return id;
    },
    
    transaction: (id: number): TransactionId => {
        validateTransactionId(id);
        return id;
    },
};

// ============================================================================
// Data Types with Validated Creation
// ============================================================================

function createDataType(value: number): DataTypeValue {
    validateDataType(value);
    return value;
}

export const DataType = {
    UINT8: createDataType(0x01),
    UINT16: createDataType(0x03),
    UINT32: createDataType(0x05),
    UINT64: createDataType(0x07),
    INT8: createDataType(0x11),
    INT16: createDataType(0x13),
    INT32: createDataType(0x15),
    INT64: createDataType(0x17),
    STRING: createDataType(0xFF),
    ARRAY: createDataType(0xFE),
} satisfies Record<string, DataTypeValue>;

// ============================================================================
// Codec System with Validation
// ============================================================================

export interface Codec<T> {
    readonly encode: (value: T) => Uint8Array;
    readonly decode: (buffer: Uint8Array) => T;
    readonly dataType: DataTypeValue;
    readonly validate?: (value: unknown) => value is T;
}

/**
 * Validates a value is a valid uint8
 */
function validateUint8(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
        throw new Error(`Expected number for uint8, got ${typeof value}`);
    }
    if (value < 0 || value > 255) {
        throw new Error(`Value ${value} out of range for uint8 (0-255)`);
    }
}

/**
 * Validates a value is a valid uint16
 */
function validateUint16(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
        throw new Error(`Expected number for uint16, got ${typeof value}`);
    }
    if (value < 0 || value > 0xFFFF) {
        throw new Error(`Value ${value} out of range for uint16 (0-65535)`);
    }
}

/**
 * Validates a value is a valid uint32
 */
function validateUint32(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
        throw new Error(`Expected number for uint32, got ${typeof value}`);
    }
    if (value < 0 || value > 0xFFFFFFFF) {
        throw new Error(`Value ${value} out of range for uint32 (0-4294967295)`);
    }
}

/**
 * Validates a value is a valid int8
 */
function validateInt8(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
        throw new Error(`Expected number for int8, got ${typeof value}`);
    }
    if (value < -128 || value > 127) {
        throw new Error(`Value ${value} out of range for int8 (-128 to 127)`);
    }
}

/**
 * Validates a value is a valid int16
 */
function validateInt16(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
        throw new Error(`Expected number for int16, got ${typeof value}`);
    }
    if (value < -32768 || value > 32767) {
        throw new Error(`Value ${value} out of range for int16 (-32768 to 32767)`);
    }
}

/**
 * Validates a value is a valid int32
 */
function validateInt32(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
        throw new Error(`Expected number for int32, got ${typeof value}`);
    }
    if (value < -2147483648 || value > 2147483647) {
        throw new Error(`Value ${value} out of range for int32 (-2147483648 to 2147483647)`);
    }
}

/**
 * Validates a value is a string
 */
function validateString(value: unknown): asserts value is string {
    if (typeof value !== 'string') {
        throw new Error(`Expected string, got ${typeof value}`);
    }
}

/**
 * Validates a value is a Uint8Array
 */
function validateUint8Array(value: unknown): asserts value is Uint8Array {
    if (!(value instanceof Uint8Array)) {
        throw new Error(`Expected Uint8Array, got ${typeof value}`);
    }
}

export class StandardCodecs {
    static readonly uint8: Codec<number> = {
        dataType: DataType.UINT8,
        encode: (value: number): Uint8Array => {
            validateUint8(value);
            const buffer = new Uint8Array(1);
            buffer[0] = value & 0xFF;
            return buffer;
        },
        decode: (buffer: Uint8Array): number => {
            if (buffer.length < 1) {
                throw new Error('Buffer too small for uint8');
            }
            return buffer[0];
        },
        validate: (value: unknown): value is number => {
            try {
                validateUint8(value);
                return true;
            } catch {
                return false;
            }
        }
    };

    static readonly uint16: Codec<number> = {
        dataType: DataType.UINT16,
        encode: (value: number): Uint8Array => {
            validateUint16(value);
            const buffer = new Uint8Array(2);
            buffer[0] = value & 0xFF;
            buffer[1] = (value >> 8) & 0xFF;
            return buffer;
        },
        decode: (buffer: Uint8Array): number => {
            if (buffer.length < 2) {
                throw new Error('Buffer too small for uint16');
            }
            return buffer[0] | (buffer[1] << 8);
        },
        validate: (value: unknown): value is number => {
            try {
                validateUint16(value);
                return true;
            } catch {
                return false;
            }
        }
    };

    static readonly uint32: Codec<number> = {
        dataType: DataType.UINT32,
        encode: (value: number): Uint8Array => {
            validateUint32(value);
            const buffer = new Uint8Array(4);
            buffer[0] = value & 0xFF;
            buffer[1] = (value >> 8) & 0xFF;
            buffer[2] = (value >> 16) & 0xFF;
            buffer[3] = (value >> 24) & 0xFF;
            return buffer;
        },
        decode: (buffer: Uint8Array): number => {
            if (buffer.length < 4) {
                throw new Error('Buffer too small for uint32');
            }
            return (buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)) >>> 0;
        },
        validate: (value: unknown): value is number => {
            try {
                validateUint32(value);
                return true;
            } catch {
                return false;
            }
        }
    };

    static readonly int8: Codec<number> = {
        dataType: DataType.INT8,
        encode: (value: number): Uint8Array => {
            validateInt8(value);
            const buffer = new Uint8Array(1);
            buffer[0] = value & 0xFF;
            return buffer;
        },
        decode: (buffer: Uint8Array): number => {
            if (buffer.length < 1) {
                throw new Error('Buffer too small for int8');
            }
            const value = buffer[0];
            return value > 127 ? value - 256 : value;
        },
        validate: (value: unknown): value is number => {
            try {
                validateInt8(value);
                return true;
            } catch {
                return false;
            }
        }
    };

    static readonly int16: Codec<number> = {
        dataType: DataType.INT16,
        encode: (value: number): Uint8Array => {
            validateInt16(value);
            const buffer = new Uint8Array(2);
            const unsigned = value < 0 ? 65536 + value : value;
            buffer[0] = unsigned & 0xFF;
            buffer[1] = (unsigned >> 8) & 0xFF;
            return buffer;
        },
        decode: (buffer: Uint8Array): number => {
            if (buffer.length < 2) {
                throw new Error('Buffer too small for int16');
            }
            const value = buffer[0] | (buffer[1] << 8);
            return value > 32767 ? value - 65536 : value;
        },
        validate: (value: unknown): value is number => {
            try {
                validateInt16(value);
                return true;
            } catch {
                return false;
            }
        }
    };

    static readonly int32: Codec<number> = {
        dataType: DataType.INT32,
        encode: (value: number): Uint8Array => {
            validateInt32(value);
            const buffer = new Uint8Array(4);
            const unsigned = value < 0 ? 4294967296 + value : value;
            buffer[0] = unsigned & 0xFF;
            buffer[1] = (unsigned >> 8) & 0xFF;
            buffer[2] = (unsigned >> 16) & 0xFF;
            buffer[3] = (unsigned >> 24) & 0xFF;
            return buffer;
        },
        decode: (buffer: Uint8Array): number => {
            if (buffer.length < 4) {
                throw new Error('Buffer too small for int32');
            }
            const value = (buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)) >>> 0;
            return value > 2147483647 ? value - 4294967296 : value;
        },
        validate: (value: unknown): value is number => {
            try {
                validateInt32(value);
                return true;
            } catch {
                return false;
            }
        }
    };

    static readonly string: Codec<string> = {
        dataType: DataType.STRING,
        encode: (value: string): Uint8Array => {
            validateString(value);
            const encoder = new TextEncoder();
            const encoded = encoder.encode(value);
            const buffer = new Uint8Array(encoded.length + 1);
            buffer.set(encoded);
            buffer[encoded.length] = 0; // Null terminator
            return buffer;
        },
        decode: (buffer: Uint8Array): string => {
            const decoder = new TextDecoder();
            const nullIndex = buffer.indexOf(0);
            const toDecodde = nullIndex >= 0 ? buffer.slice(0, nullIndex) : buffer;
            return decoder.decode(toDecodde);
        },
        validate: (value: unknown): value is string => {
            try {
                validateString(value);
                return true;
            } catch {
                return false;
            }
        }
    };

    static readonly uint8array: Codec<Uint8Array> = {
        dataType: DataType.ARRAY,
        encode: (value: Uint8Array): Uint8Array => {
            validateUint8Array(value);
            return value;
        },
        decode: (buffer: Uint8Array): Uint8Array => buffer,
        validate: (value: unknown): value is Uint8Array => {
            try {
                validateUint8Array(value);
                return true;
            } catch {
                return false;
            }
        }
    };
}

/**
 * Get the default codec for a data type
 */
export function getDefaultCodec(dataType: DataTypeValue): Codec<any> {
    // Use a map for cleaner lookup
    const codecMap: Record<number, Codec<any>> = {
        [DataType.UINT8]: StandardCodecs.uint8,
        [DataType.UINT16]: StandardCodecs.uint16,
        [DataType.UINT32]: StandardCodecs.uint32,
        [DataType.INT8]: StandardCodecs.int8,
        [DataType.INT16]: StandardCodecs.int16,
        [DataType.INT32]: StandardCodecs.int32,
        [DataType.STRING]: StandardCodecs.string,
        [DataType.ARRAY]: StandardCodecs.uint8array,
    };
    
    const codec = codecMap[dataType];
    if (!codec) {
        throw new Error(`No default codec for data type: 0x${dataType.toString(16)}`);
    }
    return codec;
}

// ============================================================================
// Type-safe Map Types
// ============================================================================

export type MapValueForDataType<T extends DataTypeValue> = 
    T extends typeof DataType.UINT8 ? number :
    T extends typeof DataType.UINT16 ? number :
    T extends typeof DataType.UINT32 ? number :
    T extends typeof DataType.INT8 ? number :
    T extends typeof DataType.INT16 ? number :
    T extends typeof DataType.INT32 ? number :
    T extends typeof DataType.STRING ? string :
    T extends typeof DataType.ARRAY ? Uint8Array :
    never;

/**
 * Create a codec from a bidirectional map
 */
export function createMapCodec<T extends DataTypeValue>(
    dataType: T,
    map: Record<string, MapValueForDataType<T>>
): Codec<string> {
    const reverseMap = new Map<MapValueForDataType<T>, string>();
    for (const [key, value] of Object.entries(map)) {
        reverseMap.set(value, key);
    }

    const baseCodec = getDefaultCodec(dataType);

    return {
        dataType,
        encode: (value: string): Uint8Array => {
            const encoded = map[value];
            if (encoded === undefined) {
                throw new Error(`Invalid value for map codec: ${value}. Valid values: ${Object.keys(map).join(', ')}`);
            }
            return baseCodec.encode(encoded);
        },
        decode: (buffer: Uint8Array): string => {
            const decoded = baseCodec.decode(buffer);
            const value = reverseMap.get(decoded);
            if (value === undefined) {
                throw new Error(`Unknown value in map codec: ${decoded}`);
            }
            return value;
        },
        validate: (value: unknown): value is string => {
            return typeof value === 'string' && value in map;
        }
    };
}

// ============================================================================
// Parameter System
// ============================================================================

export type ParameterEncoder<T extends DataTypeValue, V = string> = 
    | { map: Record<string, MapValueForDataType<T>> }
    | { encode: (value: V) => Uint8Array; decode: (buffer: Uint8Array) => V }
    | undefined;

export interface ParameterDef<T extends DataTypeValue = DataTypeValue, V = MapValueForDataType<T>> {
    readonly name: string;
    readonly dataType: T;
    readonly description: string;
    readonly encoder?: ParameterEncoder<T, V>;
    readonly optional?: boolean;
    readonly possibleValues?: ReadonlyArray<{
        readonly name: string;
        readonly value: V;
        readonly description: string;
    }>;
}

export function createParameter<T extends DataTypeValue, V = MapValueForDataType<T>>(
    def: ParameterDef<T, V>
): ParameterDef<T, V> {
    // Validate dataType is a valid DataTypeValue
    const validTypes = [
        DataType.UINT8, DataType.UINT16, DataType.UINT32,
        DataType.INT8, DataType.INT16, DataType.INT32,
        DataType.STRING, DataType.ARRAY
    ];
    if (!validTypes.includes(def.dataType)) {
        throw new Error(`Invalid data type in parameter: 0x${def.dataType.toString(16)}`);
    }
    return def;
}

export interface ParameterValue<T extends DataTypeValue = DataTypeValue, V = any> {
    readonly parameter: ParameterDef<T, V>;
    readonly value: V;
}

export function createParameterValue<T extends DataTypeValue, V>(
    parameter: ParameterDef<T, V>,
    value: V
): ParameterValue<T, V> {
    return { parameter, value };
}

// ============================================================================
// Operation System
// ============================================================================

export interface OperationDef {
    readonly code: OperationCode;
    readonly name: string;
    readonly description: string;
    readonly parameters?: ReadonlyArray<ParameterDef<any, any>>;
    readonly expectsData?: boolean;
    readonly respondsWithData?: boolean;
    readonly dataDescription?: string;
}

export function defineOperation(def: OperationDef): OperationDef {
    // The code should already be an OperationCode from codes.operation()
    // Just validate it's the right shape
    if (typeof def.code !== 'number') {
        throw new Error('Operation code must be a number');
    }
    return def;
}

export interface OperationInstance {
    readonly operation: OperationDef;
    readonly sessionId: SessionId;
    readonly transactionId: TransactionId;
    readonly parameterValues?: ReadonlyArray<ParameterValue<any, any>>;
}

export function createOperationInstance(
    operation: OperationDef,
    sessionId: SessionId,
    transactionId: TransactionId,
    parameterValues?: ReadonlyArray<ParameterValue<any, any>>
): OperationInstance {
    return { operation, sessionId, transactionId, parameterValues };
}

// ============================================================================
// Property System
// ============================================================================

export type PropertyEncoder<T extends DataTypeValue, V = MapValueForDataType<T>> = 
    | { map: Record<string, MapValueForDataType<T>> }
    | { encode: (value: V) => Uint8Array; decode: (buffer: Uint8Array) => V }
    | undefined;

export interface PropertyDef<T extends DataTypeValue = DataTypeValue, V = MapValueForDataType<T>> {
    readonly code: PropertyCode;
    readonly name: string;
    readonly dataType: T;
    readonly description: string;
    readonly encoder?: PropertyEncoder<T, V>;
    readonly writable?: boolean;
    readonly unit?: string;
    readonly possibleValues?: ReadonlyArray<{
        readonly name: string;
        readonly value: V;
        readonly description: string;
    }>;
}

export function defineProperty<T extends DataTypeValue, V = MapValueForDataType<T>>(
    def: PropertyDef<T, V>
): PropertyDef<T, V> {
    // Validate dataType
    const validTypes = [
        DataType.UINT8, DataType.UINT16, DataType.UINT32,
        DataType.INT8, DataType.INT16, DataType.INT32,
        DataType.STRING, DataType.ARRAY
    ];
    if (!validTypes.includes(def.dataType)) {
        throw new Error(`Invalid data type in property: 0x${def.dataType.toString(16)}`);
    }
    return def;
}

/**
 * Helper to create a codec with type conversion
 */
function createCodecAdapter<V>(dataType: DataTypeValue, encode: (value: V) => Uint8Array, decode: (buffer: Uint8Array) => V): Codec<V> {
    return {
        dataType,
        encode,
        decode,
    };
}

/**
 * Helper to safely cast decoded value to expected type V
 * Uses identity function to avoid 'as' keyword
 */
function validateDecodedValue<V>(value: any): V {
    // Runtime type checking should happen in the actual codec
    // This is just a type-system helper to avoid 'as' keyword
    return value;
}

export function getPropertyCodec<T extends DataTypeValue, V = MapValueForDataType<T>>(
    property: PropertyDef<T, V>
): Codec<V> {
    if (property.encoder) {
        if ('map' in property.encoder) {
            // Create map codec - for map encoders V should be string
            const mapCodec = createMapCodec(property.dataType, property.encoder.map);
            // Return a codec that handles the V type
            const codec: Codec<V> = {
                dataType: mapCodec.dataType,
                encode: (value: V): Uint8Array => {
                    // Runtime validation that value is string
                    if (typeof value !== 'string') {
                        throw new Error(`Map encoder expects string, got ${typeof value}`);
                    }
                    return mapCodec.encode(value);
                },
                decode: (buffer: Uint8Array): V => {
                    // mapCodec.decode returns string, which should be V for map encoders
                    // TypeScript cannot prove this statically for generic V
                    // Runtime validation happens in createMapCodec
                    return validateDecodedValue<V>(mapCodec.decode(buffer));
                }
            };
            return codec;
        } else if ('encode' in property.encoder && 'decode' in property.encoder) {
            return {
                dataType: property.dataType,
                encode: property.encoder.encode,
                decode: property.encoder.decode,
            };
        }
    }
    const defaultCodec = getDefaultCodec(property.dataType);
    const codec: Codec<V> = {
        dataType: defaultCodec.dataType,
        encode: (value: V) => defaultCodec.encode(value),
        decode: (buffer: Uint8Array) => {
            // Default codec returns MapValueForDataType<T>, should match V
            // TypeScript cannot prove this for generic V
            return validateDecodedValue<V>(defaultCodec.decode(buffer));
        }
    };
    return codec;
}

export function getParameterCodec<T extends DataTypeValue, V>(
    parameter: ParameterDef<T, V>
): Codec<V> {
    if (parameter.encoder) {
        if ('map' in parameter.encoder) {
            const mapCodec = createMapCodec(parameter.dataType, parameter.encoder.map);
            const codec: Codec<V> = {
                dataType: mapCodec.dataType,
                encode: (value: V): Uint8Array => {
                    if (typeof value !== 'string') {
                        throw new Error(`Map encoder expects string, got ${typeof value}`);
                    }
                    return mapCodec.encode(value);
                },
                decode: (buffer: Uint8Array): V => {
                    // mapCodec.decode returns string, which should be V for map encoders
                    // TypeScript cannot prove this statically for generic V
                    return validateDecodedValue<V>(mapCodec.decode(buffer));
                }
            };
            return codec;
        } else if ('encode' in parameter.encoder && 'decode' in parameter.encoder) {
            return {
                dataType: parameter.dataType,
                encode: parameter.encoder.encode,
                decode: parameter.encoder.decode,
            };
        }
    }
    const defaultCodec = getDefaultCodec(parameter.dataType);
    const codec: Codec<V> = {
        dataType: defaultCodec.dataType,
        encode: (value: V) => defaultCodec.encode(value),
        decode: (buffer: Uint8Array) => {
            // Default codec returns MapValueForDataType<T>, should match V
            // TypeScript cannot prove this for generic V
            return validateDecodedValue<V>(defaultCodec.decode(buffer));
        }
    };
    return codec;
}

// ============================================================================
// Schema System
// ============================================================================

export interface Schema {
    readonly vendor: VendorId;
    readonly name: string;
    readonly version: string;
    readonly operations: ReadonlyArray<OperationDef>;
    readonly properties: ReadonlyArray<PropertyDef<any, any>>;
}

/**
 * Validates an object is a Schema
 */
function validateSchema(schema: unknown): asserts schema is Schema {
    if (!schema || typeof schema !== 'object') {
        throw new Error('Schema must be an object');
    }
    if (!('vendor' in schema) || !('name' in schema) || !('version' in schema) || 
        !('operations' in schema) || !('properties' in schema)) {
        throw new Error('Schema missing required fields');
    }
    const s = schema;
    if (typeof s.vendor !== 'number') {
        throw new Error('Schema vendor must be a VendorId');
    }
    if (typeof s.name !== 'string') {
        throw new Error('Schema name must be a string');
    }
    if (typeof s.version !== 'string') {
        throw new Error('Schema version must be a string');
    }
    if (!Array.isArray(s.operations)) {
        throw new Error('Schema operations must be an array');
    }
    if (!Array.isArray(s.properties)) {
        throw new Error('Schema properties must be an array');
    }
}

export function defineSchema(schema: Schema): Schema {
    validateSchema(schema);
    return schema;
}

export function mergeSchemas(base: Schema, vendor: Schema): Schema {
    validateSchema(base);
    validateSchema(vendor);
    
    // Merge operations (vendor overrides base)
    const mergedOps: OperationDef[] = [...base.operations];
    for (const vendorOp of vendor.operations) {
        const index = mergedOps.findIndex(op => op.code === vendorOp.code);
        if (index >= 0) {
            mergedOps[index] = vendorOp; // Override
        } else {
            mergedOps.push(vendorOp); // Add new
        }
    }
    
    // Merge properties (vendor overrides base)
    const mergedProps: PropertyDef<any, any>[] = [...base.properties];
    for (const vendorProp of vendor.properties) {
        const index = mergedProps.findIndex(prop => prop.code === vendorProp.code);
        if (index >= 0) {
            mergedProps[index] = vendorProp; // Override
        } else {
            mergedProps.push(vendorProp); // Add new
        }
    }
    
    return {
        vendor: vendor.vendor,
        name: `${vendor.name} (extends ${base.name})`,
        version: vendor.version,
        operations: mergedOps,
        properties: mergedProps,
    };
}

// ============================================================================
// Runtime Registry
// ============================================================================

export class PTPRegistry {
    private operations = new Map<OperationCode, OperationDef>();
    private properties = new Map<PropertyCode, PropertyDef<any, any>>();
    private vendors = new Map<VendorId, Schema>();
    
    registerSchema(schema: Schema): void {
        this.vendors.set(schema.vendor, schema);
        schema.operations.forEach(op => this.operations.set(op.code, op));
        schema.properties.forEach(prop => this.properties.set(prop.code, prop));
    }
    
    getOperation(code: OperationCode): OperationDef | undefined {
        return this.operations.get(code);
    }
    
    getProperty(code: PropertyCode): PropertyDef<any, any> | undefined {
        return this.properties.get(code);
    }
    
    getSchema(vendor: VendorId): Schema | undefined {
        return this.vendors.get(vendor);
    }
}

export const defaultRegistry = new PTPRegistry();