import { DeviceProperty, PropertyValue } from '../properties/device-properties'
import { ImageInfo, ImageData } from './image.interface'
import { LiveViewFrame } from './liveview.interface'

/**
 * Camera interface providing vendor-agnostic operations
 */
export interface CameraInterface {
    /**
     * Connect to the camera
     */
    connect(): Promise<void>

    /**
     * Disconnect from the camera
     */
    disconnect(): Promise<void>

    /**
     * Check if connected
     */
    isConnected(): boolean

    /**
     * Capture a still image
     */
    captureImage(): Promise<void>

    /**
     * Get a device property value
     * @param property - Property to get
     */
    getDeviceProperty(property: DeviceProperty): Promise<PropertyValue>

    /**
     * Set a device property value
     * @param property - Property to set
     * @param value - Value to set
     */
    setDeviceProperty(property: DeviceProperty, value: PropertyValue): Promise<void>

    /**
     * Get property descriptor
     * @param property - Property to describe
     */
    getPropertyDescriptor(property: DeviceProperty): Promise<PropertyDescriptor>

    /**
     * Enable live view mode
     */
    enableLiveView(): Promise<void>

    /**
     * Disable live view mode
     */
    disableLiveView(): Promise<void>

    /**
     * Get a live view frame
     */
    getLiveViewFrame(): Promise<LiveViewFrame>

    /**
     * Check if live view is active
     */
    isLiveViewActive(): boolean

    /**
     * List available images on camera
     */
    listImages(): Promise<ImageInfo[]>

    /**
     * Download an image from camera
     * @param handle - Image handle
     */
    downloadImage(handle: number): Promise<ImageData>

    /**
     * Delete an image on camera
     * @param handle - Image handle
     */
    deleteImage(handle: number): Promise<void>

    /**
     * Get camera information
     */
    getCameraInfo(): Promise<CameraInfo>

    /**
     * Get storage information
     */
    getStorageInfo(): Promise<StorageInfo[]>

    /**
     * Enable OSD (On-Screen Display) mode (Sony specific)
     * @param enabled - Whether to enable OSD mode
     * @returns Promise<boolean> - Success status
     */
    setOSDMode?(enabled: boolean): Promise<boolean>

    /**
     * Get OSD image from camera (Sony specific)
     * @returns Promise<ImageData> - OSD image data
     */
    getOSDImage?(): Promise<ImageData>
}

/**
 * Property descriptor
 */
export interface PropertyDescriptor {
    property: DeviceProperty
    dataType: number
    getSet: number
    factoryDefault: PropertyValue
    currentValue: PropertyValue
    formFlag: number
    minValue?: PropertyValue
    maxValue?: PropertyValue
    stepSize?: PropertyValue
    enumeration?: PropertyValue[]
}

/**
 * Camera information
 */
export interface CameraInfo {
    manufacturer: string
    model: string
    version: string
    serialNumber: string
    vendorExtensionId?: number
    vendorExtensionVersion?: number
    vendorExtensionDescription?: string
    functionalMode?: number
    operationsSupported: number[]
    eventsSupported: number[]
    devicePropertiesSupported: number[]
    captureFormats: number[]
    imageFormats: number[]
}

/**
 * Storage information
 */
export interface StorageInfo {
    storageId: number
    storageType: number
    filesystemType: number
    accessCapability: number
    maxCapacity: bigint
    freeSpaceInBytes: bigint
    freeSpaceInImages: number
    storageDescription: string
    volumeLabel: string
}
