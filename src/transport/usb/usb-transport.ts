import { TransportInterface, PTPEvent } from '@transport/interfaces/transport.interface'
import { DeviceDescriptor } from '@transport/interfaces/device.interface'
import { TransportType } from '@transport/interfaces/transport-types'
import { Logger } from '@core/logger'
import { VendorIDs } from '@ptp/definitions/vendor-ids'
import { USBContainerBuilder, USBContainerType, toBuffer, toUint8Array } from './usb-container'

// ============================================================================
// Types & Constants
// ============================================================================

export enum EndpointType {
    BULK_IN = 'bulk_in',
    BULK_OUT = 'bulk_out',
    INTERRUPT = 'interrupt',
}

export interface EndpointConfiguration {
    bulkIn: USBEndpoint
    bulkOut: USBEndpoint
    interrupt?: USBEndpoint
}

enum USBClassRequest {
    CANCEL_REQUEST = 0x64,
    GET_EXTENDED_EVENT_DATA = 0x65,
    DEVICE_RESET = 0x66,
    GET_DEVICE_STATUS = 0x67,
}

export interface DeviceStatus {
    code: number
    parameters: number[]
}

export interface ExtendedEventData {
    eventCode: number
    transactionId: number
    parameters: Array<{ size: number; value: Uint8Array }>
}

const USB_CLASS_STILL_IMAGE = 6
const USB_SUBCLASS_STILL_IMAGE_CAPTURE = 1

export const USB_LIMITS = {
    MAX_USB_TRANSFER: 1024 * 1024 * 1024,
    DEFAULT_BULK_SIZE: 8192,
} as const

// ============================================================================
// USB Transport
// ============================================================================

export class USBTransport implements TransportInterface {
    private device: USBDevice | null = null
    private interfaceNumber = 0
    private endpoints: EndpointConfiguration | null = null
    private connected = false
    private deviceInfo: { vendorId: number; productId: number } | null = null
    private eventHandlers = new Set<(event: PTPEvent) => void>()
    private usb: USB | null = null
    private isListeningForEvents = false

    constructor(private logger: Logger<any>) {}

    private async getUSB(): Promise<USB> {
        if (this.usb) return this.usb
        if (typeof navigator !== 'undefined' && 'usb' in navigator) {
            this.usb = navigator.usb
        } else {
            const usb = await import('usb')
            this.usb = usb.webusb
        }
        return this.usb
    }

    async discover(criteria?: Partial<DeviceDescriptor>): Promise<DeviceDescriptor[]> {
        const usb = await this.getUSB()
        const devices = await usb.getDevices()

        return devices
            .filter(device => {
                if (device.vendorId === 0) return false
                if (criteria?.vendorId && criteria.vendorId !== 0 && device.vendorId !== criteria.vendorId) return false
                if (criteria?.productId && criteria.productId !== 0 && device.productId !== criteria.productId)
                    return false
                if (criteria?.serialNumber && device.serialNumber !== criteria.serialNumber) return false
                return true
            })
            .map(device => ({
                device,
                vendorId: device.vendorId,
                productId: device.productId,
                manufacturer: device.manufacturerName || undefined,
                model: device.productName || undefined,
                serialNumber: device.serialNumber || undefined,
            }))
    }

    async connect(deviceIdentifier?: DeviceDescriptor): Promise<void> {
        if (this.connected) throw new Error('Already connected')

        this.isListeningForEvents = false
        const usb = await this.getUSB()

        // Find device or request from user
        let usbDevice: USBDevice | undefined
        if (deviceIdentifier?.vendorId && deviceIdentifier.vendorId !== 0) {
            const devices = await this.discover(deviceIdentifier)
            usbDevice = devices[0]?.device as USBDevice
        }

        if (!usbDevice) {
            const filters =
                deviceIdentifier?.vendorId && deviceIdentifier.vendorId !== 0
                    ? [
                          {
                              vendorId: deviceIdentifier.vendorId,
                              ...(deviceIdentifier.productId &&
                                  deviceIdentifier.productId !== 0 && { productId: deviceIdentifier.productId }),
                          },
                      ]
                    : Object.values(VendorIDs).map(vendorId => ({ vendorId }))

            usbDevice = await usb.requestDevice({ filters })
        }

        // Open and configure
        this.device = usbDevice
        this.deviceInfo = { vendorId: usbDevice.vendorId, productId: usbDevice.productId }
        await this.device.open()

        // Find PTP interface
        const config = this.device.configuration || this.device.configurations?.[0]
        if (!config) throw new Error('No USB configuration available')

        const ptpInterface = config.interfaces.find(intf => {
            const alt = intf.alternates?.[0] || intf.alternate
            return (
                alt?.interfaceClass === USB_CLASS_STILL_IMAGE &&
                alt?.interfaceSubclass === USB_SUBCLASS_STILL_IMAGE_CAPTURE
            )
        })
        if (!ptpInterface) throw new Error('PTP interface not found')

        this.interfaceNumber = ptpInterface.interfaceNumber
        await this.device.claimInterface(this.interfaceNumber)

        // Find endpoints
        const alt = ptpInterface.alternates?.[0] || ptpInterface.alternate
        if (!alt) throw new Error('No alternate interface found')

        const bulkIn = alt.endpoints.find(ep => ep.direction === 'in' && ep.type === 'bulk')
        const bulkOut = alt.endpoints.find(ep => ep.direction === 'out' && ep.type === 'bulk')
        const interrupt = alt.endpoints.find(ep => ep.direction === 'in' && ep.type === 'interrupt')

        if (!bulkIn || !bulkOut) throw new Error('Required bulk endpoints not found')

        this.endpoints = { bulkIn, bulkOut, interrupt }
        this.connected = true

        if (interrupt) this.startListeningForEvents()
    }

    async disconnect(): Promise<void> {
        if (!this.connected) return

        this.isListeningForEvents = false

        if (this.endpoints?.interrupt && this.device) {
            await this.clearStall(EndpointType.INTERRUPT)
        }

        if (this.device) await this.device.close()

        this.device = null
        this.interfaceNumber = 0
        this.endpoints = null
        this.connected = false
        this.eventHandlers.clear()
    }

    async send(data: Uint8Array, sessionId: number, transactionId: number): Promise<void> {
        if (!this.connected || !this.endpoints || !this.device) throw new Error('Not connected')

        const buffer = toBuffer(data)
        const endpoint = this.endpoints.bulkOut.endpointNumber
        const container = USBContainerBuilder.parseContainer(data)

        this.logger.addLog({
            type: 'usb_transfer',
            level: 'info',
            direction: 'send',
            bytes: buffer.length,
            endpoint: 'bulkOut',
            endpointAddress: `0x${endpoint.toString(16)}`,
            sessionId,
            transactionId,
            phase:
                container.type === USBContainerType.COMMAND
                    ? 'request'
                    : container.type === USBContainerType.DATA
                      ? 'data'
                      : 'response',
        })

        let result = await this.device.transferOut(endpoint, buffer.buffer as ArrayBuffer)

        if (result.status === 'stall') {
            await this.clearStall(EndpointType.BULK_OUT)
            result = await this.device.transferOut(endpoint, buffer.buffer as ArrayBuffer)
        }

        if (result.status !== 'ok') throw new Error(`Bulk OUT failed: ${result.status}`)
    }

    async receive(maxLength: number, sessionId: number, transactionId: number): Promise<Uint8Array> {
        if (!this.connected || !this.endpoints || !this.device) throw new Error('Not connected')

        const endpoint = this.endpoints.bulkIn.endpointNumber

        let result = await this.device.transferIn(endpoint, maxLength)

        if (result.status === 'stall') {
            await this.clearStall(EndpointType.BULK_IN)
            result = await this.device.transferIn(endpoint, maxLength)
        }

        if (result.status !== 'ok' || !result.data || result.data.byteLength === 0) {
            throw new Error(`Bulk IN failed: ${result.status}`)
        }

        const data = toUint8Array(result.data.buffer as ArrayBuffer)
        const container = USBContainerBuilder.parseContainer(data)

        this.logger.addLog({
            type: 'usb_transfer',
            level: 'info',
            direction: 'receive',
            bytes: data.length,
            endpoint: 'bulkIn',
            endpointAddress: `0x${endpoint.toString(16)}`,
            sessionId,
            transactionId,
            phase:
                container.type === USBContainerType.COMMAND
                    ? 'request'
                    : container.type === USBContainerType.DATA
                      ? 'data'
                      : 'response',
        })

        return data
    }

    private async clearStall(endpointType: EndpointType): Promise<void> {
        if (!this.device || !this.endpoints) throw new Error('Cannot handle STALL')

        await this.getDeviceStatus()

        if (endpointType === EndpointType.BULK_IN || endpointType === EndpointType.BULK_OUT) {
            await this.device.clearHalt('in', this.endpoints.bulkIn.endpointNumber)
            await this.device.clearHalt('out', this.endpoints.bulkOut.endpointNumber)
        } else if (endpointType === EndpointType.INTERRUPT && this.endpoints.interrupt) {
            await this.device.clearHalt('in', this.endpoints.interrupt.endpointNumber)
        }

        for (let i = 0; i < 10; i++) {
            const status = await this.getDeviceStatus()
            if (status.code === 0x2001) return
            await new Promise(resolve => setTimeout(resolve, 50))
        }

        throw new Error('Device did not return OK after STALL recovery')
    }

    isConnected(): boolean {
        return this.connected
    }

    async reset(): Promise<void> {
        if (!this.connected || !this.device) throw new Error('Not connected')
        await this.device.controlTransferOut({
            requestType: 'class',
            recipient: 'interface',
            request: USBClassRequest.DEVICE_RESET,
            value: 0,
            index: this.interfaceNumber,
        })
    }

    async cancelRequest(transactionId: number): Promise<void> {
        if (!this.connected || !this.device) throw new Error('Not connected')

        const data = new Uint8Array(6)
        const view = new DataView(data.buffer)
        view.setUint16(0, 0x4001, true)
        view.setUint32(2, transactionId, true)

        await this.device.controlTransferOut(
            {
                requestType: 'class',
                recipient: 'interface',
                request: USBClassRequest.CANCEL_REQUEST,
                value: 0,
                index: this.interfaceNumber,
            },
            data
        )
    }

    async getDeviceStatus(): Promise<DeviceStatus> {
        if (!this.device) throw new Error('Device not connected')

        const result = await this.device.controlTransferIn(
            {
                requestType: 'class',
                recipient: 'interface',
                request: USBClassRequest.GET_DEVICE_STATUS,
                value: 0,
                index: this.interfaceNumber,
            },
            20
        )

        if (!result || result.status !== 'ok' || !result.data || result.data.byteLength === 0) {
            throw new Error('Failed to get device status')
        }

        const data = new Uint8Array(result.data.buffer)
        const view = new DataView(data.buffer)
        const length = view.getUint16(0, true)
        const code = view.getUint16(2, true)

        const parameters: number[] = []
        let offset = 4
        while (offset + 4 <= length && offset < data.length) {
            parameters.push(view.getUint32(offset, true))
            offset += 4
        }

        return { code, parameters }
    }

    async getExtendedEventData(bufferSize = 512): Promise<ExtendedEventData> {
        if (!this.connected || !this.device) throw new Error('Not connected')

        const result = await this.device.controlTransferIn(
            {
                requestType: 'class',
                recipient: 'interface',
                request: USBClassRequest.GET_EXTENDED_EVENT_DATA,
                value: 0,
                index: this.interfaceNumber,
            },
            bufferSize
        )

        if (!result || result.status !== 'ok' || !result.data) {
            throw new Error('Failed to get extended event data')
        }

        const data = new Uint8Array(result.data.buffer)
        const view = new DataView(data.buffer)

        const eventCode = view.getUint16(0, true)
        const transactionId = view.getUint32(2, true)
        const numParameters = view.getUint16(6, true)

        const parameters: Array<{ size: number; value: Uint8Array }> = []
        let offset = 8

        for (let i = 0; i < numParameters && offset + 2 <= data.length; i++) {
            const paramSize = view.getUint16(offset, true)
            offset += 2

            if (offset + paramSize <= data.length) {
                parameters.push({ size: paramSize, value: data.slice(offset, offset + paramSize) })
                offset += paramSize
            }
        }

        return { eventCode, transactionId, parameters }
    }

    getType(): TransportType {
        return TransportType.USB
    }

    isLittleEndian(): boolean {
        return true
    }

    getDeviceInfo(): DeviceDescriptor | null {
        return this.deviceInfo
    }

    on(handler: (event: PTPEvent) => void): void {
        this.eventHandlers.add(handler)
    }

    off(handler: (event: PTPEvent) => void): void {
        this.eventHandlers.delete(handler)
    }

    async stopEventListening(): Promise<void> {
        this.isListeningForEvents = false

        if (this.endpoints?.interrupt && this.device) {
            await this.clearStall(EndpointType.INTERRUPT)
        }
    }

    private startListeningForEvents(): void {
        if (!this.connected || !this.endpoints?.interrupt || this.isListeningForEvents || !this.device) return

        this.isListeningForEvents = true

        const restart = () => {
            if (this.isListeningForEvents) {
                this.isListeningForEvents = false
                this.startListeningForEvents()
            }
        }

        this.device
            .transferIn(this.endpoints.interrupt.endpointNumber, 64)
            .then((result: USBInTransferResult) => {
                if (result.status === 'stall') {
                    this.clearStall(EndpointType.INTERRUPT).then(restart)
                } else if (result.status === 'ok' && result.data && result.data.byteLength > 0) {
                    this.handleInterruptData(new Uint8Array(result.data.buffer))
                    restart()
                } else {
                    restart()
                }
            })
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : String(error)
                if (!message.includes('LIBUSB_TRANSFER_CANCELLED') && this.isListeningForEvents) {
                    restart()
                }
            })
    }

    private handleInterruptData(data: Uint8Array): void {
        if (!this.endpoints?.interrupt) return

        const container = USBContainerBuilder.parseEvent(data)
        const view = new DataView(container.payload.buffer, container.payload.byteOffset, container.payload.byteLength)

        const event: PTPEvent = {
            code: container.code,
            transactionId: container.transactionId,
            parameters: [],
        }

        let offset = 0
        while (offset + 4 <= container.payload.length && event.parameters.length < 5) {
            event.parameters.push(view.getUint32(offset, true))
            offset += 4
        }

        this.logger.addLog({
            type: 'usb_transfer',
            level: 'info',
            bytes: data.length,
            direction: 'receive',
            endpoint: 'interrupt',
            endpointAddress: `0x${this.endpoints.interrupt.endpointNumber.toString(16)}`,
            sessionId: event.transactionId >> 16,
            transactionId: event.transactionId,
            phase: 'response',
        })

        this.eventHandlers.forEach(handler => handler(event))
    }
}
