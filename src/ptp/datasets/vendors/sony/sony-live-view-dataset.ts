import { CustomCodec, baseCodecs } from '@ptp/types/codec'

export interface FocalFrameInfo {
    data: Uint8Array
}

export interface LiveViewDataset {
    offsetToLiveViewImage: number
    liveViewImageSize: number
    offsetToFocalFrameInfo: number
    focalFrameInfoSize: number
    reserved: Uint8Array
    liveViewImage: Uint8Array | null
    focalFrameInfo: FocalFrameInfo | null
}

export class LiveViewDatasetCodec extends CustomCodec<LiveViewDataset> {
    readonly type = 'custom' as const

    encode(value: LiveViewDataset): Uint8Array {
        throw new Error('Encoding LiveViewDataset is not yet implemented')
    }

    decode(buffer: Uint8Array, offset = 0): { value: LiveViewDataset; bytesRead: number } {
        const view = new DataView(buffer.buffer, buffer.byteOffset)

        const offsetToLiveViewImage = view.getUint32(offset, true)
        const liveViewImageSize = view.getUint32(offset + 4, true)
        const offsetToFocalFrameInfo = view.getUint32(offset + 8, true)
        const focalFrameInfoSize = view.getUint32(offset + 12, true)

        const minOffset = Math.min(
            offsetToLiveViewImage > 0 ? offsetToLiveViewImage : Infinity,
            offsetToFocalFrameInfo > 0 ? offsetToFocalFrameInfo : Infinity
        )
        const reservedSize = minOffset > 16 && minOffset !== Infinity ? minOffset - 16 : 0
        const reserved = reservedSize > 0 ? buffer.slice(offset + 16, offset + 16 + reservedSize) : new Uint8Array()

        let liveViewImage: Uint8Array | null = null
        if (
            offsetToLiveViewImage > 0 &&
            liveViewImageSize > 0 &&
            buffer.length >= offset + offsetToLiveViewImage + liveViewImageSize
        ) {
            liveViewImage = buffer.slice(
                offset + offsetToLiveViewImage,
                offset + offsetToLiveViewImage + liveViewImageSize
            )
        }

        let focalFrameInfo: FocalFrameInfo | null = null
        if (
            offsetToFocalFrameInfo > 0 &&
            focalFrameInfoSize > 0 &&
            buffer.length >= offset + offsetToFocalFrameInfo + focalFrameInfoSize
        ) {
            const focalFrameData = buffer.slice(
                offset + offsetToFocalFrameInfo,
                offset + offsetToFocalFrameInfo + focalFrameInfoSize
            )
            focalFrameInfo = {
                data: focalFrameData,
            }
        }

        const bytesRead = buffer.length - offset

        return {
            value: {
                offsetToLiveViewImage,
                liveViewImageSize,
                offsetToFocalFrameInfo,
                focalFrameInfoSize,
                reserved,
                liveViewImage,
                focalFrameInfo,
            },
            bytesRead,
        }
    }
}

export const liveViewDatasetCodec = new LiveViewDatasetCodec()

export function parseLiveViewDataset(data: Uint8Array): LiveViewDataset {
    return liveViewDatasetCodec.decode(data).value
}
