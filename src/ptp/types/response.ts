export interface ResponseDefinition {
    code: number;
    name: string;
    description: string;
}

export type ResponseCode = number;

export function isStandardResponseCode(code: number): boolean {
    return (code & 0xF000) === 0x2000;
}

export function isVendorResponseCode(code: number): boolean {
    return (code & 0x8000) === 0x8000 && (code & 0xF000) === 0xA000;
}