import NextAuth, { User, Session, DefaultSession, AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase, supabaseAdmin } from "@/app/lib/supabaseClient";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
  }
  interface Session {
    user?: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

const authOptions: AuthOptions = {
  pages: {
    signIn: '/campus/auth/login',
    error: '/campus/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Configuración específica para App Router en producción
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        const { email, password } = credentials;

        try {
          // 🔥 NUEVO: Usar Supabase Auth para autenticar
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email as string,
            password: password as string,
          });

          if (authError || !authData.user) {
            console.error('Auth error:', authError?.message);
            
            // Verificar si es por email no confirmado
            if (authError?.message?.includes('Email not confirmed')) {
              // Permitir login aunque el email no esté confirmado (para desarrollo)
              console.log('⚠️  Permitiendo login sin confirmación de email (modo desarrollo)');
              
              // Obtener usuario por email usando admin client
              const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

              if (userData) {
                return {
                  id: userData.id,
                  email: userData.email,
                  name: userData.name,
                  role: userData.role || 'student',
                };
              }
            }
            
            throw new Error("Credenciales incorrectas");
          }

          // Obtener datos adicionales del usuario desde nuestra tabla personalizada
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          let finalUserData = userData;

          if (userError) {
            // Si no existe en nuestra tabla, crear entrada
            const { data: newUserData, error: createError } = await supabaseAdmin
              .from('users')
              .insert([
                {
                  id: authData.user.id,
                  email: authData.user.email,
                  name: authData.user.user_metadata?.name || authData.user.email,
                  role: authData.user.user_metadata?.role || 'student',
                  created_at: new Date().toISOString(),
                }
              ])
              .select()
              .single();

            if (createError) {
              console.error('Error creating user profile:', createError);
            } else {
              finalUserData = newUserData;
            }
          }

          return {
            id: authData.user.id,
            email: authData.user.email!,
            name: finalUserData?.name || authData.user.user_metadata?.name || authData.user.email,
            role: finalUserData?.role || authData.user.user_metadata?.role || 'student',
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw new Error("Error al autenticar usuario");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User | null }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user) {
        session.user.role = token.role as string | undefined;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

// Configuración específica para App Router y Vercel
export { handler as GET, handler as POST };

// También exportar como default para mayor compatibilidad
export default handler;
