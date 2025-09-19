import { TransportInterface } from '@transport/interfaces/transport.interface'
import { ProtocolInterface } from '@core/interfaces/protocol.interface'
import { MessageBuilderInterface } from '@core/interfaces/message-builder.interface'
import { PTPMessageBuilder } from '@core/ptp/ptp-message-builder'
import { PTPProtocol } from '@core/ptp/ptp-protocol'
import { CameraInterface } from './interfaces/camera.interface'
import { PropertyMapperInterface } from './interfaces/property-mapper.interface'
import { GenericPropertyMapper } from './generic/generic-property-mapper'
import { GenericPTPCamera } from './generic/generic-ptp-camera'
import { SonyCamera } from './vendors/sony/sony-camera'
import { SonyAuthenticator } from './vendors/sony/sony-authenticator'

/**
 * Camera factory for creating camera implementations
 */
export class CameraFactory {
    /**
     * Create a Sony camera instance
     * @param transport - Transport interface
     */
    createSonyCamera(transport: TransportInterface): CameraInterface {
        const messageBuilder = this.createMessageBuilder()
        const protocol = this.createProtocol(transport, messageBuilder)
        const authenticator = new SonyAuthenticator()
        return new SonyCamera(protocol, authenticator)
    }

    /**
     * Create a Canon camera instance
     * @param transport - Transport interface
     */
    createCanonCamera(transport: TransportInterface): CameraInterface {
        this.createMessageBuilder()
        this.createProtocol(transport, this.createMessageBuilder())
        // TODO: Not implemented in old architecture
        throw new Error('Canon camera not implemented in old architecture')
    }

    /**
     * Create a Nikon camera instance
     * @param transport - Transport interface
     */
    createNikonCamera(transport: TransportInterface): CameraInterface {
        this.createMessageBuilder()
        this.createProtocol(transport, this.createMessageBuilder())
        // TODO: Not implemented in old architecture
        throw new Error('Nikon camera not implemented in old architecture')
    }

    /**
     * Create a generic PTP camera instance
     * @param transport - Transport interface
     */
    createGenericCamera(transport: TransportInterface): CameraInterface {
        const messageBuilder = this.createMessageBuilder()
        const protocol = this.createProtocol(transport, messageBuilder)
        const propertyMapper = this.createGenericPropertyMapper()
        return new GenericPTPCamera(protocol, propertyMapper)
    }

    /**
     * Create a camera instance by vendor
     * @param vendor - Vendor name
     * @param transport - Transport interface
     */
    create(vendor: string, transport: TransportInterface): CameraInterface {
        const normalizedVendor = vendor.toLowerCase()

        switch (normalizedVendor) {
            case 'sony':
                return this.createSonyCamera(transport)
            case 'canon':
                return this.createCanonCamera(transport)
            case 'nikon':
                return this.createNikonCamera(transport)
            case 'fuji':
            case 'fujifilm':
                // TODO: Not implemented in old architecture
                throw new Error('Fujifilm camera not implemented in old architecture')
            case 'panasonic':
                // TODO: Not implemented in old architecture
                throw new Error('Panasonic camera not implemented in old architecture')
            case 'olympus':
                // TODO: Not implemented in old architecture
                throw new Error('Olympus camera not implemented in old architecture')
            default:
                return this.createGenericCamera(transport)
        }
    }

    /**
     * Detect vendor from device info
     * @param vendorId - USB vendor ID
     * @param productId - USB product ID
     */
    detectVendor(vendorId: number, _productId?: number): string {
        switch (vendorId) {
            case 0x054c:
                return 'sony'
            case 0x04a9:
                return 'canon'
            case 0x04b0:
                return 'nikon'
            case 0x04cb:
                return 'fujifilm'
            case 0x2704:
                return 'panasonic'
            case 0x07b4:
                return 'olympus'
            default:
                return 'generic'
        }
    }

    /**
     * Create a PTP message builder
     */
    private createMessageBuilder(): MessageBuilderInterface {
        return new PTPMessageBuilder()
    }

    /**
     * Create a PTP protocol instance
     */
    private createProtocol(transport: TransportInterface, messageBuilder: MessageBuilderInterface): ProtocolInterface {
        return new PTPProtocol(transport, messageBuilder)
    }

    /**
     * Create a generic property mapper
     */
    private createGenericPropertyMapper(): PropertyMapperInterface {
        return new GenericPropertyMapper()
    }
}
