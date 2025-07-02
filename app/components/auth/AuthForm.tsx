'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
        // La sincronización con Supabase ahora se hace mediante webhook o función Firebase
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/campus/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };
  

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const res = await fetch('../../api/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        uid: userCredential.user.uid, 
        email: userCredential.user.email 
      })
    });
    
    if (!res.ok) throw new Error('Error al sincronizar con Supabase');
    
    router.push('/campus/dashboard');
  } catch (err: any) {
    setError(err.message || 'Error en el registro');
  } finally {
    setIsLoading(false);
  }
};



  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading
          ? (mode === 'login' ? 'Iniciando...' : 'Registrando...')
          : (mode === 'login' ? 'Iniciar sesión' : 'Registrarse')}
      </button>
    </form>
  );
}
function setIsLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}

