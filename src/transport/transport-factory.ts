import { TransportInterface, TransportType, TransportOptions } from './interfaces/transport.interface'
import { DeviceFinderInterface, EndpointManagerInterface } from './interfaces/endpoint.interface'
import { USBTransport } from './usb/usb-transport'
import { USBDeviceFinder } from './usb/usb-device-finder'
import { USBEndpointManager } from './usb/usb-endpoint-manager'

/**
 * Transport factory for creating transport implementations
 */
export class TransportFactory {
    /**
     * Create a USB transport instance
     * @param options - USB transport options
     */
    createUSBTransport(_options?: USBTransportOptions): TransportInterface {
        const deviceFinder = this.createUSBDeviceFinder()
        const endpointManager = this.createUSBEndpointManager()
        return new USBTransport(deviceFinder, endpointManager)
    }

    /**
     * Create an IP transport instance
     * @param options - IP transport options
     */
    createIPTransport(_options: IPTransportOptions): TransportInterface {
        // TODO: Not implemented in old architecture
        throw new Error('IP transport not implemented in old architecture')
    }

    /**
     * Create a transport instance by type
     * @param type - Transport type
     * @param options - Transport options
     */
    create(type: TransportType, options?: unknown): TransportInterface {
        switch (type) {
            case TransportType.USB:
                return this.createUSBTransport(options as USBTransportOptions)
            case TransportType.IP:
                return this.createIPTransport(options as IPTransportOptions)
            case TransportType.BLUETOOTH:
                // TODO: Not implemented in old architecture
                throw new Error('Bluetooth transport not implemented in old architecture')
            default:
                throw new Error(`Unknown transport type: ${type as string}`)
        }
    }

    /**
     * Create a device finder for USB devices
     */
    createUSBDeviceFinder(): DeviceFinderInterface {
        return new USBDeviceFinder()
    }

    /**
     * Create an endpoint manager for USB devices
     */
    createUSBEndpointManager(): EndpointManagerInterface {
        return new USBEndpointManager()
    }
}

/**
 * USB transport options
 */
export interface USBTransportOptions extends TransportOptions {
    interfaceNumber?: number
    alternateInterface?: number
    claimInterface?: boolean
}

/**
 * IP transport options
 */
export interface IPTransportOptions extends TransportOptions {
    address: string
    port: number
    protocol?: 'tcp' | 'udp'
    keepAlive?: boolean
    keepAliveInterval?: number
}
