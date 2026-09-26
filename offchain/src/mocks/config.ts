// Mock mode switch, in its own file so any module can import it without import cycles.
// Turned on by `yarn dev:mock` (NEXT_PUBLIC_MOCK=1).

export const USE_MOCKS = process.env.NEXT_PUBLIC_MOCK === "1";
