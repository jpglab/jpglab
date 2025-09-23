import { ProtocolInterface } from '@core/protocol'
import { GenericPTPCamera } from '@camera/generic/generic-ptp-camera'
import { SonyAuthenticator } from '@camera/vendors/sony/sony-authenticator'
import { SonyOperations } from '@constants/vendors/sony/operations'
import { SonyProperties } from '@constants/vendors/sony/properties'
import { PTPResponses } from '@constants/ptp/responses'
import { encodePTPValue, decodePTPValue } from '@core/buffers'
import { extractSonyLiveViewJPEG } from '@camera/vendors/sony/sony-image-utils'
import { parseJPEGDimensions } from '@core/images'

export class SonyCamera extends GenericPTPCamera {
    constructor(
        protocol: ProtocolInterface,
        private readonly authenticator: SonyAuthenticator
    ) {
        super(protocol)
    }

    async connect(): Promise<void> {
        // Call parent connect to open session first
        await super.connect()

        // Perform authentication after session is open
        await this.authenticator.authenticate(this.protocol)

        // Set the host as the priority for settings
        const response = await this.protocol.sendOperation({
            code: SonyOperations.SDIO_SET_EXT_DEVICE_PROP_VALUE.code,
            parameters: [SonyProperties.POSITION_KEY_SETTING.code],
            expectsData: true,
            data: encodePTPValue(
                SonyProperties.POSITION_KEY_SETTING.enum.HOST_PRIORITY,
                SonyProperties.POSITION_KEY_SETTING.type
            ),
        })

        if (response.code !== PTPResponses.OK.code) {
            console.warn('Failed to set Sony control mode, some features may not work')
        }
    }

    async getDeviceProperty<T = any>(propertyName: keyof typeof SonyProperties): Promise<T> {
        const property = SonyProperties[propertyName]
        if (!property) {
            throw new Error(`Unknown property: ${String(propertyName)}`)
        }

        const response = await this.protocol.sendOperation({
            code: SonyOperations.SDIO_GET_EXT_DEVICE_PROP_VALUE.code,
            parameters: [property.code],
            expectsData: true,
        })

        if (response.code !== PTPResponses.OK.code) {
            throw new Error(`Failed to get property ${propertyName}: 0x${response.code.toString(16)}`)
        }

        if (!response.data) {
            throw new Error(`No data received for property ${propertyName}`)
        }

        // Parse Sony's all-properties response to find our property
        const value = this.extractPropertyFromResponse(response.data, property.code)

        // Use property's decode if available
        if ('decode' in property && typeof property.decode === 'function') {
            return property.decode(value) as T
        }

        return decodePTPValue(value, property.type) as T
    }

    async setDeviceProperty(propertyName: keyof typeof SonyProperties, value: any): Promise<void> {
        const property = SonyProperties[propertyName]
        if (!property) {
            throw new Error(`Unknown property: ${String(propertyName)}`)
        }

        // Determine which operation to use based on property type
        // Some properties use SET_DEVICE_PROPERTY_VALUE, others use CONTROL_DEVICE_PROPERTY
        const isControlProperty = /shutter|focus|live_view/i.test(property.name)

        const operationCode = isControlProperty
            ? SonyOperations.CONTROL_DEVICE_PROPERTY.code
            : SonyOperations.SET_DEVICE_PROPERTY_VALUE.code

        // Use property's encode if available, or enum value if provided
        let encodedValue: Uint8Array
        if ('encode' in property && typeof property.encode === 'function') {
            encodedValue = property.encode(value)
        } else if ('enum' in property && property.enum && typeof value === 'string' && value in property.enum) {
            encodedValue = encodePTPValue(property.enum[value as keyof typeof property.enum], property.type)
        } else {
            encodedValue = encodePTPValue(value, property.type)
        }

        const response = await this.protocol.sendOperation({
            code: operationCode,
            parameters: [property.code],
            expectsData: true,
            data: encodedValue,
        })

        if (response.code !== PTPResponses.OK.code) {
            throw new Error(`Failed to set property ${propertyName}: 0x${response.code.toString(16)}`)
        }
    }

    /**
     * Capture an image using Sony's control properties
     */
    async captureImage(): Promise<void> {
        await this.setDeviceProperty('SHUTTER_BUTTON_CONTROL', 'HALF_PRESS')
        await new Promise(resolve => setTimeout(resolve, 250))
        await this.setDeviceProperty('SHUTTER_BUTTON_CONTROL', 'FULL_PRESS')
        await this.setDeviceProperty('SHUTTER_BUTTON_CONTROL', 'RELEASE')
    }

    async captureLiveViewFrame(): Promise<any> {
        // Start live view if not already active
        const startResponse = await this.protocol.sendOperation({
            code: SonyOperations.GET_LIVE_VIEW_IMG.code,
            parameters: [],
        })

        if (startResponse.code !== PTPResponses.OK.code || !startResponse.data) {
            return null
        }

        // Parse Sony's live view format
        const jpegData = extractSonyLiveViewJPEG(startResponse.data)
        if (!jpegData) {
            return null
        }

        // Parse actual dimensions from JPEG
        const dimensions = parseJPEGDimensions(jpegData)

        return {
            data: jpegData,
            timestamp: Date.now(),
            width: dimensions.width,
            height: dimensions.height,
            format: 'jpeg',
        }
    }
}
