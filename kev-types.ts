export type Code = number & { _brand: 'code' }
export type Operation = { [OperationName: string]: number }
export const code = (code: number) => code as Code

export type DataType =
    | 'UINT32'
    | 'STRING'
    | 'UINT8'
    | 'UINT16'
    | 'UINT64'
    | 'INT32'
    | 'INT64'
    | 'FLOAT'
    | 'DOUBLE'
    | 'BOOLEAN'
    | 'ENUM'
    | 'ARRAY'
    | 'STRUCT'
    | 'UNION'
    | 'VOID'

export const Operations: Operation = {
    OPEN_SESSION: 0x1002,
}

export type Parameter<Op extends typeof Operations, DT extends DataType> = {
    operation: keyof Op
    name: string
    type: DT
    description: string
    possibleValues?: {
        name: string
        description: string
        value: DT
    }[]
}

export type OperationDefinition<Op extends Operation> = {
    code: keyof Op
    name: keyof typeof Operations
    description: string
    parameters: Parameter<keyof typeof Operations, any>[]
}

const operationsDefinitions: OperationDefinition<typeof Operations>[] = [
    {
        code: Operations.OPEN_SESSION,
        name: 'OPEN_SESSION',
        description: 'Open a session with the camera',
        parameters: [{ name: 'sessionID', type: 'UINT32', description: 'The session ID to open' }],
    },
] as const

export const sendOperation = (operation: keyof typeof Operations, parameters: any) => {
    console.log(operation, parameters)
}

sendOperation(operationsDefinitions[0], { sessionID: 12345 })
