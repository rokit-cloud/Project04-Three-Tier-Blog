import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../api/AuthContext';

vi.mock('../api/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const loginMock = vi.fn();

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/register" element={<div>Register Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: loginMock });
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
  });

  it('logs in successfully', async () => {
    loginMock.mockResolvedValueOnce(undefined);
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(screen.getByText('Home Page')).toBeTruthy();
    });
  });

  it('displays login error', async () => {
    loginMock.mockRejectedValueOnce(new Error('Invalid credentials'));
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('shows loading state', async () => {
    let resolveLogin;

    loginMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('button', { name: 'Signing in…' })).toBeDisabled();

    resolveLogin();

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeTruthy();
    });
  });
});
