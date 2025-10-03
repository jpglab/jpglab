import { CodecDefinition, baseCodecs, CustomCodec } from '@ptp/types/codec'
import { DatatypeCode } from '@ptp/types/datatype'
import { getDatatypeByCode } from '@ptp/definitions/datatype-definitions'

export interface SDIExtDevicePropInfo {
    devicePropertyCode: number
    devicePropertyName: string
    devicePropertyDescription: string
    dataType: DatatypeCode
    writable: boolean
    enabled: boolean
    factoryDefaultValue: any
    currentValueRaw: any
    currentValueBytes: Uint8Array
    currentValueDecoded: any
    formFlag: number
    enumValuesSet: any[]
    enumValuesGetSet: any[]
}

export interface SDIDevicePropInfoArray {
    numOfElements: number
    properties: SDIExtDevicePropInfo[]
}

class VariableValueCodec extends CustomCodec<{ value: any; rawBytes: Uint8Array }> {
    readonly type = 'custom' as const

    constructor(private dataType: DatatypeCode) {
        super()
    }

    encode(value: { value: any; rawBytes: Uint8Array }): Uint8Array {
        return value.rawBytes
    }

    decode(buffer: Uint8Array, offset = 0): { value: { value: any; rawBytes: Uint8Array }; bytesRead: number } {
        const datatypeDefinition = getDatatypeByCode(this.dataType)
        if (!datatypeDefinition) {
            throw new Error(`Unknown datatype: 0x${this.dataType.toString(16)}`)
        }
        if (!datatypeDefinition.codec) {
            throw new Error(`Datatype ${this.dataType} has no codec`)
        }

        const codec = this.resolveBaseCodec(datatypeDefinition.codec)
        const result = codec.decode(buffer, offset)
        const rawBytes = buffer.slice(offset, offset + result.bytesRead)

        return {
            value: {
                value: result.value,
                rawBytes,
            },
            bytesRead: result.bytesRead,
        }
    }
}

export class SDIExtDevicePropInfoCodec extends CustomCodec<SDIExtDevicePropInfo> {
    readonly type = 'custom' as const

    encode(value: SDIExtDevicePropInfo): Uint8Array {
        throw new Error('Encoding SDIExtDevicePropInfo is not yet implemented')
    }

    decode(buffer: Uint8Array, offset = 0): { value: SDIExtDevicePropInfo; bytesRead: number } {
        let currentOffset = offset
        const view = new DataView(buffer.buffer, buffer.byteOffset)

        if (buffer.length < 6) {
            throw new Error(`Buffer too short: expected at least 6 bytes, got ${buffer.length}`)
        }

        const devicePropertyCode = view.getUint16(currentOffset, true)
        currentOffset += 2

        const dataType = view.getUint16(currentOffset, true) as DatatypeCode
        currentOffset += 2

        const getSet = view.getUint8(currentOffset)
        currentOffset += 1

        const isEnabled = view.getUint8(currentOffset)
        currentOffset += 1

        const valueCodec = new VariableValueCodec(dataType)
        valueCodec.baseCodecs = this.baseCodecs

        const factoryDefaultResult = valueCodec.decode(buffer, currentOffset)
        const factoryDefaultValue = factoryDefaultResult.value.value
        currentOffset += factoryDefaultResult.bytesRead

        const currentValueResult = valueCodec.decode(buffer, currentOffset)
        const currentValueRaw = currentValueResult.value.value
        const currentValueBytes = currentValueResult.value.rawBytes
        currentOffset += currentValueResult.bytesRead

        const formFlag = view.getUint8(currentOffset)
        currentOffset += 1

        let enumValuesSet: any[] = []
        let enumValuesGetSet: any[] = []

        if (formFlag === 0x02) {
            const numEnumSet = view.getUint16(currentOffset, true)
            currentOffset += 2

            for (let i = 0; i < numEnumSet; i++) {
                const enumValueResult = valueCodec.decode(buffer, currentOffset)
                enumValuesSet.push(enumValueResult.value.value)
                currentOffset += enumValueResult.bytesRead
            }

            const numEnumGetSet = view.getUint16(currentOffset, true)
            currentOffset += 2

            for (let i = 0; i < numEnumGetSet; i++) {
                const enumValueResult = valueCodec.decode(buffer, currentOffset)
                enumValuesGetSet.push(enumValueResult.value.value)
                currentOffset += enumValueResult.bytesRead
            }
        }

        let devicePropertyName = `Unknown_0x${devicePropertyCode.toString(16).padStart(4, '0')}`
        let devicePropertyDescription = ''

        return {
            value: {
                devicePropertyCode,
                devicePropertyName,
                devicePropertyDescription,
                dataType,
                writable: getSet === 0x01,
                enabled: isEnabled === 0x01 || isEnabled === 0x02,
                factoryDefaultValue,
                currentValueRaw,
                currentValueBytes,
                currentValueDecoded: currentValueRaw,
                formFlag,
                enumValuesSet,
                enumValuesGetSet,
            },
            bytesRead: currentOffset - offset,
        }
    }
}

export class SDIDevicePropInfoArrayCodec extends CustomCodec<SDIDevicePropInfoArray> {
    readonly type = 'custom' as const

    encode(value: SDIDevicePropInfoArray): Uint8Array {
        throw new Error('Encoding SDIDevicePropInfoArray is not yet implemented')
    }

    decode(buffer: Uint8Array, offset = 0): { value: SDIDevicePropInfoArray; bytesRead: number } {
        let currentOffset = offset
        const view = new DataView(buffer.buffer, buffer.byteOffset)

        const lowDword = view.getUint32(currentOffset, true)
        const highDword = view.getUint32(currentOffset + 4, true)
        const numOfElements = lowDword + highDword * 0x100000000
        currentOffset += 8

        const properties: SDIExtDevicePropInfo[] = []
        const propCodec = new SDIExtDevicePropInfoCodec()

        for (let i = 0; i < numOfElements; i++) {
            const propResult = propCodec.decode(buffer, currentOffset)
            properties.push(propResult.value)
            currentOffset += propResult.bytesRead
        }

        return {
            value: {
                numOfElements,
                properties,
            },
            bytesRead: currentOffset - offset,
        }
    }
}

export const sdiExtDevicePropInfoCodec = new SDIExtDevicePropInfoCodec()
export const sdiDevicePropInfoArrayCodec = new SDIDevicePropInfoArrayCodec()

export function parseSDIExtDevicePropInfo(data: Uint8Array, baseCodecs?: ReturnType<typeof import('@ptp/types/codec').createBaseCodecs>): SDIExtDevicePropInfo {
    const codec = new SDIExtDevicePropInfoCodec()
    if (baseCodecs) {
        codec.baseCodecs = baseCodecs
    }
    return codec.decode(data).value
}

export function parseSDIDevicePropInfoArray(data: Uint8Array, baseCodecs?: ReturnType<typeof import('@ptp/types/codec').createBaseCodecs>): SDIDevicePropInfoArray {
    const codec = new SDIDevicePropInfoArrayCodec()
    if (baseCodecs) {
        codec.baseCodecs = baseCodecs
    }
    return codec.decode(data).value
}
