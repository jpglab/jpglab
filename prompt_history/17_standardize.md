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

Right now, we have:

- `PTPClient` in `src/core/ptp-client.ts`
- `USBTransport` in `src/transport/usb-transport.ts`
- `SonyCamera` that loosely mirrors `PTPClient`
- `src/types/ptp-codes` and `src/vendors/sony/sony-codes`

What we want:

- `PTPClient` -> `BaseCamera`
- Add an abstract class for `BaseTransport`
- `USBTransport` should extend/implement `BaseTransport`
- `SonyCamera` should extend/implement `BaseCamera`
- We should have a `Transport` class that takes an argument and abstracts away transport implementation
- We should have a `Camera` class that takes one of the discovered cameras or arguments and abstracts away any vendor implementation, and utilizes the `Transport` class internally
- The `BaseCamera` class should define the ISO standardized `BaseCameraProperties` which are then extended/overridden by vendors, e.g. Sony
- `CameraProperty` should be the ones used in the vendor-agnostic `Camera` class which defines (for now) ISO, SHUTTER_SPEED, APERTURE, and takes should delegate fetching that property to the vendor specific implementation if it differs from the ISO spec

The only thing people should interact with is the `Camera` class. The transport layer and vendor shoudl abstract specifics away from the user. People should not have to think about what operation code they need (e.g. send code 0x9205 to the camera). Rather, it should be simple and expressive.

Usage and required function specifications:

```typescript
import {listCameras, Camera, CameraProperty} from `@jpglab/ptp/web`
// or:
import {listCameras, Camera, CameraProperty} from `@jpglab/ptp/node`

// discovery, can specify transport=usb
const cameras = listCameras() // -> [Camera({"vendor": "Sony", "model": "ILCE-6700", type: "PTP-WebUSB"})]

// automatically picks the right vendor implementation and transport type
const myCamera = cameras.find(c => c.model === "ILCE-6700")

// NOTE: all of these functions are async with proper types defined in the BaseCamera class

myCamera.connect() // handles openSession and anything else we need to get to a stable PTP connection, for example the authenticate, various sdioConnect phases for Sony
myCamera.getAll() // gets all properties we can for this vendor in a parsed result
myCamera.get(CameraProperty.APERTURE) // {current: "f/3.5", available: ["f/2.0", "f/2.8", ...]}
myCamera.get(CameraProperty.SHUTTER_SPEED) // {current: "1/100", available: ["1/100", "1/200", ...]}
myCamera.get(CameraProperty.ISO) // {current: "ISO 100", available: ["ISO 100", "ISO 200", ...]}
myCamera.set(CameraProperty.SHUTTER_SPEED, "1/250") // sets property with familiar format
myCamera.capture(output='./path/to/output/folder') // captures photo using shutter button
myCamera.getLiveView(output='./path/to/output/folder') // get current live view image
myCamera.getOSD(output='./path/to/output/folder') // get current on-screen display (OSD) image
myCamera.startRecording() // starts video recording
myCamera.stopRecording() // stops video recording
myCamera.listFiles() // lists files
myCamera.transferFiles(filenames=['0001.jpg', '0002.jpg'], output='./path/to/output/folder')
myCamera.disconnect()
```

If the functionality for any of these does NOT currently exist in the current Sony implementation, make it an empty stub with a // TODO comment. The only way you are allowed to do this is if we don't have an existing implementation. Don't cut out any functionality.
