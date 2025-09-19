We are building an API around Picture Transfer Protocol (PTP).

We have amassed a vast collection on this protocol (both the generic ISO spec and various vendor implementations). You have access to all of this through tool invocation (`basic-memory`, `write_note()`, `read_note()`, `search_notes()`, `edit_note()`, `move_note()`)

We are now going to attempt **PHASE 2** of the refactor.

Essential background context:

- You **MUST FULLY** read this prompt before continuing.
- You **MUST FULLY** read and understand the refactor proposal before continuing.
- You **MUST FULLY** read and understand the important notes before continuing.
- You **MUST FULLY** understand the goals for this phase of the refactor before continuing.
- You **MUST FULLY** understand the success criteria for this phase of the refactor before continuing.
- You **MUST FULLY** read through `./AGENTS.md` before continuing.
- You **MUST FULLY** read and understand how the relevant functionality for this phase is implemented in the old architecture before continuing.
- You _may_ read through `prompt_history/` to understand our work so far at any time.
- You _may_ use tools and MCP to gather more information on the specification at any time.

Important notes for the migration (**ALL PHASES**):

- Any code that relates to current functionality (USB transport, generic ISO spec, Sony vendor spec) must be migrated so it works exactly the same
- If functionality does not exist in the old arch, do not attempt to guess at what it should be, just leave a TODO comment and say not implemented in old architecture
- Do not "infer" any PTP codes, vendor codes or magic bytes, only transfer over ones that exist in the old architecture
- We are moving from the old arch (`src`) to the new arch (`src_new`)
- Do not delete any code from the old arch (`src`)
- Do not refer to or import any code in the old arch (`src`) within the new arch (`src_new`)

Our goals at this phase of the refactor (**PHASE 2**):

- [ ] Extract `TransportInterface` from `USBTransport`
- [ ] Create `USBTransport` implementing interface
- [ ] Add transport factory

Success criteria for this phase of the refactor (**PHASE 2**):

- [ ] `src_new/tests/usb.ts`:
    - [ ] tests using Vitest
    - [ ] we can instantiate the new `USBTransport`
    - [ ] we have access to the USB functions available
    - [ ] we can discover devices & interfaces – there should be >5
    - [ ] we can see at least one device with the vendor code for sony
    - [ ] we can see at least one Sony camera
        - [ ] it should be still image class
        - [ ] we should be able to read its name and its name should contain '6700'
        - [ ] we should be able to read its serial number
        - [ ] we should be able to read what port/interface it is using
        - [ ] we should be able to claim the interface
- [ ] `bun run test:usb` runs the script using Vitest
- [ ] `bun run test:all` runs ALL the tests in `src_new/tests`
- [ ] `bun run test:all` works with exit code 0 and no errors/warnings
- [ ] `bun run all` also runs tests after the current 3 operations
- [ ] `bun run all` works with exit code 0 and no errors/warnings

---

# PTP API Refactoring Proposal

## Executive Summary

This proposal outlines a comprehensive refactoring of the PTP (Picture Transfer Protocol) API to achieve a clean, maintainable, and extensible four-layer architecture with vendor-agnostic abstractions and dependency injection throughout.

## Current Architecture Analysis

### Current Issues

1. **Tight Coupling**: `PTPClient` directly instantiates `USBTransport`, making testing and alternate transports difficult
2. **Vendor-Specific Logic**: Sony implementation is tightly integrated without clear abstraction boundaries
3. **No Abstraction Layer**: Missing vendor-agnostic property mappings
4. **Mixed Responsibilities**: Transport, protocol, and vendor logic intermingled
5. **Limited Extensibility**: Adding new vendors or transports requires modifying core code

### Current Structure

```
src/
├── core/
│   ├── ptp-client.ts      (Mixed protocol/transport concerns)
│   ├── ptp-message.ts     (Message building/parsing)
│   └── data-utils.ts      (Low-level utilities)
├── transport/
│   └── usb-transport.ts   (USB implementation with mixed concerns)
├── vendors/
│   └── sony/
│       ├── sony-camera.ts (Vendor implementation)
│       └── sony-codes.ts  (Vendor-specific constants)
└── types/
    └── ptp-codes.ts       (Protocol constants)
```

## Proposed Four-Layer Architecture

### Layer Overview

```
┌─────────────────────────────────────────────┐
│         Application Layer                   │
│   (High-level API for consumers)            │
├─────────────────────────────────────────────┤
│         Camera Layer                        │
│   (Vendor implementations & abstractions)   │
├─────────────────────────────────────────────┤
│         Core Layer                          │
│   (Protocol implementation & messaging)     │
├─────────────────────────────────────────────┤
│         Transport Layer                     │
│   (USB, IP, and other transport protocols)  │
└─────────────────────────────────────────────┘
```

### Detailed Layer Design

#### 1. Transport Layer (Bottom)

**Purpose**: Handle physical communication with devices

```typescript
// src/transport/interfaces/transport.interface.ts
export interface TransportInterface {
    connect(device: DeviceIdentifier): Promise<void>
    disconnect(): Promise<void>
    send(data: Uint8Array): Promise<void>
    receive(maxLength?: number): Promise<Uint8Array>
    isConnected(): boolean
    reset(): Promise<void>
}

// src/transport/interfaces/device-identifier.interface.ts
export interface DeviceIdentifier {
    vendorId: number
    productId: number
    serialNumber?: string
    path?: string
}

// src/transport/usb/usb.transport.ts
export class USBTransport implements TransportInterface {
    constructor(
        private readonly deviceFinder: DeviceFinderInterface,
        private readonly endpointManager: EndpointManagerInterface
    ) {}
    // Implementation...
}

// src/transport/ip/ip.transport.ts
export class IPTransport implements TransportInterface {
    constructor(private readonly networkClient: NetworkClientInterface) {}
    // Implementation...
}
```

#### 2. Core Layer

**Purpose**: Implement PTP protocol mechanics

```typescript
// src/core/interfaces/protocol.interface.ts
export interface ProtocolInterface {
    openSession(sessionId: number): Promise<void>
    closeSession(): Promise<void>
    sendOperation(operation: Operation): Promise<Response>
    receiveEvent(): Promise<Event>
}

// src/core/interfaces/message-builder.interface.ts
export interface MessageBuilderInterface {
    buildCommand(operation: number, parameters: number[]): Uint8Array
    buildData(operation: number, data: Uint8Array): Uint8Array
    parseResponse(data: Uint8Array): Response
    parseEvent(data: Uint8Array): Event
}

// src/core/ptp/ptp-protocol.ts
export class PTPProtocol implements ProtocolInterface {
    constructor(
        private readonly transport: TransportInterface,
        private readonly messageBuilder: MessageBuilderInterface
    ) {}

    async sendOperation(operation: Operation): Promise<Response> {
        const message = this.messageBuilder.buildCommand(operation.code, operation.parameters)
        await this.transport.send(message)

        if (operation.hasDataPhase) {
            const dataMessage = this.messageBuilder.buildData(operation.code, operation.data)
            await this.transport.send(dataMessage)
        }

        const responseData = await this.transport.receive()
        return this.messageBuilder.parseResponse(responseData)
    }
}
```

#### 3. Camera Layer

**Purpose**: Provide vendor abstractions and implementations

```typescript
// src/camera/interfaces/camera.interface.ts
export interface CameraInterface {
    connect(): Promise<void>
    disconnect(): Promise<void>

    // Vendor-agnostic operations
    captureImage(): Promise<void>
    getDeviceProperty(property: DeviceProperty): Promise<PropertyValue>
    setDeviceProperty(property: DeviceProperty, value: PropertyValue): Promise<void>

    // Live view
    enableLiveView(): Promise<void>
    disableLiveView(): Promise<void>
    getLiveViewFrame(): Promise<ImageData>

    // File operations
    listImages(): Promise<ImageInfo[]>
    downloadImage(handle: number): Promise<ImageData>
    deleteImage(handle: number): Promise<void>
}

// src/camera/interfaces/property-mapper.interface.ts
export interface PropertyMapperInterface {
    mapToVendor(property: DeviceProperty): number
    mapFromVendor(vendorCode: number): DeviceProperty
    convertValue(property: DeviceProperty, value: any): any
    parseValue(property: DeviceProperty, rawValue: any): any
}

// src/camera/generic/generic-ptp-camera.ts
export class GenericPTPCamera implements CameraInterface {
    constructor(
        protected readonly protocol: ProtocolInterface,
        protected readonly propertyMapper: PropertyMapperInterface
    ) {}

    async getDeviceProperty(property: DeviceProperty): Promise<PropertyValue> {
        const vendorCode = this.propertyMapper.mapToVendor(property)
        const response = await this.protocol.sendOperation({
            code: PTPOperations.GET_DEVICE_PROP_VALUE,
            parameters: [vendorCode],
        })
        return this.propertyMapper.parseValue(property, response.data)
    }
}

// src/camera/vendors/sony/sony-camera.ts
export class SonyCamera extends GenericPTPCamera {
    constructor(
        protocol: ProtocolInterface,
        private readonly sonyAuthenticator: SonyAuthenticatorInterface
    ) {
        super(protocol, new SonyPropertyMapper())
    }

    async connect(): Promise<void> {
        await this.protocol.openSession(1)
        await this.sonyAuthenticator.authenticate(this.protocol)
    }

    // Sony-specific overrides and extensions
    async enableOSDMode(): Promise<void> {
        // Sony-specific implementation
    }
}
```

#### 4. Application Layer

**Purpose**: Provide high-level, user-friendly API

```typescript
// src/application/camera-manager.ts
export class CameraManager {
    constructor(
        private readonly cameraFactory: CameraFactoryInterface,
        private readonly transportFactory: TransportFactoryInterface
    ) {}

    async connectCamera(options: ConnectionOptions): Promise<Camera> {
        const transport = await this.transportFactory.create(options.transport)
        const protocol = new PTPProtocol(transport, new PTPMessageBuilder())
        const camera = await this.cameraFactory.create(options.vendor, protocol)
        await camera.connect()
        return camera
    }
}

// src/application/camera.ts
export class Camera {
    constructor(
        private readonly implementation: CameraInterface,
        private readonly eventEmitter: EventEmitterInterface
    ) {}

    async takePhoto(): Promise<Photo> {
        await this.implementation.captureImage()
        this.eventEmitter.emit('photo:captured')
        const images = await this.implementation.listImages()
        const latest = images[images.length - 1]
        const data = await this.implementation.downloadImage(latest.handle)
        return new Photo(data)
    }

    async setAperture(value: string): Promise<void> {
        await this.implementation.setDeviceProperty(DeviceProperties.APERTURE, value)
    }

    async startLiveView(callback: (frame: Frame) => void): Promise<void> {
        await this.implementation.enableLiveView()
        this.liveViewInterval = setInterval(async () => {
            const frame = await this.implementation.getLiveViewFrame()
            callback(new Frame(frame))
        }, 33) // 30fps
    }
}
```

## Vendor-Agnostic Property System

### Property Definition

```typescript
// src/camera/properties/device-properties.ts
export enum DeviceProperties {
    // Exposure
    APERTURE = 'aperture',
    SHUTTER_SPEED = 'shutterSpeed',
    ISO = 'iso',
    EXPOSURE_COMPENSATION = 'exposureCompensation',

    // Focus
    FOCUS_MODE = 'focusMode',
    FOCUS_AREA = 'focusArea',

    // Capture
    IMAGE_QUALITY = 'imageQuality',
    WHITE_BALANCE = 'whiteBalance',
    CAPTURE_MODE = 'captureMode',

    // Device
    BATTERY_LEVEL = 'batteryLevel',
    DEVICE_NAME = 'deviceName',
    SERIAL_NUMBER = 'serialNumber',
}

// src/camera/properties/property-metadata.ts
export interface PropertyMetadata {
    property: DeviceProperties
    dataType: DataType
    unit?: PropertyUnit
    readable: boolean
    writable: boolean
    enumValues?: PropertyValue[]
}

export enum PropertyUnit {
    SECONDS = 'seconds',
    FRACTION = 'fraction',
    F_STOP = 'fStop',
    ISO_VALUE = 'iso',
    PERCENTAGE = 'percentage',
}
```

### Vendor Mapping Implementation

```typescript
// src/camera/vendors/sony/sony-property-mapper.ts
export class SonyPropertyMapper implements PropertyMapperInterface {
    private readonly vendorToGeneric = new Map<number, DeviceProperties>([
        [0x5007, DeviceProperties.APERTURE], // F_NUMBER
        [0xd20d, DeviceProperties.SHUTTER_SPEED], // Sony SHUTTER_SPEED
        [0xd21e, DeviceProperties.ISO], // Sony ISO_SENSITIVITY
    ])

    private readonly genericToVendor = new Map<DeviceProperties, number>([
        [DeviceProperties.APERTURE, 0x5007],
        [DeviceProperties.SHUTTER_SPEED, 0xd20d],
        [DeviceProperties.ISO, 0xd21e],
    ])

    mapToVendor(property: DeviceProperties): number {
        const vendorCode = this.genericToVendor.get(property)
        if (!vendorCode) {
            throw new UnsupportedPropertyError(property)
        }
        return vendorCode
    }

    convertValue(property: DeviceProperties, value: any): any {
        switch (property) {
            case DeviceProperties.SHUTTER_SPEED:
                // Convert from "1/250" to Sony's fractional format
                return this.parseShutterSpeed(value)
            case DeviceProperties.APERTURE:
                // Convert from "f/2.8" to Sony's format
                return this.parseAperture(value)
            default:
                return value
        }
    }

    parseValue(property: DeviceProperties, rawValue: any): any {
        switch (property) {
            case DeviceProperties.SHUTTER_SPEED:
                // Convert Sony's fractional format to "1/250"
                return this.formatShutterSpeed(rawValue)
            case DeviceProperties.APERTURE:
                // Convert Sony's format to "f/2.8"
                return this.formatAperture(rawValue)
            default:
                return rawValue
        }
    }

    private parseShutterSpeed(value: string): Uint8Array {
        // Parse "1/250" format
        if (value.startsWith('1/')) {
            const denominator = parseInt(value.substring(2))
            const data = new Uint8Array(8)
            const view = new DataView(data.buffer)
            view.setUint32(0, 1, true) // Numerator
            view.setUint32(4, denominator, true) // Denominator
            return data
        }
        // Handle full seconds like "2"
        const seconds = parseFloat(value)
        const data = new Uint8Array(8)
        const view = new DataView(data.buffer)
        view.setUint32(0, seconds * 10000, true) // Sony uses 1/10000 seconds
        view.setUint32(4, 10000, true)
        return data
    }

    private formatShutterSpeed(rawValue: Uint8Array): string {
        const view = new DataView(rawValue.buffer, rawValue.byteOffset)
        const numerator = view.getUint32(0, true)
        const denominator = view.getUint32(4, true)

        if (numerator === 1 && denominator > 1) {
            return `1/${denominator}`
        }

        const seconds = numerator / denominator
        return seconds >= 1 ? `${seconds}` : `1/${Math.round(1 / seconds)}`
    }
}

// src/camera/vendors/canon/canon-property-mapper.ts
export class CanonPropertyMapper implements PropertyMapperInterface {
    private readonly vendorToGeneric = new Map<number, DeviceProperties>([
        [0xd101, DeviceProperties.APERTURE], // Canon Av
        [0xd102, DeviceProperties.SHUTTER_SPEED], // Canon Tv
        [0xd103, DeviceProperties.ISO], // Canon ISO
    ])

    // Canon-specific value conversions...
}
```

## Dependency Injection & Factory Pattern

### Native Factory Implementation

```typescript
// src/factories/transport.factory.ts
export class TransportFactory {
    async createUSBTransport(options?: USBTransportOptions): Promise<TransportInterface> {
        const deviceFinder = new USBDeviceFinder()
        const endpointManager = new USBEndpointManager()
        return new USBTransport(deviceFinder, endpointManager, options)
    }

    async createIPTransport(options: IPTransportOptions): Promise<TransportInterface> {
        const networkClient = new NetworkClient(options)
        return new IPTransport(networkClient)
    }

    async create(type: 'usb' | 'ip', options?: any): Promise<TransportInterface> {
        switch (type) {
            case 'usb':
                return this.createUSBTransport(options)
            case 'ip':
                return this.createIPTransport(options)
            default:
                throw new Error(`Unknown transport type: ${type}`)
        }
    }
}

// src/factories/camera.factory.ts
export class CameraFactory {
    constructor(private readonly transportFactory: TransportFactory = new TransportFactory()) {}

    async createSonyCamera(transport: TransportInterface): Promise<CameraInterface> {
        const messageBuilder = new PTPMessageBuilder()
        const protocol = new PTPProtocol(transport, messageBuilder)
        const authenticator = new SonyAuthenticator()
        return new SonyCamera(protocol, authenticator)
    }

    async createCanonCamera(transport: TransportInterface): Promise<CameraInterface> {
        const messageBuilder = new PTPMessageBuilder()
        const protocol = new PTPProtocol(transport, messageBuilder)
        return new CanonCamera(protocol)
    }

    async createGenericCamera(transport: TransportInterface): Promise<CameraInterface> {
        const messageBuilder = new PTPMessageBuilder()
        const protocol = new PTPProtocol(transport, messageBuilder)
        const propertyMapper = new GenericPropertyMapper()
        return new GenericPTPCamera(protocol, propertyMapper)
    }

    async create(vendor: string, transport: TransportInterface): Promise<CameraInterface> {
        switch (vendor.toLowerCase()) {
            case 'sony':
                return this.createSonyCamera(transport)
            case 'canon':
                return this.createCanonCamera(transport)
            default:
                return this.createGenericCamera(transport)
        }
    }
}

// src/factories/application.factory.ts
export class ApplicationFactory {
    private readonly transportFactory: TransportFactory
    private readonly cameraFactory: CameraFactory

    constructor() {
        this.transportFactory = new TransportFactory()
        this.cameraFactory = new CameraFactory(this.transportFactory)
    }

    createCameraManager(): CameraManager {
        return new CameraManager(this.cameraFactory, this.transportFactory)
    }

    // Factory method for creating configured camera instances
    async createCamera(options: CameraOptions): Promise<Camera> {
        const transport = await this.transportFactory.create(options.transportType, options.transportOptions)
        const cameraImpl = await this.cameraFactory.create(options.vendor || 'generic', transport)

        await transport.connect({
            vendorId: options.vendorId,
            productId: options.productId,
        })

        await cameraImpl.connect()

        return new Camera(cameraImpl, new EventEmitter())
    }
}

// Usage example without DI container
// src/index.ts
export { ApplicationFactory } from './factories/application.factory'
export { TransportFactory } from './factories/transport.factory'
export { CameraFactory } from './factories/camera.factory'

// User code - Simple usage
import { ApplicationFactory } from '@jpglab/ptp'

const factory = new ApplicationFactory()
const camera = await factory.createCamera({
    vendor: 'sony',
    transportType: 'usb',
    vendorId: 0x054c,
    productId: 0x096f,
})
```

## Migration Plan

### Phase 1: Create Interfaces

- [ ] Define all interfaces for each layer
- [ ] Create type definitions for vendor-agnostic properties
- [ ] Set up dependency injection container
- [ ] Write interface documentation

### Phase 2: Refactor Transport Layer

- [ ] Extract `TransportInterface` from `USBTransport`
- [ ] Create `USBTransport` implementing interface
- [ ] Add transport factory

### Phase 3: Refactor Core Layer

- [ ] Extract `ProtocolInterface` from `PTPClient`
- [ ] Create `PTPProtocol` class with injected transport
- [ ] Separate message building from protocol logic
- [ ] Add comprehensive protocol tests

### Phase 4: Build Camera Layer

- [ ] Create `GenericPTPCamera` implementation
- [ ] Implement `SonyPropertyMapper`
- [ ] Refactor `SonyCamera` to extend `GenericPTPCamera`
- [ ] Add property mapping tests

### Phase 5: Create Application Layer

- [ ] Build `CameraManager` with factory pattern
- [ ] Create high-level `Camera` API
- [ ] Add event system for notifications
- [ ] Write integration tests

### Phase 6: Migration & Testing

- [ ] Update all examples to use new architecture
- [ ] Migrate existing tests
- [ ] Add end-to-end tests
- [ ] Update documentation

## Testing at Each Phase

### Phase 2 Tests

```typescript
// Test transport connection/disconnection
// Test data send/receive
// Test error handling and recovery
```

### Phase 3 Tests

```typescript
// Test protocol operations
// Test message building/parsing
// Test session management
```

### Phase 4 Tests

```typescript
// Test property mapping for each vendor
// Test value conversions
// Test vendor-specific operations
```

### Phase 5 Tests

```typescript
// Test high-level API operations
// Test camera discovery
// Test event notifications
```

### Phase 6 Tests

```typescript
// Full integration tests with real cameras
// Performance benchmarks
// Backward compatibility tests
```

## File Structure After Refactoring

```
src/
├── application/
│   ├── camera.ts
│   ├── camera-manager.ts
│   └── models/
│       ├── photo.ts
│       └── frame.ts
├── camera/
│   ├── interfaces/
│   │   ├── camera.interface.ts
│   │   └── property-mapper.interface.ts
│   ├── generic/
│   │   └── generic-ptp-camera.ts
│   ├── properties/
│   │   ├── device-properties.ts
│   │   ├── property-metadata.ts
│   │   └── property-unit.ts
│   └── vendors/
│       ├── sony/
│       │   ├── sony-camera.ts
│       │   ├── sony-property-mapper.ts
│       │   └── sony-authenticator.ts
│       └── canon/
│           ├── canon-camera.ts
│           └── canon-property-mapper.ts
├── core/
│   ├── interfaces/
│   │   ├── protocol.interface.ts
│   │   └── message-builder.interface.ts
│   ├── ptp/
│   │   ├── ptp-protocol.ts
│   │   ├── ptp-message-builder.ts
│   │   └── ptp-constants.ts
│   └── utilities/
│       └── data-converter.ts
├── factories/
│   ├── application.factory.ts
│   ├── camera.factory.ts
│   └── transport.factory.ts
├── transport/
│   ├── interfaces/
│   │   ├── transport.interface.ts
│   │   └── device-identifier.interface.ts
│   ├── usb/
│   │   ├── usb.transport.ts
│   │   ├── usb-device-finder.ts
│   │   └── usb-endpoint-manager.ts
│   └── ip/
│       └── ip.transport.ts
└── index.ts
```

## Success Criteria

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Testability**: All components can be tested in isolation
3. **Extensibility**: New vendors/transports can be added without modifying existing code
4. **Type Safety**: Full TypeScript type coverage with no `any` types
5. **Documentation**: Every public API is documented with JSDoc
6. **Performance**: No regression in operation speed
7. **Backwards Compatibility**: Existing code continues to work with adapters
