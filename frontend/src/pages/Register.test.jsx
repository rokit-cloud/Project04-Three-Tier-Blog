import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Register from './Register';
import { useAuth } from '../api/AuthContext';

vi.mock('../api/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const registerMock = vi.fn();

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ register: registerMock });
  });

  it('renders registration form', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: 'Join Marginal' })).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
  });

  it('registers successfully and navigates home', async () => {
    registerMock.mockResolvedValueOnce(undefined);
    renderRegister();

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'password123'
      );
      expect(screen.getByText('Home Page')).toBeTruthy();
    });
  });

  it('displays registration error', async () => {
    registerMock.mockRejectedValueOnce(new Error('Email already exists'));
    renderRegister();

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already exists');
  });

  it('shows loading state while registering', async () => {
    let resolveRegister;

    registerMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegister = resolve;
      })
    );

    renderRegister();

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('button', { name: 'Creating…' })).toBeDisabled();

    resolveRegister();

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeTruthy();
    });
  });
});
