
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";

import ManageQueue from "./ManageQueuecopy";

// -------------------------------
// Mocks
// -------------------------------
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock Auth (context)
jest.mock("../../contexts/auth/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      user_metadata: { role: "worker", is_admin: false },
    },
  }),
}));

// Mock spinner
jest.mock("../../components/LoadingSpinner", () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mocks de accessPointService
const mockGetAll = jest.fn();
const mockGetWorker = jest.fn();
const mockInit = jest.fn();
const mockNext = jest.fn();
const mockToggle = jest.fn();
const mockCurrent = jest.fn();
const mockSchema = jest.fn();
const mockAttend = jest.fn();

jest.mock("../../api/accessPointService", () => ({
  getAllAccessPoints: (...args: any[]) => mockGetAll(...args),
  getWorkerAccessPoints: (...args: any[]) => mockGetWorker(...args),
  initializeAccessPoint: (...args: any[]) => mockInit(...args),
  nextTicket: (...args: any[]) => mockNext(...args),
  togglePauseAccessPoint: (...args: any[]) => mockToggle(...args),
  getCurrentTicket: (...args: any[]) => mockCurrent(...args),
  verifyDatabaseSchema: (...args: any[]) => mockSchema(...args),
  attendTicket: (...args: any[]) => mockAttend(...args),
}));

// -------------------------------
// Helpers
// -------------------------------
let container: HTMLDivElement | null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);

  mockNavigate.mockClear();
  mockGetAll.mockReset();
  mockGetWorker.mockReset();
  mockInit.mockReset();
  mockNext.mockReset();
  mockToggle.mockReset();
  mockCurrent.mockReset();
  mockSchema.mockReset();
  mockAttend.mockReset();
});

afterEach(() => {
  document.body.innerHTML = "";
  container = null;
});

// -------------------------------
// TESTS
// -------------------------------

describe("ManageQueue — FULL TEST", () => {
  test("Renderiza título y lista de puntos", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, is_priority: false, estado: "ACTIVO", tickets_atendidos: 5 },
      { id: 2, is_priority: true, estado: "PAUSADO", tickets_atendidos: 2 },
    ]);

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    expect(container!.innerHTML).toContain("Gestión de Filas");
    expect(container!.innerHTML).toContain("Punto #1");
    expect(container!.innerHTML).toContain("Punto #2");
  });

  
  test("Inicializa un punto cerrado", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, is_priority: false, estado: "CERRADO" },
    ]);
    mockInit.mockResolvedValue({ id: 1, estado: "ACTIVO", is_priority: false });
    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mockInit).toHaveBeenCalled();
    expect(container!.innerHTML).toContain(
      "Punto de acceso inicializado correctamente"
    );
  });

  test("NextTicket — sin ticket actual", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, is_priority: false, estado: "ACTIVO" },
    ]);
    mockCurrent.mockResolvedValue(null);

    mockNext.mockResolvedValue({
      ticket: {
        id: 100,
        ticket_number: "A001",
        service: "Pago",
        is_priority: false,
      },
      message: "Tomado",
    });

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mockNext).toHaveBeenCalled();
    expect(container!.innerHTML).toContain("A001");
  });

  test("NextTicket — ticket actual existente (usa attendTicket)", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);
    mockCurrent.mockResolvedValue({
      id: 50,
      ticket_number: "B010",
      is_priority: false,
      service: "Test",
    });

    mockAttend.mockResolvedValue(true);

    mockNext.mockResolvedValue({
      ticket: {
        id: 200,
        ticket_number: "C002",
        service: "Doc",
        is_priority: true,
      },
      message: "OK",
    });

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mockAttend).toHaveBeenCalledWith(50, 1);
    expect(container!.innerHTML).toContain("C002");
  });

  test("NextTicket — attendTicket falla pero continúa flujo", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);
    mockCurrent.mockResolvedValue({
      id: 50,
      ticket_number: "B010",
      is_priority: false,
      service: "Test",
    });

    mockAttend.mockRejectedValue(new Error("fail"));

    mockNext.mockResolvedValue({
      ticket: { id: 200, ticket_number: "C002" },
      message: "OK",
    });

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("C002");
  });

  test("NextTicket — null => no hay tickets", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);
    mockCurrent.mockResolvedValue(null);

    mockNext.mockResolvedValue(null);

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("No hay tickets pendientes");
  });

  test("NextTicket — error No hay tickets pendientes", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);
    mockCurrent.mockResolvedValue(null);

    mockNext.mockRejectedValue(new Error("No hay tickets pendientes"));

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("No hay tickets pendientes");
  });

  test("Toggle Pause — cambia estado", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);

    mockToggle.mockResolvedValue({
      id: 1,
      estado: "PAUSADO",
      is_priority: false,
    });

    mockSchema.mockResolvedValue(undefined);
    mockCurrent.mockResolvedValue(null);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    const btn = container!.querySelectorAll("button")[1];

    await act(async () => {
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("Punto de acceso pausado");
  });

  test("Toggle Pause — error", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);

    mockToggle.mockRejectedValue(new Error("fail"));

    mockSchema.mockResolvedValue(undefined);
    mockCurrent.mockResolvedValue(null);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    const btn = container!.querySelectorAll("button")[1];

    await act(async () => {
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("Error al pausar/reanudar");
  });

  
  // -------------------------------
  // Additional tests to cover missing branches
  // -------------------------------

  test("NextTicket — responde con objeto simple Ticket (compatibilidad backwards)", async () => {
    // worker access points loaded
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);
    mockCurrent.mockResolvedValue(null);

    // nextTicket devuelve directamente un Ticket (no {ticket, message})
    mockNext.mockResolvedValue({
      id: 321,
      ticket_number: "SIMPLE-1",
      service: "Consulta",
      is_priority: false,
    });

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    // Click Siguiente Ticket
    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("SIMPLE-1");
    expect(container!.innerHTML).toContain("Ticket asignado para atención");
  });

  test("NextTicket — respuesta con { ticket: null, message } marca noTicketsAvailable", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);
    mockCurrent.mockResolvedValue(null);

    mockNext.mockResolvedValue({ ticket: null, message: "No hay para hoy" });

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("No hay para hoy");
    // se debe mostrar el mensaje de no hay tickets en el bloque correspondiente
    expect(container!.innerHTML).toContain(
      "No hay un ticket siendo atendido actualmente"
    );
  });

  test("fetchCurrentTicket muestra el ticket actual cuando se selecciona un punto", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 7, estado: "ACTIVO", is_priority: false },
    ]);

    // getCurrentTicket devuelve ticket para el punto 7
    mockCurrent.mockResolvedValue({
      id: 77,
      ticket_number: "T-77",
      service: "Servicio X",
      is_priority: true,
      user: { nombre: "Cliente X" },
      modality: "Presencial",
    });

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    // seleccionar el punto (disparará fetchCurrentTicket)
    await act(async () => {
      container!
        .querySelector("li")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Ahora debe estar visible la información del ticket actual
    expect(container!.innerHTML).toContain("Ticket Actual");
    expect(container!.innerHTML).toContain("T-77");
    expect(container!.innerHTML).toContain("Cliente X");
    expect(container!.innerHTML).toContain("Presencial");
  });

  // test("handleInitialize — error muestra mensaje de error", async () => {
  //   mockGetWorker.mockResolvedValue([
  //     { id: 11, estado: "CERRADO", is_priority: false },
  //   ]);

  //   // initialize falla
  //   mockInit.mockRejectedValueOnce(new Error("init fail"));

  //   mockSchema.mockResolvedValue(undefined);

  //   await act(async () => {
  //     const root = createRoot(container!);
  //     root.render(
  //       <MemoryRouter>
  //         <ManageQueue />
  //       </MemoryRouter>
  //     );
  //   });

  //   // click en inicializar (primer botón)
  //   await act(async () => {
  //     container!
  //       .querySelector("button")!
  //       .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  //   });

  //   expect(container!.innerHTML).toContain(
  //     "Error al inicializar el punto de acceso"
  //   );
  // });

  test("Toggle Pause — reactivar muestra mensaje 'reactivado'", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 2, estado: "PAUSADO", is_priority: false },
    ]);

    // toggle devuelve ACTIVO -> reactivado
    mockToggle.mockResolvedValue({
      id: 2,
      estado: "ACTIVO",
      is_priority: false,
    });

    mockSchema.mockResolvedValue(undefined);
    mockCurrent.mockResolvedValue(null);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    // boton "Reanudar" será el segundo botón (índice 1)
    const btn = container!.querySelectorAll("button")[1];

    await act(async () => {
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("Punto de acceso reactivado");
  });

  test("NextTicket actualiza selectedPoint con datos retornados por fetchAccessPoints", async () => {
    // Primera carga devuelve un punto con 0 atendidos
    mockGetWorker
      .mockResolvedValueOnce([
        { id: 5, estado: "ACTIVO", tickets_atendidos: 0 },
      ])
      // Segunda llamada (después de nextTicket) devuelve el punto actualizado
      .mockResolvedValueOnce([
        { id: 5, estado: "ACTIVO", tickets_atendidos: 9 },
      ]);

    mockCurrent.mockResolvedValue(null);

    mockNext.mockResolvedValue({
      ticket: {
        id: 500,
        ticket_number: "UPD-1",
        service: "S",
        is_priority: false,
      },
      message: "OK",
    });

    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    // antes: muestra 0 atendidos
    expect(container!.innerHTML).toContain("0 atendidos");

    // click siguiente ticket -> fetchAccessPoints se llama y ahora regresa 9 atendidos
    await act(async () => {
      container!
        .querySelector("button")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // ahora el panel seleccionado debe reflejar 9 atendidos
    expect(container!.innerHTML).toContain("9 atendidos");
  });

  

  // --- EXTRA TESTS FOR COVERAGE (45-55, 90-105, 137-153, 219-230) ---

 

  test("fetchCurrentTicket: error silencioso", async () => {
    mockGetWorker.mockResolvedValue([
      { id: 1, estado: "ACTIVO", is_priority: false },
    ]);
    mockCurrent.mockRejectedValue(new Error("fail"));
    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    // select point
    await act(async () => {
      container!
        .querySelector("li")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container!.innerHTML).toContain("Punto #1");
  });

  test("fetchAccessPoints: usuario admin usa getAllAccessPoints", async () => {
    // override mockAuth
    jest
      .spyOn(require("../../contexts/auth/AuthContext"), "useAuth")
      .mockReturnValue({
        user: { id: "u1", user_metadata: { is_admin: true, role: "admin" } },
      });

    mockGetAll.mockResolvedValue([{ id: 10 }]);
    mockSchema.mockResolvedValue(undefined);

    await act(async () => {
      const root = createRoot(container!);
      root.render(
        <MemoryRouter>
          <ManageQueue />
        </MemoryRouter>
      );
    });

    expect(mockGetAll).toHaveBeenCalled();
    expect(container!.innerHTML).toContain("Punto #10");
  });

});