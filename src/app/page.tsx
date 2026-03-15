'use client';

import { login } from '@/lib/actions';
import { Shield } from 'lucide-react';
import { useActionState } from 'react';

const initialState = {
  error: '',
};

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md animate-fade-in glass-panel">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-[var(--accent)] p-3 rounded-full mb-4 shadow-lg shadow-blue-500/50 animate-float">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl mb-1 text-center">Secure Assessment</h1>
          <p className="text-secondary text-sm">Enter your credentials to continue</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm border border-red-500/20">
              {state.error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-secondary" htmlFor="username">
              User ID
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="input"
              placeholder="Enter your user ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-secondary" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div className="text-xs text-secondary mt-2 mb-2 bg-[var(--bg-input)] p-3 rounded-md border border-[var(--border)]">
              <strong>Demo Accounts:</strong><br />
              Admin: username <code>admin</code>, password <code>admin123</code>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
