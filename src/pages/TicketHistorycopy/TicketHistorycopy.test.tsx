import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import TicketHistoryPage from "./TicketHistorycopy";

// Mocks
jest.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../api/ticketService', () => ({
  getMyTickets: jest.fn()
}));

// Mock de LoadingSpinner con ruta relativa
jest.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => <div data-testid="loading-spinner">{message}</div>
}));

jest.mock('react-toastify', () => ({
  ToastContainer: () => null,
  toast: {
    error: jest.fn()
  }
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

import { useAuth } from '../../contexts/auth/AuthContext';
import { getMyTickets } from '../../api/ticketService';
import { toast } from 'react-toastify';

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  jest.clearAllMocks();
});

afterEach(() => {
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
});

const mockTickets = [
  {
    id: 1,
    ticket_number: "T001",
    service: "Asesoría General",
    status: "PENDIENTE",
    status_display: "Pendiente",
    created_at: "2024-01-15T10:30:00Z",
    modality: "PRESENCIAL",
    modality_display: "Presencial",
    is_priority: false
  },
  {
    id: 2,
    ticket_number: "T002",
    service: "Pago de Factura",
    status: "ATENDIDO",
    status_display: "Atendido",
    created_at: "2024-01-14T14:20:00Z",
    modality: "VIRTUAL",
    modality_display: "Virtual",
    is_priority: true
  }
];

const renderComponent = (authState = { isAuthenticated: true }) => {
  (useAuth as jest.Mock).mockReturnValue(authState);

  const root = createRoot(container!);
  act(() => {
    root.render(
      <MemoryRouter>
        <TicketHistoryPage />
      </MemoryRouter>
    );
  });
  
  return root;
};

describe("TicketHistoryPage", () => {
  it("redirige al login si no está autenticado", () => {
    renderComponent({ isAuthenticated: false });

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it("muestra loading inicial", () => {
    (getMyTickets as jest.Mock).mockImplementation(() => new Promise(() => {})); // Nunca se resuelve
    
    const root = renderComponent();

    expect(container!.textContent).toContain("Cargando historial de tickets");

    act(() => {
      root.unmount();
    });
  });

  it("muestra lista de tickets correctamente", async () => {
    (getMyTickets as jest.Mock).mockResolvedValue(mockTickets);
    
    const root = renderComponent();

    // Esperar a que se resuelva la promesa
    await act(async () => {
      await Promise.resolve();
    });

    expect(container!.textContent).toContain("Historial de Tickets");
    expect(container!.textContent).toContain("T001");
    expect(container!.textContent).toContain("T002");
    expect(container!.textContent).toContain("Asesoría General");
    expect(container!.textContent).toContain("Pago de Factura");
    expect(container!.textContent).toContain("Pendiente");
    expect(container!.textContent).toContain("Atendido");

    act(() => {
      root.unmount();
    });
  });

  it("muestra mensaje cuando no hay tickets", async () => {
    (getMyTickets as jest.Mock).mockResolvedValue([]);
    
    const root = renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(container!.textContent).toContain("No tienes turnos en tu historial");
    expect(container!.textContent).toContain("Puedes solicitar un nuevo turno");

    act(() => {
      root.unmount();
    });
  });

  it("maneja errores al cargar tickets", async () => {
    const errorMessage = "Error al cargar tickets";
    (getMyTickets as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const root = renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(container!.textContent).toContain("Error");
    expect(container!.textContent).toContain(errorMessage);
    expect(toast.error).toHaveBeenCalledWith(errorMessage);

    act(() => {
      root.unmount();
    });
  });

  it("permite regresar al home", async () => {
    (getMyTickets as jest.Mock).mockResolvedValue(mockTickets);
    
    const root = renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    const backButton = container!.querySelector('button');
    
    act(() => {
      backButton?.click();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/home-user');

    act(() => {
      root.unmount();
    });
  });

  it("muestra correctamente los estados de los tickets", async () => {
    (getMyTickets as jest.Mock).mockResolvedValue(mockTickets);
    
    const root = renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    // Verificar que se muestran ambos estados
    expect(container!.textContent).toContain("Pendiente");
    expect(container!.textContent).toContain("Atendido");

    act(() => {
      root.unmount();
    });
  });

  it("muestra modalidades correctamente", async () => {
    (getMyTickets as jest.Mock).mockResolvedValue(mockTickets);
    
    const root = renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(container!.textContent).toContain("Presencial");
    expect(container!.textContent).toContain("Virtual");

    act(() => {
      root.unmount();
    });
  });

  it("maneja error con respuesta de API", async () => {
    const apiError = { response: { data: { detail: "Error específico de API" } } };
    (getMyTickets as jest.Mock).mockRejectedValue(apiError);
    
    const root = renderComponent();

    await act(async () => {
      await Promise.resolve();
    });

    expect(container!.textContent).toContain("Error específico de API");
    expect(toast.error).toHaveBeenCalledWith("Error específico de API");

    act(() => {
      root.unmount();
    });
  });
});