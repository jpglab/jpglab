We are building an API around Picture Transfer Protocol (PTP).

We have also amassed a vast collection of knowledge on PTP (Picture Transfer Protocol). You have access to all of this through tool invocation. You should read AGENTS.md before continuing. You should reference these documents heavily to influence the design of our system and the low level features.

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

Our goals at this stage are to generate a proposal for a project refactoring that uses the principles of readability, maintainability, and dependency injection & interfaces:

- A four-layer architecture (Application -> Camera -> Core -> Transport)
- Vendor implementations for cameras (`PTPClient` -> `Camera`), instead of BaseCamera we should use `GenericPTPCamera` for an implementation lacking a specific interface
- Protocol implementations for the transport layer (USB, IP)
- A way to translate/map a set of universally useful properties, operations, and codes across vendors (for example in the ISO implementation of the PTP protocol, it defines ExposureTime (0x500D) with a unit of seconds scaled by 10,000. However, in the Sony documentation, it defines Shutter Speed (0xD016) with fractional units, upper four bytes and lower four bytes).
    - We should be able to call things like this (where DeviceProperties is the vendor agnostic definition), with friendly names of the properties/operations/codes that are agnostic of the vendor layer.
        - getDeviceProperty(DeviceProperties.SHUTTER_SPEED) // 1/250
        - setDeviceProperty(Properties.APERTURE, "f/22")
- Test cases at each stage in the refactoring process that validate we haven't broken anything

Please use the document below as a guide for what we are looking for and come up with a comprehensive & detailed proposal. It is also available in AGENTS.md.

---

# Software Engineering Principles for Agents

**Core Philosophy**: Prioritize readability and maintainability over premature optimization. Code is written for humans to understand.

## 1. Composition Over Inheritance

- Use dependency injection and interfaces instead of class hierarchies
- Replace abstract base classes with interfaces
- Move shared functionality to separate, composable classes
- Design for change - avoid tight coupling that breaks when requirements evolve

## 2. Abstraction

- Only abstract when value exceeds coupling cost
- Wait for 3+ similar implementations before abstracting
- Don't abstract single duplicate lines or simple variable assignments
- Use lightweight interfaces over heavyweight parent classes

## 3. Naming

- Never abbreviate - write full words
- Never use single letters (except short loop counters)
- Include units in variable names (`delaySeconds`)
- Avoid "Helper", "Utils", "Base", "Abstract" in class names
- If struggling to name something, restructure the code

## 4. Code Structure

- Maximum 3 levels of indentation per function
- Use early returns and guard clauses instead of deep nesting
- Extract complex logic into well-named functions
- One responsibility per function

## 5. Comments

- Replace comments with better code whenever possible
- Use meaningful variable names instead of explaining unclear code
- Only comment for: performance reasons, mathematical algorithms, API documentation
- Write API documentation, not implementation comments

## 6. Performance

- Measure before optimizing
- Focus on data structure selection over micro-optimizations
- Solve the real problem first, optimize later
- Avoid debates about `++i` vs `i++` unless proven critical
- Use profilers to identify actual bottlenecks

## 7. Dependency Injection

- Pass dependencies instead of creating them directly
- Use interfaces to define contracts
- Enables configurable, testable systems
- Inject mocks and fakes for isolated testing

## Decision Framework

When evaluating code changes, ask:

1. Does this make the code more readable?
2. Does this reduce coupling?
3. Does this make testing easier?
4. Is this solving a real problem or theoretical one?

## Red Flags

- Deep inheritance hierarchies
- Utility classes with mixed responsibilities
- Premature performance optimizations
- Comments explaining complex code
- Excessive nesting
- Abbreviations

## Priority Order

1. Solve the business problem correctly
2. Make code readable and maintainable
3. Ensure code is testable
4. Optimize only when measured as necessary
