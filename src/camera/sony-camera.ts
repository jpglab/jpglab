import { Logger } from '@core/logger'
import { ObjectInfo } from '@ptp/datasets/object-info-dataset'
import { parseLiveViewDataset } from '@ptp/datasets/vendors/sony/sony-live-view-dataset'
import { VendorIDs } from '@ptp/definitions/vendor-ids'
import { createSonyRegistry, type SonyRegistry } from '@ptp/registry'
import type { CodecType } from '@ptp/types/codec'
import type { EventData } from '@ptp/types/event'
import type { PropertyDefinition } from '@ptp/types/property'
import { DeviceDescriptor } from '@transport/interfaces/device.interface'
import { PTPEvent, TransportInterface } from '@transport/interfaces/transport.interface'
import { GenericCamera } from './generic-camera'

const SDIO_AUTH_PROTOCOL_VERSION = 0x012c
const SDIO_AUTH_DEVICE_PROPERTY_OPTION = 0x01
const SDIO_AUTH_KEY_CODE_1 = 0x00000000
const SDIO_AUTH_KEY_CODE_2 = 0x00000000

const SDIO_AUTH_PHASES = {
    PHASE_1: 0x01,
    PHASE_2: 0x02,
    PHASE_3: 0x03,
} as const

const SONY_CAPTURED_IMAGE_OBJECT_HANDLE = 0xffffc001
const SONY_LIVE_VIEW_OBJECT_HANDLE = 0xffffc002

export class SonyCamera extends GenericCamera {
    private liveViewEnabled = false
    vendorId = VendorIDs.SONY
    declare protected registry: SonyRegistry

    constructor(transport: TransportInterface, logger: Logger) {
        super(transport, logger)
        this.registry = createSonyRegistry(transport.isLittleEndian())
    }

    async connect(deviceIdentifier?: DeviceDescriptor): Promise<void> {
        if (!this.transport.isConnected()) {
            await this.transport.connect({ ...deviceIdentifier, vendorId: this.vendorId })
        }

        this.sessionId = Math.floor(Math.random() * 0xffffffff)

        const openResult = await this.send(this.registry.operations.SDIO_OpenSession, {
            SessionId: this.sessionId,
            FunctionMode: 'REMOTE_AND_CONTENT_TRANSFER',
        })

        if (openResult.code === 0x201e) {
            await this.send(this.registry.operations.CloseSession, {})
            await this.send(this.registry.operations.SDIO_OpenSession, {
                SessionId: this.sessionId,
                FunctionMode: 'REMOTE_AND_CONTENT_TRANSFER',
            })
        }

        // Small delay required before authentication to avoid Sony firmware issues
        await new Promise(resolve => setTimeout(resolve, 100))

        await this.authenticate()

        await this.set(this.registry.properties.PositionKeySetting, 'HOST_PRIORITY')
        await this.set(this.registry.properties.StillImageSaveDestination, 'CAMERA_DEVICE')
    }

    private async authenticate(): Promise<void> {
        await this.send(this.registry.operations.SDIO_Connect, {
            phaseType: SDIO_AUTH_PHASES.PHASE_1,
            keyCode1: SDIO_AUTH_KEY_CODE_1,
            keyCode2: SDIO_AUTH_KEY_CODE_2,
        })

        await this.send(this.registry.operations.SDIO_Connect, {
            phaseType: SDIO_AUTH_PHASES.PHASE_2,
            keyCode1: SDIO_AUTH_KEY_CODE_1,
            keyCode2: SDIO_AUTH_KEY_CODE_2,
        })

        await this.send(this.registry.operations.SDIO_GetExtDeviceInfo, {
            initiatorVersion: SDIO_AUTH_PROTOCOL_VERSION,
            flagOfDevicePropertyOption: 'ENABLE',
        })

        await this.send(this.registry.operations.SDIO_Connect, {
            phaseType: SDIO_AUTH_PHASES.PHASE_3,
            keyCode1: SDIO_AUTH_KEY_CODE_1,
            keyCode2: SDIO_AUTH_KEY_CODE_2,
        })
    }

    async get<P extends PropertyDefinition>(property: P): Promise<CodecType<P['codec']>> {
        if (!property.access.includes('Get')) {
            throw new Error(`Property ${property.name} is not readable`)
        }

        const response = await this.send(this.registry.operations.SDIO_GetExtDevicePropValue, {
            DevicePropCode: property.code,
        })

        if (!response.data) {
            throw new Error(
                `No data received from SDIO_GetExtDevicePropValue for ${property.name} (response code: 0x${response.code.toString(16)})`
            )
        }

        const propInfo = response.data
        return propInfo.currentValueDecoded as CodecType<P['codec']>
    }

    async set<P extends PropertyDefinition>(property: P, value: CodecType<P['codec']>): Promise<void> {
        if (!property.access.includes('Set')) {
            throw new Error(`Property ${property.name} is not writable`)
        }

        const isControlProperty =
            /ShutterReleaseButton|ShutterHalfReleaseButton|SetLiveViewEnable|MovieRecButton/i.test(property.name)

        const codec = this.resolveCodec(property.codec)
        const encodedValue = codec.encode(value)

        if (isControlProperty) {
            await this.send(
                this.registry.operations.SDIO_ControlDevice,
                {
                    sdiControlCode: property.code,
                    flagOfDevicePropertyOption: 'ENABLE',
                },
                encodedValue
            )
        } else {
            await this.send(
                this.registry.operations.SDIO_SetExtDevicePropValue,
                {
                    DevicePropCode: property.code,
                    flagOfDevicePropertyOption: 'ENABLE',
                },
                encodedValue
            )
        }
    }

    on(eventName: string, handler: (event: EventData) => void): void {
        this.emitter.on(eventName, handler)
    }

    off(eventName: string, handler?: (event: EventData) => void): void {
        if (handler) {
            this.emitter.off(eventName, handler)
        } else {
            this.emitter.removeAllListeners(eventName)
        }
    }

    async startRecording(): Promise<void> {
        await this.set(this.registry.properties.MovieRecButton, 'DOWN')
    }

    async stopRecording(): Promise<void> {
        await this.set(this.registry.properties.MovieRecButton, 'UP')
    }

    async captureImage(): Promise<{ info: ObjectInfo; data: Uint8Array } | null> {
        await this.set(this.registry.properties.ShutterHalfReleaseButton, 'DOWN')
        await new Promise(resolve => setTimeout(resolve, 500))

        await this.set(this.registry.properties.ShutterReleaseButton, 'DOWN')
        await this.set(this.registry.properties.ShutterReleaseButton, 'UP')
        await this.set(this.registry.properties.ShutterHalfReleaseButton, 'UP')

        await new Promise(resolve => setTimeout(resolve, 500))

        const objectInfoResponse = await this.send(this.registry.operations.GetObjectInfo, {
            ObjectHandle: SONY_CAPTURED_IMAGE_OBJECT_HANDLE,
        })

        if (!objectInfoResponse.data) {
            return null
        }

        const objectInfo = objectInfoResponse.data
        const objectCompressedSize = objectInfo.objectCompressedSize

        const objectResponse = await this.send(
            this.registry.operations.GetObject,
            {
                ObjectHandle: SONY_CAPTURED_IMAGE_OBJECT_HANDLE,
            },
            undefined,
            objectCompressedSize + 10 * 1024 * 1024
        )

        if (!objectResponse.data) {
            return null
        }

        return {
            info: objectInfo,
            data: objectResponse.data,
        }
    }

    async captureLiveView(): Promise<Uint8Array> {
        if (!this.liveViewEnabled) {
            await this.set(this.registry.properties.SetLiveViewEnable, 'ENABLE')
            this.liveViewEnabled = true
        }

        const objectResponse = await this.send(this.registry.operations.GetObject, {
            ObjectHandle: SONY_LIVE_VIEW_OBJECT_HANDLE,
        })

        if (!objectResponse.data) {
            return new Uint8Array()
        }

        const liveViewData = parseLiveViewDataset(objectResponse.data, this.registry)

        return liveViewData.liveViewImage || new Uint8Array()
    }

    protected handleEvent(event: PTPEvent): void {
        const eventDef = Object.values(this.registry.events).find(e => e.code === event.code)
        if (!eventDef) return

        this.emitter.emit(eventDef.name, event.parameters)
    }

    async getAperture(): Promise<string> {
        return this.get(this.registry.properties.Aperture)
    }

    async setAperture(value: string): Promise<void> {
        return this.set(this.registry.properties.Aperture, value)
    }

    async getShutterSpeed(): Promise<string> {
        return this.get(this.registry.properties.ShutterSpeed)
    }

    async setShutterSpeed(value: string): Promise<void> {
        return this.set(this.registry.properties.ShutterSpeed, value)
    }

    async getIso(): Promise<string> {
        return this.get(this.registry.properties.Iso)
    }

    async setIso(value: string): Promise<void> {
        return this.set(this.registry.properties.Iso, value)
    }
}
