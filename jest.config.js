/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx",
        module: "CommonJS",
        moduleResolution: "Node",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        paths: {
          "@/*": ["src/*"]
        }
      }
    }]
  },
  moduleDirectories: ["node_modules", "<rootDir>"]
};
