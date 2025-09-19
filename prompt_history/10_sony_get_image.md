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

Our goals at this stage are just to retrieve captured photos from the Sony camera.

Documentation from Sony is below.

Our authentication/handshake for sony cameras is totally working and we shouldn't modify that at all. Capturing photos is also done. Add your implementation to `scripts/test-sony.ts`.

---

# Abridged Steps to Retrieve Image from Sony Camera via PTP

### 5. **Capture Image Sequence**

[this is where we left off, it's done]

### 6. **Wait for Capture Completion**

```bash
# Poll capture status (0xD215) until bit 0x8000 is set
./control get 0xD215
```

### 7. **Retrieve Image**

```bash
# Get image metadata
./control recv --op=0x1008 --p1=0xffffc001

# Download actual image file
./control getobject 0xffffc001 --of=captured_image.jpg
```

### 8. **Clean Up**

```bash
./control close                  # Close PTP session (0x1003)
```

## Key Operation Codes

- **0x9205**: Set device property value
- **0x9207**: Control device property (buttons)
- **0x9209**: Get all device properties
- **0x1008**: Get object info
- **0x1009**: Get object data

## Critical Device Properties

- **0xD25A**: Dial position (set to host control)
- **0x5013**: Still capture mode
- **0xD222**: Save media location
- **0xD221**: Live view status
- **0xD2C1**: Shutter button control
- **0xD2C2**: Focus button control
- **0xD215**: Capture completion status
