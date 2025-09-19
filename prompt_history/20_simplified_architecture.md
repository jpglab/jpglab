# Simplified Architecture Using Composition

## Date: 2025-01-16

## Research Summary

After researching TypeScript patterns and best practices, I discovered that:

1. **Factory Pattern**: While useful, it adds complexity through abstract classes and factory classes
2. **Composition over Inheritance**: Modern TypeScript favors composition for flexibility and simpler testing
3. **Discriminated Unions**: TypeScript's type system provides powerful alternatives to class hierarchies
4. **Protocol-Oriented Programming**: Define behaviors through interfaces, not inheritance

## Current Architecture Problems

### Complex Inheritance Hierarchy

```
BaseTransport (abstract)
  └── USBTransport

BaseCamera (abstract)
  └── Camera (extends BaseCamera)
      └── Contains SonyCamera (which also extends BaseCamera!)
```

This creates:

- Redundant abstraction (Camera extends AND contains BaseCamera implementations)
- Tight coupling between classes
- Difficult testing (need to mock entire class hierarchies)
- Confusing ownership (Camera is both a BaseCamera AND contains a BaseCamera)

## Simplified Architecture Proposal

### Core Principles

1. **Interfaces over Abstract Classes**: Define contracts, not implementations
2. **Composition over Inheritance**: Combine behaviors, don't inherit them
3. **Plain Objects over Classes**: Vendor behaviors as composable objects
4. **Functions over Factory Classes**: Simple functions instead of factory classes

### New Structure

```typescript
// Transport: Interface, not abstract class
interface Transport {
    connect(): Promise<void>
    send(): Promise<any>
    // ...
}

// Camera: Single class using composition
class Camera {
    constructor(
        private transport: Transport, // Composed
        private vendor: VendorBehavior // Composed
    ) {}
}

// Vendor behaviors: Plain objects, not classes
const sonyBehavior: VendorBehavior = {
    authenticate: async transport => {
        /* Sony auth */
    },
    mapPropertyName: prop => {
        /* Sony mapping */
    },
}
```

## Key Improvements

### 1. Transport Simplification

**Before**: BaseTransport → USBTransport → Transport factory class

**After**:

```typescript
interface Transport {
    /* methods */
}
class USBTransport implements Transport {
    /* implementation */
}
function createTransport(type): Transport {
    /* simple switch */
}
```

### 2. Camera Simplification

**Before**: BaseCamera → Camera → SonyCamera (3 levels!)

**After**:

```typescript
class Camera {
    constructor(transport: Transport, vendor: VendorBehavior) {}
}
```

### 3. Vendor Behaviors as Objects

**Before**: SonyCamera extends BaseCamera (inheritance)

**After**:

```typescript
const sonyBehavior = {
    authenticate: async () => {},
    parseProperties: () => {},
    mapPropertyName: () => {},
}
```

### 4. Discriminated Unions for Type Safety

```typescript
type KnownDevice =
    | { vendorId: 0x054c; vendor: 'Sony'; model: 'ILCE-6700' }
    | { vendorId: 0x04a9; vendor: 'Canon'; model: 'EOS R5' }
```

## Benefits

1. **Reduced Complexity**: Single Camera class instead of 3-level hierarchy
2. **Better Flexibility**: Mix and match behaviors through composition
3. **Easier Testing**: Mock individual behaviors, not entire classes
4. **Clearer Separation**: Transport and vendor logic clearly separated
5. **Less Boilerplate**: No abstract classes or factory classes needed
6. **Better Type Inference**: TypeScript can better infer types with simpler structures

## Usage Comparison

### Current (Complex)

```typescript
const transport = Transport.create('usb') // Factory class
const camera = new Camera(info, 'usb') // Complex internals
```

### Simplified

```typescript
const transport = createTransport('usb') // Simple function
const camera = new Camera(transport, sonyBehavior) // Clear composition
```

## Builder Pattern Option

For flexibility, we can also use a builder pattern:

```typescript
const camera = new CameraBuilder().withTransport(usbTransport).withVendor(sonyBehavior).withInfo(cameraInfo).build()
```

## Files Created

1. `src/simplified/README.md` - Architecture overview
2. `src/simplified/camera-simplified.ts` - Simplified Camera implementation
3. `src/simplified/vendor-behaviors.ts` - Vendor behaviors as objects
4. `src/simplified/discovery-simplified.ts` - Simplified discovery
5. `src/simplified/usage-example.ts` - Usage examples

## Migration Path

1. Keep existing API for backward compatibility
2. Internally refactor to use composition
3. Gradually deprecate inheritance-based classes
4. User-facing API remains the same

## Next Steps

Consider adopting this simplified architecture to:

- Reduce code complexity
- Improve maintainability
- Make testing easier
- Better leverage TypeScript's type system

The simplified approach provides the same functionality with less boilerplate and clearer separation of concerns.
