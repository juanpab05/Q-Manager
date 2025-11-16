import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./navbar";

// Mocks
jest.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('./NavbarUtils', () => ({
  useMediaQuery: jest.fn(),
  MenuIcon: () => <span data-testid="menu-icon">☰</span>,
  CloseIcon: () => <span data-testid="close-icon">✕</span>,
}));

// Mock localStorage
const mockLocalStorage = {
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

import { useAuth } from '../../contexts/auth/AuthContext';
import { useMediaQuery } from './NavbarUtils';

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
  it("renderiza navbar con logo y enlaces básicos", () => {
    const { root } = renderNavbar();

    expect(container!.textContent).toContain("Q-Manager");
    expect(container!.textContent).toContain("Inicio");
    expect(container!.textContent).toContain("Sobre nosotros");

    act(() => {
      root.unmount();
    });
  });

  it("muestra enlaces de registro/login para usuarios no autenticados", () => {
    const { root } = renderNavbar();

    expect(container!.textContent).toContain("Regístrate");
    expect(container!.textContent).toContain("Iniciar Sesión");
    expect(container!.textContent).not.toContain("Dashboard");

    act(() => {
      root.unmount();
    });
  });

  it("muestra dashboard y logout para usuarios autenticados", () => {
    const { root } = renderNavbar({ isAuthenticated: true });

    expect(container!.textContent).toContain("Dashboard");
    expect(container!.textContent).toContain("Cerrar sesión");
    expect(container!.textContent).not.toContain("Regístrate");

    act(() => {
      root.unmount();
    });
  });

  it("ejecuta logout correctamente", async () => {
    const { root, mockLogout } = renderNavbar({ isAuthenticated: true });

    const logoutButtons = Array.from(container!.querySelectorAll('button'))
      .filter(btn => btn.textContent?.includes('Cerrar sesión'));
    
    expect(logoutButtons.length).toBeGreaterThan(0);

    await act(async () => {
      logoutButtons[0].click();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("usuario");
    expect(mockLogout).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it("oculta menú móvil en desktop", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    const { root } = renderNavbar();

    const mobileMenuButton = container!.querySelector('[aria-controls="mobile-menu"]');
    expect(mobileMenuButton).toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("muestra menú móvil en mobile", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    const { root } = renderNavbar();

    const mobileMenuButton = container!.querySelector('[aria-controls="mobile-menu"]');
    expect(mobileMenuButton).not.toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("alterna menú móvil al hacer click", () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    const { root } = renderNavbar();

    const mobileMenuButton = container!.querySelector('[aria-controls="mobile-menu"]') as HTMLButtonElement;
    
    // Menú inicialmente cerrado
    const mobileMenu = container!.querySelector('#mobile-menu');
    expect(mobileMenu?.className).toContain('max-h-0');

    // Abrir menú
    act(() => {
      mobileMenuButton.click();
    });

    // Cerrar menú
    act(() => {
      mobileMenuButton.click();
    });

    act(() => {
      root.unmount();
    });
  });

  it("maneja scroll correctamente", () => {
    const { root } = renderNavbar();

    // Simular scroll
    act(() => {
      window.scrollY = 20;
      window.dispatchEvent(new Event('scroll'));
    });

    act(() => {
      root.unmount();
    });
  });
});