import { CustomCodec, ArrayCodec, baseCodecs } from '@ptp/types/codec'

// Lazy-loaded registries to avoid circular dependency
let _operationRegistry: any = null
let _propertyRegistry: any = null
let _eventRegistry: any = null
let _formatRegistry: any = null

function getOperationRegistry() {
    if (!_operationRegistry) {
        const { genericOperationRegistry } = require('@ptp/definitions/operation-definitions')
        const { sonyOperationRegistry } = require('@ptp/definitions/vendors/sony/sony-operation-definitions')
        const { nikonOperationRegistry } = require('@ptp/definitions/vendors/nikon/nikon-operation-definitions')
        _operationRegistry = [...Object.values(genericOperationRegistry), ...Object.values(sonyOperationRegistry), ...Object.values(nikonOperationRegistry)]
    }
    return _operationRegistry
}

function getPropertyRegistry() {
    if (!_propertyRegistry) {
        const { genericPropertyRegistry } = require('@ptp/definitions/property-definitions')
        _propertyRegistry = Object.values(genericPropertyRegistry)
    }
    return _propertyRegistry
}

function getEventRegistry() {
    if (!_eventRegistry) {
        const { genericEventRegistry } = require('@ptp/definitions/event-definitions')
        const { sonyEventRegistry } = require('@ptp/definitions/vendors/sony/sony-event-definitions')
        _eventRegistry = [...Object.values(genericEventRegistry), ...Object.values(sonyEventRegistry)]
    }
    return _eventRegistry
}

function getFormatRegistry() {
    if (!_formatRegistry) {
        const { formatRegistry } = require('@ptp/definitions/format-definitions')
        const { sonyFormatRegistry } = require('@ptp/definitions/vendors/sony/sony-format-definitions')
        _formatRegistry = [...Object.values(formatRegistry), ...Object.values(sonyFormatRegistry)]
    }
    return _formatRegistry
}

export interface DeviceInfo {
    standardVersion: number
    vendorExtensionID: number
    vendorExtensionVersion: number
    vendorExtensionDesc: string
    functionalMode: number
    operationsSupportedRaw: number[]
    operationsSupportedDecoded: string[]
    eventsSupportedRaw: number[]
    eventsSupportedDecoded: string[]
    devicePropertiesSupported: number[]
    devicePropertiesSupportedDecoded: string[]
    captureFormats: number[]
    imageFormatsRaw: number[]
    imageFormatsDecoded: string[]
    manufacturer: string
    model: string
    deviceVersion: string
    serialNumber: string
}

export class DeviceInfoCodec extends CustomCodec<DeviceInfo> {
    encode(value: DeviceInfo): Uint8Array {
        const u16 = this.baseCodecs.uint16
        const u32 = this.baseCodecs.uint32
        const str = this.baseCodecs.string

        const arrU16 = new ArrayCodec(this.baseCodecs, this.baseCodecs.uint16)

        const buffers: Uint8Array[] = []

        buffers.push(u16.encode(value.standardVersion))
        buffers.push(u32.encode(value.vendorExtensionID))
        buffers.push(u16.encode(value.vendorExtensionVersion))
        buffers.push(str.encode(value.vendorExtensionDesc))
        buffers.push(u16.encode(value.functionalMode))
        buffers.push(arrU16.encode(value.operationsSupportedRaw))
        buffers.push(arrU16.encode(value.eventsSupportedRaw))
        buffers.push(arrU16.encode(value.devicePropertiesSupported))
        buffers.push(arrU16.encode(value.captureFormats))
        buffers.push(arrU16.encode(value.imageFormatsRaw))
        buffers.push(str.encode(value.manufacturer))
        buffers.push(str.encode(value.model))
        buffers.push(str.encode(value.deviceVersion))
        buffers.push(str.encode(value.serialNumber))

        const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0)
        const result = new Uint8Array(totalLength)
        let offset = 0
        for (const buffer of buffers) {
            result.set(buffer, offset)
            offset += buffer.length
        }

        return result
    }

    decode(buffer: Uint8Array, offset = 0): { value: DeviceInfo; bytesRead: number } {
        const u16 = this.baseCodecs.uint16
        const u32 = this.baseCodecs.uint32
        const str = this.baseCodecs.string

        const arrU16 = new ArrayCodec(this.baseCodecs, this.baseCodecs.uint16)

        let currentOffset = offset

        const standardVersion = u16.decode(buffer, currentOffset)
        currentOffset += standardVersion.bytesRead

        const vendorExtensionID = u32.decode(buffer, currentOffset)
        currentOffset += vendorExtensionID.bytesRead

        const vendorExtensionVersion = u16.decode(buffer, currentOffset)
        currentOffset += vendorExtensionVersion.bytesRead

        const vendorExtensionDesc = str.decode(buffer, currentOffset)
        currentOffset += vendorExtensionDesc.bytesRead

        const functionalMode = u16.decode(buffer, currentOffset)
        currentOffset += functionalMode.bytesRead

        const operationsSupported = arrU16.decode(buffer, currentOffset)
        currentOffset += operationsSupported.bytesRead

        const eventsSupported = arrU16.decode(buffer, currentOffset)
        currentOffset += eventsSupported.bytesRead

        const devicePropertiesSupported = arrU16.decode(buffer, currentOffset)
        currentOffset += devicePropertiesSupported.bytesRead

        const captureFormats = arrU16.decode(buffer, currentOffset)
        currentOffset += captureFormats.bytesRead

        const imageFormats = arrU16.decode(buffer, currentOffset)
        currentOffset += imageFormats.bytesRead

        const manufacturer = str.decode(buffer, currentOffset)
        currentOffset += manufacturer.bytesRead

        const model = str.decode(buffer, currentOffset)
        currentOffset += model.bytesRead

        const deviceVersion = str.decode(buffer, currentOffset)
        currentOffset += deviceVersion.bytesRead

        const serialNumber = str.decode(buffer, currentOffset)
        currentOffset += serialNumber.bytesRead

        // Decode operation codes to names (lazy-loaded)
        const allOperations = getOperationRegistry()
        const operationsSupportedDecoded = operationsSupported.value.map(code => {
            const op = allOperations.find((o: any) => o.code === code)
            return op?.name || `Unknown_0x${code.toString(16)}`
        })

        // Decode property codes to names (lazy-loaded)
        const propertyDefinitions = getPropertyRegistry()
        const devicePropertiesSupportedDecoded = devicePropertiesSupported.value.map(code => {
            const prop = propertyDefinitions.find((p: any) => p.code === code)
            return prop?.name || `Unknown_0x${code.toString(16)}`
        })

        // Decode event codes to names (lazy-loaded)
        const allEvents = getEventRegistry()
        const eventsSupportedDecoded = eventsSupported.value.map(code => {
            const evt = allEvents.find((e: any) => e.code === code)
            return evt?.name || `Unknown_0x${code.toString(16)}`
        })

        // Decode image format codes to names (lazy-loaded)
        const allFormats = getFormatRegistry()
        const imageFormatsDecoded = imageFormats.value.map(code => {
            const fmt = allFormats.find((f: any) => f.code === code)
            return fmt?.name || `Unknown_0x${code.toString(16)}`
        })

        return {
            value: {
                standardVersion: standardVersion.value,
                vendorExtensionID: vendorExtensionID.value,
                vendorExtensionVersion: vendorExtensionVersion.value,
                vendorExtensionDesc: vendorExtensionDesc.value,
                functionalMode: functionalMode.value,
                operationsSupportedRaw: operationsSupported.value,
                operationsSupportedDecoded,
                eventsSupportedRaw: eventsSupported.value,
                eventsSupportedDecoded,
                devicePropertiesSupported: devicePropertiesSupported.value,
                devicePropertiesSupportedDecoded,
                captureFormats: captureFormats.value,
                imageFormatsRaw: imageFormats.value,
                imageFormatsDecoded,
                manufacturer: manufacturer.value,
                model: model.value,
                deviceVersion: deviceVersion.value,
                serialNumber: serialNumber.value,
            },
            bytesRead: currentOffset - offset,
        }
    }
}

