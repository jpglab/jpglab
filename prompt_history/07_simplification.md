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

Our goals at this stage are to drastically simplify the entire repo without removing any functionality.

Some areas of focus:

- We have two paradigms for sending and receiving data to/from the camera – containers and commands. It would be great to take the best of both of those constucts, improve it, and use it everywhere.
- We should reduce the amount of boilerplate code that needs to be defined per vendor (the sony connection process is obviously a beast and an exception here).
- There is extensive transport code defined in the Sony file when that is supposed to live in the transport layer.
- We have lots of small utils/helper functions which only relate to one piece of functionality and are only used in one place and would be better served to just live in the same file as the one place that calls it.
- We have a lot of files, and many of them are very big. See below.
- The whole codebase is 7000 lines of code and all we are doing is connecting to a Sony camera so far.
- Anywhere else you think would be valuable

---

TypeScript Files Sorted by Line Count

Smallest files:
• src/utils/index.ts - 6 lines
• src/vendors/index.ts - 10 lines
• vite.web.config.ts - 20 lines
• vitest.config.ts - 24 lines
• src/utils/webusb-helpers.ts - 26 lines
• src/utils/nodeusb-helpers.ts - 31 lines
• src/types/index.ts - 39 lines
• scripts/test-sony.ts - 45 lines
• tsup.config.ts - 50 lines

Small files:
• src/utils/event-emitter.ts - 62 lines
• src/utils/tcp-helpers.ts - 62 lines
• src/index.ts - 65 lines
• src/utils/data-helpers.ts - 84 lines
• src/web.ts - 88 lines
• src/node.ts - 106 lines
• src/utils/vendor-detection.ts - 123 lines
• tests/unit/data-helpers.test.ts - 124 lines

Medium files:
• tests/unit/vendor-detection.test.ts - 191 lines
• tests/integration/transport-discovery.test.ts - 200 lines
• scripts/test-usb-discovery.ts - 214 lines
• tests/unit/simple-api.test.ts - 225 lines
• src/core/ptp-utils.ts - 244 lines
• src/types/transport.ts - 245 lines
• src/transport/base-transport.ts - 249 lines
• src/types/high-level-api.ts - 260 lines
• src/types/ptp-protocol.ts - 321 lines

Large files:
• src/transport/tcp-transport.ts - 521 lines
• src/transport/webusb-transport.ts - 585 lines
• src/transport/nodeusb-transport.ts - 621 lines
• src/high-level/ptp-camera.ts - 710 lines
• src/vendors/sony/sony-camera.ts - 822 lines
• src/core/ptp-client.ts - 908 lines (largest file)
