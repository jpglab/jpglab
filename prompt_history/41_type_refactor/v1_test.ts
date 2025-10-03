// ============================================================================
// protocol-definition.ts - All constants in one file
// ============================================================================

import {
    createKeyValueCodec,
    createFunctionCodec,
    type Parameter,
    type Property,
    type Operation,
    type ProtocolDefinition,
    type INT32,
} from './v1_protocol'

// ============================================================================
// Define Codecs (reusable across parameters and properties)
// ============================================================================

const StatusCodec = createKeyValueCodec({
    '0': 'idle' as const,
    '1': 'running' as const,
    '2': 'error' as const,
    '3': 'stopped' as const,
})

const ModeCodec = createKeyValueCodec({
    '0': 'manual' as const,
    '1': 'automatic' as const,
    '2': 'debug' as const,
})

const TemperatureCodec = createFunctionCodec<number>(
    celsius => Math.round(celsius * 10), // Encode: multiply by 10
    raw => raw / 10 // Decode: divide by 10
)

const SpeedCodec = createFunctionCodec<number>(
    rpm => rpm, // Direct encoding
    raw => raw // Direct decoding
)

const EnabledCodec = createKeyValueCodec({
    '0': false,
    '1': true,
})

// ============================================================================
// Define Parameters
// ============================================================================

const SpeedParam = {
    name: 'speed',
    codec: SpeedCodec,
} as const satisfies Parameter<'speed', number>

const TemperatureParam = {
    name: 'temperature',
    codec: TemperatureCodec,
} as const satisfies Parameter<'temperature', number>

const ModeParam = {
    name: 'mode',
    codec: ModeCodec,
} as const satisfies Parameter<'mode', 'manual' | 'automatic' | 'debug'>

const DurationParam = {
    name: 'duration',
    codec: SpeedCodec, // Reusing codec for simple int
} as const satisfies Parameter<'duration', number>

const EnabledParam = {
    name: 'enabled',
    codec: EnabledCodec,
} as const satisfies Parameter<'enabled', boolean>

// ============================================================================
// Define Operations (up to 5 parameters each)
// ============================================================================

const StartOperation = {
    name: 'start',
    description: 'Start the device',
    parameters: [] as const,
} as const satisfies Operation<'start', []>

const SetSpeedOperation = {
    name: 'setSpeed',
    description: 'Set the device speed',
    parameters: [SpeedParam] as const,
} as const satisfies Operation<'setSpeed', [typeof SpeedParam]>

const ConfigureOperation = {
    name: 'configure',
    description: 'Configure device with mode and temperature',
    parameters: [ModeParam, TemperatureParam] as const,
} as const satisfies Operation<'configure', [typeof ModeParam, typeof TemperatureParam]>

const RunCycleOperation = {
    name: 'runCycle',
    description: 'Run a cycle with specified parameters',
    parameters: [SpeedParam, TemperatureParam, DurationParam, ModeParam, EnabledParam] as const,
} as const satisfies Operation<
    'runCycle',
    [typeof SpeedParam, typeof TemperatureParam, typeof DurationParam, typeof ModeParam, typeof EnabledParam]
>

const StopOperation = {
    name: 'stop',
    description: 'Stop the device',
    parameters: [] as const,
} as const satisfies Operation<'stop', []>

// ============================================================================
// Define Properties
// ============================================================================

const StatusProperty = {
    name: 'status',
    dataType: 'enum',
    codec: StatusCodec,
} as const satisfies Property<'status', 'idle' | 'running' | 'error' | 'stopped'>

const CurrentSpeedProperty = {
    name: 'currentSpeed',
    dataType: 'int32',
    codec: SpeedCodec,
} as const satisfies Property<'currentSpeed', number>

const TargetTemperatureProperty = {
    name: 'targetTemperature',
    dataType: 'float',
    codec: TemperatureCodec,
} as const satisfies Property<'targetTemperature', number>

const CurrentModeProperty = {
    name: 'currentMode',
    dataType: 'enum',
    codec: ModeCodec,
} as const satisfies Property<'currentMode', 'manual' | 'automatic' | 'debug'>

// ============================================================================
// Export Protocol Definition
// ============================================================================

export const MyDeviceProtocol = {
    operations: [StartOperation, SetSpeedOperation, ConfigureOperation, RunCycleOperation, StopOperation] as const,
    properties: [StatusProperty, CurrentSpeedProperty, TargetTemperatureProperty, CurrentModeProperty] as const,
} as const satisfies ProtocolDefinition

export type MyDeviceProtocol = typeof MyDeviceProtocol

// ============================================================================
// Example Usage
// ============================================================================

import { ProtocolClient, type DeviceTransport } from './v1_protocol'

// Mock transport for demonstration
class MockTransport implements DeviceTransport {
    async sendOperation(name: string, params: INT32[]): Promise<void> {
        console.log(`Sending operation: ${name}`, params)
    }

    async getProperty(name: string): Promise<INT32> {
        console.log(`Getting property: ${name}`)
        // Mock return values
        if (name === 'status') return 1
        if (name === 'currentSpeed') return 1500
        if (name === 'targetTemperature') return 250 // 25.0°C
        if (name === 'currentMode') return 0
        return 0
    }

    async setProperty(name: string, value: INT32): Promise<void> {
        console.log(`Setting property: ${name} = ${value}`)
    }
}

// ============================================================================
// Usage Examples with Full Type Safety
// ============================================================================

async function exampleUsage() {
    const client = new ProtocolClient(MyDeviceProtocol, new MockTransport())

    // ✅ Valid: Operation with no parameters
    await client.sendOperation('start')

    // ✅ Valid: Operation with one parameter
    await client.sendOperation('setSpeed', { speed: 1500 })

    // ✅ Valid: Operation with two parameters
    await client.sendOperation('configure', {
        mode: 'automatic',
        temperature: 25.5,
    })

    // ✅ Valid: Operation with all 5 parameters
    await client.sendOperation('runCycle', {
        speed: 2000,
        temperature: 30.0,
        duration: 600,
        mode: 'manual',
        enabled: true,
    })

    // ✅ Valid: Get property with correct type inference
    const status = await client.getProperty('status') // type: 'idle' | 'running' | 'error' | 'stopped'
    const speed = await client.getProperty('currentSpeed') // type: number
    const temp = await client.getProperty('targetTemperature') // type: number

    // ✅ Valid: Set property with correct type
    await client.setProperty('targetTemperature', 28.5)
    await client.setProperty('currentMode', 'debug')

    // ❌ TypeScript errors (uncomment to test):
    // await client.sendOperation('invalidOp'); // Error: invalid operation name
    // await client.sendOperation('setSpeed', { wrongParam: 100 }); // Error: wrong parameter
    // await client.sendOperation('setSpeed', { speed: 'fast' }); // Error: wrong type
    // await client.sendOperation('configure', { mode: 'automatic' }); // Error: missing temperature
    // await client.sendOperation('start', { extraParam: 123 }); // Error: no parameters expected
    // await client.getProperty('invalidProp'); // Error: invalid property name
    // await client.setProperty('currentMode', 'invalid'); // Error: invalid enum value
    // await client.setProperty('targetTemperature', 'hot'); // Error: wrong type

    console.log('Status:', status)
    console.log('Speed:', speed)
    console.log('Temperature:', temp)
}

// Run the example
exampleUsage().catch(console.error)
