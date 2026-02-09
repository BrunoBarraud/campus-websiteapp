"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleMode = () => {
    router.push(
      mode === "login" ? "/campus/auth/register" : "/campus/auth/login"
    );
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/campus/dashboard" });
    } catch {
      setError("Error al iniciar sesión con Google");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "register") {
        // Para registro, hacer una llamada API
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name: email.split("@")[0], // Usar la parte antes del @ como nombre por defecto
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al registrar usuario");
        }

        // Después del registro exitoso, hacer login automático
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error("Error al iniciar sesión después del registro");
        }
      } else {
        // Para login, usar NextAuth
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error("Credenciales incorrectas");
        }
      }

      router.push("/campus/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al procesar tu solicitud.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-rose-100 to-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 to-yellow-400"></div>

        <div className="px-10 py-12">
          {/* Logo local */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/ipdvs-logo.png"
              alt="Logo del Campus - IPDVS"
              width={80}
              height={80}
              className="rounded-full bg-yellow-300 p-2 object-contain"
            />
          </div>

          {/* Título */}
          <h2 className="text-center mb-8">
            <span className="inline-block text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-rose-500">
              {mode === "login" ? "Iniciar sesión" : "Registrarse"}
            </span>
            <span className="block mt-2 h-1 w-20 mx-auto bg-gradient-to-r from-yellow-300 to-rose-400 rounded-full"></span>
          </h2>

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 backdrop-blur-sm bg-white/80 p-8 rounded-xl shadow-md"
          >
            {/* Campo Email */}
            <div className="floating-input relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all"
              />
              <label
                htmlFor="email"
                className="absolute left-3 top-3 text-gray-400 peer-focus:text-yellow-500 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100"
              >
                Correo electrónico
              </label>
            </div>

            {/* Campo Contraseña */}
            <div className="floating-input relative group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all"
              />
              <label
                htmlFor="password"
                className="absolute left-3 top-3 text-gray-400 peer-focus:text-yellow-500 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100"
              >
                Contraseña
              </label>
            </div>

            {/* Mensaje de error */}
            {error && (
              <p className="text-red-500 text-center text-sm">{error}</p>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-md shadow-md transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading
                ? mode === "login"
                  ? "Accediendo..."
                  : "Creando cuenta..."
                : mode === "login"
                ? "Acceder ahora"
                : "Crear cuenta"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>

          {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              {mode === "login" ? "Iniciar sesión" : "Registrarse"} con Google
            </span>
          </button>

          {/* Cambiar modo */}
          <div className="text-center text-sm text-gray-500 mt-6">
            {mode === "login" ? (
              <>
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-yellow-500 hover:text-yellow-600 font-medium"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-yellow-500 hover:text-yellow-600 font-medium"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pie de formulario */}
        <div className="bg-gray-50 px-8 py-4 text-center text-xs text-gray-500">
          © 2025 IPDVS. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
