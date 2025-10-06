import { FormatDefinition } from '@ptp/types/format'

export const sonyFormatDefinitions = [
    {
        code: 0xb101,
        name: 'RAW',
        description: 'For RAW File',
        category: 'image',
    },
    {
        code: 0xb110,
        name: 'HEIF',
        description: 'For HEIF File',
        category: 'image',
    },
    {
        code: 0xb301,
        name: 'MPO',
        description: 'For MPO File',
        category: 'image',
    },
    {
        code: 0xb982,
        name: 'MP4',
        description: 'For MP4 File',
        category: 'video',
    },
] as const satisfies readonly FormatDefinition[]

export const sonyFormatsByCode = new Map(sonyFormatDefinitions.map(f => [f.code, f]))

export const sonyFormatsByName = new Map(sonyFormatDefinitions.map(f => [f.name, f]))

export function getSonyFormatByCode(code: number): FormatDefinition | undefined {
    return sonyFormatsByCode.get(code as any)
}

export function getSonyFormatByName(name: string): FormatDefinition | undefined {
    return sonyFormatsByName.get(name as any)
}
