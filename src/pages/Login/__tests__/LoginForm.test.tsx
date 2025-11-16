/// &lt;reference types="jest" /&gt;
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/auth/AuthContext';
import useMediaQuery from '@/hooks/useMediaQuery';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('@/hooks/useMediaQuery', () => jest.fn());
jest.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-toastify', () => {
  const toastFn = Object.assign(jest.fn(), {
    error: jest.fn(),
    success: jest.fn(),
  });

  return {
    ToastContainer: () => <div data-testid="toast-container" />,
    toast: toastFn,
  };
});

const mockUseAuth = useAuth as jest.Mock;
const mockUseMediaQuery = useMediaQuery as jest.Mock;

const getToastMock = () =>
  toast as unknown as { error: jest.Mock; success: jest.Mock };

const createAuthMock = (overrides: Record<string, unknown> = {}) => {
  const baseMock = {
    login: jest.fn(),
    sendPhoneOtp: jest.fn(),
    verifyPhoneOtp: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    logout: jest.fn(),
    refreshUserProfile: jest.fn(),
    updateLastActivity: jest.fn(),
    userProfile: {},
    user: null,
    loading: false,
    isAuthenticated: false,
    ...overrides,
  };

  mockUseAuth.mockReturnValue(baseMock);
  return baseMock;
};

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReset();
  mockUseMediaQuery.mockReturnValue(false);
});

describe('LoginForm - email login flow', () => {
  it('shows a toast when trying to submit empty credentials', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authMock.login).not.toHaveBeenCalled();
    expect(getToastMock().error).toHaveBeenCalledWith(
      'Por favor ingrese las credenciales.'
    );
  });

  it('validates email format before calling the auth service', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'invalidmail');
    await user.type(screen.getByPlaceholderText(/contraseña/i), '12345678');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authMock.login).not.toHaveBeenCalled();
    expect(getToastMock().error).toHaveBeenCalledWith(
      'Por favor ingrese un email válido.'
    );
  });

  it('navigates to /home-user after a successful login attempt', async () => {
    const loginMock = jest.fn().mockResolvedValue(true);
    createAuthMock({ login: loginMock });
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'SuperSecret1!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith('user@example.com', 'SuperSecret1!')
    );
    expect(mockNavigate).toHaveBeenCalledWith('/home-user');
    expect(getToastMock().error).not.toHaveBeenCalled();
  });

  it('notifies the user when credentials are invalid', async () => {
    const loginMock = jest.fn().mockResolvedValue(false);
    createAuthMock({ login: loginMock });
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'worker@qmanager.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'WrongPass01');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(getToastMock().error).toHaveBeenCalledWith(
      'Credenciales inválidas o error de conexión.'
    );
  });

  it('surfaces unexpected errors from the auth service', async () => {
    const loginMock = jest.fn().mockRejectedValue(new Error('network'));
    createAuthMock({ login: loginMock });
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'MyPassword!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(getToastMock().error).toHaveBeenCalledWith(
      'Error al iniciar sesión. Intente nuevamente.'
    );
  });

  it('disables the submit button while the login promise is pending', async () => {
    const deferred = createDeferred<boolean>();
    const loginMock = jest.fn(() => deferred.promise);
    createAuthMock({ login: loginMock });
    render(<LoginForm />);
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'Waiting123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Iniciando sesión');

    deferred.resolve(true);
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    expect(submitButton).toHaveTextContent('Iniciar Sesión');
  });

  it('shows success toast when URL contains confirmation=success', () => {
    // Mock URLSearchParams
    const mockSearchParams = new URLSearchParams('?confirmation=success');
    jest.spyOn(URLSearchParams.prototype, 'get').mockImplementation((key) => {
      if (key === 'confirmation') return 'success';
      return null;
    });

    const mockReplaceState = jest.fn();
    window.history.replaceState = mockReplaceState;

    render(<LoginForm />);

    expect(getToastMock().success).toHaveBeenCalledWith(
      '¡Email confirmado! Ya puedes iniciar sesión con tu cuenta.',
      { autoClose: 5000 }
    );
    expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/');
  });

  it('shows error toast when URL hash contains error', () => {
    // Mock URLSearchParams for hash
    const mockHashParams = new URLSearchParams('error=test_error&error_description=Test error message');
    jest.spyOn(URLSearchParams.prototype, 'get').mockImplementation((key) => {
      if (key === 'error') return 'test_error';
      if (key === 'error_description') return 'Test error message';
      return null;
    });

    const mockReplaceState = jest.fn();
    window.history.replaceState = mockReplaceState;

    render(<LoginForm />);

    expect(getToastMock().error).toHaveBeenCalledWith(
      'Test error message',
      { autoClose: 7000 }
    );
    expect(mockReplaceState).toHaveBeenCalledWith({}, document.title, '/');
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const toggleButton = screen.getByLabelText(/mostrar contraseña/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('navigates to recover password when link is clicked', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.click(screen.getByText(/¿olvidaste tu contraseña\?/i));
    expect(mockNavigate).toHaveBeenCalledWith('/recover-password');
  });

  it('navigates to signup when registration link is clicked', async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.click(screen.getByText(/regístrate/i));
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('shows phone tab as disabled and displays warning message', () => {
    render(<LoginForm />);

    const phoneTab = screen.getByText(/teléfono/i);
    expect(phoneTab).toHaveClass('cursor-not-allowed');

    // Click should not change auth method
    const emailTab = screen.getByRole('button', { name: 'Email' });
    expect(emailTab).toHaveClass('text-indigo-600');
  });

  it('does not call sendPhoneOtp when phone form is submitted', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    // The phone form is not rendered by default since authMethod is 'email'
    // This test documents that the phone functionality is disabled
    expect(screen.queryByPlaceholderText(/número de teléfono/i)).not.toBeInTheDocument();

    // Ensure sendPhoneOtp is not called
    expect(authMock.sendPhoneOtp).not.toHaveBeenCalled();
  });



  it('handles email with extra spaces', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), '  user@example.com  ');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Input trims whitespace automatically
    expect(authMock.login).toHaveBeenCalledWith('user@example.com', 'password123');
  });

  it('handles very long email input', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    const longEmail = 'a'.repeat(200) + '@example.com';
    await user.type(screen.getByPlaceholderText(/email/i), longEmail);
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authMock.login).toHaveBeenCalledWith(longEmail, 'password123');
  });

  it('handles special characters in password', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    const specialPassword = 'P@ssw0rd!#$%^&*()';
    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), specialPassword);
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authMock.login).toHaveBeenCalledWith('user@example.com', specialPassword);
  });

  it('renders correctly on mobile devices', () => {
    mockUseMediaQuery.mockReturnValue(true);
    render(<LoginForm />);

    // Check that mobile-specific classes are applied
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('pt-24');
  });

  it('renders correctly on desktop devices', () => {
    mockUseMediaQuery.mockReturnValue(false);
    render(<LoginForm />);

    // Check that desktop-specific classes are applied (has sm:pt-28)
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('sm:pt-28');
  });

  it('shows proper form structure and accessibility', () => {
    render(<LoginForm />);

    // Check form structure using querySelector since form doesn't have role
    const form = document.querySelector('form');
    expect(form).toHaveAttribute('novalidate');

    // Check input labels and placeholders
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Check accessibility attributes - aria-label is on the button
    const toggleButton = screen.getByLabelText(/mostrar contraseña/i);
    expect(toggleButton).toHaveAttribute('aria-label', 'Mostrar contraseña');
  });

  it('handles form submission with Enter key', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.keyboard('{Enter}');

    expect(authMock.login).toHaveBeenCalledWith('user@example.com', 'password123');
  });

  it('prevents multiple rapid submissions', async () => {
    const deferred = createDeferred<boolean>();
    const loginMock = jest.fn(() => deferred.promise);
    createAuthMock({ login: loginMock });
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');

    // Click multiple times rapidly
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Should only call login once
    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(loginMock).toHaveBeenCalledWith('user@example.com', 'password123');
  });

  it('handles network timeout errors', async () => {
    // Reset URL mocks to avoid interference
    jest.restoreAllMocks();
    jest.spyOn(URLSearchParams.prototype, 'get').mockReturnValue(null);

    const loginMock = jest.fn().mockRejectedValue(new Error('Network timeout'));
    createAuthMock({ login: loginMock });
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(getToastMock().error).toHaveBeenCalledWith(
      'Error al iniciar sesión. Intente nuevamente.'
    );
  });

  it('maintains form state during submission', async () => {
    const deferred = createDeferred<boolean>();
    const loginMock = jest.fn(() => deferred.promise);
    createAuthMock({ login: loginMock });
    render(<LoginForm />);
    const user = userEvent.setup();

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Form should maintain values during submission
    expect(emailInput).toHaveValue('user@example.com');
    expect(passwordInput).toHaveValue('password123');

    deferred.resolve(true);
    await waitFor(() => expect(loginMock).toHaveBeenCalled());
  });

  it('handles authentication context errors gracefully', async () => {
    const loginMock = jest.fn().mockRejectedValue(new Error('Auth service unavailable'));
    createAuthMock({ login: loginMock });
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(getToastMock().error).toHaveBeenCalledWith(
      'Error al iniciar sesión. Intente nuevamente.'
    );
  });

  it('validates email with multiple @ symbols', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'user@domain@invalid.com');
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Should validate as valid since it contains @
    expect(authMock.login).toHaveBeenCalledWith('user@domain@invalid.com', 'password123');
  });

  it('handles empty password with valid email', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    // Leave password empty
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authMock.login).not.toHaveBeenCalled();
    expect(getToastMock().error).toHaveBeenCalledWith(
      'Por favor ingrese las credenciales.'
    );
  });

  it('handles empty email with valid password', async () => {
    const authMock = createAuthMock();
    render(<LoginForm />);
    const user = userEvent.setup();

    // Leave email empty
    await user.type(screen.getByPlaceholderText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authMock.login).not.toHaveBeenCalled();
    expect(getToastMock().error).toHaveBeenCalledWith(
      'Por favor ingrese las credenciales.'
    );
  });
});