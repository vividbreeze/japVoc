import { useState } from 'react';
import { login, setToken } from '../api/client';

interface Props {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const { token } = await login(password);
      if (token) setToken(token);
      onSuccess();
    } catch {
      setError('Falsches Passwort. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-700 font-japanese mb-1">日本語</h1>
          <p className="text-sm text-gray-400">Vokabeltrainer N5</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
