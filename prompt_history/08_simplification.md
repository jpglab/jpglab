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

- We have a new paradigms for sending and receiving data to/from the camera - PTPMessage and PTPMessageBuilder. We can possibly improve it and make sure we're using it everywhere.
- We should reduce the amount of boilerplate code that needs to be defined per vendor (the sony connection process is obviously a beast and an exception here).
- We have a lot of files, and many of them are very big, some of them may share functionality that can be consolidated or referenced. See below.
- Anywhere else you think would be valuable

---

Here are all the TypeScript and JavaScript files in your repo sorted by line count (descending), excluding dist and node_modules folders:

1. 426 lines - ./src/types/ptp-codes.ts
2. 283 lines - ./src/transport/usb-transport.ts
3. 260 lines - ./src/types/high-level-api.ts
4. 245 lines - ./src/types/transport.ts
5. 214 lines - ./scripts/test-usb.ts
6. 197 lines - ./src/vendors/sony/sony-camera.ts
7. 164 lines - ./src/core/ptp-message.ts
8. 163 lines - ./src/core/ptp-client.ts
9. 112 lines - ./src/vendors/sony/sony-codes.ts
10. 50 lines - ./tsup.config.ts
11. 49 lines - ./scripts/test-sony.ts
12. 39 lines - ./src/types/index.ts
13. 31 lines - ./.eslintrc.js
14. 24 lines - ./vitest.config.ts
15. 23 lines - ./src/index.ts
16. 20 lines - ./vite.web.config.ts
17. 18 lines - ./src/web.ts
18. 13 lines - ./src/node.ts
19. 6 lines - ./src/vendors/index.ts

Total: 2,337 lines across 19 TypeScript/JavaScript files.

The largest file is src/types/ptp-codes.ts with 426 lines, followed by src/transport/usb-transport.ts with 283 lines.
