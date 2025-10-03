export enum USBContainerType {
    COMMAND = 1,
    DATA = 2,
    RESPONSE = 3,
    EVENT = 4,
}

export interface USBContainer {
    length: number
    type: USBContainerType
    code: number
    transactionId: number
    payload: Uint8Array
}

export class USBContainerBuilder {
    static buildCommand(operationCode: number, transactionId: number, parameters: Uint8Array[]): Uint8Array {
        const payloadSize = parameters.reduce((sum, param) => sum + param.length, 0)
        const containerSize = 12 + payloadSize
        const buffer = new Uint8Array(containerSize)
        const view = new DataView(buffer.buffer)

        view.setUint32(0, containerSize, true)
        view.setUint16(4, USBContainerType.COMMAND, true)
        view.setUint16(6, operationCode, true)
        view.setUint32(8, transactionId, true)

        let offset = 12
        for (const param of parameters) {
            buffer.set(param, offset)
            offset += param.length
        }

        return buffer
    }

    static buildData(operationCode: number, transactionId: number, data: Uint8Array): Uint8Array {
        const containerSize = 12 + data.length
        const buffer = new Uint8Array(containerSize)
        const view = new DataView(buffer.buffer)

        view.setUint32(0, containerSize, true)
        view.setUint16(4, USBContainerType.DATA, true)
        view.setUint16(6, operationCode, true)
        view.setUint32(8, transactionId, true)

        buffer.set(data, 12)

        return buffer
    }

    static parseResponse(data: Uint8Array): USBContainer {
        if (data.length < 12) {
            throw new Error(`Invalid response container: too short (${data.length} bytes)`)
        }

        const view = new DataView(data.buffer, data.byteOffset, data.byteLength)

        const length = view.getUint32(0, true)
        const type = view.getUint16(4, true)
        const code = view.getUint16(6, true)
        const transactionId = view.getUint32(8, true)

        if (type !== USBContainerType.RESPONSE) {
            throw new Error(`Expected response container, got type ${type}`)
        }

        if (length !== data.length) {
            throw new Error(`Container length mismatch: header says ${length}, received ${data.length}`)
        }

        const payload = data.slice(12)

        return {
            length,
            type,
            code,
            transactionId,
            payload,
        }
    }

    static parseData(data: Uint8Array): USBContainer {
        if (data.length < 12) {
            throw new Error(`Invalid data container: too short (${data.length} bytes)`)
        }

        const view = new DataView(data.buffer, data.byteOffset, data.byteLength)

        const length = view.getUint32(0, true)
        const type = view.getUint16(4, true)
        const code = view.getUint16(6, true)
        const transactionId = view.getUint32(8, true)

        if (type !== USBContainerType.DATA) {
            throw new Error(`Expected data container, got type ${type}`)
        }

        if (length !== data.length) {
            throw new Error(`Container length mismatch: header says ${length}, received ${data.length}`)
        }

        const payload = data.slice(12)

        return {
            length,
            type,
            code,
            transactionId,
            payload,
        }
    }

    static parseEvent(data: Uint8Array): USBContainer {
        if (data.length < 12) {
            throw new Error(`Invalid event container: too short (${data.length} bytes)`)
        }

        const view = new DataView(data.buffer, data.byteOffset, data.byteLength)

        const length = view.getUint32(0, true)
        const type = view.getUint16(4, true)
        const code = view.getUint16(6, true)
        const transactionId = view.getUint32(8, true)

        if (type !== USBContainerType.EVENT) {
            throw new Error(`Expected event container, got type ${type}`)
        }

        const payload = data.slice(12)

        return {
            length,
            type,
            code,
            transactionId,
            payload,
        }
    }

    static parseContainer(data: Uint8Array): USBContainer {
        if (data.length < 12) {
            throw new Error(`Invalid container: too short (${data.length} bytes)`)
        }

        const view = new DataView(data.buffer, data.byteOffset, data.byteLength)

        const length = view.getUint32(0, true)
        const type = view.getUint16(4, true)
        const code = view.getUint16(6, true)
        const transactionId = view.getUint32(8, true)

        const payload = data.slice(12)

        return {
            length,
            type,
            code,
            transactionId,
            payload,
        }
    }
}
