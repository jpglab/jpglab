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

Our goals at this stage relate to liveview and retrieving images. You should implement this functionality at the bottom of the `scripts/test-sony.ts` and in `src/vendors/sony/sony-camera.ts` and in `src/vendors/sony/sony-codes.ts`.

---

This is the sequence (-> means from initiator [our api], <- means from responder [the camera]):

PTP Remote Protocol Connected
-> SDIO_GetAllExtDevicePropInfo ()
<- Data (SDIExtDevicePropInfo Dataset Array)
<- Response (OK)

OPTION 1:
[Live View Status (0xD221) is currently Enabled (0x01)]
GetObjectInfo (ObjectHandle=0xFFFFC002)
Data (ObjectInfo Dataset)
Response (OK)

OPTION 2:
[Live View Status (0xD221) is currently Disabled (0x00)]
Please wait until Live View Status becomes Enabled. (see set LiveView Enable below)

-> GetObject (ObjectHandle=0xFFFFC002)
<- Data (Image File Binary)
<- Response (OK)

---

# Control Reference

## Set LiveView Enable

### **Summary**

Set live view enable.

| Field          | Field Order | Size (Bytes) | Datatype | Value          |
| -------------- | ----------- | ------------ | -------- | -------------- |
| ControlCode    | 1           | 2            | UINT16   | 0xD313         |
| Datatype       | 2           | 2            | UINT16   | 0x0004(UINT16) |
| SDIControlType | 3           | 1            | UINT8    | 0x81(Button)   |
| Reserved       | 4           | 1            | UINT8    | Variable       |
| Reserved       | 5           | 2            | UINT16   | 0x0000         |
| Reserved       | 6           | 2            | UINT16   | 0x0000         |

| Field    | Field Order | Size (Bytes) | Datatype | Value             |
| -------- | ----------- | ------------ | -------- | ----------------- |
| FormFlag | 7           | 1            | UINT8    | 0x02(Enumeration) |

| Value  | Description   |
| ------ | ------------- |
| 0x0001 | Up (Disable)  |
| 0x0002 | Down (Enable) |

### **Note**

When using Live View while connected in "Remote Control with Transfer Mode," it is necessary to enable the feature using this Control Code.
