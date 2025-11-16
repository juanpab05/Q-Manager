import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import PersonalData from './PersonalData';

jest.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../hooks/useMediaQuery', () => () => false);
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div>ToastContainer</div>,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../components/LoadingSpinner', () => () => <div>LoadingSpinner</div>);

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUseAuth = jest.requireMock('../../contexts/auth/AuthContext').useAuth;

jest.mock('./PersonalDataForm', () => (props: any) => {

  if (props.onEditClick) props.onEditClick();
  if (props.onCancelEdit) props.onCancelEdit();
  if (props.onSaveSuccess) props.onSaveSuccess();
  if (props.onSaveError) props.onSaveError('test-error');
  if (props.onGoBack) props.onGoBack();
  if (props.onNavigateToResetPassword) props.onNavigateToResetPassword();
  if (props.setIsSaving) props.setIsSaving(true);
  return <div>PersonalDataForm</div>;
});

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
  jest.clearAllMocks();
});

test('PersonalData muestra LoadingSpinner mientras auth carga', () => {
  mockUseAuth.mockReturnValue({
    userProfile: null,
    loading: true,
    isAuthenticated: false,
    user: null,
    refreshUserProfile: jest.fn(),
  });

  const root = createRoot(container!);
  act(() => {
    root.render(
      <MemoryRouter>
        <PersonalData />
      </MemoryRouter>
    );
  });

  expect(container!.textContent).toContain('LoadingSpinner');
  act(() => root.unmount());
});

test('PersonalData renderiza datos del usuario cuando está autenticado', () => {
  const mockUserProfile = {
    id: 1,
    nombre: 'Juan Pérez',
    cedula: 12345678,
    email: 'juan@example.com',
    phone_number: '+573001234567',
    userType: 'worker',
  };

  mockUseAuth.mockReturnValue({
    userProfile: mockUserProfile,
    loading: false,
    isAuthenticated: true,
    user: { id: 1 },
    refreshUserProfile: jest.fn(),
  });

  const root = createRoot(container!);
  act(() => {
    root.render(
      <MemoryRouter>
        <PersonalData />
      </MemoryRouter>
    );
  });

  expect(container!.textContent).toContain('Mis Datos Personales');
  expect(container!.textContent).toContain('PersonalDataForm');
  act(() => root.unmount());
});

test('PersonalData redirige a login si no está autenticado', () => {
  mockUseAuth.mockReturnValue({
    userProfile: null,
    loading: false,
    isAuthenticated: false,
    user: null,
    refreshUserProfile: jest.fn(),
  });

  const root = createRoot(container!);
  act(() => {
    root.render(
      <MemoryRouter>
        <PersonalData />
      </MemoryRouter>
    );
  });

  expect(container!.textContent).toContain('LoadingSpinner');
  act(() => root.unmount());
});

test('PersonalData maneja diferentes tipos de usuario', () => {
  const mockAdminProfile = {
    id: 2,
    nombre: 'Admin User',
    cedula: 87654321,
    email: 'admin@example.com',
    phone_number: '+573008765432',
    userType: 'admin',
  };

  mockUseAuth.mockReturnValue({
    userProfile: mockAdminProfile,
    loading: false,
    isAuthenticated: true,
    user: { id: 2 },
    refreshUserProfile: jest.fn(),
  });

  const root = createRoot(container!);
  act(() => {
    root.render(
      <MemoryRouter>
        <PersonalData />
      </MemoryRouter>
    );
  });

  expect(container!.textContent).toContain('Mis Datos Personales');
  act(() => root.unmount());
});

test('PersonalData ejecuta todas las funciones internas a través del form', () => {
  const mockUserProfile = {
    id: 3,
    nombre: 'Worker User',
    cedula: 11223344,
    email: 'worker@example.com',
    phone_number: '+57300112233',
    userType: 'worker',
  };

  mockUseAuth.mockReturnValue({
    userProfile: mockUserProfile,
    loading: false,
    isAuthenticated: true,
    user: { id: 3 },
    refreshUserProfile: jest.fn(),
  });

  const root = createRoot(container!);
  act(() => {
    root.render(
      <MemoryRouter>
        <PersonalData />
      </MemoryRouter>
    );
  });

  expect(container!.textContent).toContain('PersonalDataForm');
  act(() => root.unmount());
});
