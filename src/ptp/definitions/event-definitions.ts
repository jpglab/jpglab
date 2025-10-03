import { EventDefinition } from '@ptp/types/event';

export const eventDefinitions = [
    {
        code: 0x4000,
        name: 'Undefined',
        description: 'Undefined event',
        parameters: []
    },
    {
        code: 0x4001,
        name: 'CancelTransaction',
        description: 'Cancel a transaction',
        transactionId: 'Transaction to cancel',
        parameters: []
    },
    {
        code: 0x4002,
        name: 'ObjectAdded',
        description: 'New data object added to device',
        parameters: [
            {
                name: 'ObjectHandle',
                description: 'Handle of the new object',
                type: 'ObjectHandle'
            }
        ]
    },
    {
        code: 0x4003,
        name: 'ObjectRemoved',
        description: 'Data object removed from device',
        parameters: [
            {
                name: 'ObjectHandle',
                description: 'Handle of the removed object',
                type: 'ObjectHandle'
            }
        ]
    },
    {
        code: 0x4004,
        name: 'StoreAdded',
        description: 'New store added to device',
        parameters: [
            {
                name: 'StorageID',
                description: 'ID of the new store',
                type: 'StorageID'
            }
        ]
    },
    {
        code: 0x4005,
        name: 'StoreRemoved',
        description: 'Store removed from device',
        parameters: [
            {
                name: 'StorageID',
                description: 'ID of the removed store',
                type: 'StorageID'
            }
        ]
    },
    {
        code: 0x4006,
        name: 'DevicePropChanged',
        description: 'Device property value changed',
        parameters: [
            {
                name: 'DevicePropCode',
                description: 'Property that changed',
                type: 'DevicePropCode'
            }
        ]
    },
    {
        code: 0x4007,
        name: 'ObjectInfoChanged',
        description: 'Object information changed',
        parameters: [
            {
                name: 'ObjectHandle',
                description: 'Handle of the object',
                type: 'ObjectHandle'
            }
        ]
    },
    {
        code: 0x4008,
        name: 'DeviceInfoChanged',
        description: 'Device information or capabilities changed',
        parameters: []
    },
    {
        code: 0x4009,
        name: 'RequestObjectTransfer',
        description: 'Responder requests object transfer',
        parameters: [
            {
                name: 'ObjectHandle',
                description: 'Handle of the requested object',
                type: 'ObjectHandle'
            }
        ]
    },
    {
        code: 0x400A,
        name: 'StoreFull',
        description: 'Store is full',
        parameters: [
            {
                name: 'StorageID',
                description: 'ID of the full store',
                type: 'StorageID'
            }
        ]
    },
    {
        code: 0x400B,
        name: 'DeviceReset',
        description: 'Device has been reset',
        parameters: []
    },
    {
        code: 0x400C,
        name: 'StorageInfoChanged',
        description: 'Storage information changed',
        parameters: [
            {
                name: 'StorageID',
                description: 'ID of the changed store',
                type: 'StorageID'
            }
        ]
    },
    {
        code: 0x400D,
        name: 'CaptureComplete',
        description: 'Capture operation completed',
        transactionId: 'Transaction ID of the capture',
        parameters: []
    },
    {
        code: 0x400E,
        name: 'UnreportedStatus',
        description: 'Unreported status change occurred',
        parameters: []
    }
] as const satisfies readonly EventDefinition[];

// Type to extract event names from the actual definitions
export type EventName = typeof eventDefinitions[number]['name'];

// Type to extract a specific event by name
export type GetEvent<N extends EventName> = Extract<typeof eventDefinitions[number], { name: N }>;

export const eventsByCode = new Map(
    eventDefinitions.map(e => [e.code, e])
);

export const eventsByName = new Map(
    eventDefinitions.map(e => [e.name, e])
);

export function getEventByCode(code: number): EventDefinition | undefined {
    return eventsByCode.get(code as any) as EventDefinition | undefined;
}

export function getEventByName(name: string): EventDefinition | undefined {
    return eventsByName.get(name as any) as EventDefinition | undefined;
}