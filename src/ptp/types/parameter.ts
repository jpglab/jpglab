import { CodecDefinition } from '@ptp/types/codec';

export interface ParameterDefinition<T = any> {
    name: string;
    description: string;
    codec: CodecDefinition<T>;
    required: boolean;
    defaultValue?: T;
}