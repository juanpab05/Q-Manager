import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './navbar';

// Mock the auth context used by Navbar
jest.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    logout: async () => {},
  }),
}));

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
});

test('Navbar renders and contains brand text', () => {
  if (!container) throw new Error('Test container not initialized');
  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(MemoryRouter, null, React.createElement(Navbar, null))
    );
  });

  // Basic assertion: brand text should be present
  console.log(container.textContent)
  expect(container.textContent).toContain('Q-Manager');

  act(() => {
    root.unmount();
  });
});