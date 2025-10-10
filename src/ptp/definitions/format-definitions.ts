import { FormatDefinition } from '@ptp/types/format'

// ============================================================================
// Individual Format Definitions
// ============================================================================

/** Undefined object */
export const Undefined = {
    code: 0x3000,
    name: 'Undefined',
    description: 'Undefined object',
    category: 'non-image',
} as const satisfies FormatDefinition

/** Object association (folder) */
export const Association = {
    code: 0x3001,
    name: 'Association',
    description: 'Object association (folder)',
    category: 'non-image',
} as const satisfies FormatDefinition

/** Device script */
export const Script = {
    code: 0x3002,
    name: 'Script',
    description: 'Device script',
    category: 'non-image',
} as const satisfies FormatDefinition

/** Device executable */
export const Executable = {
    code: 0x3003,
    name: 'Executable',
    description: 'Device executable',
    category: 'non-image',
} as const satisfies FormatDefinition

/** Text file */
export const Text = {
    code: 0x3004,
    name: 'Text',
    description: 'Text file',
    category: 'non-image',
} as const satisfies FormatDefinition

/** HTML file */
export const HTML = {
    code: 0x3005,
    name: 'HTML',
    description: 'HTML file',
    category: 'non-image',
} as const satisfies FormatDefinition

/** Digital Print Order Format */
export const DPOF = {
    code: 0x3006,
    name: 'DPOF',
    description: 'Digital Print Order Format',
    category: 'non-image',
} as const satisfies FormatDefinition

/** Audio Interchange File Format */
export const AIFF = {
    code: 0x3007,
    name: 'AIFF',
    description: 'Audio Interchange File Format',
    category: 'audio',
} as const satisfies FormatDefinition

/** Waveform Audio File Format */
export const WAV = {
    code: 0x3008,
    name: 'WAV',
    description: 'Waveform Audio File Format',
    category: 'audio',
} as const satisfies FormatDefinition

/** MPEG Audio Layer 3 */
export const MP3 = {
    code: 0x3009,
    name: 'MP3',
    description: 'MPEG Audio Layer 3',
    category: 'audio',
} as const satisfies FormatDefinition

/** Audio Video Interleave */
export const AVI = {
    code: 0x300a,
    name: 'AVI',
    description: 'Audio Video Interleave',
    category: 'video',
} as const satisfies FormatDefinition

/** MPEG video */
export const MPEG = {
    code: 0x300b,
    name: 'MPEG',
    description: 'MPEG video',
    category: 'video',
} as const satisfies FormatDefinition

/** Advanced Systems Format */
export const ASF = {
    code: 0x300c,
    name: 'ASF',
    description: 'Advanced Systems Format',
    category: 'video',
} as const satisfies FormatDefinition

/** QuickTime movie */
export const QuickTime = {
    code: 0x300d,
    name: 'QuickTime',
    description: 'QuickTime movie',
    category: 'video',
} as const satisfies FormatDefinition

/** XML file */
export const XML = {
    code: 0x300e,
    name: 'XML',
    description: 'XML file',
    category: 'other',
} as const satisfies FormatDefinition

/** Undefined image object */
export const UndefinedImage = {
    code: 0x3800,
    name: 'UndefinedImage',
    description: 'Undefined image object',
    category: 'image',
} as const satisfies FormatDefinition

/** Exchangeable Image File Format JPEG */
export const EXIF_JPEG = {
    code: 0x3801,
    name: 'EXIF_JPEG',
    description: 'Exchangeable Image File Format JPEG',
    category: 'image',
} as const satisfies FormatDefinition

/** Tag Image File Format for Electronic Photography */
export const TIFF_EP = {
    code: 0x3802,
    name: 'TIFF_EP',
    description: 'Tag Image File Format for Electronic Photography',
    category: 'image',
} as const satisfies FormatDefinition

/** FlashPix */
export const FlashPix = {
    code: 0x3803,
    name: 'FlashPix',
    description: 'FlashPix',
    category: 'image',
} as const satisfies FormatDefinition

/** Windows Bitmap */
export const BMP = {
    code: 0x3804,
    name: 'BMP',
    description: 'Windows Bitmap',
    category: 'image',
} as const satisfies FormatDefinition

/** Camera Image File Format */
export const CIFF = {
    code: 0x3805,
    name: 'CIFF',
    description: 'Camera Image File Format',
    category: 'image',
} as const satisfies FormatDefinition

/** Graphics Interchange Format */
export const GIF = {
    code: 0x3807,
    name: 'GIF',
    description: 'Graphics Interchange Format',
    category: 'image',
} as const satisfies FormatDefinition

/** JPEG File Interchange Format */
export const JFIF = {
    code: 0x3808,
    name: 'JFIF',
    description: 'JPEG File Interchange Format',
    category: 'image',
} as const satisfies FormatDefinition

/** PhotoCD Image Pac */
export const PCD = {
    code: 0x3809,
    name: 'PCD',
    description: 'PhotoCD Image Pac',
    category: 'image',
} as const satisfies FormatDefinition

/** Quickdraw Picture */
export const PICT = {
    code: 0x380a,
    name: 'PICT',
    description: 'Quickdraw Picture',
    category: 'image',
} as const satisfies FormatDefinition

/** Portable Network Graphics */
export const PNG = {
    code: 0x380b,
    name: 'PNG',
    description: 'Portable Network Graphics',
    category: 'image',
} as const satisfies FormatDefinition

/** Tag Image File Format */
export const TIFF = {
    code: 0x380d,
    name: 'TIFF',
    description: 'Tag Image File Format',
    category: 'image',
} as const satisfies FormatDefinition

/** Tag Image File Format for Information Technology */
export const TIFF_IT = {
    code: 0x380e,
    name: 'TIFF_IT',
    description: 'Tag Image File Format for Information Technology',
    category: 'image',
} as const satisfies FormatDefinition

/** JPEG 2000 baseline */
export const JP2 = {
    code: 0x380f,
    name: 'JP2',
    description: 'JPEG 2000 baseline',
    category: 'image',
} as const satisfies FormatDefinition

/** JPEG 2000 extended */
export const JPX = {
    code: 0x3810,
    name: 'JPX',
    description: 'JPEG 2000 extended',
    category: 'image',
} as const satisfies FormatDefinition

/** Digital Negative */
export const DNG = {
    code: 0x3811,
    name: 'DNG',
    description: 'Digital Negative',
    category: 'image',
} as const satisfies FormatDefinition

// ============================================================================
// Format Registry
// ============================================================================

export const formatRegistry = {
    Undefined,
    Association,
    Script,
    Executable,
    Text,
    HTML,
    DPOF,
    AIFF,
    WAV,
    MP3,
    AVI,
    MPEG,
    ASF,
    QuickTime,
    XML,
    UndefinedImage,
    EXIF_JPEG,
    TIFF_EP,
    FlashPix,
    BMP,
    CIFF,
    GIF,
    JFIF,
    PCD,
    PICT,
    PNG,
    TIFF,
    TIFF_IT,
    JP2,
    JPX,
    DNG,
} as const satisfies Record<string, FormatDefinition>

export type FormatRegistry = typeof formatRegistry
