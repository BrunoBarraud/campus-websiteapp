"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { AcademicUtils, ACADEMIC_CONFIG } from "@/constant/academic";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [year, setYear] = React.useState<number | "">("");
  const [division, setDivision] = React.useState<string>("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const toggleMode = () => {
    router.push(
      mode === "login" ? "/campus/auth/register" : "/campus/auth/login"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "register") {
        // Registro usando la API de NextAuth que maneja Supabase
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name,
            year: year || null,
            division: division || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();

          // Manejar errores específicos del servidor
          if (response.status === 503) {
            throw new Error(
              data.details ||
                "El servicio está temporalmente no disponible. Por favor, intenta nuevamente en unos minutos."
            );
          }

          throw new Error(data.error || "Error en el registro");
        }

        const registrationData = await response.json();

        // Si el registro fue exitoso pero necesita verificación de email
        if (registrationData.needsVerification) {
          setError(""); // Limpiar errores
          setIsLoading(false);

          // Mostrar mensaje de éxito y verificación
          alert(
            `✅ Registro exitoso!\n\n📧 Hemos enviado un email de verificación a: ${email}\n\nPor favor, revisa tu bandeja de entrada (y spam) y haz clic en el enlace para verificar tu cuenta.\n\nDespués de verificar tu email, podrás iniciar sesión.`
          );

          // Redirigir al login
          router.push("/campus/auth/login");
          return;
        }

        // Si no necesita verificación, continuar con login automático
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          // Si el error es por email no confirmado, mostrar mensaje específico
          if (
            result.error.includes("Email not confirmed") ||
            result.error.includes("email_not_confirmed")
          ) {
            setError(
              "Registro exitoso. Por favor, revisa tu email para confirmar tu cuenta antes de iniciar sesión."
            );
          } else {
            setError(
              "Registro exitoso, pero hubo un error al iniciar sesión automáticamente. Puedes intentar hacer login manualmente."
            );
          }
          // No redirigir si hay error de login
          return;
        }
      } else {
        // Login usando NextAuth
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error("Credenciales inválidas");
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
    <div className="bg-gradient-to-br from-rose-950 to-yellow-500 min-h-screen w-full flex items-center justify-center p-2 sm:p-4 lg:p-6 dark:bg-gradient-to-br dark:from-rose-950 dark:to-yellow-500">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative dark:bg-white dark:border-gray-200">
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 to-yellow-400"></div>

        <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-10 lg:py-12">
          {/* Logo local */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Image
              src={ACADEMIC_CONFIG.INSTITUTION.logo}
              alt="Logo del Campus - IPDVS"
              width={60}
              height={60}
              className="sm:w-20 sm:h-20 p-2 object-contain"
            />
          </div>

          {/* Título */}
          <h2 className="text-center mb-6 sm:mb-8">
            <span className="inline-block text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-rose-500">
              {mode === "login" ? "Iniciar sesión" : "Registrarse"}
            </span>
            <span className="block mt-2 h-1 w-16 sm:w-20 mx-auto bg-gradient-to-r from-yellow-300 to-rose-400 rounded-full"></span>
          </h2>

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-6 backdrop-blur-sm bg-white/80 p-4 sm:p-6 lg:p-8 rounded-xl shadow-md"
          >
            {/* Campo Nombre (solo para registro) */}
            {mode === "register" && (
              <>
                <div className="floating-input relative group">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=" "
                    required
                    className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all text-sm sm:text-base"
                  />
                  <label
                    htmlFor="name"
                    className={`absolute left-2 sm:left-3 text-gray-400 peer-focus:text-yellow-500 transition-all text-sm sm:text-base pointer-events-none ${
                      name
                        ? "-translate-y-6 scale-90 bg-white px-2 top-0"
                        : "top-2 sm:top-3 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-focus:top-0"
                    }`}
                  >
                    Nombre completo
                  </label>
                </div>

                {/* Campo Año (solo para registro) */}
                <div className="relative">
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => {
                      const selectedYear = e.target.value
                        ? parseInt(e.target.value)
                        : "";
                      setYear(selectedYear);
                      // Limpiar división si es 5° o 6° año (no tienen divisiones)
                      if (selectedYear === 5 || selectedYear === 6) {
                        setDivision("");
                      }
                    }}
                    className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none transition-all appearance-none bg-white text-sm sm:text-base"
                  >
                    <option value="">Selecciona tu año de estudio</option>
                    {AcademicUtils.getYearOptions().map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Campo División (solo para registro y solo para años 1-4) */}
                {year && year >= 1 && year <= 4 && (
                  <div className="relative">
                    <select
                      id="division"
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none transition-all appearance-none bg-white text-sm sm:text-base"
                    >
                      <option value="">Selecciona tu división</option>
                      {AcademicUtils.getDivisionOptionsByYear(Number(year)).map(
                        (divisionOption) => (
                          <option
                            key={divisionOption.value}
                            value={divisionOption.value}
                          >
                            {divisionOption.label}
                          </option>
                        )
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Campo Email */}
            <div className="floating-input relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
                className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all text-sm sm:text-base"
              />
              <label
                htmlFor="email"
                className={`absolute left-2 sm:left-3 text-gray-400 peer-focus:text-yellow-500 transition-all text-sm sm:text-base pointer-events-none ${
                  email
                    ? "-translate-y-6 scale-90 bg-white px-2 top-0"
                    : "top-2 sm:top-3 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-focus:top-0"
                }`}
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
                className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all text-sm sm:text-base"
              />
              <label
                htmlFor="password"
                className={`absolute left-2 sm:left-3 text-gray-400 peer-focus:text-yellow-500 transition-all text-sm sm:text-base pointer-events-none ${
                  password
                    ? "-translate-y-6 scale-90 bg-white px-2 top-0"
                    : "top-2 sm:top-3 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-focus:top-0"
                }`}
              >
                Contraseña
              </label>
            </div>

            {/* Mensaje de error */}
            {error && (
              <p className="text-red-500 text-center text-xs sm:text-sm">
                {error}
              </p>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 sm:py-3 md:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-md shadow-md transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg"
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

          {/* Cambiar modo */}
          <div className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
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
        <div className="bg-gray-50 px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-center text-xs text-gray-500">
          © 2025 IPDVS. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
