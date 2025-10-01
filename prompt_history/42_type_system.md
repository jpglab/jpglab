# PTP API Type System Overhaul

We want to overhaul our type system. Ultrathink hard about the problem.

**You are NOT improving the existing system. You are REPLACING it with something better.**

Think: "If I were designing this from scratch with perfect knowledge of TypeScript's capabilities, what would be the ideal solution?"

## DO NOT:

- ❌ DO NOT Adhere to the current implementation structure
- ❌ DO NOT Feel constrained by existing patterns in `@src/constants/`
- ❌ DO NOT Assume the current structure is optimal
- ❌ DO NOT Keep the same file organization or naming conventions
- ❌ DO NOT Maintain backwards compatibility with current code
- ❌ DO NOT Define branded types for every single const (such as white balance CLOUDY) - this is overkill
- ❌ DO NOT use `@ts-nocheck`

## MUST DO:

- ✅ Review `./AGENTS.md`
- ✅ Review `./src/constants` for context only, don't copy it
- ✅ Design a completely fresh approach that maximizes TypeScript's type system
- ✅ Define abstract schemas/interfaces for Operations, Properties, DataTypes, etc.
- ✅ Prioritize compile-time type safety above all else
- ✅ Think from first principles about what makes an ideal type system
- ✅ Define things once and use them everywhere
- ✅ Provide type safety at compile time and runtime
- ✅ Support vendor overrides elegantly
- ✅ Enable full IntelliSense/autocomplete
- ✅ Ensure that every single positive example works
- ✅ Ensure that every single negative example throws the error we expect
- ✅ Limit your usage of the `as` and `satisfies` keywords

## Learnings from previous attempts

- Functions with more than two arguments like `createOperation` and `createProperty` should take a dictionary of arguments that makes it clear that you are setting the `code`, `name`, `description` etc.
- Developers should not have to remember to label things `as const` everywhere or the type system will break. If there's something dicey, help developers out by offering a helper function or a builder interface.
- Large declaration blocks (e.g. `const PTP_OPERATIONS = ...`) should themselves adhere to a type, preventing people from putting junk in
- Large declaration blocks (e.g. `const PTP_OPERATIONS = ...`) should be lists rather than dictionaries so the keys of objects and their `name` properties do not unintentionally diverge
- Encoders/decoders/maps should be inline in definitions of constants to prevent amassing a huge mess of helper functions in bad places throughout the codebase
- Users should be able to define a bidirectional map OR an encode/decode function, a simple map shouldn't require writing a custom function
- If the user does not define a map or encode/decode function, we should use a standard that is appropriate for the datatype of the property/parameter

## Deliverables

- Put everything in the `./new-type-system-claude` subdirectory
- Create an implementation of the new type system in `types.ts`
- Create `schema.ts` which shows how you'd build up a schema of operations and constants using all of the features
- Create a brief `SUMMARY.md` document (no need for code examples, that is what the typescript examples are for)
- Create comprehensive test cases in `test-positive.ts` and `test-negative.ts` using Vitest

## Success Criteria for Deliverables

### Postive Test Cases

- Should be comprehensive of the entire type system (properties, operations, encoders, decoders, maps, property values, parameter values)
- Should use Vitest and `--typecheck`
- Should import from `types.ts` and `schema.ts`
- File should compile
- All tests should pass

### Negative Test Cases

- Should be comprehensive of the entire type system (properties, operations, encoders, decoders, maps, property values, parameter values)
- Should use Vitest and `--typecheck`
- Should import from `types.ts` and `schema.ts`
- File should compile
- All tests should pass
- Each failure case we expect should be marked with `@ts-expect-error <specific message we expect>`
- Refer to https://vitest.dev/guide/testing-types

## Core Requirements

### 1. Type Safety Requirements

Your type system MUST provide compile-time guarantees for the following

```typescript
// Generic PTP camera
const genericCamera = new Camera(ptpSchema)

// ✅ VALID: Correct operation with correct parameters
await genericCamera.sendOperation(OPEN_SESSION, { sessionId: 12345 })

// ✅ VALID: Operation with no parameters
await genericCamera.sendOperation(CLOSE_SESSION, {})

// ✅ VALID: Get property with automatic decoding
const isoValue = await genericCamera.get(ISO)

// ✅ VALID: Set property with valid value to pass into encoder
await genericCamera.set(ISO, 'ISO 3200')

// Sony camera with vendor-specific operations
const sonyCamera = new Camera(sonySchema)

// ✅ VALID: Sony override of OPEN_SESSION with additional parameter
await sonyCamera.sendOperation(OPEN_SESSION, {
    sessionId: 12345,
    functionMode: 'NORMAL',
})

// ✅ VALID: Sony-only operation with enum parameter
await sonyCamera.sendOperation(SDIO_CONNECT, { phase: PHASE_1 })

// ❌ ERROR 1: Invalid operation name
await genericCamera.sendOperation(INVALID_OPERATION, {})
//                                 ^^^^^^^^^^^^^^^^^^^
// Expected error: Argument of type INVALID_OPERATION is not assignable to parameter of type OPEN_SESSION | CLOSE_SESSION | GET_DEVICE_INFO | GET_PROPERTY_VALUE

// ❌ ERROR 2: Wrong parameter type
await genericCamera.sendOperation(OPEN_SESSION, { sessionId: 'string_not_number' })
//                                                              ^^^^^^^^^^^^^^^^^^^
// Expected error: Type 'string' is not assignable to type 'number'

// ❌ ERROR 3: Missing required parameter
await genericCamera.sendOperation(OPEN_SESSION, {})
//                                                 ^^
// Expected error: Property 'sessionId' is missing in type '{}' but required

// ❌ ERROR 4: Extra parameter that doesn't exist
await genericCamera.sendOperation(OPEN_SESSION, {
    sessionId: 12345,
    extraParam: 'invalid',
    //^^^^^^^^^^^
})
// Expected error: Object literal may only specify known properties, and 'extraParam' does not exist

// ❌ ERROR 5: Invalid property name
await genericCamera.set(INVALID_PROPERTY, 100)
//                       ^^^^^^^^^^^^^^^^^^
// Expected error: Argument of type INVALID_PROPERTY is not assignable to parameter of type BATTERY_LEVEL | ISO

// ❌ ERROR 6: Invalid property value
await genericCamera.set(WHITE_BALANCE, MIDNIGHT)
//                                     ^^^^^^^^
// Expected error: Argument of type MIDNIGHT is not assignable to parameter of type DAYLIGHT | CLOUDY | AUTO

// ❌ ERROR 7: Mixing operation and property codes (branded types prevent this)
const operationCode: OperationCode<0x1002> = opCode(0x1002)
const propertyCode: PropertyCode<0x5001> = operationCode
//                                          ^^^^^^^^^^^^^
// Expected error: Type 'OperationCode<0x1002>' is not assignable to type 'PropertyCode<0x5001>'

// ❌ ERROR 8: Sony-only operation on generic camera
await genericCamera.sendOperation(SDIO_CONNECT, { phase: PHASE_1 })
//                                ^^^^^^^^^^^^
// Expected error: Argument of type SDIO_CONNECT is not assignable to parameter of type OPEN_SESSION | CLOSE_SESSION | GET_DEVICE_INFO | GET_PROPERTY_VALUE

// ❌ ERROR 9: Wrong vendor parameter structure
await sonyCamera.sendOperation(OPEN_SESSION, { sessionId: 12345 })
//                                           ^^^^^^^^^^^^^^^^^^^^
// Expected error: Property 'functionMode' is missing in type but required

// ❌ ERROR 10: Invalid enum value for parameter
await sonyCamera.sendOperation(SDIO_CONNECT, { phase: PHASE_4 })
//                                                   ^^^^^^^^^
// Expected error: Type PHASE_4 is not assignable to type PHASE_1 | PHASE_2 | PHASE_3
```

### 2. Branded Types

All codes and identifiers must use branded/nominal types. You must create validate and have helper functions to wrap unknown codes. Don't use the `as` keyword. You should use this pattern for ALL branded types, not just operations and properties.

```typescript
// Example of what we want (not prescriptive of implementation):
type DataType = number & { __brand: 'DataType' }
type OperationCode = number & { __brand: 'OperationCode' }
type PropertyCode = number & { __brand: 'PropertyCode' }
type OperationName = string & { __brand: 'OperationName' }

// helper functions to create branded types
export function validateOpCode(code: number): asserts code is OperationCode {
    if (typeof code !== 'number') {
        throw new Error('Code must be a number')
    }
    if (code < 0 || code > 0xffff) {
        throw new Error('Code must be a valid hex code')
    }
}
export function opCode(code: number): OperationCode {
    validateOpCode(code)
    return code
}
export function validatePropCode(code: number): asserts code is PropertyCode {
    if (typeof code !== 'number') {
        throw new Error('Code must be a number')
    }
    if (code < 0 || code > 0xffff) {
        throw new Error('Code must be a valid hex code')
    }
}
export function propCode(code: number): PropertyCode {
    validatePropCode(code)
    return code
}

propCode(0x1002) === opCode(0x1002)
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ERROR: This comparison appears to be unintentional because the types 'PropertyCode' and 'OperationCode' have no overlap.

// BAD – DO NOT DO THIS
const myPropCode: PropCode = 0x0102958209850981029385 as PropCode // this is clearly not valid, we should use the functions to help validate and cast codes
```

### 3. Vendor Override System

The system must elegantly handle:

- Generic PTP operations/properties (base layer)
- Vendor-specific overrides (Sony, Canon, etc.)
- Automatic selection based on camera type

Example behavior:

- `OPEN_SESSION` - Available on all cameras (defined in PTP only)
- `SHUTTER_SPEED` - Different implementations for Generic vs Sony
- `METERED_EXPOSURE` - Sony-only, not available on GenericPTPCamera

### 4. Automatic Encoding/Decoding

Include a way to encode/decode both parameter values and property values. This should be possible either using an enum that works in both directions, or by defining a custom encoder/decoder in the definition of that parameter/property value. These maps/encoders/decoders should be colocated & included WITHIN the operation or property definition so it is easy to reference without jumping around between helper functions. Parameters values and property values should share the generic implmementation of this functionality.

```typescript
// definition includes a map to use bidirectionally
WHITE_BALANCE: {
    map: {
        DAYLIGHT: 0x0000,
        CLOUDY: 0x0001,
        AUTO: 0x0003,
    }
}
camera.set(WHITE_BALANCE, DAYLIGHT) // Automatically encodes
camera.get(WHITE_BALANCE) // returns decoded CLOUDY, not bytes

// Definition includes custom encoder/decoder
ISO: {
    encode: (value) => {
        // custom logic
    }
    decode: (bytes) => {
        // custom logic
    }
}

// Usage is automatic
camera.set(ISO, ISO_3200) // Automatically encodes
camera.get(ISO) // Returns decoded ISO_3200, not bytes
```

### 5. Runtime Introspection

The same definitions must support runtime logging:

```text
[PTP] Send operation EXAMPLE_OPERATION (0x1234)
      Parameters:
        - Phase Type: Connection phase = PHASE_1 (0x01)
        - Transfer Mode: Direction = IN (0x01)
      Response:
        - DEVICE_BUSY (0x2019): Device is currently busy
```

### 6. Definitions must be strictly typed

There is no point in writing definitions if we're not going to use them to validate our constants.

```typescript
// BAD – how do we know we've written this correctly?
export const PTP_SCHEMA = {
    // ... operations, properties, etc
} as const

// GOOD – validates things as we're writing them
export type PTPSchema = {
    // ... operations, properties, etc
}
export const PTP_SCHEMA: PTPSchema = {
    // ... operations, properties, etc
} as const
```

### 7. Great Developer Experience

Developers are forgetful and they will not remember the intricacies that make our type system bulletproof.

```typescript
// BAD - only an example, do not adhere to this specification
export const PTP_SCHEMA = {
    operations: {
        OPEN_SESSION: {
            code: opCode(0x1002),                           // BAD - developer will forget to wrap this with `opCode`
            name: opName('OPEN_SESSION'),                   // BAD - developer will forget to wrap this in `opName`
            description: 'Opens a new session',
            parameters: [
                {
                    name: 'sessionId',
                    type: DATA_TYPES.UINT32,                // BAD - developer could just put `uint32` without referencing the type
                    description: 'Session identifier',
                },
            ] as const,                                     // BAD - developer will forget to declare `as const`
        },
    },
}

// GOOD - enforces things in the arguments
defineOperation({
    // ...
})
```
