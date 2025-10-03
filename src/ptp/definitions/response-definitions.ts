import { ResponseDefinition } from '@ptp/types/response';

export const responseDefinitions = [
    {
        code: 0x2000,
        name: 'Undefined',
        description: 'Undefined response'
    },
    {
        code: 0x2001,
        name: 'OK',
        description: 'Operation completed successfully'
    },
    {
        code: 0x2002,
        name: 'GeneralError',
        description: 'Operation did not complete, unknown error'
    },
    {
        code: 0x2003,
        name: 'SessionNotOpen',
        description: 'Session handle is not a currently open session'
    },
    {
        code: 0x2004,
        name: 'InvalidTransactionID',
        description: 'TransactionID is zero or does not refer to a valid transaction'
    },
    {
        code: 0x2005,
        name: 'OperationNotSupported',
        description: 'OperationCode appears valid but responder does not support it'
    },
    {
        code: 0x2006,
        name: 'ParameterNotSupported',
        description: 'Non-zero parameter specified but not used for this operation'
    },
    {
        code: 0x2007,
        name: 'IncompleteTransfer',
        description: 'Transfer did not complete, data should be discarded'
    },
    {
        code: 0x2008,
        name: 'InvalidStorageID',
        description: 'StorageID does not refer to a valid store on the device'
    },
    {
        code: 0x2009,
        name: 'InvalidObjectHandle',
        description: 'ObjectHandle does not refer to a valid object on the device'
    },
    {
        code: 0x200A,
        name: 'DevicePropNotSupported',
        description: 'DevicePropCode appears valid but not supported by device'
    },
    {
        code: 0x200B,
        name: 'InvalidObjectFormatCode',
        description: 'Device does not support the ObjectFormatCode in this context'
    },
    {
        code: 0x200C,
        name: 'StoreFull',
        description: 'Store referred to by operation is full'
    },
    {
        code: 0x200D,
        name: 'ObjectWriteProtected',
        description: 'Object referred to by operation is write-protected'
    },
    {
        code: 0x200E,
        name: 'StoreReadOnly',
        description: 'Store referred to by operation is read-only'
    },
    {
        code: 0x200F,
        name: 'AccessDenied',
        description: 'Access to data has been denied'
    },
    {
        code: 0x2010,
        name: 'NoThumbnailPresent',
        description: 'Object exists but contains no producible thumbnail'
    },
    {
        code: 0x2011,
        name: 'SelfTestFailed',
        description: 'Device failed internal self-test'
    },
    {
        code: 0x2012,
        name: 'PartialDeletion',
        description: 'Only a subset of objects were deleted'
    },
    {
        code: 0x2013,
        name: 'StoreNotAvailable',
        description: 'Store is not physically available'
    },
    {
        code: 0x2014,
        name: 'SpecificationByFormatUnsupported',
        description: 'Operation cannot specify action by format'
    },
    {
        code: 0x2015,
        name: 'NoValidObjectInfo',
        description: 'SendObject attempted without successful SendObjectInfo'
    },
    {
        code: 0x2016,
        name: 'InvalidCodeFormat',
        description: 'Data code does not have correct format'
    },
    {
        code: 0x2017,
        name: 'UnknownVendorCode',
        description: 'Vendor-extended code not supported by device'
    },
    {
        code: 0x2018,
        name: 'CaptureAlreadyTerminated',
        description: 'Capture session already terminated'
    },
    {
        code: 0x2019,
        name: 'DeviceBusy',
        description: 'Device or store is busy'
    },
    {
        code: 0x201A,
        name: 'InvalidParentObject',
        description: 'Object is not of type Association'
    },
    {
        code: 0x201B,
        name: 'InvalidDevicePropFormat',
        description: 'DevicePropDesc data set is incorrect size or format'
    },
    {
        code: 0x201C,
        name: 'InvalidDevicePropValue',
        description: 'DeviceProperty value not permitted by device'
    },
    {
        code: 0x201D,
        name: 'InvalidParameter',
        description: 'Parameter value is not legal'
    },
    {
        code: 0x201E,
        name: 'SessionAlreadyOpen',
        description: 'Session is already open'
    },
    {
        code: 0x201F,
        name: 'TransactionCancelled',
        description: 'Operation interrupted by manual cancellation'
    },
    {
        code: 0x2020,
        name: 'SpecificationOfDestinationUnsupported',
        description: 'Responder does not support initiator-specified destination'
    },
    {
        code: 0x2021,
        name: 'InvalidEnumHandle',
        description: 'EnumID parameter is invalid'
    },
    {
        code: 0x2022,
        name: 'NoStreamEnabled',
        description: 'Streaming operation started without enabled streams'
    },
    {
        code: 0x2023,
        name: 'InvalidDataset',
        description: 'Data set is malformed or has incorrect size'
    }
] as const satisfies readonly ResponseDefinition[];

export const responsesByCode = new Map(
    responseDefinitions.map(r => [r.code, r])
);

export const responsesByName = new Map(
    responseDefinitions.map(r => [r.name, r])
);

export function getResponseByCode(code: number): ResponseDefinition | undefined {
    return responsesByCode.get(code as any);
}

export function getResponseByName(name: string): ResponseDefinition | undefined {
    return responsesByName.get(name as any);
}