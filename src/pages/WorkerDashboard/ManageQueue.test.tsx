import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";

// Componente a probar
import ManageQueue from "./ManageQueue";

// Mock: navegación
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
jest.mock("../../contexts/auth/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "123",
      user_metadata: { role: "worker", is_admin: false },
    },
  }),
}));

// Mock LoadingSpinner
jest.mock("../../components/LoadingSpinner", () => () => (
  <div data-testid="loading-spinner">Cargando...</div>
));

// Mock accessPointService
jest.mock("../../api/accessPointService", () => ({
  getAllAccessPoints: jest.fn(),
  getWorkerAccessPoints: jest.fn().mockResolvedValue([
    {
      id: 1,
      is_priority: false,
      estado: "ACTIVO",
      tickets_atendidos: 0,
    },
  ]),
  initializeAccessPoint: jest.fn(),
  nextTicket: jest.fn(),
  togglePauseAccessPoint: jest.fn(),
  getCurrentTicket: jest.fn().mockResolvedValue(null),
  verifyDatabaseSchema: jest.fn().mockResolvedValue(undefined),
}));

describe("ManageQueue Component", () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    container = null;
  });

  test("Renderiza correctamente y muestra el punto de acceso", async () => {
    await act(async () => {
      const root = createRoot(container!);

      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    // Verificar HTML contenido
    expect(container!.innerHTML).toContain("Gestión de Filas");
    expect(container!.innerHTML).toContain("Punto #1"); // viene del mock
  });
});
