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

now we want to get current image settings. use `src/vendors/sony` and `src/scripts/test-sony`. don't create any new files. We need to call SDIO_GetAllExtDevicePropInfo first, which contains all the settings for the camera, then get the dataset from that, then index into the right property code for the settings we want. We need to loop through the

Note they are all different dataypes/sizes/lengths.

F number and Shutter Speed are all working but we have not figured out ISO yet. I think we need to loop through each field in the dataset and look at its datatype in order to determine its length so that we get the position and size of all the slots correct. Reference for all of this is below. Do some logging and be verbose so that we can debug together.

---

## Data Types

The generic datatypes that may be used in this International Standard are listed in Table 3.

All datatypes having bit 14 set to 1 are uniform arrays of individual fixed-length types.

| Datatype code                        | Type           | Description                        |
| ------------------------------------ | -------------- | ---------------------------------- |
| 0x0000                               | UNDEF          | Undefined                          |
| 0x0001                               | INT8           | Signed 8-bit integer               |
| 0x0002                               | UINT8          | Unsigned 8-bit integer             |
| 0x0003                               | INT16          | Signed 16-bit integer              |
| 0x0004                               | UINT16         | Unsigned 16-bit integer            |
| 0x0005                               | INT32          | Signed 32-bit integer              |
| 0x0006                               | UINT32         | Unsigned 32-bit integer            |
| 0x0007                               | INT64          | Signed 64-bit integer              |
| 0x0008                               | UINT64         | Unsigned 64-bit integer            |
| 0x0009                               | INT128         | Signed 128-bit integer             |
| 0x000A                               | UINT128        | Unsigned 128-bit integer           |
| 0x4001                               | AINT8          | Array of signed 8-bit integers     |
| 0x4002                               | AUINT8         | Array of unsigned 8-bit integers   |
| 0x4003                               | AINT16         | Array of signed 16-bit integers    |
| 0x4004                               | AUINT16        | Array of unsigned 16-bit integers  |
| 0x4005                               | AINT32         | Array of signed 32-bit integers    |
| 0x4006                               | AUINT32        | Array of unsigned 32-bit integers  |
| 0x4007                               | AINT64         | Array of signed 64-bit integers    |
| 0x4008                               | AUINT64        | Array of unsigned 64-bit integers  |
| 0x4009                               | AINT128        | Array of signed 128-bit integers   |
| 0x400A                               | AUINT128       | Array of unsigned 128-bit integers |
| 0xFFFF                               | STR            | Variable-length unicode string     |
| All other values with bit 15set to 0 | Undefined      | Reserved                           |
| All other values with bit 15set to 1 | Vendor-defined | Vendor-defined                     |

# SDIO_GetAllExtDevicePropInfo

### **Summary**

Obtain all support DevicePropDescs at one time. The host will send this operation at regular intervals to obtain the latest (current) camera settings.

| Field                    | Value                            |
| ------------------------ | -------------------------------- |
| Operation Code           | 0x9209                           |
| Operation<br>Parameter 1 | Flag of get only difference data |

| Field                    | Value                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Operation<br>Parameter 2 | Flag of Device Property Option                                                                                |
| Operation<br>Parameter 3 | None                                                                                                          |
| Operation<br>Parameter 4 | None                                                                                                          |
| Operation<br>Parameter 5 | None                                                                                                          |
| Data                     | SDIDevicePropInfo Dataset Array                                                                               |
| Data Direction           | R->I                                                                                                          |
| Response Code            | OK, Operation_Not_Supported, Session_Not_Open, Invalid_TransactionID,<br>Device_Busy, Parameter_Not_Supported |
| Response<br>Parameter 1  | None                                                                                                          |
| Response<br>Parameter 2  | None                                                                                                          |
| Response<br>Parameter 3  | None                                                                                                          |
| Response<br>Parameter 4  | None                                                                                                          |
| Response<br>Parameter 5  | None                                                                                                          |

# **SDIExtDevicePropInfo Dataset**

| Field                 | Field Order | Size (Bytes) | Datatype |
| --------------------- | ----------- | ------------ | -------- |
| Device Property Code  | 1           | 2            | UINT16   |
| DataType              | 2           | 2            | UINT16   |
| GetSet                | 3           | 1            | UINT8    |
| IsEnabled             | 4           | 1            | UINT8    |
| Factory Default Value | 5           | Variable     | Any      |
| Current Value         | 6           | Variable     | Any      |
| Form Flag             | 7           | 1            | UINT8    |

The GetSet field is defined as the following:

- 0x00: The Initiator cannot set the value
- 0x01: The Initiator can set the value

The IsEnabled field is defined as the following (for the Initiator UI):

- 0x00: False (means invalid, greyed-out, no indication for the button, combo box, some values like shutter speed, F-number)
- 0x01: True (means valid, indication for the button, combo box, some values like shutter speed, Fnumber)
- 0x02: DispOnly (means only indication; cannot change the value)

If IsEnabled is "False", the Factory Default Value and Current Value are not guaranteed.

If Form Flag is 0x02 (Enumeration), the Dataset will be the following example:

| Field                                                     | Field Order | Size (Bytes)        | Datatype |
| --------------------------------------------------------- | ----------- | ------------------- | -------- |
| Device Property Code                                      | 1           | 2                   | UINT16   |
| DataType                                                  | 2           | 2                   | UINT16   |
| GetSet                                                    | 3           | 1                   | UINT8    |
| IsEnabled                                                 | 4           | 1                   | UINT8    |
| Factory Default Value                                     | 5           | Variable            | Any      |
| Current Value                                             | 6           | Variable            | Any      |
| Form Flag                                                 | 7           | 1                   | UINT8    |
| Num of Enum lists (Set)                                   | 8           | 2                   | UINT16   |
| Enum value (Set)[0]                                       | 9           | Depends on DataType | -        |
| …                                                         | …           | Depends on DataType | -        |
| Enum value (Set)<br>[Num of Enum lists (Set) - 1]         | N           | Depends on DataType | -        |
| Num of Enum lists(Get/Set)                                | N+1         | 2                   | UINT16   |
| Enum value (Get/Set)[0]                                   | N+2         | Depends on DataType | -        |
| …                                                         | …           | Depends on DataType | -        |
| Enum value (Get/Set)<br>[Num of Enum lists (Get/Set) - 1] | O           | Depends on DataType | -        |

### **SDIDevicePropInfo Dataset Array**

| Field                                          | Field Order | Size (Bytes) | Datatype |
| ---------------------------------------------- | ----------- | ------------ | -------- |
| Num of Elements                                | 1           | 8            | UINT64   |
| SDIDevicePropInfo Dataset[0]                   | 2           | variable     | UINT16   |
| …                                              | …           | variable     | UINT8    |
| SDIDevicePropInfo Dataset[Num of Elements - 1] | N           | variable     | UINT8    |

# **Note**

Flag of get only difference data: 0x00000000: Gets all data 0x00000001: Gets only difference data Flag of Device Property Option: 0x00000001: Enables extended SDIO Device Property / SDIControlCode The extended SDIO Device Property / SDIControlCode can be used if the camera supports SDIO_GetVendorCodeVersion and the Vendor code version is 3.10 or higher. Please set this flag to utilize all commands supported by the camera. The extended SDIO Device Property uses 0xE000 ~ 0xEFFF, and the SDIControlCode uses 0xF000 ~ 0xFFFF.

# F-Number

# **Summary**

Get/Set the aperture value.

| Field        | Field Order | Size (Bytes) | Datatype | Value             |
| ------------ | ----------- | ------------ | -------- | ----------------- |
| PropertyCode | 1           | 2            | UINT16   | 0x5007            |
| Datatype     | 2           | 2            | UINT16   | 0x0004(UINT16)    |
| Get/Set      | 3           | 1            | UINT8    | 0x01(Get/Set)     |
| IsEnabled    | 4           | 1            | UINT8    | variable          |
| Reserved     | 5           | 2            | UINT16   | 0xFFFF            |
| CurrentValue | 6           | 2            | UINT16   | variable          |
| FormFlag     | 7           | 1            | UINT8    | 0x02(Enumeration) |

| Value  | Description        |
| ------ | ------------------ |
| 0x0064 | 1                  |
| 0x006E | 1.1                |
| 0x0078 | 1.2                |
| 0x0082 | 1.3                |
| 0x008C | 1.4                |
| 0x00A0 | 1.6                |
| 0x00AA | 1.7                |
| 0x00B4 | 1.8                |
| 0x00C8 | 2                  |
| 0x00DC | 2.2                |
| 0x00F0 | 2.4                |
| 0x00FA | 2.5                |
| 0x0118 | 2.8                |
| 0x0136 | 3.1                |
| 0x0140 | 3.2                |
| 0x0154 | 3.4                |
| 0x015E | 3.5                |
| 0x0172 | 3.7                |
| 0x0190 | 4                  |
| 0x01B8 | 4.4                |
| 0x01C2 | 4.5                |
| 0x01E0 | 4.8                |
| 0x01F4 | 5                  |
| 0x0208 | 5.2                |
| 0x0230 | 5.6                |
| 0x026C | 6.2                |
| 0x0276 | 6.3                |
| 0x029E | 6.7                |
| 0x02A8 | 6.8                |
| 0x02C6 | 7.1                |
| 0x02DA | 7.3                |
| 0x0320 | 8                  |
| 0x0366 | 8.7                |
| 0x0384 | 9                  |
| 0x03B6 | 9.5                |
| 0x03C0 | 9.6                |
| 0x03E8 | 10                 |
| 0x044C | 11                 |
| 0x0514 | 13                 |
| 0x0578 | 14                 |
| 0x0640 | 16                 |
| 0x0708 | 18                 |
| 0x076C | 19                 |
| 0x07D0 | 20                 |
| 0x0898 | 22                 |
| 0x09C4 | 25                 |
| 0x0A8C | 27                 |
| 0x0B54 | 29                 |
| 0x0C80 | 32                 |
| 0x0E10 | 36                 |
| 0x0ED8 | 38                 |
| 0x0FA0 | 40                 |
| 0x1194 | 45                 |
| 0x13EC | 51                 |
| 0x1518 | 54                 |
| 0x1644 | 57                 |
| 0x1900 | 64                 |
| 0x1C20 | 72                 |
| 0x1DB0 | 76                 |
| 0x1FA4 | 81                 |
| 0x2328 | 90                 |
| 0xFFFD | Iris Close         |
| 0xFFFE | --                 |
| 0xFFFF | nothing to display |

# Shutter Speed

### **Summary**

Get/Set the shutter speed.

| Field        | Field Order | Size (Bytes) | Datatype | Value            |
| ------------ | ----------- | ------------ | -------- | ---------------- |
| PropertyCode | 1           | 2            | UINT16   | 0xD20D           |
| Datatype     | 2           | 2            | UINT16   | 0x0006(UINT32)   |
| Get/Set      | 3           | 1            | UINT8    | 0x01(Get/Set)    |
| IsEnabled    | 4           | 1            | UINT8    | variable         |
| Reserved     | 5           | 4            | UINT32   | 0x00000000       |
| CurrentValue | 6           | 4            | UINT32   | variable         |
| FormFlag     | 7           | 1            | UINT8    | 0x02(Enumlation) |

| Value                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0x00000000              | BULB                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 0xFFFFFFFF              | nothing to display                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Other than above values | The real value of shutter speed (Upper two bytes: numerator, Lower two bytes: denominator) In the case of the shutter speed is displayed as "Real Number" on the camera, the denominator is fixed 0x000A. e.g.) 0x000F000A: 0x000F (means 15) / 0x0000A (means 10) = 1.5" In the case of the shutter speed is displayed as "Fraction Number" on the camera, the numerator is fixed 0x0001. e.g.) 0x000103E8: 0x0001 (means 1) / 0x03E8 (means 1000) = 1/1000 |

### **Note**

The host should send SDIO_ControlDevice to change this value from the host application min: 0x00000000 max: 0xFFFFFFFF step: 0x00000001

# ISO Sensitivity

# **Summary**

Get/Set the ISO sensitivity.

| Field        | Field Order | Size (Bytes) | Datatype | Value             |
| ------------ | ----------- | ------------ | -------- | ----------------- |
| PropertyCode | 1           | 2            | UINT16   | 0xD21E            |
| Datatype     | 2           | 2            | UINT16   | 0x0006(UINT32)    |
| Get/Set      | 3           | 1            | UINT8    | 0x01(Get/Set)     |
| IsEnabled    | 4           | 1            | UINT8    | variable          |
| Reserved     | 5           | 2            | UINT32   | 0x00000000        |
| CurrentValue | 6           | 2            | UINT32   | variable          |
| FormFlag     | 7           | 1            | UINT8    | 0x02(Enumeration) |

| Value      | Description                    |
| ---------- | ------------------------------ |
| 0x0000000A | ISO 10                         |
| 0x0000000C | ISO 12                         |
| 0x00000010 | ISO 16                         |
| 0x00000014 | ISO 20                         |
| 0x00000019 | ISO 25                         |
| 0x00000020 | ISO 32                         |
| 0x00000028 | ISO 40                         |
| 0x00000032 | ISO 50                         |
| 0x00000040 | ISO 64                         |
| 0x00000050 | ISO 80                         |
| 0x00000064 | ISO 100                        |
| 0x0000007D | ISO 125                        |
| 0x000000A0 | ISO 160                        |
| 0x000000C8 | ISO 200                        |
| 0x000000FA | ISO 250                        |
| 0x00000140 | ISO 320                        |
| 0x00000190 | ISO 400                        |
| 0x000001F4 | ISO 500                        |
| 0x00000280 | ISO 640                        |
| 0x00000320 | ISO 800                        |
| 0x000003E8 | ISO 1000                       |
| 0x000004E2 | ISO 1250                       |
| 0x00000640 | ISO 1600                       |
| 0x000007D0 | ISO 2000                       |
| 0x000009C4 | ISO 2500                       |
| 0x00000C80 | ISO 3200                       |
| 0x00000FA0 | ISO 4000                       |
| 0x00001388 | ISO 5000                       |
| 0x00001900 | ISO 6400                       |
| 0x00001F40 | ISO 8000                       |
| 0x00002710 | ISO 10000                      |
| 0x00003200 | ISO 12800                      |
| 0x00003E80 | ISO 16000                      |
| 0x00004E20 | ISO 20000                      |
| 0x00006400 | ISO 25600                      |
| 0x00007D00 | ISO 32000                      |
| 0x00009C40 | ISO 40000                      |
| 0x0000C800 | ISO 51200                      |
| 0x0000FA00 | ISO 64000                      |
| 0x00013880 | ISO 80000                      |
| 0x00019000 | ISO 102400                     |
| 0x0001F400 | ISO 128000                     |
| 0x00027100 | ISO 160000                     |
| 0x00032000 | ISO 204800                     |
| 0x0003E800 | ISO 256000                     |
| 0x0004E200 | ISO 320000                     |
| 0x00064000 | ISO 409600                     |
| 0x0007D000 | ISO 512000                     |
| 0x0009C400 | ISO 640000                     |
| 0x000C8000 | ISO 819200                     |
| 0x00FFFFFF | ISO AUTO                       |
| 0x0100000A | Multi Frame NR ISO 10          |
| 0x0100000C | Multi Frame NR ISO 12          |
| 0x01000010 | Multi Frame NR ISO 16          |
| 0x01000014 | Multi Frame NR ISO 20          |
| 0x01000019 | Multi Frame NR ISO 25          |
| 0x01000020 | Multi Frame NR ISO 32          |
| 0x01000028 | Multi Frame NR ISO 40          |
| 0x01000032 | Multi Frame NR ISO 50          |
| 0x01000040 | Multi Frame NR ISO 64          |
| 0x01000050 | Multi Frame NR ISO 80          |
| 0x01000064 | Multi Frame NR ISO 100         |
| 0x0100007D | Multi Frame NR ISO 125         |
| 0x010000A0 | Multi Frame NR ISO 160         |
| 0x010000C8 | Multi Frame NR ISO 200         |
| 0x010000FA | Multi Frame NR ISO 250         |
| 0x01000140 | Multi Frame NR ISO 320         |
| 0x01000190 | Multi Frame NR ISO 400         |
| 0x010001F4 | Multi Frame NR ISO 500         |
| 0x01000280 | Multi Frame NR ISO 640         |
| 0x01000320 | Multi Frame NR ISO 800         |
| 0x010003E8 | Multi Frame NR ISO 1000        |
| 0x010004E2 | Multi Frame NR ISO 1250        |
| 0x01000640 | Multi Frame NR ISO 1600        |
| 0x010007D0 | Multi Frame NR ISO 2000        |
| 0x010009C4 | Multi Frame NR ISO 2500        |
| 0x01000C80 | Multi Frame NR ISO 3200        |
| 0x01000FA0 | Multi Frame NR ISO 4000        |
| 0x01001388 | Multi Frame NR ISO 5000        |
| 0x01001900 | Multi Frame NR ISO 6400        |
| 0x01001F40 | Multi Frame NR ISO 8000        |
| 0x01002710 | Multi Frame NR ISO 10000       |
| 0x01003200 | Multi Frame NR ISO 12800       |
| 0x01003E80 | Multi Frame NR ISO 16000       |
| 0x01006400 | Multi Frame NR ISO 25600       |
| 0x0100C800 | Multi Frame NR ISO 51200       |
| 0x01019000 | Multi Frame NR ISO 102400      |
| 0x01032000 | Multi Frame NR ISO 204800      |
| 0x01064000 | Multi Frame NR ISO 409600      |
| 0x010C8000 | Multi Frame NR ISO 819200      |
| 0x01FFFFFF | Multi Frame NR ISO AUTO        |
| 0x0200000A | Multi Frame NR High ISO 10     |
| 0x0200000C | Multi Frame NR High ISO 12     |
| 0x02000010 | Multi Frame NR High ISO 16     |
| 0x02000014 | Multi Frame NR High ISO 20     |
| 0x02000019 | Multi Frame NR High ISO 25     |
| 0x02000020 | Multi Frame NR High ISO 32     |
| 0x02000028 | Multi Frame NR High ISO 40     |
| 0x02000032 | Multi Frame NR High ISO 50     |
| 0x02000040 | Multi Frame NR High ISO 64     |
| 0x02000050 | Multi Frame NR High ISO 80     |
| 0x02000064 | Multi Frame NR High ISO 100    |
| 0x0200007D | Multi Frame NR High ISO 125    |
| 0x020000A0 | Multi Frame NR High ISO 160    |
| 0x020000C8 | Multi Frame NR High ISO 200    |
| 0x020000FA | Multi Frame NR High ISO 250    |
| 0x02000140 | Multi Frame NR High ISO 320    |
| 0x02000190 | Multi Frame NR High ISO 400    |
| 0x020001F4 | Multi Frame NR High ISO 500    |
| 0x02000280 | Multi Frame NR High ISO 640    |
| 0x02000320 | Multi Frame NR High ISO 800    |
| 0x020003E8 | Multi Frame NR High ISO 1000   |
| 0x020004E2 | Multi Frame NR High ISO 1250   |
| 0x02000640 | Multi Frame NR High ISO 1600   |
| 0x020007D0 | Multi Frame NR High ISO 2000   |
| 0x020009C4 | Multi Frame NR High ISO 2500   |
| 0x02000C80 | Multi Frame NR High ISO 3200   |
| 0x02000FA0 | Multi Frame NR High ISO 4000   |
| 0x02001388 | Multi Frame NR High ISO 5000   |
| 0x02001900 | Multi Frame NR High ISO 6400   |
| 0x02001F40 | Multi Frame NR High ISO 8000   |
| 0x02002710 | Multi Frame NR High ISO 10000  |
| 0x02003200 | Multi Frame NR High ISO 12800  |
| 0x02003E80 | Multi Frame NR High ISO 16000  |
| 0x02006400 | Multi Frame NR High ISO 25600  |
| 0x0200C800 | Multi Frame NR High ISO 51200  |
| 0x02019000 | Multi Frame NR High ISO 102400 |
| 0x02032000 | Multi Frame NR High ISO 204800 |
| 0x02064000 | Multi Frame NR High ISO 409600 |
| 0x020C8000 | Multi Frame NR High ISO 819200 |
| 0x02FFFFFF | Multi Frame NR High ISO AUTO   |

# **Note**

To specify extended ISO values, add an offset value 0x10000000.
