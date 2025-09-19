We have just amassed a vast collection of knowledge on PTP (Picture Transfer Protocol). You have access to all of this through tool invocation. You can find more info on this in AGENTS.md or CLAUDE.md. You should reference these documents heavily to influence the design of our system and the low level features.

We also want to make a high-level API for this protocol that is easy to use for humans. For that API, we want it to be declarative and object-oriented. We want people to be able to interact with this higher-level library with familiar terms and have the transport layer and vendor specifics abstracted away. People should not have to think about what operation code they need (e.g. send code 0x9205 to the camera). Rather, it should be simple and expressive. For example:

```typescript
const mySonyCamera = new PTPCamera()
mySonyCamera.connect('usb')
mySonyCamera.get(DEVICE_PROPERTIES.ISO) // ISO 100
mySonyCamera.set(DEVICE_PROPERTIES.SHUTTER_SPEED, '1/250') // sets it
mySonyCamera.takePhoto() // captures photo
mySonyCamera.startRecording() // starts video recording
mySonyCamera.transferFile() // transfers file to our computer
mySonyCamera.disconnect()
```

Much of this API will have to be pluggable. For example, there are some sensible defaults that are defined in the ISO PTP spec, but different vendors may have different codes for the same operation or different processes for connecting to a camera.

In order to facilitate this, we want to use object oriented program principles like classes and subclasses, for example a sony USB class that extends/overrides the methods with any vendor specific code, but adheres to a higher order set of constraints. Another example is a wrapper around the transport layers (there are several – WebUSB, node-usb, TCP/IP, etc). Use these principles throughout the entire repo. Make the core principles such that they may be extended or overridden to support additional vendors with slightly different behavior.

For transport protocols, our implementation should support:

- USB connection via WebUSB if run in browser
- USB connection via nodejs if run as a script
- TCP/IP connection via sockets (has to be run via node, websockets are different & not supported for this protocol)

What you are building for now:

- The low level API that implements ISO's vendor-agnostic PTP specification
- The higher level API that is easy and expressive to use
- A camera explorer app/webpage that allows us to play around and detect cameras on different interfaces, connect to them, and display information about them

Finally, validate that the implementation is comprehensive.

Additional rules to keep in mind:

- We have a wealth of knowledge at our fingertips via notes, basic memory, and MCP tools. Use them.
- Only create notes after asking me and I confirm that the feature we set out to build is working correctly. This will help us avoid creating misinformation in our knowledge base.
- Do all of this in TypeScript with modern tooling including bun, bunx, tsx, vite, and vitest. If you make any webpages they should be in React and be served with Vite.
- Pre-celebration, self promotion, self-aggrandizing, and false hope are not allowed. Be humble and honest when things aren't working completely.
- Always use typescript; never javascript.
- Make everything easy to run. If it's a javascript/typescript project, always add a script to package.json.
  Use vite or existing tooling rather than rolling your own build toolkit.
- In no way, shape, or form should you implement a "mock" or "stub" solution to revisit later. We are building the real, full solution now.

---

At the moment, we only care about Sony (check the notes as well). Their implementation allows:

- USB connection (via WebUSB)
- USB connection (via nodeJS)
- TCP/IP connection from devices on the same network via a pairing handshake
- TCP/IP connection from devices on the same network via username & password authentication (they call it SSH in their documents)
