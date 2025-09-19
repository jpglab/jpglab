/**
 * Image information interface
 */
export interface ImageInfo {
    handle: number
    storageId: number
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
    associationDescription: number
    sequenceNumber: number
    filename: string
    captureDate: Date
    modificationDate: Date
    keywords?: string
}

/**
 * Image data interface
 */
export interface ImageData {
    data: Uint8Array
    format: ImageFormat
    width: number
    height: number
    handle?: number
    filename?: string
    thumbnailData?: Uint8Array
}

/**
 * Image format enumeration
 */
export enum ImageFormat {
    JPEG = 'jpeg',
    RAW = 'raw',
    TIFF = 'tiff',
    BMP = 'bmp',
    PNG = 'png',
    HEIF = 'heif',
    DNG = 'dng',
    ARW = 'arw',
    CR2 = 'cr2',
    NEF = 'nef',
}
