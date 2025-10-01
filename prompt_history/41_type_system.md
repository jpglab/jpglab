We are building an API around Picture Transfer Protocol (PTP).

We have amassed a vast collection on this protocol (both the generic ISO spec and various vendor implementations). You have access to all of this in the `docs/` folder.

# Essential background context:

- You **MUST FULLY** read, understand, and adhere to this prompt before continuing.
- You **MUST FULLY** read, understand, and adhere to the important notes before continuing.
- You **MUST FULLY** read, understand, and adhere to the goals before continuing.
- You **MUST FULLY** read, understand, and adhere to the success criteria before continuing.
- You **MUST FULLY** read, understand, and adhere to `./AGENTS.md` before continuing.
- You _may_ read through `prompt_history/` to understand our work so far at any time.
- You _may_ read through anything in the `docs/` folder to understand the ISO or vendor implementations of the spec.

# High-Level Goal:

Our type system for this project has come a long way but we want to overhaul it to get maximum type safety and hinting.

You should read through the following files to get an idea of what our current system looks like:

- @src/constants/types.ts
- @src/constants/ptp
- @src/constants/sony

You don't need to stick to the current definition. I'd actually be thrilled if there's a way better way to define things.

# Goals:

We want to improve both the definitions of these constants and the usage subject to these concerns:

- There is a generic PTP protocol implementing:
    - Containers
    - Errors
    - Events
    - Formats
    - Operations
    - Properties
    - Responses
    - Storage

By default a camera will be a GenericPTPCamera unless we've been able to obtain a camera from a specific vendor and derive a set of capability overrides (e.g. SonyCamera). In the case that we do have a set of overrides defined, those overrides should take precedence by command name, for example:

- OPEN_SESSION command defined in just PTP implementation -> GenericPTPCamera and all vendor implementations should use this
- SHUTTER_SPEED property defined in both PTP & Sony implementations -> GenericPTPCamera will use the generic version, Sony will use the Sony overrides
- METERED_EXPOSURE property defined in only Sony implementation -> GenericPTPCamera will not have this property, Sony will use the sony overrides

# Current Shortcomings

- Property getting and setting is currently in the Camera layer of our framework, whereas it should probably be in the protocol layer (different manufacturers should be able to define overrides for the GET_DEVICE_PROP_VALUE and SET_DEVICE_PROP_VALUE commands which are used for this)
    - Protocol does not have vendor overrides and it should not because it's meant to be generic, but we should have a way of selecting the correct operation to use for a vendor specific implementation
- We don't currently have a way of marking certain properties as a "command set" vs. a property set for Sony (commands require sending a different operation code)

# Desired way things work

### Parameters & operations should be strictly typed and give hints in both their definitions and usage

```typescript
// definition of operations
// ...
EXAMPLE_OPERATION: {
    code: 0x017507293687,
    name: 'EXAMPLE_OPERATION',
    parameters: [                                   // here we are defining the number and types of parameters for this 
        {
            name: 'Phase Type',
            type: DataType.UINT32,                  // here we are defining what the types of this specific parameter is
            description: 'Connection phase',
            possibleValues: [
                {
                    name: 'Phase 1',
                    description: 'Phase 1',
                    value: 1,                       // OK, matches UINT32
                },
                {
                    name: 'Bad Phase',
                    description: 'Bad Phase',
                    value: 'asdf',                  // BAD, string does not match UINT32
                },
                // ...
            ],
        },
    ],
    respondsWithData: true,
    dataDescription: 'UINT64 Value',
},
// ...

// calling of operations
sendOperation(BAD_OPERATION_THAT_DOESNT_EXIST, [0x01])  // bad, TypeScript should complain that this is not a valid operation
sendOperation(EXAMPLE_OPERATION, [0x01])                // good, this is a valid operation and the number & types of parameters are correct
sendOperation(EXAMPLE_OPERATION, [0x01, 0x02])          // bad, this operation only has one parameter
sendOperation(EXAMPLE_OPERATION, ['asdf'])              // bad, number of parameters is correct but it's supposed to be UINT32
```

### Indexing into constants & Intellisense

We should have a way from anywhere within the codebase to get information at compile time with Typescript and JSDoc about defined properties, operations, etc.

```typescript
// in Protocol definition
class Protocol {
    sendOperation(operation, parameters)
}

// usage of this, e.g. at the GenericPTPCamera Level
sendOperation(<intellisense>)                       // here the compiler should suggest EXAMPLE_OPERATION1, EXAMPLE_OPERATION2 with JSDocs/hints
sendOperation(EXAMPLE_OPERATION1, <intellisense>)   // here the compiler should suggest anything in the possible values for this specific operation with JSDocs/hints
```

### Properties & parameters should handle automatic encoding and decoding through their definitions and the protocol level

```typescript
// in Sony properties definitions
// ...
 ISO: {
    name: 'ISO',
    code: 0xd21e,
    type: DataType.UINT32,
    unit: 'ISO',
    encode: (value: string): Uint8Array => {
        // ...
    },
    decode: (value: Uint8Array): string => {
        // ...
    },
},
// ...

// usage
setDeviceProperty(ISO, '3200') // automatically encoded, returns back OK
getDeviceProperty(ISO) // automatically decoded, returns back 'ISO 3200'

// in Sony operations definitions
// ...
SDIO_SET_CONTENTS_TRANSFER_MODE: {
    code: 0x9212,
    name: 'SDIO_SET_CONTENTS_TRANSFER_MODE',
    description: 'Enable content transfer mode to access memory card content.',
    parameters: [
        {
            name: 'Transfer Mode',
            type: DataType.UINT32,
            description: 'Transfer mode setting',
            possibleValues: [
                {
                    name: 'ON',                     // feel free to change the name of this to ID or something
                    description: 'Enable transfer',
                    value: 0x00000001,
                },
            ],
        },
    ],
}
// ...

// in usage
sendOperation(SDIO_SET_CONTENTS_TRANSFER_MODE, ON) // automatically encodes it to 0x00000001
sendOperation(SDIO_GET_CONTENTS_TRANSFER_MODE) // automatically decodes 0x00000001 to ON
```

### Define once, use everywhere (at both compile time and runtime)

In addition, at runtime, we should be able to use our constants to decode things and provide descriptions about what's happening (for example in logging, show any parameters with their name, value, description, and decode the response):

```bash
09:06:10 PM  [USB]  ↗ Sent data using bulkOut endpoint 0x2 (24 bytes) 
09:06:10 PM  [USB]  ↙ Received data using bulkIn endpoint 0x81 (12 bytes) 
09:06:12 PM  [PTP]  ⠋ Send operation EXAMPLE_OPERATION (0x0000)
                          Parameters:
                            - Device Phase: The phase of this operation     PHASE 1 (0x01)
                            - Flag: In or out                               IN      (0x01)
                          Response:
                            - DEVICE_BUSY: The device is currently busy             (0x2019)
09:06:12 PM  [USB]  ⠋ Send data using bulkOut endpoint 0x2 (16 bytes) 
```

### Constants we can use everywhere

This applies to operations, properties, property values, parameters, and parameter values.

We'd like to reference these using constants, and more specifically branded types:

```typescript
camera.set(WHITE_BALANCE, DAYLIGHT)
```

instead of:

```typescript
camera.set('WHITE_BALANCE', 'DAYLIGHT') // what is 'WHITE_BALANCE' and 'DAYLIGHT'? where are they defined? what are the other possible values?
```

### We should use branded types for strict enforcement of any constants or codes

```typescript

// current implementation
const SonyOperations = {
    SDIO_OPEN_SESSION: {            // this is just a string             
        code: 0x9210,               // this is just a number
        name: 'SDIO_OPEN_SESSION',  // this is also just a string, there is also nothing preventing name from diverging from the key
        // ...
    },
    // ...
}

// desired
const SonyOperations = [
    {
        code: 0x9210,               // branded type for operation code,
        name: SDIO_OPEN_SESSION     // branded type for operation name, cannot diverge from anything because we only define it once
        // ...
    }
    // ...
]
```

This applies everywhere, you could imagine branded types for:
- OperationName
- PropertyName
- ParameterValue
- ParameterName

### Key Instructions

- You have full autonomy to design something totally different than the current type system that would meet the needs above more closely.
- Operations, properties, enum property values, parameters, and enum parameter values should be referenced with a constant/enum or type (SDIO_CONNECT) vs a string
('SDIO_CONNECT')

### Desired outputs

- Make a comprehensive proposal for some updates to the type system that address all these concerns
- Put that proposal in a markdown file
- Demonstrate your proposal with a single, minimal TypeScript example. Don't modify any existing code.
    - This example should test both positive and negative examples for everything. It shouldn't compile – it should raise errors at the places that our type system is working.
