import { ParameterDefinition } from '@ptp/types/parameter';
import { CodecDefinition } from '@ptp/types/codec';

export type DataDirection = 'none' | 'in' | 'out';

export interface OperationDefinition<T = number | bigint | string | object | Uint8Array | number[]> {
    code: number;
    name: string;
    description: string;
    dataDirection: DataDirection;
    dataCodec?: CodecDefinition<T>;
    operationParameters: [
        ParameterDefinition?,
        ParameterDefinition?,
        ParameterDefinition?,
        ParameterDefinition?,
        ParameterDefinition?
    ];
    responseParameters: [
        ParameterDefinition?,
        ParameterDefinition?,
        ParameterDefinition?,
        ParameterDefinition?,
        ParameterDefinition?
    ];
}

export type OperationCode = number;

export function isStandardOperationCode(code: number): boolean {
    return (code & 0xF000) === 0x1000;
}

export function isVendorOperationCode(code: number): boolean {
    return (code & 0x8000) === 0x8000 && (code & 0xF000) === 0x9000;
}