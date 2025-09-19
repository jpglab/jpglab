We are building an API around Picture Transfer Protocol (PTP). You can find documentation about our progress in the `prompt_history/` folder. You should read through all of those first so you are familiar with the goals and our work so far.

We have also amassed a vast collection of knowledge on PTP (Picture Transfer Protocol). You have access to all of this through tool invocation. You can find more info on this in AGENTS.md. You should reference these documents heavily to influence the design of our system and the low level features.

Additional rules to keep in mind

- We have a wealth of knowledge at our fingertips via notes, basic memory, and MCP tools. Use them.
- Only create notes after asking me and I confirm that the feature we set out to build is working correctly. This will help us avoid creating misinformation in our knowledge base.
- Do all of this in TypeScript with modern tooling including bun, bunx, tsx, vite, and vitest. If you make any webpages they should be in React and be served with Vite.
- Pre-celebration, self promotion, self-aggrandizing, and false hope are not allowed. Be humble and honest when things aren't working completely.
- Always use typescript; never javascript.
- Make everything super easy to run. Keep the `scripts` block of `package.json` tidy and up-to-date. This should match 1-to-1 with any functionality in the app such as various examples or running an app, plus linting/building/formatting etc.
- Use vite or existing tooling rather than rolling your own build toolkit.
- In no way, shape, or form should you implement a "mock" or "stub" solution to revisit later. We are building the real, full solution now.
- ANY vendor-specific code belongs in the `src/vendors` folder. It does not belong in the core or transport layers. Do not make any logic branches in the core or transport layers relating to vendor specific functionality.

Our goals at this stage are to build the Sony implementation of a camera and its connection/authentication/handshake process (`src/vendors/sony/sony.ts`) so it is ready to process additional commands. Once the implementation is built make a script to test it and output debug information that YOU can run and inspect if everything is working as expected.

This is the authentication sequence (-> means from initiator [our api], <- means from responder [the camera])

PTP / MTP Connected
-> OpenSession
<- OpenSession
PTP / MTP Standard Communication
-> SDIO_Connect (PhaseType=1, KeyCode1&2=0)
<- Data (0)
<- Response (OK)
-> SDIO_Connect (PhaseType=2, KeyCode1&2=0)
<- Data (0)
<- Response (OK)
-> SDIO_GetExtdeviceInfo (InitiatorVersion=0x012C)
<- Data (SDIExtDeviceInfo Dataset)
<- Response (OK)
-> SDIO_Connect (PhaseType=3, KeyCode1&2=0)
<- Data (0)
<- Response (OK)
PTP Remote Protocol Connected

We have the core discovery functionality and we are getting up until Phase 1 SDIO_Connect working.

bunx tsx scripts/test-sony-debug.ts

=== Direct USB Connection Test ===
✓ Found Sony camera
✓ Device opened
✓ Found PTP interface at index 0
✓ Interface claimed
Bulk IN endpoint: 0x81
Bulk OUT endpoint: 0x2
Interrupt IN endpoint: 0x83
✓ Endpoints found

=== Testing OpenSession ===
Sending OpenSession command...
Command: 14 00 00 00 01 00 02 10 01 00 00 00 01 00 00 00 00 00 00 00
✓ Command sent
Waiting for response...
✓ Received 12 bytes
Response: 0c 00 00 00 03 00 01 20 01 00 00 00
Response: Length=12, Type=3, Code=0x2001, TransID=1
✓ OpenSession successful!

=== Testing Sony SDIO_Connect Phase 1 ===
Sending SDIO_Connect Phase 1...
Command: 1c 00 00 00 01 00 01 92 02 00 00 00 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
✓ Command sent
Waiting for SDIO_Connect data...
✓ Received data: 20 bytes
Data: 14 00 00 00 02 00 01 92 02 00 00 00 00 00 00 00 00 00 00 00
Waiting for SDIO_Connect response...
✓ Received 12 bytes
Response: 0c 00 00 00 03 00 01 20 02 00 00 00
SDIO_Connect response code: 0x2001
✓ SDIO_Connect Phase 1 successful!

✗ Error: Error: Can't close device with a pending request

After the connection between the Initiator and the camera has been established, the Initiator must initiate
a connection protocol using SDIO_Connect and SDIO_GetExtDeviceInfo.

The Initiator must send SDIO_Connect twice at the beginning.

In the first call, PhaseType should be 0x01 and 0x02 in the second. Subsequently,
SDIO_GetExtDeviceInfo should be sent. The Initiator can obtain the protocol version using the response
code; if the version is okay, call SDIO_Connect again and establish the connection.

When SDIO_GetExtDeviceInfo fails (returned data size is zero), retry until successful. After succeeding,
SDIO_Connect must be executed with PhaseType=0x03.

Camera Control PTP has its version defined by its specifying functions. This version will change if a
supporting function in any command or property changes. The Initiator can check the “Extension
Version” in the response code of SDIO_GetExtDeviceInfo and confirm it is equal to 0x012C. Camera
functionalities vary among firmware. The Initiator should check the array of properties and control codes.

---

# Operation Reference

## OpenSession

| Field                | Value                                                                             |
| -------------------- | --------------------------------------------------------------------------------- |
| OperationCode        | 0x1002                                                                            |
| Operation Parameter1 | SessionID                                                                         |
| Operation Parameter2 | none                                                                              |
| Operation Parameter3 | none                                                                              |
| Data                 | none                                                                              |
| Data direction       | N/A                                                                               |
| Response Code        | OK, Parameter_Not_Supported, Invalid_Parameter, Session_Already_Open, Device_Busy |
| Response Parameter1  | none                                                                              |
| Response Parameter2  | none                                                                              |
| Response Parameter3  | none                                                                              |

Description: causes device to allocate resources, assigns handles to data objects if necessary, and performs any connection-specific initialization. The SessionID will then be used by all other operations during the session. Unless otherwise specified, an open session is required to invoke an operation. If the first parameter is 0x00000000, the operation should fail with a response of Invalid_Parameter. If a session is already open, and the device does not support multiple sessions, the response Session\_ Already_Open should be returned, with the SessionID of the already open session as the first response parameter. The response Session_Already_Open should also be used if the device supports multiple sessions, but a session with that ID is already open. If the device supports multiple sessions, and the maximum number of sessions is open, the device should respond with Device_Busy.

The SessionID and TransactionID fields of the operation data set should both be set to 0x00000000 for this operation.

## SDIO_Connect

This is for the authentication handshake.

| Field                 | Value                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Operation Parameter 1 | 0x9201                                                                                                                           |
| Operation Parameter 1 | Phase Type                                                                                                                       |
| Operation Parameter 2 | KeyCode1                                                                                                                         |
| Operation Parameter 3 | KeyCode2                                                                                                                         |
| Operation Parameter 4 | None                                                                                                                             |
| OperationParameter 5  | None                                                                                                                             |
| Data                  | UINT64 Value                                                                                                                     |
| Data Direction        | R->I                                                                                                                             |
| Response Code         | OK, Operation_Not_Supported, Session_Not_Open, Invalid_TransactionID,Device_Busy, Parameter_Not_Supported, Authentication_Failed |
| ResponseParameter 1   | None                                                                                                                             |
| ResponseParameter 2   | None                                                                                                                             |
| ResponseParameter 3   | None                                                                                                                             |
| ResponseParameter 4   | None                                                                                                                             |
| ResponseParameter 5   | None                                                                                                                             |

The Initiator should send this command with both KeyCode1 and KeyCode2, which are 0x00000000.

## SDIO_GetExtDeviceInfo

Get the protocol version and the supported properties of the connected device.

| Field                | Value                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Operation Code       | 0x9202                                                                                                                            |
| OperationParameter 1 | Initiator Version                                                                                                                 |
| OperationParameter 2 | Flag of Device Property Option                                                                                                    |
| OperationParameter 3 | None                                                                                                                              |
| OperationParameter 4 | None                                                                                                                              |
| OperationParameter 5 | None                                                                                                                              |
| Data                 | SDIExtDeviceInfo Dataset                                                                                                          |
| Data Direction       | R->I                                                                                                                              |
| Response Code        | OK, Operation_Not_Supported, Session_Not_Open, Invalid_TransactionID, Device_Busy, Parameter_Not_Supported, Authentication_Failed |
| Response Parameter 1 | Vendor Code Version                                                                                                               |
| Response Parameter 2 | None                                                                                                                              |
| Response Parameter 3 | None                                                                                                                              |
| Response Parameter 4 | None                                                                                                                              |
| Response Parameter 5 | None                                                                                                                              |

### SDIExtDeviceInfo Dataset

| Field                   | Field Order | Size (Bytes) | Datatype     |
| ----------------------- | ----------- | ------------ | ------------ |
| SDIExtensionVersion     | 1           | 2            | UINT16       |
| SDIDevicePropCode Array | 2           | Variable     | UINT16 Array |
| SDIControlCode Array    | 3           | Variable     | UINT16 Array |

The Initiator Version and SDIExtensionVersion are 0x012C (3.00) in this version. "3" indicates the major version, and "00" indicates the minor version.

The camera returns Authentication_Failed if the major version of the connected Initiator is less than the major version.

Flag of Device Property Option (0x00000001: enable extended SDIO Device Property / SDIControlCode)

The extended SDIO Device Property / SDIControlCode can be used if the camera supports

SDIO_GetVendorCodeVersion and the Vendor code version is 3.10 or higher.

Please set this flag to utilize all commands supported by the camera. The extended SDIO Device Property uses 0xE000 ~ 0xEFFF, and the SDIControlCode uses 0xF000 ~ 0xFFFF.
