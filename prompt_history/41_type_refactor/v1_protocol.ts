// ============================================================================
// Core Type Definitions
// ============================================================================

export type INT32 = number;

// Codec type definitions
export interface KeyValueCodec<T = any> {
  type: 'keyvalue';
  map: Record<string, T>;
}

export interface FunctionCodec<T = any> {
  type: 'function';
  encode: (value: T) => INT32;
  decode: (value: INT32) => T;
}

export type Codec<T = any> = KeyValueCodec<T> | FunctionCodec<T>;

// Parameter definition
export interface Parameter<TName extends string = string, TValue = any> {
  name: TName;
  codec: Codec<TValue>;
}

// Property definition
export interface Property<TName extends string = string, TValue = any> {
  name: TName;
  dataType: string;
  codec: Codec<TValue>;
}

// Operation definition with up to 5 parameters
export interface Operation<
  TName extends string = string,
  TParams extends readonly Parameter[] = readonly Parameter[]
> {
  name: TName;
  description: string;
  parameters: TParams & { length: 0 | 1 | 2 | 3 | 4 | 5 };
}

// ============================================================================
// Helper Types for Type Extraction
// ============================================================================

// Extract the value type from a codec
type CodecValue<C extends Codec> = 
  C extends KeyValueCodec<infer T> ? T :
  C extends FunctionCodec<infer T> ? T :
  never;

// Convert parameters array to an object type
type ParamsToObject<P extends readonly Parameter[]> = {
  [K in P[number] as K['name']]: CodecValue<K['codec']>
};

// Check if parameters array is empty
type IsEmptyParams<P extends readonly Parameter[]> = 
  P extends readonly [] ? true : false;

// ============================================================================
// Protocol Definition Type
// ============================================================================

export interface ProtocolDefinition<
  TOperations extends readonly Operation[] = readonly Operation[],
  TProperties extends readonly Property[] = readonly Property[]
> {
  operations: TOperations;
  properties: TProperties;
}

// ============================================================================
// Codec Helper Functions
// ============================================================================

export function createKeyValueCodec<T>(map: Record<string, T>): KeyValueCodec<T> {
  return { type: 'keyvalue', map };
}

export function createFunctionCodec<T>(
  encode: (value: T) => INT32,
  decode: (value: INT32) => T
): FunctionCodec<T> {
  return { type: 'function', encode, decode };
}

// Encode a value using a codec
function encodeValue<T>(codec: Codec<T>, value: T): INT32 {
  if (codec.type === 'keyvalue') {
    const entry = Object.entries(codec.map).find(([_, v]) => v === value);
    if (!entry) throw new Error(`Value not found in codec map: ${value}`);
    return parseInt(entry[0]);
  } else {
    return codec.encode(value);
  }
}

// Decode a value using a codec
function decodeValue<T>(codec: Codec<T>, value: INT32): T {
  if (codec.type === 'keyvalue') {
    const result = codec.map[value.toString()];
    if (result === undefined) throw new Error(`Key not found in codec map: ${value}`);
    return result;
  } else {
    return codec.decode(value);
  }
}

// ============================================================================
// Protocol Client
// ============================================================================

export class ProtocolClient<P extends ProtocolDefinition> {
  constructor(
    private protocol: P,
    private transport: DeviceTransport
  ) {}

  // Send an operation with type-safe parameters
  async sendOperation<
    OpName extends P['operations'][number]['name'],
    Op extends Extract<P['operations'][number], { name: OpName }>
  >(
    operationName: OpName,
    ...args: IsEmptyParams<Op['parameters']> extends true 
      ? [] 
      : [params: ParamsToObject<Op['parameters']>]
  ): Promise<void> {
    const operation = this.protocol.operations.find(
      op => op.name === operationName
    ) as Op | undefined;

    if (!operation) {
      throw new Error(`Operation not found: ${operationName}`);
    }

    const params = args[0] as ParamsToObject<Op['parameters']> | undefined;
    const encodedParams: INT32[] = [];

    if (operation.parameters.length > 0 && params) {
      for (const param of operation.parameters) {
        const value = params[param.name];
        if (value === undefined) {
          throw new Error(`Missing parameter: ${param.name}`);
        }
        encodedParams.push(encodeValue(param.codec, value));
      }
    }

    await this.transport.sendOperation(operationName, encodedParams);
  }

  // Get a property value with proper typing
  async getProperty<
    PropName extends P['properties'][number]['name'],
    Prop extends Extract<P['properties'][number], { name: PropName }>
  >(propertyName: PropName): Promise<CodecValue<Prop['codec']>> {
    const property = this.protocol.properties.find(
      prop => prop.name === propertyName
    ) as Prop | undefined;

    if (!property) {
      throw new Error(`Property not found: ${propertyName}`);
    }

    const rawValue = await this.transport.getProperty(propertyName);
    return decodeValue(property.codec, rawValue);
  }

  // Set a property value with proper typing
  async setProperty<
    PropName extends P['properties'][number]['name'],
    Prop extends Extract<P['properties'][number], { name: PropName }>
  >(
    propertyName: PropName,
    value: CodecValue<Prop['codec']>
  ): Promise<void> {
    const property = this.protocol.properties.find(
      prop => prop.name === propertyName
    ) as Prop | undefined;

    if (!property) {
      throw new Error(`Property not found: ${propertyName}`);
    }

    const encodedValue = encodeValue(property.codec, value);
    await this.transport.setProperty(propertyName, encodedValue);
  }
}

// ============================================================================
// Transport Interface (to be implemented by actual device communication)
// ============================================================================

export interface DeviceTransport {
  sendOperation(name: string, params: INT32[]): Promise<void>;
  getProperty(name: string): Promise<INT32>;
  setProperty(name: string, value: INT32): Promise<void>;
}