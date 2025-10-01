/**
 * PTP Type System v5 - Separated Encode/Decode with Better Type Control
 * 
 * Key improvements:
 * - Encode/decode/map at root level for better type inference
 * - Combined possibleValues and map into a single concept
 * - Standardized encoding pattern for reuse
 * - NO 'as' keyword usage
 * - All branded types created through validated assertion functions
 */

// ============================================================================
// Branded Types for Compile-Time Safety
// ============================================================================

const brand = Symbol('brand');

export type OperationCode = number & { [brand]: 'OperationCode' };
export type PropertyCode = number & { [brand]: 'PropertyCode' };
export type VendorId = number & { [brand]: 'VendorId' };
export type SessionId = number & { [brand]: 'SessionId' };
export type TransactionId = number & { [brand]: 'TransactionId' };
export type EventCode = number & { [brand]: 'EventCode' };
export type ResponseCode = number & { [brand]: 'ResponseCode' };
export type DataTypeValue = number & { [brand]: 'DataType' };

// ============================================================================
// Validation Functions with Type Assertions
// ============================================================================

/**
 * Validates a value is a valid operation code
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
 * Validates a value is a valid property code
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
 * Validates a value is a valid vendor ID
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
 * Validates a value is a valid session ID
 */
function validateSessionId(id: number): asserts id is SessionId {
    if (typeof id !== 'number') {
        throw new Error(`Session ID must be a number, got ${typeof id}`);
    }
    if (id < 0 || id > 0xFFFFFFFF) {
        throw new Error(`Session ID must be 0x00000000-0xFFFFFFFF, got 0x${id.toString(16)}`);
    }
}

/**
 * Validates a value is a valid transaction ID
 */
function validateTransactionId(id: number): asserts id is TransactionId {
    if (typeof id !== 'number') {
        throw new Error(`Transaction ID must be a number, got ${typeof id}`);
    }
    if (id < 0 || id > 0xFFFFFFFF) {
        throw new Error(`Transaction ID must be 0x00000000-0xFFFFFFFF, got 0x${id.toString(16)}`);
    }
}

/**
 * Validates a value is a valid event code
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
 * Validates a value is a valid response code
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
 * Validates a value is a valid data type
 */
function validateDataType(type: number): asserts type is DataTypeValue {
    if (typeof type !== 'number') {
        throw new Error(`Data type must be a number, got ${typeof type}`);
    }
    if (type < 0 || type > 0xFF) {
        throw new Error(`Data type must be 0x00-0xFF, got 0x${type.toString(16)}`);
    }
}

// ============================================================================
// Code Creation Helpers
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
    
    event: (code: number): EventCode => {
        validateEventCode(code);
        return code;
    },
    
    response: (code: number): ResponseCode => {
        validateResponseCode(code);
        return code;
    },
};

// ============================================================================
// Data Types
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
    INT8: createDataType(0x09),
    INT16: createDataType(0x0B),
    INT32: createDataType(0x0D),
    INT64: createDataType(0x0F),
    STRING: createDataType(0xFF),
    ARRAY: createDataType(0xFE),
} satisfies Record<string, DataTypeValue>;

// ============================================================================
// Type Mapping for DataTypes
// ============================================================================

export type MapValueForDataType<T extends DataTypeValue> = 
    T extends typeof DataType.UINT8 ? number :
    T extends typeof DataType.UINT16 ? number :
    T extends typeof DataType.UINT32 ? number :
    T extends typeof DataType.UINT64 ? bigint :
    T extends typeof DataType.INT8 ? number :
    T extends typeof DataType.INT16 ? number :
    T extends typeof DataType.INT32 ? number :
    T extends typeof DataType.INT64 ? bigint :
    T extends typeof DataType.STRING ? string :
    T extends typeof DataType.ARRAY ? Uint8Array :
    never;

// ============================================================================
// Standardized Encoding Pattern
// ============================================================================

/**
 * A map entry with name, value, and description
 */
export interface MapEntry<T> {
    readonly name: string;
    readonly value: T;
    readonly description: string;
}

/**
 * Encoding configuration - either map-based or custom encode/decode
 * This is a standardized pattern that can be reused
 */
export type EncodingConfig<TDataType extends DataTypeValue, TValue> = 
    | {
        // Map-based encoding
        readonly map: ReadonlyArray<MapEntry<MapValueForDataType<TDataType>>>;
        readonly encode?: undefined;
        readonly decode?: undefined;
    }
    | {
        // Custom encoding functions
        readonly map?: undefined;
        readonly encode: (value: TValue) => Uint8Array;
        readonly decode: (buffer: Uint8Array) => TValue;
    }
    | {
        // No encoding specified - use defaults
        readonly map?: undefined;
        readonly encode?: undefined;
        readonly decode?: undefined;
    };

// ============================================================================
// Parameter System
// ============================================================================

// Parameter without encoding - uses default for dataType
export interface ParameterDefBase<T extends DataTypeValue> {
    readonly name: string;
    readonly dataType: T;
    readonly description: string;
    readonly optional?: boolean;
    readonly map?: undefined;
    readonly encode?: undefined;
    readonly decode?: undefined;
}

// Parameter with map - value type becomes string
export interface ParameterDefWithMap<T extends DataTypeValue> {
    readonly name: string;
    readonly dataType: T;
    readonly description: string;
    readonly optional?: boolean;
    readonly map: ReadonlyArray<MapEntry<MapValueForDataType<T>>>;
    readonly encode?: undefined;
    readonly decode?: undefined;
}

// Parameter with custom encode/decode
export interface ParameterDefWithCodec<T extends DataTypeValue, V> {
    readonly name: string;
    readonly dataType: T;
    readonly description: string;
    readonly optional?: boolean;
    readonly map?: undefined;
    readonly encode: (value: V) => Uint8Array;
    readonly decode: (buffer: Uint8Array) => V;
}

export type ParameterDef<T extends DataTypeValue = DataTypeValue, V = MapValueForDataType<T>> = 
    V extends MapValueForDataType<T> ? ParameterDefBase<T> | ParameterDefWithMap<T> :
    ParameterDefWithCodec<T, V>;

export function createParameter<T extends DataTypeValue>(
    def: ParameterDefBase<T>
): ParameterDefBase<T>;
export function createParameter<T extends DataTypeValue>(
    def: ParameterDefWithMap<T>
): ParameterDefWithMap<T>;
export function createParameter<T extends DataTypeValue, V>(
    def: ParameterDefWithCodec<T, V>
): ParameterDefWithCodec<T, V>;
export function createParameter(def: any): any {
    // Validate dataType
    const validTypes = [
        DataType.UINT8, DataType.UINT16, DataType.UINT32, DataType.UINT64,
        DataType.INT8, DataType.INT16, DataType.INT32, DataType.INT64,
        DataType.STRING, DataType.ARRAY
    ];
    if (!validTypes.includes(def.dataType)) {
        throw new Error(`Invalid data type in parameter: 0x${def.dataType.toString(16)}`);
    }
    
    // Validate encoding config
    if (def.map && (def.encode || def.decode)) {
        throw new Error('Parameter cannot have both map and encode/decode functions');
    }
    if ((def.encode && !def.decode) || (!def.encode && def.decode)) {
        throw new Error('Parameter must have both encode and decode or neither');
    }
    
    return def;
}

export interface ParameterValue<T extends DataTypeValue = DataTypeValue, V = any> {
    readonly parameter: ParameterDef<T, V>;
    readonly value: V;
}

export function createParameterValue<T extends DataTypeValue>(
    parameter: ParameterDefBase<T>,
    value: MapValueForDataType<T>
): ParameterValue<T, MapValueForDataType<T>>;
export function createParameterValue<T extends DataTypeValue>(
    parameter: ParameterDefWithMap<T>,
    value: string
): ParameterValue<T, string>;
export function createParameterValue<T extends DataTypeValue, V>(
    parameter: ParameterDefWithCodec<T, V>,
    value: V
): ParameterValue<T, V>;
export function createParameterValue(parameter: any, value: any): any {
    return { parameter, value };
}

// ============================================================================
// Property System
// ============================================================================

// Property without encoding - uses default for dataType
export interface PropertyDefBase<T extends DataTypeValue> {
    readonly code: PropertyCode;
    readonly name: string;
    readonly dataType: T;
    readonly description: string;
    readonly writable?: boolean;
    readonly unit?: string;
    readonly map?: undefined;
    readonly encode?: undefined;
    readonly decode?: undefined;
}

// Property with map - value type becomes string
export interface PropertyDefWithMap<T extends DataTypeValue> {
    readonly code: PropertyCode;
    readonly name: string;
    readonly dataType: T;
    readonly description: string;
    readonly writable?: boolean;
    readonly unit?: string;
    readonly map: ReadonlyArray<MapEntry<MapValueForDataType<T>>>;
    readonly encode?: undefined;
    readonly decode?: undefined;
}

// Property with custom encode/decode
export interface PropertyDefWithCodec<T extends DataTypeValue, V> {
    readonly code: PropertyCode;
    readonly name: string;
    readonly dataType: T;
    readonly description: string;
    readonly writable?: boolean;
    readonly unit?: string;
    readonly map?: undefined;
    readonly encode: (value: V) => Uint8Array;
    readonly decode: (buffer: Uint8Array) => V;
}

export type PropertyDef<T extends DataTypeValue = DataTypeValue, V = MapValueForDataType<T>> = 
    V extends MapValueForDataType<T> ? PropertyDefBase<T> | PropertyDefWithMap<T> :
    PropertyDefWithCodec<T, V>;

export function defineProperty<T extends DataTypeValue>(
    def: PropertyDefBase<T>
): PropertyDefBase<T>;
export function defineProperty<T extends DataTypeValue>(
    def: PropertyDefWithMap<T>
): PropertyDefWithMap<T>;
export function defineProperty<T extends DataTypeValue, V>(
    def: PropertyDefWithCodec<T, V>
): PropertyDefWithCodec<T, V>;
export function defineProperty(def: any): any {
    // Validate dataType
    const validTypes = [
        DataType.UINT8, DataType.UINT16, DataType.UINT32, DataType.UINT64,
        DataType.INT8, DataType.INT16, DataType.INT32, DataType.INT64,
        DataType.STRING, DataType.ARRAY
    ];
    if (!validTypes.includes(def.dataType)) {
        throw new Error(`Invalid data type in property: 0x${def.dataType.toString(16)}`);
    }
    
    // Validate encoding config
    if (def.map && (def.encode || def.decode)) {
        throw new Error('Property cannot have both map and encode/decode functions');
    }
    if ((def.encode && !def.decode) || (!def.encode && def.decode)) {
        throw new Error('Property must have both encode and decode or neither');
    }
    
    return def;
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
    return {
        operation,
        sessionId,
        transactionId,
        parameterValues,
    };
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

export function defineSchema(schema: Schema): Schema {
    // Validate vendor
    if (typeof schema.vendor !== 'number') {
        throw new Error('Schema vendor must be a VendorId');
    }
    if (!schema.name || typeof schema.name !== 'string') {
        throw new Error('Schema must have a name');
    }
    if (!schema.version || typeof schema.version !== 'string') {
        throw new Error('Schema must have a version');
    }
    if (!Array.isArray(schema.operations)) {
        throw new Error('Schema operations must be an array');
    }
    if (!Array.isArray(schema.properties)) {
        throw new Error('Schema properties must be an array');
    }
    return schema;
}

export function mergeSchemas(base: Schema, extension: Schema): Schema {
    // Create maps for efficient lookup
    const baseOps = new Map(base.operations.map(op => [op.code, op]));
    const extOps = new Map(extension.operations.map(op => [op.code, op]));
    
    const baseProps = new Map(base.properties.map(prop => [prop.code, prop]));
    const extProps = new Map(extension.properties.map(prop => [prop.code, prop]));
    
    // Merge operations - extension overrides base
    const mergedOps: OperationDef[] = [];
    const seenOpCodes = new Set<OperationCode>();
    
    // Add all extension operations (they override)
    for (const op of extension.operations) {
        mergedOps.push(op);
        seenOpCodes.add(op.code);
    }
    
    // Add base operations that weren't overridden
    for (const op of base.operations) {
        if (!seenOpCodes.has(op.code)) {
            mergedOps.push(op);
        }
    }
    
    // Merge properties - extension overrides base
    const mergedProps: PropertyDef<any, any>[] = [];
    const seenPropCodes = new Set<PropertyCode>();
    
    // Add all extension properties (they override)
    for (const prop of extension.properties) {
        mergedProps.push(prop);
        seenPropCodes.add(prop.code);
    }
    
    // Add base properties that weren't overridden
    for (const prop of base.properties) {
        if (!seenPropCodes.has(prop.code)) {
            mergedProps.push(prop);
        }
    }
    
    return {
        vendor: extension.vendor,
        name: extension.name,
        version: extension.version,
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