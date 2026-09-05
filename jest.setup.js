require('@testing-library/jest-dom');

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn().mockReturnValue([]),
  })),
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    headers: new Headers(),
  })
);

window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
window.URL.revokeObjectURL = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'PARTNER',
      },
      expires: '2099-01-01',
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

jest.mock('@tanstack/react-table', () => ({
  useReactTable: jest.fn(() => ({
    getHeaderGroups: () => [],
    getRowModel: () => ({ rows: [] }),
    getFilteredRowModel: () => ({ rows: [] }),
    getSortedRowModel: () => ({ rows: [] }),
    setColumnFilters: jest.fn(),
    setSorting: jest.fn(),
    getPageCount: () => 1,
    nextPage: jest.fn(),
    previousPage: jest.fn(),
    setPageSize: jest.fn(),
    getState: () => ({
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [],
      columnFilters: [],
    }),
  })),
  createColumnHelper: () => ({
    accessor: (id, opts) => ({ id, ...opts }),
    display: (opts) => opts,
  }),
  flexRender: jest.fn((comp) => comp),
}));

const { toHaveNoViolations } = require('jest-axe');
expect.extend(toHaveNoViolations);

const consoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return;
    }
    consoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = consoleError;
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
