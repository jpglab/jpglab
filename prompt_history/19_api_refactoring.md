# API Refactoring - Architecture Improvements

## Date: 2025-01-16

## Overview

Major refactoring to create a clean, abstracted PTP API architecture that hides transport and vendor-specific details from users.

## Requirements

The goal was to create a simple, expressive API where users only interact with a `Camera` class:

```typescript
import { listCameras, Camera, CameraProperty } from '@jpglab/ptp/node'

const cameras = await listCameras()
const myCamera = cameras[0]

await myCamera.connect()
await myCamera.getDeviceProperty(CameraProperty.APERTURE)
await myCamera.capture('./photos')
await myCamera.disconnect()
```

## Architecture Changes

### 1. Base Classes Created

- **BaseTransport** (`src/transport/base-transport.ts`) - Abstract class for all transport implementations
- **BaseCamera** (`src/core/base-camera.ts`) - Abstract class replacing PTPClient with standardized methods

### 2. Inheritance Hierarchy

- **Camera extends BaseCamera** - Main user-facing class inherits from BaseCamera
- **SonyCamera extends BaseCamera** - Vendor implementations inherit from BaseCamera
- **USBTransport extends BaseTransport** - Transport implementations inherit from BaseTransport

### 3. New Components

- **Transport** (`src/transport/transport.ts`) - Factory class for creating transports
- **Camera** (`src/core/camera.ts`) - High-level abstraction hiding vendor details
- **CameraProperty** (`src/types/camera-property.ts`) - Standardized property enum
- **Camera Discovery** (`src/discovery/camera-discovery.ts`) - Discovery functions

### 4. API Design Decisions

#### Using getDeviceProperty/setDeviceProperty

Instead of generic `get()` and `set()` methods, we use the more explicit `getDeviceProperty()` and `setDeviceProperty()` to be clear about what these methods do - they interact with device properties via PTP protocol.

```typescript
// Clear and explicit
await camera.getDeviceProperty(CameraProperty.ISO)
await camera.setDeviceProperty(CameraProperty.ISO, 'ISO 400')
```

#### Camera extends BaseCamera

The Camera class extends BaseCamera rather than just composing it, providing a cleaner inheritance model and allowing Camera to override base methods when needed while delegating to vendor implementations.

## File Structure

```
src/
├── core/
│   ├── base-camera.ts       # Abstract base for all cameras
│   └── camera.ts            # Main user-facing camera class
├── transport/
│   ├── base-transport.ts    # Abstract base for transports
│   ├── usb-transport.ts     # USB implementation
│   └── transport.ts         # Transport factory
├── vendors/
│   └── sony/
│       └── sony-camera.ts   # Sony-specific implementation
├── discovery/
│   └── camera-discovery.ts  # Camera discovery functions
└── types/
    └── camera-property.ts   # Property definitions
```

## Key Features

### Vendor Abstraction

Users don't need to know about vendor-specific implementations. The Camera class automatically selects the right vendor implementation based on the discovered device.

### Transport Abstraction

Transport selection is automatic. Users can specify 'usb' or 'auto', and the system handles the rest.

### Property Mapping

Standardized properties (ISO, SHUTTER_SPEED, APERTURE) are mapped to vendor-specific property codes internally.

### Type Safety

Full TypeScript support with proper types throughout the API.

## Preserved Functionality

All existing Sony camera functionality remains intact:

- Photo capture with `takePhoto()`
- Live view with `getLiveViewImage()`
- OSD images with `getOSDImage()`
- Camera settings retrieval with `getCameraSettings()`
- Authentication handshake

## TODO Items (Stubs Created)

The following methods have TODO stubs for future implementation:

- `setDeviceProperty()` - Setting camera properties
- `startRecording()` / `stopRecording()` - Video recording
- `listFiles()` / `transferFiles()` - File operations

## Testing

- TypeScript compilation passes without errors
- Test script created at `scripts/test-refactored-api.ts`
- Run with: `npm run camera:test`

## Example Usage

```typescript
// Discovery
const cameras = await listCameras()

// Connection
const myCamera = cameras[0]
await myCamera.connect()

// Get all properties
const all = await myCamera.getAll()

// Get specific property
const iso = await myCamera.getDeviceProperty(CameraProperty.ISO)
console.log(`ISO: ${iso.current}, Available: ${iso.available}`)

// Capture
await myCamera.capture('./photos')

// Live view
const liveView = await myCamera.getLiveView('./live')

// Disconnect
await myCamera.disconnect()
```

## Next Steps

1. Implement `setDeviceProperty()` for Sony cameras
2. Add support for more vendors (Canon, Nikon, etc.)
3. Implement WiFi transport
4. Add video recording support
5. Implement file transfer operations
