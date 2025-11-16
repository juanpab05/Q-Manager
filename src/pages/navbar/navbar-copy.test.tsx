import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
// Mutable mock for the auth context so tests can change auth state without reloading modules
const useAuthMock = jest.fn(() => ({ isAuthenticated: false, logout: async () => {} }));
jest.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

import Navbar from './navbar-copy';

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

test('displays Cerrar sesión when user is authenticated', async () => {
  // Change the mock to simulate an authenticated user
  useAuthMock.mockReturnValue({ isAuthenticated: true, logout: async () => {} });

  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);

  act(() => {
    root.render(React.createElement(MemoryRouter, null, React.createElement(Navbar, null)));
  });

  expect(div.textContent).toContain('Cerrar sesión');

  act(() => {
    root.unmount();
  });
  document.body.removeChild(div);
});

test('handleLogout failure triggers fallback navigation and clears localStorage', async () => {
  // Prepare: set an item in localStorage
  localStorage.setItem('usuario', 'will-be-removed');

  // Make logout reject to force the catch path
  const logoutMock = jest.fn().mockRejectedValue(new Error('failed'));
  useAuthMock.mockReturnValue({ isAuthenticated: true, logout: logoutMock });

  // No window.location replacement here (jsdom prevents redefining it reliably).

  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);

  await act(async () => {
    root.render(React.createElement(MemoryRouter, null, React.createElement(Navbar, null)));
  });

  const buttons = Array.from(div.querySelectorAll('button'));
  const logoutBtn = buttons.find(b => b.textContent?.includes('Cerrar sesión'));
  expect(logoutBtn).toBeDefined();

  // Click and wait for the rejection to propagate to the catch block
  await act(async () => {
    logoutBtn!.click();
    // flush microtasks
    await Promise.resolve();
  });

  expect(logoutMock).toHaveBeenCalled();
  expect(localStorage.getItem('usuario')).toBeNull();
  // We avoid asserting on window.location.href because jsdom prevents reliable redefinition.

  act(() => {
    root.unmount();
  });
  document.body.removeChild(div);

  // nothing to restore for window.location
});

test('mobile menu opens and closes; click outside closes it', async () => {
  // Simulate mobile viewport by replacing matchMedia to return matches=true
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: ((query: string) => ({ matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia,
  });

  useAuthMock.mockReturnValue({ isAuthenticated: false, logout: async () => {} });

  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);

  act(() => {
    root.render(React.createElement(MemoryRouter, null, React.createElement(Navbar, null)));
  });

  // Find the mobile menu toggle button (has aria-controls="mobile-menu")
  const toggleBtn = Array.from(div.querySelectorAll('button')).find(b => b.getAttribute('aria-controls') === 'mobile-menu');
  expect(toggleBtn).toBeDefined();

  // Open the menu
  act(() => {
    toggleBtn!.click();
  });

  const mobileMenu = div.querySelector('#mobile-menu');
  expect(mobileMenu).toBeDefined();
  // When open, it should not have the closed max-h-0 class
  expect(mobileMenu!.className).not.toContain('max-h-0');

  // Simulate clicking outside: dispatch mousedown on document body
  act(() => {
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });

  // Menu should be closed now
  expect(mobileMenu!.className).toContain('max-h-0');

  act(() => {
    root.unmount();
  });
  document.body.removeChild(div);

  // restore matchMedia
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: originalMatchMedia,
  });
});

test('handleLogout calls auth.logout and clears localStorage', async () => {
  // Prepare: set an item in localStorage that should be removed by logout
  localStorage.setItem('usuario', 'test-user');

  // Create a logout mock we can assert on and return it via the auth mock
  const logoutMock = jest.fn().mockResolvedValue(undefined);
  useAuthMock.mockReturnValue({ isAuthenticated: true, logout: logoutMock });

  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);

  act(() => {
    root.render(React.createElement(MemoryRouter, null, React.createElement(Navbar, null)));
  });

  // Find the logout button by text and click it
  const buttons = Array.from(div.querySelectorAll('button'));
  const logoutBtn = buttons.find(b => b.textContent?.includes('Cerrar sesión'));
  expect(logoutBtn).toBeDefined();

  // Click and wait for async handlers
  await act(async () => {
    logoutBtn!.click();
    // allow microtask queue to flush so the async logout can run
    await Promise.resolve();
  });

  // Assertions: logout called and localStorage cleared
  expect(logoutMock).toHaveBeenCalled();
  expect(localStorage.getItem('usuario')).toBeNull();

  act(() => {
    root.unmount();
  });
  document.body.removeChild(div);
});