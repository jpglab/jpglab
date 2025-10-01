/**
 * This file verifies that the negative test cases produce the expected type errors
 * Run: bunx tsc --noEmit verify-errors.ts
 */

import {
    OperationCode, PropertyCode, 
    codes, createOperation, createParameter, createParameterValue,
    DataType, StandardCodecs
} from './types';

// ❌ ERROR 1: Cannot mix branded types
const operationCode: OperationCode = codes.operation(0x1002);
const propertyCode: PropertyCode = operationCode; // Should error

// ❌ ERROR 2: Wrong parameter type
const sessionParam = createParameter({
    name: 'sessionId',
    dataType: DataType.UINT32,
    codec: StandardCodecs.uint32(),
    description: 'Session identifier'
});

const wrongValue = createParameterValue(sessionParam, 'not_a_number'); // Should error

// ❌ ERROR 3: Missing required parameter
const openSession = createOperation({
    name: 'OPEN_SESSION',
    code: codes.operation(0x1002),
    parameters: [sessionParam],
    description: 'Opens a new session'
});

// Missing sessionId parameter - should error
const missingParam = {
    operation: openSession,
    parameters: {} // Missing required sessionId
};

// ❌ ERROR 4: Invalid codec type
const invalidCodec = StandardCodecs.enum({
    PHASE_1: 0x01,
    PHASE_2: 0x02,
});

// Wrong value type for enum - should error
const wrongEnumValue = createParameterValue(
    createParameter({
        name: 'phase',
        dataType: DataType.UINT8,
        codec: invalidCodec,
        description: 'Phase'
    }),
    'PHASE_99' // Invalid enum value
);