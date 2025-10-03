import { CodecDefinition } from '@ptp/types/codec';

export type PropertyAccess = 'Get' | 'GetSet';

export interface PropertyDefinition<T = any> {
    code: number;
    name: string;
    description: string;
    datatype: number;
    access: PropertyAccess;
    codec: CodecDefinition<T>;
    defaultValue?: T;
    currentValue?: T;
}

export type DevicePropCode = number;

export function isStandardPropertyCode(code: number): boolean {
    return (code & 0xF000) === 0x5000;
}

export function isVendorPropertyCode(code: number): boolean {
    return (code & 0x8000) === 0x8000 && (code & 0xF000) === 0xD000;
}