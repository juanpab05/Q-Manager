import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import QueueStatusView from './QueueStatus';

// Mock dependencies
jest.mock('../../api/ticketService', () => ({
  getQueueStatus: jest.fn(),
  subscribeToTicketUpdates: jest.fn(),
}));

jest.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../utils/supabaseClient', () => ({
  __esModule: true,
  default: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('../../components/AnnouncementsCarousel/AnnouncementsCarousel', () => () => 
  <div data-testid="announcements-carousel">Announcements</div>
);

jest.mock('../../components/LoadingSpinner', () => ({ message }: { message: string }) => 
  <div data-testid="loading-spinner">{message}</div>
);

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockGetQueueStatus = require('../../api/ticketService').getQueueStatus;
const mockSubscribeToTicketUpdates = require('../../api/ticketService').subscribeToTicketUpdates;
const mockUseAuth = require('../../contexts/auth/AuthContext').useAuth;
const mockSupabase = require('../../utils/supabaseClient').default;

const mockTicket = {
  id: 1,
  ticket_number: 'A001',
  status: 'waiting',
  status_display: 'En espera',
  service: 'Test Service',
  is_priority: false,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
};

const mockQueueStatus = {
  user_ticket: null,
  priority: {
    current: null,
    last_attended: null,
    next_tickets: [],
  },
  normal: {
    current: mockTicket,
    last_attended: null,
    next_tickets: [{ ...mockTicket, id: 2, ticket_number: 'A002' }],
  },
  next_tickets: [],
  statistics: {
    waiting_count: 5,
    avg_wait_time: 300,
    attended_today: 10,
  },
};

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  jest.clearAllMocks();

  // Setup default mocks
  mockUseAuth.mockReturnValue({
    user: { id: 'user-123' },
    userProfile: null,
  });

  const mockSupabaseFrom = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ 
      data: { is_staff: false, is_superuser: false }, 
      error: null 
    }),
  };

  mockSupabase.from.mockReturnValue(mockSupabaseFrom);
  mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
  mockGetQueueStatus.mockResolvedValue(mockQueueStatus);
  mockSubscribeToTicketUpdates.mockReturnValue(jest.fn());
});

afterEach(() => {
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
});

test('QueueStatusView renders loading spinner initially', () => {
  if (!container) throw new Error('Test container not initialized');

  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
  });

  expect(container.textContent).toContain('Cargando estado de la cola');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView renders queue status after loading', async () => {
  if (!container) throw new Error('Test container not initialized');

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('Estado de la Cola');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView displays user ticket when available', async () => {
  if (!container) throw new Error('Test container not initialized');

  const userTicket = { ...mockTicket, id: 99, ticket_number: 'B999' };
  mockGetQueueStatus.mockResolvedValue({
    ...mockQueueStatus,
    user_ticket: userTicket,
  });

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('Tu Ticket');
  expect(container.textContent).toContain('B999');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView displays normal queue section', async () => {
  if (!container) throw new Error('Test container not initialized');

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('Cola Regular');
  expect(container.textContent).toContain('A001');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView displays priority queue for priority users', async () => {
  if (!container) throw new Error('Test container not initialized');

  const mockSupabaseFrom = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
      .mockResolvedValueOnce({ data: { is_staff: false, is_superuser: false }, error: null })
      .mockResolvedValueOnce({ data: { has_priority: true }, error: null }),
  };

  mockSupabase.from.mockReturnValue(mockSupabaseFrom);

  const priorityTicket = { ...mockTicket, is_priority: true, ticket_number: 'P001' };
  mockGetQueueStatus.mockResolvedValue({
    ...mockQueueStatus,
    priority: {
      current: priorityTicket,
      last_attended: null,
      next_tickets: [],
    },
  });

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('Cola Prioritaria');
  expect(container.textContent).toContain('P001');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView displays statistics for staff users', async () => {
  if (!container) throw new Error('Test container not initialized');

  const mockSupabaseFrom = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ 
      data: { is_staff: true, is_superuser: false }, 
      error: null 
    }),
  };

  mockSupabase.from.mockReturnValue(mockSupabaseFrom);

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('Estadísticas');
  expect(container.textContent).toContain('Tickets en espera');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView hides statistics for non-staff users', async () => {
  if (!container) throw new Error('Test container not initialized');

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  const hasStatistics = container.textContent?.includes('Estadísticas');
  expect(hasStatistics).toBe(false);

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView displays announcements carousel', async () => {
  if (!container) throw new Error('Test container not initialized');

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  const carousel = container.querySelector('[data-testid="announcements-carousel"]');
  expect(carousel).toBeTruthy();

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView handles error when fetching data', async () => {
  if (!container) throw new Error('Test container not initialized');

  mockGetQueueStatus.mockRejectedValue(new Error('API Error'));

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('Error al cargar los datos');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView subscribes to ticket updates on mount', async () => {
  if (!container) throw new Error('Test container not initialized');

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(mockSubscribeToTicketUpdates).toHaveBeenCalled();

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView uses userProfile data when available', async () => {
  if (!container) throw new Error('Test container not initialized');

  mockUseAuth.mockReturnValue({
    user: { id: 'user-123' },
    userProfile: {
      is_staff: true,
      is_superuser: false,
      userType: 'actor',
      details: { has_priority: true },
    },
  });

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('Cola Prioritaria');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView renders next ticket in normal queue', async () => {
  if (!container) throw new Error('Test container not initialized');

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('A002');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView handles schema fix error gracefully', async () => {
  if (!container) throw new Error('Test container not initialized');

  mockSupabase.rpc.mockRejectedValue(new Error('Schema error'));

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(container.textContent).toContain('Estado de la Cola');

  act(() => {
    root.unmount();
  });
});

test('QueueStatusView calls getQueueStatus on mount', async () => {
  if (!container) throw new Error('Test container not initialized');

  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <QueueStatusView />
      </MemoryRouter>
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  expect(mockGetQueueStatus).toHaveBeenCalled();

  act(() => {
    root.unmount();
  });
});