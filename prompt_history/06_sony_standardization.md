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

Our goals at this stage are to:

- For any bytes/bits (anything beginning with 0x) used in the `scripts/test-sony.ts`, either import them as constants from `src/types/ptp-protocol.ts`, or for the custom sony ones, extract them as constants to `src/vendors/sony/sony-camera.ts`.
- Make it friendlier to call these functions with various fields and interpret the responses.
    - The code would be far more ergonomic if we didn't have to think about which interface to use, the buffer length in bytes of each container, and the individal code to send (could be a constant).
    - Interpreting the results would be much easier if we broke any packets from the camera out into a table form and put the byte notation and what that particular code means. The table form would be nice to have in both directions.
    - You should do this as high up in the abstraction tree as possible so we get the benefits everywhere.
