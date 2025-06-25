//This code is a login page for a campus application using Next.js and React.
// It includes a form for users to enter their email and password, and upon submission, it
// redirects them to the dashboard if the login is successful.

// "use client";
// import React from "react";
// import Link from "next/link";

// const LoginPage = () => {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
//       <span
//               className="mb-2 text-xl md:text-2xl text-rose-950 uppercase font-bold bg-yellow-400 px-2 py-0.5 rounded-lg shadow-sm transition hover:bg-yellow-500 "
//             >
//               ¡Inicia Sesión!
//             </span>
//       <form className="bg-rose-950 p-6 rounded-lg shadow-md w-full max-w-md space-y-4 border border-amber-300">
//         <input
//           type="email"
//           placeholder="Correo electrónico"
//           className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
//         />
//         <input
//           type="password"
//           placeholder="Contraseña"
//           className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
//         />
//         <button
//           type="submit"
//           className="w-full bg-yellow-400 text-rose-950 py-2 rounded-md hover:bg-yellow-500 transition"
//         >
//           Iniciar Sesión
//         </button>
//         <p className="text-sm text-center text-white">
//           ¿No tenés cuenta? <Link href="/campus/register" className="text-yellow-400 hover:underline">Registrate</Link>
//         </p>
//       </form>
//     </div>
//   );
// };

// export default LoginPage;

//This code is a routerpush for come to the dashboard after login

"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


const LoginPage = () => {

  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <span
              className="mb-2 text-xl md:text-2xl text-rose-950 uppercase font-bold bg-yellow-400 px-2 py-0.5 rounded-lg shadow-sm transition hover:bg-yellow-500 "
            >
              ¡Inicia Sesión!
            </span>
      <form 
        onSubmit = {(e) => {
          e.preventDefault();
          router.push("/campus/dashboard");
        }}
      className="bg-rose-950 p-6 rounded-lg shadow-md w-full max-w-md space-y-4 border border-amber-300">
        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          className="w-full bg-yellow-400 text-rose-950 py-2 rounded-md hover:bg-yellow-500 transition"
        >
          Iniciar Sesión
        </button>
        <p className="text-sm text-center text-white">
          ¿No tenés cuenta? <Link href="/campus/register" className="text-yellow-400 hover:underline">Registrate</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;