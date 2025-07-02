// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Silence console.warn for tests
global.console = {
  ...console,
  warn: jest.fn(),
};