import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthGate } from './AuthGate';
import * as supabase from '../services/supabase';

describe('AuthGate — Admin Authentication & Sign In', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders sign-in form with default admin credentials banner', () => {
    render(
      <AuthGate
        context="admin"
        onBackToDriverView={vi.fn()}
      />
    );

    expect(screen.getByText(/DEFAULT ADMIN CREDENTIALS/i)).toBeInTheDocument();
    expect(screen.getByText(/admin@haulmatch\.ai/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Autofill Admin →/i })).toBeInTheDocument();
  });

  it('autofills admin credentials when button is clicked', () => {
    render(
      <AuthGate
        context="admin"
        onBackToDriverView={vi.fn()}
      />
    );

    const autofillBtn = screen.getByRole('button', { name: /Autofill Admin →/i });
    fireEvent.click(autofillBtn);

    const emailInput = screen.getByPlaceholderText(/you@company\.com/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;

    expect(emailInput.value).toBe('admin@haulmatch.ai');
    expect(passwordInput.value).toBe('password123');
  });

  it('signs in successfully with admin credentials', async () => {
    const signInSpy = vi.spyOn(supabase, 'signInWithEmail');

    const { container } = render(
      <AuthGate
        context="admin"
        onBackToDriverView={vi.fn()}
      />
    );

    const autofillBtn = screen.getByRole('button', { name: /Autofill Admin →/i });
    fireEvent.click(autofillBtn);

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signInSpy).toHaveBeenCalledWith('admin@haulmatch.ai', 'password123');
    });
  });

  it('allows switching to Register mode to create a new Staff account', async () => {
    const signUpSpy = vi.spyOn(supabase, 'signUpWithEmail').mockResolvedValue({ success: true, autoSignedIn: true });

    render(
      <AuthGate
        context="admin"
        onBackToDriverView={vi.fn()}
      />
    );

    const registerTabBtn = screen.getByRole('button', { name: /^Register$/i });
    fireEvent.click(registerTabBtn);

    const staffRoleBtn = screen.getByRole('button', { name: /HaulMatch Staff/i });
    fireEvent.click(staffRoleBtn);

    fireEvent.change(screen.getByPlaceholderText(/you@company\.com/i), {
      target: { value: 'operations@haulmatch.ai' }
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'SecurePass987!' }
    });

    const createAccountBtn = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(createAccountBtn);

    await waitFor(() => {
      expect(signUpSpy).toHaveBeenCalledWith(
        'operations@haulmatch.ai',
        'SecurePass987!',
        'staff',
        undefined
      );
    });
  });

  it('switches to password reset recovery mode and dispatches reset link', async () => {
    const resetSpy = vi.spyOn(supabase, 'resetPasswordForEmail').mockResolvedValue({ success: true });

    render(
      <AuthGate
        context="admin"
        onBackToDriverView={vi.fn()}
      />
    );

    const forgotBtn = screen.getByRole('button', { name: /Forgot password\?/i });
    expect(forgotBtn).toBeInTheDocument();
    fireEvent.click(forgotBtn);

    expect(screen.getByText(/PASSWORD RESET RECOVERY/i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/you@company\.com/i);
    fireEvent.change(emailInput, { target: { value: 'safety@apextransit.com' } });

    const submitResetBtn = screen.getByRole('button', { name: /Send Password Reset Link/i });
    fireEvent.click(submitResetBtn);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith('safety@apextransit.com');
    });

    expect(screen.getByText(/RESET LINK DISPATCHED/i)).toBeInTheDocument();
    expect(screen.getByText(/safety@apextransit\.com/i)).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /Proceed to Sign In →/i });
    fireEvent.click(backBtn);
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });
});
