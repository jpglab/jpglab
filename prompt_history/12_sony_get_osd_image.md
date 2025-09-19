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

We have enabled liveview and retrieving images. Now we want to do the same for OSD images. Same process, first set OSD image mode to enabled, then retrieve it using the function below. They are PNG images.

# OSD Image Mode

### **Summary**

Get/Set the OSD image mode

# **Description**

| Field        | Field Order | Size (Bytes) | Datatype | Value             |
| ------------ | ----------- | ------------ | -------- | ----------------- |
| PropertyCode | 1           | 2            | UINT16   | 0xD207            |
| Datatype     | 2           | 2            | UINT16   | 0x0002(UINT8)     |
| Get/Set      | 3           | 1            | UINT8    | 0x01(Get/Set)     |
| IsEnabled    | 4           | 1            | UINT8    | variable          |
| Reserved     | 5           | 1            | UINT8    | 0x00              |
| CurrentValue | 6           | 1            | UINT8    | variable          |
| FormFlag     | 7           | 1            | UINT8    | 0x02(Enumeration) |

### **Value**

| Value | Description |
| ----- | ----------- |
| 0x00  | OFF         |
| 0x01  | ON          |

# SDIO_GetOSDImage

### **Summary**

Get OSD Image.

| Field                | Value                                                                                                     |     |     |
| -------------------- | --------------------------------------------------------------------------------------------------------- | --- | --- |
| Operation Code       | 0x9238                                                                                                    |     |     |
| OperationParameter 1 | None                                                                                                      |     |     |
| OperationParameter 2 | None                                                                                                      |     |     |
| OperationParameter 3 | None                                                                                                      |     |     |
| OperationParameter 4 | None                                                                                                      |     |     |
| OperationParameter 5 | None                                                                                                      |     |     |
| Data                 | OSD Image Dataset                                                                                         |     |     |
| Data Direction       | R->I                                                                                                      |     |     |
| Response Code        | OK, Operation_Not_Supported, Session_Not_Open, Invalid_TransactionID,Device_Busy, Parameter_Not_Supported |     |     |
| ResponseParameter 1  | None                                                                                                      |     |     |
| ResponseParameter 2  | None                                                                                                      |     |     |
| ResponseParameter 3  | None                                                                                                      |     |     |
| ResponseParameter 4  | None                                                                                                      |     |     |
| ResponseParameter 5  | None                                                                                                      |     |     |

### **OSD Image Dataset**

| Field                      | Field Order | Size (Bytes)          | Datatype |
| -------------------------- | ----------- | --------------------- | -------- |
| Offset to OSDImage         | 1           | 4                     | UNIT32   |
| OSD Image Size             | 2           | 4                     | UINT32   |
| Offset to OSDImageMetaInfo | 3           | 4                     | UNIT32   |
| OSDImageMetaInfo Size      | 4           | 4                     | UINT32   |
| Reserved                   | 5           | Variable              | UINT8    |
| OSDImage Binary            | 6           | OSDImage Size         | UINT8    |
| OSDImageMetaInfo           | 7           | OSDImageMetaInfo Size | UINT8    |

### **Note**

The image data of the OSD displayed on the camera is obtained as an OSDImage Binary. The data format of the OSDImage Binary is PNG.

To obtain the OSDImage Binary, the device property OSD Image Mode must be turned "ON."
