/**
 * Negative test cases for type system v4
 * These should all produce TypeScript compilation errors
 * DO NOT use @ts-expect-error - we WANT to see the errors
 */

import {
    defineOperation,
    defineProperty,
    defineSchema,
    mergeSchemas,
    createParameter,
    createParameterValue,
    createOperationInstance,
    codes,
    DataType,
    type OperationCode,
    type PropertyCode,
    type SessionId,
    type TransactionId,
    type ParameterDef,
    type PropertyDef,
    defaultRegistry,
} from './types-v4'

console.log('❌ Negative Test Cases - V4')

// ============================================================================
// Test 1: Branded Type Mixing
// ============================================================================

console.log('\n1. Branded Type Mixing')

const opCode = codes.operation(0x1002)
const propCode = codes.property(0x5007)
const vendorId = codes.vendor(0x054C)

// ❌ ERROR: Cannot assign OperationCode to PropertyCode
const wrongAssign1: PropertyCode = opCode

// ❌ ERROR: Cannot assign PropertyCode to OperationCode  
const wrongAssign2: OperationCode = propCode

// ❌ ERROR: Cannot assign VendorId to OperationCode
const wrongAssign3: OperationCode = vendorId

// ❌ ERROR: Cannot use property code where operation code is expected
function expectsOperationCode(code: OperationCode) { return code }
expectsOperationCode(propCode) // Should error

// ❌ ERROR: Cannot use vendor ID where property code is expected
function expectsPropertyCode(code: PropertyCode) { return code }
expectsPropertyCode(vendorId) // Should error

// ============================================================================
// Test 2: Invalid Schema Structure
// ============================================================================

console.log('\n2. Invalid Schema Structure')

// ❌ ERROR: Missing required field 'version'
const invalidSchema1 = defineSchema({
    vendor: codes.vendor(0x1234),
    name: 'Invalid',
    // Missing version
    operations: [],
    properties: [],
})

// ❌ ERROR: Wrong type for operations (should be array)
const invalidSchema2 = defineSchema({
    vendor: codes.vendor(0x1234),
    name: 'Invalid',
    version: '1.0.0',
    operations: 'not an array', // Wrong type
    properties: [],
})

// ❌ ERROR: Wrong type for properties
const invalidSchema3 = defineSchema({
    vendor: codes.vendor(0x1234),
    name: 'Invalid',
    version: '1.0.0',
    operations: [],
    properties: { wrong: 'type' }, // Should be array
})

// ============================================================================
// Test 3: Invalid Operation Definition
// ============================================================================

console.log('\n3. Invalid Operation Definition')

// ❌ ERROR: Wrong type for code (should be OperationCode)
const invalidOp1 = defineOperation({
    code: 0x1234, // Should be OperationCode from codes.operation()
    name: 'INVALID_OP',
    description: 'Invalid operation',
})

// ❌ ERROR: Missing required field 'name'
const invalidOp2 = defineOperation({
    code: codes.operation(0x1234),
    // Missing name
    description: 'Invalid operation',
})

// ❌ ERROR: Missing required field 'description'
const invalidOp3 = defineOperation({
    code: codes.operation(0x1234),
    name: 'INVALID_OP',
    // Missing description
})

// ============================================================================
// Test 4: Invalid Property Definition
// ============================================================================

console.log('\n4. Invalid Property Definition')

// ❌ ERROR: Wrong type for code (should be PropertyCode)
const invalidProp1 = defineProperty({
    code: 0x5001, // Should be PropertyCode from codes.property()
    name: 'INVALID_PROP',
    dataType: DataType.UINT8,
    description: 'Invalid property',
})

// ❌ ERROR: Missing required field 'dataType'
const invalidProp2 = defineProperty({
    code: codes.property(0x5001),
    name: 'INVALID_PROP',
    // Missing dataType
    description: 'Invalid property',
})

// ❌ ERROR: Wrong dataType value
const invalidProp3 = defineProperty({
    code: codes.property(0x5001),
    name: 'INVALID_PROP',
    dataType: 0x99, // Not a valid DataType
    description: 'Invalid property',
})

// ============================================================================
// Test 5: Parameter Type Mismatches
// ============================================================================

console.log('\n5. Parameter Type Mismatches')

// Create typed parameters
const uint32Param: ParameterDef<typeof DataType.UINT32, number> = createParameter({
    name: 'numberParam',
    dataType: DataType.UINT32,
    description: 'Expects number',
})

const stringParam: ParameterDef<typeof DataType.STRING, string> = createParameter({
    name: 'stringParam',
    dataType: DataType.STRING,
    description: 'Expects string',
})

// ❌ ERROR: Wrong value type - passing string to number parameter
const wrongValue1 = createParameterValue(uint32Param, 'not a number')

// ❌ ERROR: Wrong value type - passing number to string parameter
const wrongValue2 = createParameterValue(stringParam, 12345)

// ❌ ERROR: Wrong value type - passing boolean to number parameter
const wrongValue3 = createParameterValue(uint32Param, true)

// ❌ ERROR: Wrong value type - passing object to string parameter
const wrongValue4 = createParameterValue(stringParam, { value: 'object' })

// ============================================================================
// Test 6: Invalid Map Encoder Types
// ============================================================================

console.log('\n6. Invalid Map Encoder Types')

// ❌ ERROR: Map values don't match data type (string values for UINT16)
const invalidMapProp1: PropertyDef<typeof DataType.UINT16> = defineProperty({
    code: codes.property(0x7001),
    name: 'INVALID_MAP',
    dataType: DataType.UINT16,
    description: 'Invalid map property',
    encoder: {
        map: {
            'OPTION_A': 'not a number', // ERROR: string not assignable to number
            'OPTION_B': 'also string',  // ERROR: string not assignable to number
        }
    },
})

// ❌ ERROR: Map values wrong type for parameter (boolean for UINT8)
const invalidMapParam: ParameterDef<typeof DataType.UINT8> = createParameter({
    name: 'invalidMode',
    dataType: DataType.UINT8,
    description: 'Invalid map parameter',
    encoder: {
        map: {
            'MODE_A': true,  // ERROR: boolean not assignable to number
            'MODE_B': false, // ERROR: boolean not assignable to number
        }
    },
})

// ❌ ERROR: Map values wrong type for INT16 (string values)
const invalidMapProp2: PropertyDef<typeof DataType.INT16> = defineProperty({
    code: codes.property(0x7002),
    name: 'INVALID_MAP_2',
    dataType: DataType.INT16,
    description: 'Invalid map property',
    encoder: {
        map: {
            'VALUE_A': 'string', // ERROR: string not assignable to number
            'VALUE_B': 'text',   // ERROR: string not assignable to number
        }
    },
})

// ============================================================================
// Test 7: Invalid Custom Encoder Signatures
// ============================================================================

console.log('\n7. Invalid Custom Encoder Signatures')

// ❌ ERROR: Encoder functions have wrong signatures
const invalidCustomProp = defineProperty({
    code: codes.property(0x7003),
    name: 'INVALID_CUSTOM',
    dataType: DataType.UINT32,
    description: 'Invalid custom property',
    encoder: {
        encode: (value: number): string => 'wrong return type', // Should return Uint8Array
        decode: (buffer: string): number => 42, // Should take Uint8Array
    },
})

// ⚠️ LIMITATION: TypeScript infers V=number from encoder functions
// This creates a PropertyDef<DataType.STRING, number> which is technically valid
// but semantically wrong. The dataType says STRING but encoder uses number.
// This is a fundamental limitation of TypeScript's inference system.
// To prevent this, always explicitly type the property or use proper encoder types.
const invalidCustomProp2 = defineProperty({
    code: codes.property(0x7004),
    name: 'INVALID_CUSTOM_2',
    dataType: DataType.STRING,  // Says STRING
    description: 'Invalid custom property',
    encoder: {
        encode: (value: number): Uint8Array => new Uint8Array(), // But uses number
        decode: (buffer: Uint8Array): number => 42, // TypeScript infers V=number
    },
})
// At runtime, getPropertyCodec will throw an error when trying to use this

// ============================================================================
// Test 8: Invalid Operation Instance Creation
// ============================================================================

console.log('\n8. Invalid Operation Instance Creation')

const testOp = defineOperation({
    code: codes.operation(0x8001),
    name: 'TEST_OP',
    description: 'Test operation',
})

// ❌ ERROR: Wrong type for sessionId (should be SessionId)
const invalidInstance1 = createOperationInstance(
    testOp,
    0x12345678, // Should be SessionId from codes.session()
    codes.transaction(0x0001),
)

// ❌ ERROR: Wrong type for transactionId (should be TransactionId)
const invalidInstance2 = createOperationInstance(
    testOp,
    codes.session(0x12345678),
    'not a transaction id', // Should be TransactionId
)

// ❌ ERROR: Wrong type for operation (should be OperationDef)
const invalidInstance3 = createOperationInstance(
    'not an operation', // Should be OperationDef
    codes.session(0x12345678),
    codes.transaction(0x0001),
)

// ============================================================================
// Test 9: Schema Merge Type Mismatches
// ============================================================================

console.log('\n9. Schema Merge Type Mismatches')

const validSchema = defineSchema({
    vendor: codes.vendor(0x0001),
    name: 'Valid',
    version: '1.0.0',
    operations: [],
    properties: [],
})

// ❌ ERROR: Cannot merge with non-schema type
const invalidMerge1 = mergeSchemas(
    validSchema,
    'not a schema' // Should be Schema type
)

// ❌ ERROR: Cannot merge with null
const invalidMerge2 = mergeSchemas(
    validSchema,
    null // Should be Schema type
)

// ❌ ERROR: Cannot merge with undefined
const invalidMerge3 = mergeSchemas(
    undefined, // Should be Schema type
    validSchema
)

// ============================================================================
// Test 10: Registry Type Guards
// ============================================================================

console.log('\n10. Registry Type Guards')

// ❌ ERROR: Cannot pass plain number as operation code
const invalidLookup1 = defaultRegistry.getOperation(0x1002)

// ❌ ERROR: Cannot pass plain number as property code
const invalidLookup2 = defaultRegistry.getProperty(0x5007)

// ❌ ERROR: Cannot pass plain number as vendor ID
const invalidLookup3 = defaultRegistry.getSchema(0x054C)

// ❌ ERROR: Cannot pass string as operation code
const invalidLookup4 = defaultRegistry.getOperation('OPEN_SESSION')

// ❌ ERROR: Cannot pass wrong branded type
const invalidLookup5 = defaultRegistry.getOperation(codes.property(0x5007))

// ============================================================================
// Test 11: Readonly Property Violations
// ============================================================================

console.log('\n11. Readonly Property Violations')

const readonlySchema = defineSchema({
    vendor: codes.vendor(0x1234),
    name: 'Readonly',
    version: '1.0.0',
    operations: [],
    properties: [],
})

// ❌ ERROR: Cannot modify readonly property 'name'
readonlySchema.name = 'Modified'

// ❌ ERROR: Cannot modify readonly property 'vendor'
readonlySchema.vendor = codes.vendor(0x5678)

// ❌ ERROR: Cannot push to readonly array 'operations'
readonlySchema.operations.push(defineOperation({
    code: codes.operation(0x9999),
    name: 'NEW_OP',
    description: 'Trying to add',
}))

// ❌ ERROR: Cannot modify readonly array 'properties'
readonlySchema.properties = []

// ============================================================================
// Test 12: Invalid Encoder Access
// ============================================================================

console.log('\n12. Invalid Encoder Access')

const propWithMap = defineProperty({
    code: codes.property(0x8001),
    name: 'MAP_PROP',
    dataType: DataType.UINT16,
    description: 'Property with map',
    encoder: {
        map: { 'A': 1, 'B': 2 }
    },
})

// ❌ ERROR: Cannot access encode/decode on map encoder
if (propWithMap.encoder && 'map' in propWithMap.encoder) {
    const invalid = propWithMap.encoder.encode // 'encode' doesn't exist on map encoder
}

// ============================================================================
// Test 13: Type Safety in Arrays
// ============================================================================

console.log('\n13. Type Safety in Arrays')

const typedSchema = defineSchema({
    vendor: codes.vendor(0x5555),
    name: 'Typed',
    version: '1.0.0',
    operations: [
        defineOperation({
            code: codes.operation(0x8001),
            name: 'OP1',
            description: 'Operation 1',
        }),
        // ❌ ERROR: Cannot mix types in operations array
        'not an operation',
        12345,
        null,
    ],
    properties: [
        defineProperty({
            code: codes.property(0x7001),
            name: 'PROP1',
            dataType: DataType.UINT8,
            description: 'Property 1',
        }),
        // ❌ ERROR: Cannot mix types in properties array
        { invalid: 'object' },
        'not a property',
    ],
})

// ============================================================================
// Test 14: Invalid DataType Values
// ============================================================================

console.log('\n14. Invalid DataType Values')

// ❌ ERROR: Cannot create parameter with invalid dataType
const invalidDataTypeParam = createParameter({
    name: 'invalid',
    dataType: 0xFF00, // Not a valid DataType
    description: 'Invalid data type',
})

// ❌ ERROR: Cannot create property with invalid dataType
const invalidDataTypeProp = defineProperty({
    code: codes.property(0x9001),
    name: 'INVALID_DT',
    dataType: 0xAAAA, // Not a valid DataType
    description: 'Invalid data type',
})

// ============================================================================
// Test 15: Wrong Parameter Counts
// ============================================================================

console.log('\n15. Wrong Parameter Counts')

// ❌ ERROR: Missing required parameters in function calls
const missingParams1 = codes.operation() // Missing code parameter

// ❌ ERROR: Wrong type and missing parameters
const missingParams2 = defineOperation() // Missing entire definition object

// ❌ ERROR: Extra parameters
const extraParams = codes.property(0x5001, 'extra', 'params') // Too many parameters

console.log('\n🎯 All negative test cases documented')
console.log('   Run TypeScript compiler to see all expected type errors')