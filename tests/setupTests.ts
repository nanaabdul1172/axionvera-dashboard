import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock ResizeObserver for Recharts ResponsiveContainer in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

// Mock AppTooltip to avoid Radix UI dependency issues in tests
jest.mock("@/components/AppTooltip", () => ({
  AppTooltip: ({ children }: { children: React.ReactNode }) => children,
}), { virtual: true });
