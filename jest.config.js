const config = {
  verbose: true,
  preset: 'ts-jest',
  // use jsdom for React DOM tests
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.app.json',
    },
  },
  transformIgnorePatterns: ['/node_modules/'],
  // setup files are executed before the test framework is installed
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  // map static asset imports (css/images) to mocks so Jest doesn't try to parse them
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/src/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
};

export default config;