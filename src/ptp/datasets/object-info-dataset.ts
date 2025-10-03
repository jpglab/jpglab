import { CustomCodec, baseCodecs } from '@ptp/types/codec'


export interface ObjectInfo {
    storageID: number
    objectFormat: number
    protectionStatus: number
    objectCompressedSize: number
    thumbFormat: number
    thumbCompressedSize: number
    thumbPixWidth: number
    thumbPixHeight: number
    imagePixWidth: number
    imagePixHeight: number
    imageBitDepth: number
    parentObject: number
    associationType: number
    associationDesc: number
    sequenceNumber: number
    filename: string
    captureDate: string
    modificationDate: string
    keywords: string
}

export class ObjectInfoCodec extends CustomCodec<ObjectInfo> {
    readonly type = 'custom' as const

    encode(value: ObjectInfo): Uint8Array {
        const u16 = this.resolveBaseCodec(baseCodecs.uint16)
        const u32 = this.resolveBaseCodec(baseCodecs.uint32)
        const str = this.resolveBaseCodec(baseCodecs.string)

        const buffers: Uint8Array[] = []

        buffers.push(u32.encode(value.storageID))
        buffers.push(u16.encode(value.objectFormat))
        buffers.push(u16.encode(value.protectionStatus))
        buffers.push(u32.encode(value.objectCompressedSize))
        buffers.push(u16.encode(value.thumbFormat))
        buffers.push(u32.encode(value.thumbCompressedSize))
        buffers.push(u32.encode(value.thumbPixWidth))
        buffers.push(u32.encode(value.thumbPixHeight))
        buffers.push(u32.encode(value.imagePixWidth))
        buffers.push(u32.encode(value.imagePixHeight))
        buffers.push(u32.encode(value.imageBitDepth))
        buffers.push(u32.encode(value.parentObject))
        buffers.push(u16.encode(value.associationType))
        buffers.push(u32.encode(value.associationDesc))
        buffers.push(u32.encode(value.sequenceNumber))
        buffers.push(str.encode(value.filename))
        buffers.push(str.encode(value.captureDate))
        buffers.push(str.encode(value.modificationDate))
        buffers.push(str.encode(value.keywords))

        const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0)
        const result = new Uint8Array(totalLength)
        let offset = 0
        for (const buffer of buffers) {
            result.set(buffer, offset)
            offset += buffer.length
        }

        return result
    }

    decode(buffer: Uint8Array, offset = 0): { value: ObjectInfo; bytesRead: number } {
        const u16 = this.resolveBaseCodec(baseCodecs.uint16)
        const u32 = this.resolveBaseCodec(baseCodecs.uint32)
        const str = this.resolveBaseCodec(baseCodecs.string)

        let currentOffset = offset

        const storageID = u32.decode(buffer, currentOffset)
        currentOffset += storageID.bytesRead

        const objectFormat = u16.decode(buffer, currentOffset)
        currentOffset += objectFormat.bytesRead

        const protectionStatus = u16.decode(buffer, currentOffset)
        currentOffset += protectionStatus.bytesRead

        const objectCompressedSize = u32.decode(buffer, currentOffset)
        currentOffset += objectCompressedSize.bytesRead

        const thumbFormat = u16.decode(buffer, currentOffset)
        currentOffset += thumbFormat.bytesRead

        const thumbCompressedSize = u32.decode(buffer, currentOffset)
        currentOffset += thumbCompressedSize.bytesRead

        const thumbPixWidth = u32.decode(buffer, currentOffset)
        currentOffset += thumbPixWidth.bytesRead

        const thumbPixHeight = u32.decode(buffer, currentOffset)
        currentOffset += thumbPixHeight.bytesRead

        const imagePixWidth = u32.decode(buffer, currentOffset)
        currentOffset += imagePixWidth.bytesRead

        const imagePixHeight = u32.decode(buffer, currentOffset)
        currentOffset += imagePixHeight.bytesRead

        const imageBitDepth = u32.decode(buffer, currentOffset)
        currentOffset += imageBitDepth.bytesRead

        const parentObject = u32.decode(buffer, currentOffset)
        currentOffset += parentObject.bytesRead

        const associationType = u16.decode(buffer, currentOffset)
        currentOffset += associationType.bytesRead

        const associationDesc = u32.decode(buffer, currentOffset)
        currentOffset += associationDesc.bytesRead

        const sequenceNumber = u32.decode(buffer, currentOffset)
        currentOffset += sequenceNumber.bytesRead

        const filename = str.decode(buffer, currentOffset)
        currentOffset += filename.bytesRead

        const captureDate = str.decode(buffer, currentOffset)
        currentOffset += captureDate.bytesRead

        const modificationDate = str.decode(buffer, currentOffset)
        currentOffset += modificationDate.bytesRead

        const keywords = str.decode(buffer, currentOffset)
        currentOffset += keywords.bytesRead

        return {
            value: {
                storageID: storageID.value,
                objectFormat: objectFormat.value,
                protectionStatus: protectionStatus.value,
                objectCompressedSize: objectCompressedSize.value,
                thumbFormat: thumbFormat.value,
                thumbCompressedSize: thumbCompressedSize.value,
                thumbPixWidth: thumbPixWidth.value,
                thumbPixHeight: thumbPixHeight.value,
                imagePixWidth: imagePixWidth.value,
                imagePixHeight: imagePixHeight.value,
                imageBitDepth: imageBitDepth.value,
                parentObject: parentObject.value,
                associationType: associationType.value,
                associationDesc: associationDesc.value,
                sequenceNumber: sequenceNumber.value,
                filename: filename.value,
                captureDate: captureDate.value,
                modificationDate: modificationDate.value,
                keywords: keywords.value,
            },
            bytesRead: currentOffset - offset,
        }
    }
}

export const objectInfoCodec = new ObjectInfoCodec()
