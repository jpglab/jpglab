/**
 * NikonCamera - Approach 6 Implementation
 *
 * Extends GenericCamera with Nikon-specific vendor extensions.
 * Accepts definition objects instead of strings with merged generic + Nikon registries.
 */

import { EventEmitter } from '@ptp/types/event'
import type { EventData } from '@ptp/types/event'
import { genericOperationRegistry, type GenericOperationDef } from '@ptp/definitions/operation-definitions'
import { genericPropertyRegistry, type GenericPropertyDef } from '@ptp/definitions/property-definitions'
import { genericEventRegistry, type GenericEventDef } from '@ptp/definitions/event-definitions'
import {
    nikonOperationRegistry,
    type NikonOperationDef,
} from '@ptp/definitions/vendors/nikon/nikon-operation-definitions'
import { responseRegistry } from '@ptp/definitions/response-definitions'
import { formatRegistry } from '@ptp/definitions/format-definitions'
import type { CodecType, BaseCodecRegistry, CodecDefinition, CodecInstance } from '@ptp/types/codec'
import { baseCodecs, createBaseCodecs } from '@ptp/types/codec'
import { TransportInterface, PTPEvent } from '@transport/interfaces/transport.interface'
import { DeviceDescriptor } from '@transport/interfaces/device.interface'
import type { OperationDefinition } from '@ptp/types/operation'
import type { PropertyDefinition } from '@ptp/types/property'
import type { ParameterDefinition } from '@ptp/types/parameter'
import { Logger, PTPTransferLog } from '@core/logger'
import { VendorIDs } from '@ptp/definitions/vendor-ids'
import { GenericCamera } from './generic-camera'
import { OperationParams, OperationResponse } from '@ptp/types/type-helpers'

// ============================================================================
// Merge Nikon registries with generic registries
// ============================================================================

const mergedOperationRegistry = { ...genericOperationRegistry, ...nikonOperationRegistry } as const
const mergedPropertyRegistry = { ...genericPropertyRegistry } as const
const mergedEventRegistry = { ...genericEventRegistry } as const
const mergedFormatRegistry = { ...formatRegistry } as const
const mergedResponseRegistry = { ...responseRegistry } as const

type MergedOperationDef = (typeof mergedOperationRegistry)[keyof typeof mergedOperationRegistry]
type MergedPropertyDef = (typeof mergedPropertyRegistry)[keyof typeof mergedPropertyRegistry]
type MergedEventDef = (typeof mergedEventRegistry)[keyof typeof mergedEventRegistry]
type MergedFormatDef = (typeof mergedFormatRegistry)[keyof typeof mergedFormatRegistry]
type MergedResponseDef = (typeof mergedResponseRegistry)[keyof typeof mergedResponseRegistry]

// ============================================================================
// NikonCamera class
// ============================================================================

export class NikonCamera extends GenericCamera {
    vendorId = VendorIDs.NIKON

    constructor(transport: TransportInterface, logger: Logger) {
        super(transport, logger)
    }

    /**
     * Override get to use Nikon's GetDevicePropDescEx
     * Returns full property descriptor including current value, supported values, etc.
     */
    async get<P extends PropertyDefinition>(property: P): Promise<CodecType<P['codec']>> {
        if (!property.access.includes('Get')) {
            throw new Error(`Property ${property.name} is not readable`)
        }

        // Use GetDevicePropDescEx to get full descriptor including current value
        const response = await this.send(mergedOperationRegistry.GetDevicePropDescEx, {
            DevicePropCode: property.code,
        })

        if (!response.data) {
            throw new Error('No data received from GetDevicePropDescEx')
        }

        // The response contains a full property descriptor
        // Extract current value from descriptor (already decoded by DevicePropDescCodec)
        const descriptor = response.data

        // Type guard to ensure descriptor has currentValueDecoded
        if (!descriptor || typeof descriptor !== 'object' || !('currentValueDecoded' in descriptor)) {
            throw new Error('Invalid property descriptor structure')
        }

        // Cast needed: TypeScript knows data exists but can't narrow to specific property's codec type
        return descriptor.currentValueDecoded as CodecType<P['codec']>
    }

    /**
     * Override set to use Nikon's SetDevicePropValueEx
     */
    async set<P extends PropertyDefinition>(property: P, value: CodecType<P['codec']>): Promise<void> {
        if (!property.access.includes('Set')) {
            throw new Error(`Property ${property.name} is not writable`)
        }

        const codec = this.resolveCodec(property.codec)
        const encodedValue = codec.encode(value)

        await this.send(
            mergedOperationRegistry.SetDevicePropValueEx,
            {
                DevicePropCode: property.code,
            },
            encodedValue
        )
    }

    /**
     * Override on() to accept Nikon events (currently same as generic)
     */
    on(eventName: string, handler: (event: EventData) => void): void {
        this.emitter.on(eventName, handler)
    }

    /**
     * Override off() to accept Nikon events (currently same as generic)
     */
    off(eventName: string, handler?: (event: EventData) => void): void {
        if (handler) {
            this.emitter.off(eventName, handler)
        } else {
            this.emitter.removeAllListeners(eventName)
        }
    }

    /**
     * Handle incoming PTP events from transport (Nikon-specific)
     */
    protected handleEvent(event: PTPEvent): void {
        // Look up event definition by code in merged registry
        const eventDef = Object.values(mergedEventRegistry).find(e => e.code === event.code)
        if (!eventDef) return

        // Emit event parameters as array
        this.emitter.emit(eventDef.name, event.parameters)
    }
}
