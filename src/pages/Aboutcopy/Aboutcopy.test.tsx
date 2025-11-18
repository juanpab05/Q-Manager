// src/pages/About/About.test.tsx
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import AboutPage from './Aboutcopy';

jest.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: false,
  })),
}));

// Función helper para crear container para pruebas
function createTestContainer(): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

// Función helper para limpiar container
function removeTestContainer(container: HTMLDivElement): void {
  document.body.removeChild(container);
}

describe('AboutPage', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  // Obtener referencia al mock
  const mockUseAuth = require('../../contexts/auth/AuthContext').useAuth as jest.Mock;

  beforeEach(() => {
    container = createTestContainer();
    root = createRoot(container);
    jest.clearAllMocks();
    
    // Configurar el mock por defecto
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root!.unmount();
      });
    }
    if (container) {
      removeTestContainer(container);
    }
    container = null;
    root = null;
  });

  const renderComponent = (isAuthenticated: boolean = false) => {
    mockUseAuth.mockReturnValue({
      isAuthenticated,
    });

    act(() => {
      root!.render(<AboutPage />);
    });
  };

  const getTextContent = (element: Element | null): string => {
    return element?.textContent || '';
  };

  const getByText = (text: string): Element => {
    const elements = container!.querySelectorAll('*');
    const element = Array.from(elements).find(el => 
      getTextContent(el).includes(text)
    );
    if (!element) {
      throw new Error(`Element with text "${text}" not found`);
    }
    return element;
  };

  describe('Renderizado básico', () => {
    it('debe renderizar correctamente sin autenticación', () => {
      renderComponent(false);

      expect(getByText('Sobre Q-Manager')).toBeTruthy();
      expect(getByText('Q-Manager es un Sistema de Manejo de Atención a Usuarios')).toBeTruthy();
    });

    it('debe renderizar correctamente con autenticación', () => {
      renderComponent(true);

      expect(getByText('Sobre Q-Manager')).toBeTruthy();
      expect(getByText('Q-Manager es un Sistema de Manejo de Atención a Usuarios')).toBeTruthy();
    });
  });

  describe('Secciones de contenido', () => {
    beforeEach(() => {
      renderComponent(false);
    });

    it('debe mostrar la sección de Misión', () => {
      expect(getByText('Nuestra Misión')).toBeTruthy();
      expect(getByText('Mejorar la experiencia de gestión de filas')).toBeTruthy();
    });

    it('debe mostrar la sección de Visión', () => {
      expect(getByText('Nuestra Visión')).toBeTruthy();
      expect(getByText('Ser reconocidos como el estándar de excelencia')).toBeTruthy();
    });

    it('debe mostrar la sección de Valores', () => {
      expect(getByText('Nuestros Valores')).toBeTruthy();
      expect(getByText('Innovación')).toBeTruthy();
      expect(getByText('Eficiencia')).toBeTruthy();
      expect(getByText('Accesibilidad')).toBeTruthy();
      expect(getByText('Transparencia')).toBeTruthy();
    });
  });

  describe('Sección de equipo', () => {
    it('debe mostrar la sección de equipo con los miembros correctos', () => {
      renderComponent(false);

      expect(getByText('Nuestro Equipo')).toBeTruthy();
      expect(getByText('Cristian Guaza')).toBeTruthy();
      expect(getByText('Desarrollador Fullstack & DB')).toBeTruthy();
    });
  });
});
