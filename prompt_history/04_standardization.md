We are building an API around Picture Transfer Protocol (PTP). You can find documentation about our progress in the `prompts/` folder. You should read through all of those first so you are familiar with the goals and our work so far.

We have also amassed a vast collection of knowledge on PTP (Picture Transfer Protocol). You have access to all of this through tool invocation. You can find more info on this in AGENTS.md. You should reference these documents heavily to influence the design of our system and the low level features.

Additional rules to keep in mind:

- We have a wealth of knowledge at our fingertips via notes, basic memory, and MCP tools. Use them.
- Only create notes after asking me and I confirm that the feature we set out to build is working correctly. This will help us avoid creating misinformation in our knowledge base.
- Do all of this in TypeScript with modern tooling including bun, bunx, tsx, vite, and vitest. If you make any webpages they should be in React and be served with Vite.
- Pre-celebration, self promotion, self-aggrandizing, and false hope are not allowed. Be humble and honest when things aren't working completely.
- Always use typescript; never javascript.
- Make everything super easy to run. Keep the `scripts` block of `package.json` tidy and up-to-date. This should match 1-to-1 with any functionality in the app such as various examples or running an app, plus linting/building/formatting etc.
- Use vite or existing tooling rather than rolling your own build toolkit.
- In no way, shape, or form should you implement a "mock" or "stub" solution to revisit later. We are building the real, full solution now.

We have the

Our goals at this stage are to:

- Standardize the API so that the same functions with the same signatures are exported
- Get the camera explorer app working and at least discovering our camera over each protocol
- Make everything super easy to run. Keep the `scripts` block of `package.json` tidy and up-to-date. This should match 1-to-1 with any functionality in the app such as various examples or running an app, plus linting/building/formatting etc
