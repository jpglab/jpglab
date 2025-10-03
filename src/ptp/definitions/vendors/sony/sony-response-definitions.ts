import { ResponseDefinition } from '@ptp/types/response'

export const sonyResponseDefinitions = [
    {
        code: 0xa101,
        name: 'AuthenticationFailed',
        description:
            'Indicates that the major version of the connected host is less than that of the camera. It also indicates that authentication fails due to some other factor.',
    },
    {
        code: 0xa102,
        name: 'PasswordLengthOverMax',
        description: 'Indicates that the password length is over max.',
    },
    {
        code: 0xa103,
        name: 'PasswordIncludesInvalidCharacter',
        description: 'Indicates that the password includes invalid character.',
    },
    {
        code: 0xa104,
        name: 'FeatureVersionInvalidValue',
        description: 'Indicates that the feature version is invalid value.',
    },
    {
        code: 0xa105,
        name: 'TemporaryStorageFull',
        description: 'Indicates that the temporary storage is full.',
    },
    {
        code: 0xa106,
        name: 'CameraStatusError',
        description: 'Indicates that a camera status error occurred.',
    },
] as const satisfies readonly ResponseDefinition[]

export const sonyResponsesByCode = new Map(sonyResponseDefinitions.map(r => [r.code, r]))

export const sonyResponsesByName = new Map(sonyResponseDefinitions.map(r => [r.name, r]))

export function getSonyResponseByCode(code: number): ResponseDefinition | undefined {
    return sonyResponsesByCode.get(code as any)
}

export function getSonyResponseByName(name: string): ResponseDefinition | undefined {
    return sonyResponsesByName.get(name as any)
}
