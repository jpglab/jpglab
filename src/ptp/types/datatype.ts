import { CodecDefinition } from '@ptp/types/codec';

export interface DatatypeDefinition<T = any> {
    code: number;
    name: string;
    description: string;
    codec: CodecDefinition<T>;
}

export type DatatypeCode = number;