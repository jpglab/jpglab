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

Our goals at this stage are to drastically simplify / refactor the entire repo without removing any functionality. Previous simplification efforts have actually led to an INCREASE in the total number of lines!

## Concentrate on ANY areas you find valuable.

Here are all the TypeScript and JavaScript files in your repo sorted by line count (descending), excluding dist and node_modules folders:

find /Users/kevinschaich/repositories/jpglab/ptp -name "_.ts" -o -name "_.tsx" | grep -v node_modules | grep -v dist | xargs wc -l | sort -nr
3230 total
753 /Users/kevinschaich/repositories/jpglab/ptp/src/vendors/sony/sony-camera.ts
426 /Users/kevinschaich/repositories/jpglab/ptp/src/types/ptp-codes.ts
322 /Users/kevinschaich/repositories/jpglab/ptp/src/vendors/sony/sony-helpers.ts
308 /Users/kevinschaich/repositories/jpglab/ptp/src/vendors/sony/sony-codes.ts
302 /Users/kevinschaich/repositories/jpglab/ptp/src/transport/usb-transport.ts
281 /Users/kevinschaich/repositories/jpglab/ptp/src/core/ptp-message.ts
202 /Users/kevinschaich/repositories/jpglab/ptp/src/core/data-utils.ts
177 /Users/kevinschaich/repositories/jpglab/ptp/scripts/test-sony.ts
163 /Users/kevinschaich/repositories/jpglab/ptp/src/core/ptp-client.ts
74 /Users/kevinschaich/repositories/jpglab/ptp/src/core/logger.ts
62 /Users/kevinschaich/repositories/jpglab/ptp/scripts/test-usb.ts
50 /Users/kevinschaich/repositories/jpglab/ptp/tsup.config.ts
24 /Users/kevinschaich/repositories/jpglab/ptp/vitest.config.ts
23 /Users/kevinschaich/repositories/jpglab/ptp/src/index.ts
20 /Users/kevinschaich/repositories/jpglab/ptp/vite.web.config.ts
18 /Users/kevinschaich/repositories/jpglab/ptp/src/web.ts
13 /Users/kevinschaich/repositories/jpglab/ptp/src/node.ts
6 /Users/kevinschaich/repositories/jpglab/ptp/src/vendors/index.ts
6 /Users/kevinschaich/repositories/jpglab/ptp/src/types/index.ts
