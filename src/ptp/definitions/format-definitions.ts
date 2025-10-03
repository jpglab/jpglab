import { FormatDefinition } from '@ptp/types/format'

export const formatDefinitions = [
    {
        code: 0x3000,
        name: 'Undefined',
        description: 'Undefined object',
        category: 'non-image',
    },
    {
        code: 0x3001,
        name: 'Association',
        description: 'Object association (folder)',
        category: 'non-image',
    },
    {
        code: 0x3002,
        name: 'Script',
        description: 'Device script',
        category: 'non-image',
    },
    {
        code: 0x3003,
        name: 'Executable',
        description: 'Device executable',
        category: 'non-image',
    },
    {
        code: 0x3004,
        name: 'Text',
        description: 'Text file',
        category: 'non-image',
    },
    {
        code: 0x3005,
        name: 'HTML',
        description: 'HTML file',
        category: 'non-image',
    },
    {
        code: 0x3006,
        name: 'DPOF',
        description: 'Digital Print Order Format',
        category: 'non-image',
    },
    {
        code: 0x3007,
        name: 'AIFF',
        description: 'Audio Interchange File Format',
        category: 'audio',
    },
    {
        code: 0x3008,
        name: 'WAV',
        description: 'Waveform Audio File Format',
        category: 'audio',
    },
    {
        code: 0x3009,
        name: 'MP3',
        description: 'MPEG Audio Layer 3',
        category: 'audio',
    },
    {
        code: 0x300a,
        name: 'AVI',
        description: 'Audio Video Interleave',
        category: 'video',
    },
    {
        code: 0x300b,
        name: 'MPEG',
        description: 'MPEG video',
        category: 'video',
    },
    {
        code: 0x300c,
        name: 'ASF',
        description: 'Advanced Systems Format',
        category: 'video',
    },
    {
        code: 0x300d,
        name: 'QuickTime',
        description: 'QuickTime movie',
        category: 'video',
    },
    {
        code: 0x300e,
        name: 'XML',
        description: 'XML file',
        category: 'other',
    },
    {
        code: 0x3800,
        name: 'UndefinedImage',
        description: 'Undefined image object',
        category: 'image',
    },
    {
        code: 0x3801,
        name: 'EXIF_JPEG',
        description: 'Exchangeable Image File Format JPEG',
        category: 'image',
    },
    {
        code: 0x3802,
        name: 'TIFF_EP',
        description: 'Tag Image File Format for Electronic Photography',
        category: 'image',
    },
    {
        code: 0x3803,
        name: 'FlashPix',
        description: 'FlashPix',
        category: 'image',
    },
    {
        code: 0x3804,
        name: 'BMP',
        description: 'Windows Bitmap',
        category: 'image',
    },
    {
        code: 0x3805,
        name: 'CIFF',
        description: 'Camera Image File Format',
        category: 'image',
    },
    {
        code: 0x3807,
        name: 'GIF',
        description: 'Graphics Interchange Format',
        category: 'image',
    },
    {
        code: 0x3808,
        name: 'JFIF',
        description: 'JPEG File Interchange Format',
        category: 'image',
    },
    {
        code: 0x3809,
        name: 'PCD',
        description: 'PhotoCD Image Pac',
        category: 'image',
    },
    {
        code: 0x380a,
        name: 'PICT',
        description: 'Quickdraw Picture',
        category: 'image',
    },
    {
        code: 0x380b,
        name: 'PNG',
        description: 'Portable Network Graphics',
        category: 'image',
    },
    {
        code: 0x380d,
        name: 'TIFF',
        description: 'Tag Image File Format',
        category: 'image',
    },
    {
        code: 0x380e,
        name: 'TIFF_IT',
        description: 'Tag Image File Format for Information Technology',
        category: 'image',
    },
    {
        code: 0x380f,
        name: 'JP2',
        description: 'JPEG 2000 baseline',
        category: 'image',
    },
    {
        code: 0x3810,
        name: 'JPX',
        description: 'JPEG 2000 extended',
        category: 'image',
    },
    {
        code: 0x3811,
        name: 'DNG',
        description: 'Digital Negative',
        category: 'image',
    },
] as const satisfies readonly FormatDefinition[]

export const formatsByCode: Map<number, FormatDefinition> = new Map(
    formatDefinitions.map(f => [f.code, f])
)

export const formatsByName: Map<string, FormatDefinition> = new Map(
    formatDefinitions.map(f => [f.name, f])
)

export function getFormatByCode(code: number): FormatDefinition | undefined {
    return formatsByCode.get(code)
}

export function getFormatByName(name: string): FormatDefinition | undefined {
    return formatsByName.get(name)
}

export function isImageFormat(code: number): boolean {
    const format = getFormatByCode(code)
    return format?.category === 'image'
}

export function isAssociation(code: number): boolean {
    return code === 0x3001
}
