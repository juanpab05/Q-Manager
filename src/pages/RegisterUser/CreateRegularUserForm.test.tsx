// Set up mocks before importing the component so module resolution uses them
const mockNavigate = jest.fn();
const mockToastWarn = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockToastInfo = jest.fn();
const mockRegisterUser = jest.fn();

jest.mock('react-router-dom', () => {
    const original = jest.requireActual('react-router-dom');
    return {
        ...original,
        useNavigate: () => mockNavigate,
    };
});

jest.mock('../../contexts/auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: false }),
}));

jest.mock('../../hooks/useMediaQuery', () => ({ __esModule: true, default: () => false }));

jest.mock('react-toastify', () => ({
    ToastContainer: () => null,
    toast: {
        warn: (...args: unknown[]) => mockToastWarn(...args),
        success: (...args: unknown[]) => mockToastSuccess(...args),
        error: (...args: unknown[]) => mockToastError(...args),
        info: (...args: unknown[]) => mockToastInfo(...args),
    },
}));

// Mock both path styles (relative and alias) to ensure the component's imported module is mocked
jest.mock('../../api/userService', () => ({ __esModule: true, registerUser: (...args: unknown[]) => mockRegisterUser(...args), default: { registerUser: (...args: unknown[]) => mockRegisterUser(...args) } }));

// Reset mocks between tests to avoid cross-test pollution
beforeEach(() => {
    jest.clearAllMocks();
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { MemoryRouter } from 'react-router-dom';
import CreateRegularUserForm from './CreateRegularUserForm';

let container: HTMLDivElement | null = null;

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
});

test('redirects to home when already authenticated', () => {
    // override mocked auth to simulate authenticated user
    const authMock = jest.requireMock('../../contexts/auth/AuthContext');
    authMock.useAuth = () => ({ isAuthenticated: true });

    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    expect(mockToastInfo).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/home-user');

    // restore mocked auth
    authMock.useAuth = () => ({ isAuthenticated: false });

    act(() => { root.unmount(); });
});

test('cedula validation rejects non-numeric or too long cedula', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    const c = container!;
    act(() => {
        fireEvent.change(c.querySelector('input[name="nombre"]') as HTMLInputElement, { target: { value: 'Nombre Valido' } });
        fireEvent.change(c.querySelector('input[name="cedula"]') as HTMLInputElement, { target: { value: 'abc123' } });
        fireEvent.change(c.querySelector('input[name="telefono"]') as HTMLInputElement, { target: { value: '987654321' } });
        fireEvent.change(c.querySelector('input[name="email"]') as HTMLInputElement, { target: { value: 'a@b.com' } });
        fireEvent.change(c.querySelector('input#passwordUser') as HTMLInputElement, { target: { value: 'password1' } });
        fireEvent.change(c.querySelector('input#confirmPasswordUser') as HTMLInputElement, { target: { value: 'password1' } });
    });

    const form = c.querySelector('form') as HTMLFormElement;
    act(() => { fireEvent.submit(form); });

    expect(mockToastWarn).toHaveBeenCalled();
    act(() => { root.unmount(); });
});

test('telefono validation rejects invalid phone numbers', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    const c = container!;
    act(() => {
        fireEvent.change(c.querySelector('input[name="nombre"]') as HTMLInputElement, { target: { value: 'Nombre Valido' } });
        fireEvent.change(c.querySelector('input[name="cedula"]') as HTMLInputElement, { target: { value: '1234567' } });
        fireEvent.change(c.querySelector('input[name="telefono"]') as HTMLInputElement, { target: { value: '12' } });
        fireEvent.change(c.querySelector('input[name="email"]') as HTMLInputElement, { target: { value: 'a@b.com' } });
        fireEvent.change(c.querySelector('input#passwordUser') as HTMLInputElement, { target: { value: 'password1' } });
        fireEvent.change(c.querySelector('input#confirmPasswordUser') as HTMLInputElement, { target: { value: 'password1' } });
    });

    const form = c.querySelector('form') as HTMLFormElement;
    act(() => { fireEvent.submit(form); });

    expect(mockToastWarn).toHaveBeenCalled();
    act(() => { root.unmount(); });
});

test('password length validation rejects short passwords', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    const c = container!;
    act(() => {
        fireEvent.change(c.querySelector('input[name="nombre"]') as HTMLInputElement, { target: { value: 'Nombre Valido' } });
        fireEvent.change(c.querySelector('input[name="cedula"]') as HTMLInputElement, { target: { value: '1234567' } });
        fireEvent.change(c.querySelector('input[name="telefono"]') as HTMLInputElement, { target: { value: '987654321' } });
        fireEvent.change(c.querySelector('input[name="email"]') as HTMLInputElement, { target: { value: 'a@b.com' } });
        fireEvent.change(c.querySelector('input#passwordUser') as HTMLInputElement, { target: { value: 'short' } });
        fireEvent.change(c.querySelector('input#confirmPasswordUser') as HTMLInputElement, { target: { value: 'short' } });
    });

    const form = c.querySelector('form') as HTMLFormElement;
    act(() => { fireEvent.submit(form); });

    expect(mockToastWarn).toHaveBeenCalled();
    act(() => { root.unmount(); });
});

test('successful registration (priority) calls registerUser and navigates', async () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    mockRegisterUser.mockResolvedValue({ success: true, userId: 'u123' });

    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    const c = container!;
    act(() => {
        fireEvent.change(c.querySelector('input[name="nombre"]') as HTMLInputElement, { target: { value: 'Nombre Valido' } });
        fireEvent.change(c.querySelector('input[name="cedula"]') as HTMLInputElement, { target: { value: '1234567' } });
        fireEvent.change(c.querySelector('input[name="telefono"]') as HTMLInputElement, { target: { value: '987654321' } });
        fireEvent.change(c.querySelector('input[name="email"]') as HTMLInputElement, { target: { value: 'a@b.com' } });
        fireEvent.change(c.querySelector('input#passwordUser') as HTMLInputElement, { target: { value: 'password1' } });
        fireEvent.change(c.querySelector('input#confirmPasswordUser') as HTMLInputElement, { target: { value: 'password1' } });
        // check priority and select motivo
        fireEvent.click(c.querySelector('input[type="checkbox"]') as HTMLInputElement);
    });

    // select motive now that select is visible
    const select = c.querySelector('select#prioridadTipo') as HTMLSelectElement | null;
    expect(select).not.toBeNull();
    act(() => { fireEvent.change(select as HTMLSelectElement, { target: { value: 'A' } }); });

    const form = c.querySelector('form') as HTMLFormElement | null;
    expect(form).not.toBeNull();

    jest.useFakeTimers();
    await act(async () => {
        fireEvent.submit(form!);
        await Promise.resolve();
    });
    act(() => { jest.runAllTimers(); });

    expect(mockRegisterUser).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();

    jest.useRealTimers();
    act(() => { root.unmount(); });
});

afterEach(() => {
    if (container) {
        document.body.removeChild(container);
        container = null;
    }
});

test('CreateRegularUserForm renders and contains title', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    expect(container.textContent).toContain('Crea tu Cuenta');

    act(() => {
        root.unmount();
    });
});

// (no helper) tests will directly reference the test container

test('submit with empty fields triggers warning', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    const form = container.querySelector('form') as HTMLFormElement | null;
    expect(form).not.toBeNull();

    // Dispatch submit directly to bypass jsdom HTML5 form validation
    act(() => {
        form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(mockToastWarn).toHaveBeenCalled();

    act(() => {
        root.unmount();
    });
});

test('name length validation shows warning', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    // Fill most fields but name too short
    const c = container!;
    const nombreInput = c.querySelector('input[name="nombre"]') as HTMLInputElement | null;
    const cedulaInput = c.querySelector('input[name="cedula"]') as HTMLInputElement | null;
    const telefonoInput = c.querySelector('input[name="telefono"]') as HTMLInputElement | null;
    const emailInput = c.querySelector('input[name="email"]') as HTMLInputElement | null;
    const passwordInput = c.querySelector('input#passwordUser') as HTMLInputElement | null;
    const confirmInput = c.querySelector('input#confirmPasswordUser') as HTMLInputElement | null;

    act(() => { nombreInput!.value = 'Ab'; nombreInput!.dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { cedulaInput!.value = '1234567'; cedulaInput!.dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { telefonoInput!.value = '987654321'; telefonoInput!.dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { emailInput!.value = 'a@b.com'; emailInput!.dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { passwordInput!.value = 'password1'; passwordInput!.dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { confirmInput!.value = 'password1'; confirmInput!.dispatchEvent(new Event('input', { bubbles: true })); });

    const submitBtn = c.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    act(() => { submitBtn!.click(); });

    expect(mockToastWarn).toHaveBeenCalled();

    act(() => { root.unmount(); });
});

test('password mismatch triggers warning', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    // Fill fields with mismatching passwords
    const c = container!;
    act(() => { (c.querySelector('input[name="nombre"]') as HTMLInputElement).value = 'Nombre Largo'; (c.querySelector('input[name="nombre"]') as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { (c.querySelector('input[name="cedula"]') as HTMLInputElement).value = '1234567'; (c.querySelector('input[name="cedula"]') as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { (c.querySelector('input[name="telefono"]') as HTMLInputElement).value = '987654321'; (c.querySelector('input[name="telefono"]') as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { (c.querySelector('input[name="email"]') as HTMLInputElement).value = 'a@b.com'; (c.querySelector('input[name="email"]') as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { (c.querySelector('input#passwordUser') as HTMLInputElement).value = 'password1'; (c.querySelector('input#passwordUser') as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => { (c.querySelector('input#confirmPasswordUser') as HTMLInputElement).value = 'different'; (c.querySelector('input#confirmPasswordUser') as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true })); });

    act(() => { (c.querySelector('button[type="submit"]') as HTMLButtonElement).click(); });

    expect(mockToastWarn).toHaveBeenCalled();

    act(() => { root.unmount(); });
});

test('priority checked without motivo triggers warning', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    // Fill valid fields
    const c = container!;
    act(() => { const el = (c.querySelector('input[name="nombre"]') as HTMLInputElement); el.value = 'Nombre Valido'; el.dispatchEvent(new Event('change', { bubbles: true })); });
    act(() => { const el = (c.querySelector('input[name="cedula"]') as HTMLInputElement); el.value = '1234567'; el.dispatchEvent(new Event('change', { bubbles: true })); });
    act(() => { const el = (c.querySelector('input[name="telefono"]') as HTMLInputElement); el.value = '987654321'; el.dispatchEvent(new Event('change', { bubbles: true })); });
    act(() => { const el = (c.querySelector('input[name="email"]') as HTMLInputElement); el.value = 'a@b.com'; el.dispatchEvent(new Event('change', { bubbles: true })); });
    act(() => { const el = (c.querySelector('input#passwordUser') as HTMLInputElement); el.value = 'password1'; el.dispatchEvent(new Event('change', { bubbles: true })); });
    act(() => { const el = (c.querySelector('input#confirmPasswordUser') as HTMLInputElement); el.value = 'password1'; el.dispatchEvent(new Event('change', { bubbles: true })); });

    // Check priority but don't choose motivo
    const checkbox = c.querySelector('input[type="checkbox"]') as HTMLInputElement;
    act(() => { checkbox.click(); });

    // Wait DOM update then dispatch submit directly to ensure onSubmit runs (bypass native validation)
    const form = c.querySelector('form') as HTMLFormElement | null;
    expect(form).not.toBeNull();
    act(() => { form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });

    expect(mockToastWarn).toHaveBeenCalled();

    act(() => { root.unmount(); });
});

test('toggles password visibility for password and confirm fields', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    const passwordInput = container.querySelector('input#passwordUser') as HTMLInputElement | null;
    const confirmInput = container.querySelector('input#confirmPasswordUser') as HTMLInputElement | null;
    expect(passwordInput).not.toBeNull();
    expect(confirmInput).not.toBeNull();

    // Initially should be password type
    expect(passwordInput!.type).toBe('password');
    expect(confirmInput!.type).toBe('password');

    // Find the show/hide buttons by aria-label and click them
    const pwButton = container.querySelector('button[aria-label="Mostrar contraseña"]') as HTMLButtonElement | null;
    const confirmButton = container.querySelector('button[aria-label="Mostrar contraseña"]') as HTMLButtonElement | null;

    // It's possible both buttons have same aria-label, so ensure clicking changes types
    if (pwButton) {
        act(() => {
            pwButton.click();
        });
        expect(passwordInput!.type).toBe('text');
    }

    // Click the second button (confirm) - try to find a button that targets confirm field by checking proximity
    const buttons = Array.from(container.querySelectorAll('button[aria-label]')) as HTMLButtonElement[];
    const confirmBtn = buttons.find(b => b !== pwButton) || confirmButton;
    if (confirmBtn) {
        act(() => {
            confirmBtn.click();
        });
        expect(confirmInput!.type).toBe('text');
    }

    act(() => {
        root.unmount();
    });
});

test('checking priority checkbox reveals motivo select', () => {
    if (!container) throw new Error('Test container not initialized');
    const root = createRoot(container);
    act(() => {
        root.render(React.createElement(MemoryRouter, null, React.createElement(CreateRegularUserForm, null)));
    });

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();
    expect(checkbox!.checked).toBeFalsy();

    act(() => {
        checkbox!.click();
    });

    const select = container.querySelector('select#prioridadTipo') as HTMLSelectElement | null;
    expect(select).not.toBeNull();

    act(() => {
        root.unmount();
    });
});

