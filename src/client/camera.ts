import { TransportFactory } from '@transport/transport-factory'
import { CameraFactory } from '@camera/camera-factory'
import { CameraInterface } from '@camera/interfaces/camera.interface'
import { TransportType } from '@transport/interfaces/transport.interface'
import { DeviceProperty } from '@camera/properties/device-properties'
import { listCameras } from './discovery'
import { CameraOptions, CameraDescriptor, Photo as PhotoType, Frame, ExposureMode } from './types'
import { Photo } from './photo'
import { EventEmitter } from 'events'

export class Camera extends EventEmitter {
    private options: CameraOptions
    private cameraImplementation?: CameraInterface
    private transportFactory: TransportFactory
    private cameraFactory: CameraFactory
    private _vendor?: string
    private _model?: string
    private _serialNumber?: string

    constructor(options?: CameraOptions | CameraDescriptor) {
        super()
        this.options = options || {}
        this.transportFactory = new TransportFactory()
        this.cameraFactory = new CameraFactory()
    }

    async connect(): Promise<void> {
        if (!this.options.usb?.productId && !this.options.ip?.host) {
            const cameras = await listCameras(this.options)

            if (cameras.length === 0) {
                const filters = []
                if (this.options.vendor) filters.push(`vendor: ${this.options.vendor}`)
                if (this.options.model) filters.push(`model: ${this.options.model}`)
                if (this.options.usb?.vendorId) filters.push(`USB vendor: 0x${this.options.usb.vendorId.toString(16)}`)

                const filterMsg = filters.length > 0 ? ` matching filters: ${filters.join(', ')}` : ''
                throw new Error(`No cameras found${filterMsg}. Please connect a camera via USB.`)
            }

            const firstCamera = cameras[0]
            if (firstCamera) {
                this.options = { ...this.options, ...firstCamera }
                this._vendor = firstCamera.vendor
                this._model = firstCamera.model
                this._serialNumber = firstCamera.serialNumber
            }
        }

        await this.establishConnection()
    }

    private async establishConnection(): Promise<void> {
        if (this.options.ip) {
            throw new Error('IP connections not yet implemented')
        }

        const transport = this.transportFactory.create(TransportType.USB, {
            timeout: this.options.timeout,
        })

        await transport.connect({
            vendorId: this.options.usb?.vendorId || 0,
            productId: this.options.usb?.productId || 0,
            serialNumber: this.options.serialNumber,
        })

        const detectedVendor =
            this.options.vendor ||
            this.cameraFactory.detectVendor(this.options.usb?.vendorId || 0, this.options.usb?.productId || 0)

        this.cameraImplementation = this.cameraFactory.create(detectedVendor, transport)
        await this.cameraImplementation.connect()

        // Set vendor/model/serial from options if not already set
        if (!this._vendor) this._vendor = this.options.vendor || detectedVendor
        if (!this._model) this._model = this.options.model || 'Unknown'
        if (!this._serialNumber) this._serialNumber = this.options.serialNumber || 'Unknown'
    }

    async disconnect(): Promise<void> {
        if (this.cameraImplementation) {
            await this.cameraImplementation.disconnect()
            this.cameraImplementation = undefined
        }
        this.emit('disconnect')
    }

    isConnected(): boolean {
        return this.cameraImplementation?.isConnected() || false
    }

    get vendor(): string {
        if (!this._vendor) throw new Error('Camera not connected')
        return this._vendor
    }

    get model(): string {
        if (!this._model) throw new Error('Camera not connected')
        return this._model
    }

    get serialNumber(): string {
        if (!this._serialNumber) throw new Error('Camera not connected')
        return this._serialNumber
    }

    async takePhoto(): Promise<PhotoType> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        try {
            await this.cameraImplementation.captureImage()
            const images = await this.cameraImplementation.listImages()
            if (images.length === 0) {
                throw new Error('No images found after capture')
            }
            const latestImage = images[images.length - 1]
            if (!latestImage) {
                throw new Error('No image found after capture')
            }
            const imageData = await this.cameraImplementation.downloadImage(latestImage.handle)
            const buffer = imageData instanceof Buffer ? imageData : Buffer.from(imageData as any)
            const photo = new Photo(buffer, latestImage.filename || 'unknown')
            this.emit('photo', photo)
            return photo
        } catch (error) {
            this.emit('error', error)
            throw error
        }
    }

    async getISO(): Promise<number> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const value = await this.cameraImplementation.getDeviceProperty(DeviceProperty.ISO)
        return value as number
    }

    async setISO(value: number): Promise<void> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        await this.cameraImplementation.setDeviceProperty(DeviceProperty.ISO, value)
    }

    async getShutterSpeed(): Promise<string> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const value = await this.cameraImplementation.getDeviceProperty(DeviceProperty.SHUTTER_SPEED)
        return this.formatShutterSpeed(value)
    }

    async setShutterSpeed(value: string): Promise<void> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const numericValue = this.parseShutterSpeed(value)
        await this.cameraImplementation.setDeviceProperty(DeviceProperty.SHUTTER_SPEED, numericValue)
    }

    async getAperture(): Promise<string> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const value = await this.cameraImplementation.getDeviceProperty(DeviceProperty.APERTURE)
        return this.formatAperture(value)
    }

    async setAperture(value: string): Promise<void> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const numericValue = this.parseAperture(value)
        await this.cameraImplementation.setDeviceProperty(DeviceProperty.APERTURE, numericValue)
    }

    async getExposureMode(): Promise<ExposureMode> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const value = await this.cameraImplementation.getDeviceProperty(DeviceProperty.EXPOSURE_MODE)
        return this.mapExposureMode(value)
    }

    async setExposureMode(value: ExposureMode): Promise<void> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const numericValue = this.mapExposureModeToNumeric(value)
        await this.cameraImplementation.setDeviceProperty(DeviceProperty.EXPOSURE_MODE, numericValue)
    }

    async getProperty(property: DeviceProperty): Promise<any> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        return this.cameraImplementation.getDeviceProperty(property)
    }

    async setProperty(property: DeviceProperty, value: any): Promise<void> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        await this.cameraImplementation.setDeviceProperty(property, value)
    }

    async getProperties(): Promise<Map<DeviceProperty, any>> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const properties = new Map<DeviceProperty, any>()
        const commonProperties = [
            DeviceProperty.ISO,
            DeviceProperty.SHUTTER_SPEED,
            DeviceProperty.APERTURE,
            DeviceProperty.EXPOSURE_MODE,
            DeviceProperty.WHITE_BALANCE,
            DeviceProperty.FOCUS_MODE,
        ]

        for (const prop of commonProperties) {
            try {
                const value = await this.cameraImplementation.getDeviceProperty(prop)
                properties.set(prop, value)
            } catch {
                // Property not supported by this camera
            }
        }

        return properties
    }

    async startLiveView(callback: (frame: Frame) => void): Promise<void> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        // Live view implementation would go here
        // For now, this is a placeholder
        callback // Reference to avoid unused parameter error
        throw new Error('Live view not yet implemented')
    }

    async stopLiveView(): Promise<void> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        // Live view stop implementation would go here
    }

    async listPhotos(): Promise<PhotoType[]> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const images = await this.cameraImplementation.listImages()
        return images.map(img => new Photo(Buffer.alloc(0), img.filename || 'unknown'))
    }

    async downloadPhoto(photo: PhotoType): Promise<Buffer> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const images = await this.cameraImplementation.listImages()
        const image = images.find(img => img.filename === photo.filename)
        if (!image) throw new Error('Photo not found on camera')
        const data = await this.cameraImplementation.downloadImage(image.handle)
        return data instanceof Buffer ? data : Buffer.from(data as any)
    }

    async deletePhoto(photo: PhotoType): Promise<void> {
        if (!this.cameraImplementation) throw new Error('Camera not connected')
        const filename = photo.filename || ''
        const images = await this.cameraImplementation.listImages()
        const image = images.find(img => (img.filename || '') === filename)
        if (!image) throw new Error('Photo not found on camera')
        await this.cameraImplementation.deleteImage(image.handle)
    }

    private formatShutterSpeed(value: any): string {
        if (typeof value === 'string') return value
        if (typeof value === 'number') {
            if (value >= 1) return `${value}`
            return `1/${Math.round(1 / value)}`
        }
        return String(value)
    }

    private parseShutterSpeed(value: string): number {
        if (value.includes('/')) {
            const parts = value.split('/')
            const numerator = parts[0] || '1'
            const denominator = parts[1] || '1'
            return parseFloat(numerator) / parseFloat(denominator)
        }
        return parseFloat(value)
    }

    private formatAperture(value: any): string {
        if (typeof value === 'string') return value
        if (typeof value === 'number') return `f/${value}`
        return String(value)
    }

    private parseAperture(value: string): number {
        if (value.startsWith('f/')) {
            return parseFloat(value.substring(2))
        }
        return parseFloat(value)
    }

    private mapExposureMode(value: any): ExposureMode {
        if (typeof value === 'string') return value as ExposureMode
        // Map numeric values to exposure modes (camera-specific)
        const modeMap: { [key: number]: ExposureMode } = {
            0: 'auto',
            1: 'manual',
            2: 'aperture',
            3: 'shutter',
        }
        return modeMap[value as number] || 'auto'
    }

    private mapExposureModeToNumeric(mode: ExposureMode): number {
        const modeMap: { [key in ExposureMode]: number } = {
            auto: 0,
            manual: 1,
            aperture: 2,
            shutter: 3,
        }
        return modeMap[mode]
    }
}
