import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./navbar";

// Mocks esenciales
jest.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../hooks/useMediaQuery', () => jest.fn());

jest.mock('./NavbarIcons', () => ({
  MenuIcon: () => <span>≡</span>,
  CloseIcon: () => <span>×</span>,
  HomeIcon: () => <span>🏠</span>,
  DashboardIcon: () => <span>📊</span>,
  AboutIcon: () => <span>ℹ️</span>,
  RegisterIcon: () => <span>👤</span>,
  LoginIcon: () => <span>🔑</span>,
  LogoutIcon: () => <span>🚪</span>,
}));

// Mock de localStorage solamente
const mockLocalStorage = {
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

import { useAuth } from '../../contexts/auth/AuthContext';
import useMediaQuery from '../../hooks/useMediaQuery';

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  jest.clearAllMocks();
  (useMediaQuery as jest.Mock).mockReturnValue(false);
  mockLocalStorage.removeItem.mockClear();
});

afterEach(() => {
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
});

const renderNavbar = (authState = { isAuthenticated: false }) => {
  const mockLogout = jest.fn();
  
  (useAuth as jest.Mock).mockReturnValue({
    isAuthenticated: authState.isAuthenticated,
    logout: mockLogout,
  });

  const root = createRoot(container!);
  act(() => {
    root.render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  });
  
  return { root, mockLogout };
};

describe("Navbar", () => {
  it("renderiza navbar para usuarios no autenticados", () => {
    const { root } = renderNavbar();

    expect(container!.textContent).toContain("Q-Manager");
    expect(container!.textContent).toContain("Inicio");
    expect(container!.textContent).toContain("Sobre nosotros");
    expect(container!.textContent).toContain("Regístrate");
    expect(container!.textContent).toContain("Iniciar Sesión");

    act(() => {
      root.unmount();
    });
  });

  it("renderiza navbar para usuarios autenticados", () => {
    const { root } = renderNavbar({ isAuthenticated: true });

    expect(container!.textContent).toContain("Dashboard");
    expect(container!.textContent).toContain("Cerrar sesión");
    expect(container!.textContent).not.toContain("Regístrate");
    expect(container!.textContent).not.toContain("Iniciar Sesión");

    act(() => {
      root.unmount();
    });
  });

  it("ejecuta logout correctamente", async () => {
    const { root, mockLogout } = renderNavbar({ isAuthenticated: true });

    const logoutButton = Array.from(container!.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('Cerrar sesión'));
    
    expect(logoutButton).not.toBeNull();

    await act(async () => {
      logoutButton?.click();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("usuario");
    expect(mockLogout).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it("maneja vista mobile correctamente", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    const { root } = renderNavbar();

    const mobileButton = container!.querySelector('[aria-controls="mobile-menu"]');
    expect(mobileButton).not.toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("maneja vista desktop correctamente", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { root } = renderNavbar();

    const mobileButton = container!.querySelector('[aria-controls="mobile-menu"]');
    expect(mobileButton).toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("maneja error en logout sin romperse", async () => {
    const mockLogout = jest.fn().mockRejectedValue(new Error("Logout failed"));
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
    });

    const root = createRoot(container!);
    act(() => {
      root.render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );
    });

    const logoutButton = Array.from(container!.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('Cerrar sesión'));

    await act(async () => {
      logoutButton?.click();
    });

    // Verificar que se limpió localStorage incluso con error
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("usuario");
    expect(mockLogout).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });
});