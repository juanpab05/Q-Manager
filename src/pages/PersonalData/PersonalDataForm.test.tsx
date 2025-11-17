import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import PersonalDataForm from './PersonalDataForm';

jest.mock('../../services/userService', () => ({
  updateUser: jest.fn()
}));

const mockProps = {
  userProfile: {
    id: 1,
    nombre: 'Juan Pérez',
    cedula: 12345678,
    email: 'juan@example.com',
    phone_number: '+573001234567',
    userType: 'worker'
  },
  isEditing: false,
  isSaving: false,
  isWorker: true,
  onEditClick: jest.fn(),
  onCancelEdit: jest.fn(),
  onSaveSuccess: jest.fn(),
  onSaveError: jest.fn(),
  onGoBack: jest.fn(),
  onNavigateToResetPassword: jest.fn(),
  setIsSaving: jest.fn()
};

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  jest.clearAllMocks();
});

afterEach(() => {
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
});

test('PersonalDataForm renders user data correctly', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, mockProps));
  });

  expect(container.textContent).toContain('Juan Pérez');
  expect(container.textContent).toContain('12345678');
  expect(container.textContent).toContain('juan@example.com');
  expect(container.textContent).toContain('Trabajador');
  
  act(() => {
    root.unmount();
  });
});


test('PersonalDataForm shows input fields when in edit mode', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const editModeProps = {
    ...mockProps,
    isEditing: true
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, editModeProps));
  });

  const inputs = container.querySelectorAll('input');
  expect(inputs.length).toBeGreaterThan(0);
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm cancels edit and resets form data', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const editModeProps = {
    ...mockProps,
    isEditing: true
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, editModeProps));
  });

  const cancelButton = Array.from(container.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Cancelar')
  );
  
  expect(cancelButton).toBeTruthy();
  
  act(() => {
    cancelButton?.click();
  });

  expect(mockProps.onCancelEdit).toHaveBeenCalled();
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm handles input changes correctly', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const editModeProps = {
    ...mockProps,
    isEditing: true
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, editModeProps));
  });

  const nameInput = container.querySelector('input[name="nombre"]') as HTMLInputElement;
  expect(nameInput).toBeTruthy();
  
  act(() => {
    nameInput.value = 'Nuevo Nombre';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  expect(nameInput.value).toBe('Nuevo Nombre');
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm navigates to reset password', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, mockProps));
  });

  const passwordButton = Array.from(container.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Cambiar contraseña')
  );
  
  expect(passwordButton).toBeTruthy();
  
  act(() => {
    passwordButton?.click();
  });

  expect(mockProps.onNavigateToResetPassword).toHaveBeenCalled();
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm handles go back button', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, mockProps));
  });

  const backButton = Array.from(container.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Regresar')
  );
  
  expect(backButton).toBeTruthy();
  
  act(() => {
    backButton?.click();
  });

  expect(mockProps.onGoBack).toHaveBeenCalled();
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm renders different user types', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const adminProps = {
    ...mockProps,
    userProfile: {
      ...mockProps.userProfile,
      userType: 'admin'
    }
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, adminProps));
  });

  expect(container.textContent).toContain('Administrador');
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm renders regular user type', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const regularProps = {
    ...mockProps,
    userProfile: {
      ...mockProps.userProfile,
      userType: 'regular'
    },
    isWorker: false
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, regularProps));
  });

  expect(container.textContent).toContain('Usuario Regular');
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm renders with access point data', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const accessPointProps = {
    ...mockProps,
    userProfile: {
      ...mockProps.userProfile,
      access_point: {
        name: 'Punto Norte'
      }
    }
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, accessPointProps));
  });

  expect(container.textContent).toContain('Punto de Acceso Asignado');
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm enters edit mode when edit button is clicked', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, mockProps));
  });


  const buttons = container.querySelectorAll('button');
  const editButton = buttons[buttons.length - 1]; 
  
  expect(editButton?.textContent).toContain('Editar Mis Datos');
  
  act(() => {
    editButton?.click();
  });

  expect(mockProps.onEditClick).toHaveBeenCalled();
  
  act(() => {
    root.unmount();
  });
});

test('PersonalDataForm shows save button when in edit mode', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const editModeProps = {
    ...mockProps,
    isEditing: true
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, editModeProps));
  });


  expect(container.textContent).toContain('Guardar Cambios');
  expect(container.textContent).toContain('Cancelar');
  
  act(() => {
    root.unmount();
  });
});


test('PersonalDataForm shows save and cancel buttons in edit mode', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const editModeProps = {
    ...mockProps,
    isEditing: true
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, editModeProps));
  });

  expect(container.textContent).toContain('Guardar Cambios');
  expect(container.textContent).toContain('Cancelar');
  
  act(() => {
    root.unmount();
  });
});


test('PersonalDataForm initializes with different user types', () => {
  if (!container) throw new Error('Test container not initialized');
  
  const actorProps = {
    ...mockProps,
    userProfile: {
      ...mockProps.userProfile,
      userType: 'actor'
    }
  };

  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(PersonalDataForm, actorProps));
  });

  expect(container.textContent).toContain('Usuario con Prioridad');
  
  act(() => {
    root.unmount();
  });
});


test('PersonalDataForm handles successful form submission', async () => {
  if (!container) throw new Error('Test container not initialized');
  
 
  const mockUpdateUser = require('../../services/userService').updateUser;
  mockUpdateUser.mockResolvedValueOnce({});

  const editModeProps = {
    ...mockProps,
    isEditing: true
  };

  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(PersonalDataForm, editModeProps));
  });


  const nameInput = container.querySelector('input[name="nombre"]') as HTMLInputElement;
  const cedulaInput = container.querySelector('input[name="cedula"]') as HTMLInputElement;
  const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
  const phoneInput = container.querySelector('input[name="phone_number"]') as HTMLInputElement;
  
  await act(async () => {
    nameInput.value = 'Nombre Actualizado';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    cedulaInput.value = '87654321';
    cedulaInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    emailInput.value = 'nuevo@example.com';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    phoneInput.value = '+573001234567';
    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const saveButton = Array.from(container.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Guardar Cambios')
  );
  
  await act(async () => {
    saveButton?.click();
  });


  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(mockUpdateUser).toHaveBeenCalled();
  
  act(() => {
    root.unmount();
  });
});

