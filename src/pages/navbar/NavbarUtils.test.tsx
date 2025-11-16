import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { useMediaQuery, MenuIcon, CloseIcon } from "./NavbarUtils";

// Mock para matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
});

describe("useMediaQuery", () => {
  it("devuelve false cuando el media query no coincide", () => {
    let matchesValue: boolean;
    
    const TestComponent = () => {
      matchesValue = useMediaQuery("(max-width: 768px)");
      return null;
    };

    const root = createRoot(container!);
    act(() => {
      root.render(<TestComponent />);
    });

    expect(matchesValue!).toBe(false);
    
    act(() => {
      root.unmount();
    });
  });

  it("devuelve true cuando el media query coincide", () => {
    // Mock para cuando coincide el media query
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    let matchesValue: boolean;
    
    const TestComponent = () => {
      matchesValue = useMediaQuery("(max-width: 768px)");
      return null;
    };

    const root = createRoot(container!);
    act(() => {
      root.render(<TestComponent />);
    });

    expect(matchesValue!).toBe(true);
    
    act(() => {
      root.unmount();
    });
  });

  it("se suscribe y desuscribe correctamente de los eventos", () => {
    const mockAddEventListener = jest.fn();
    const mockRemoveEventListener = jest.fn();

    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    }));

    const TestComponent = () => {
      useMediaQuery("(max-width: 768px)");
      return null;
    };

    const root = createRoot(container!);
    act(() => {
      root.render(<TestComponent />);
    });

    // Verificar que se suscribió al evento
    expect(mockAddEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    act(() => {
      root.unmount();
    });

    // Verificar que se desuscribió al desmontar
    expect(mockRemoveEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});

describe("Icon Components", () => {
  it("renderiza MenuIcon correctamente", () => {
    const root = createRoot(container!);
    act(() => {
      root.render(<MenuIcon />);
    });

    const svgElement = container!.querySelector('svg');
    expect(svgElement).not.toBeNull();
    expect(svgElement?.getAttribute('class')).toContain('w-7 h-7');
    
    act(() => {
      root.unmount();
    });
  });

  it("renderiza CloseIcon correctamente", () => {
    const root = createRoot(container!);
    act(() => {
      root.render(<CloseIcon />);
    });

    const svgElement = container!.querySelector('svg');
    expect(svgElement).not.toBeNull();
    expect(svgElement?.getAttribute('class')).toContain('w-7 h-7');
    
    act(() => {
      root.unmount();
    });
  });


  it("CloseIcon tiene los paths correctos", () => {
    const root = createRoot(container!);
    act(() => {
      root.render(<CloseIcon />);
    });

    const paths = container!.querySelectorAll('path');
    expect(paths.length).toBe(1); // Una X
    
    act(() => {
      root.unmount();
    });
  });
});