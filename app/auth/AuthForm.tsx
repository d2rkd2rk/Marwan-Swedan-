'use client';

import {FormEvent, useState} from 'react';
import Link from 'next/link';

export function AuthForm({mode}: {mode: 'login' | 'register'}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const payload = mode === 'login'
      ? {
          email: String(form.get('email') || ''),
          password: String(form.get('password') || ''),
        }
      : Object.fromEntries(form.entries());

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
        return;
      }

      location.href = mode === 'login' && json.user?.role === 'admin' ? '/admin' : '/courses';
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form">
      <Link className="brand" href="/">MARWAN.SWEDAN</Link>

      <h1>{mode === 'login' ? 'Welcome back.' : 'Create your academy account.'}</h1>
      <p className="muted">
        {mode === 'login'
          ? 'Sign in with your email and password.'
          : 'Your account is private and course access is controlled by the administrator.'}
      </p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={submit}>
        {mode === 'register' && (
          <>
            <div className="field">
              <label>Full name</label>
              <input required minLength={2} maxLength={80} name="name" autoComplete="name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input required type="email" name="email" autoComplete="email" />
            </div>
            <div className="field">
              <label>WhatsApp number</label>
              <input required inputMode="tel" name="whatsapp" placeholder="2015…" />
            </div>
            <div className="field">
              <label>Username</label>
              <input
                required
                name="username"
                pattern="[A-Za-z0-9_]{3,24}"
                title="Use 3–24 letters, numbers, or underscores. No spaces."
                autoComplete="username"
              />
              <span className="small muted">3–24 letters, numbers, or underscores. No spaces.</span>
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{display: 'flex', gap: 8}}>
                <input
                  style={{flex: 1}}
                  required
                  minLength={8}
                  name="password"
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                />
                <button className="btn" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <span className="small muted">8+ characters, at least one number and one special character.</span>
            </div>
          </>
        )}

        {mode === 'login' && (
          <>
            <div className="field">
              <label>Email</label>
              <input required type="email" name="email" autoComplete="username" inputMode="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{display: 'flex', gap: 8}}>
                <input
                  style={{flex: 1}}
                  required
                  name="password"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                />
                <button className="btn" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </>
        )}

        <button className="btn primary" style={{width: '100%', marginTop: 10}} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="small muted">
        {mode === 'login' ? (
          <>No account? <Link href="/register">Register</Link> · <Link href="/forgot-password">Forgot password?</Link></>
        ) : (
          <>Already registered? <Link href="/login">Sign in</Link></>
        )}
      </p>
      <Link className="small muted" href="/">Back to portfolio</Link>
    </div>
  );
}
