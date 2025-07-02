'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        name: mode === 'register' ? name : undefined,
        redirect: false,
        callbackUrl: '/campus/dashboard'
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/campus/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      {mode === 'register' && (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          required={mode === 'register'}
          className="w-full p-2 mb-4 border rounded"
        />
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full p-2 mb-4 border rounded"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full p-2 mb-4 border rounded"
      />
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading
          ? (mode === 'login' ? 'Iniciando...' : 'Registrando...')
          : (mode === 'login' ? 'Iniciar sesión' : 'Registrarse')}
      </button>
    </form>
  );
}

