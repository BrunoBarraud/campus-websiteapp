import NextAuth, { User, Session, DefaultSession, AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/app/lib/supabaseClient";
import bcrypt from "bcryptjs";

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
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Nombre completo", type: "text", required: false },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("Credenciales no proporcionadas");
        }
        const { email, password, name } = credentials;

        try {
          // Buscar usuario existente
          const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          // Manejar errores de consulta
          if (findError && findError.code !== 'PGRST116') {
            console.error('Error al buscar usuario:', findError);
            throw new Error("Error al buscar usuario");
          }

          // Registro automático si es nuevo
          if (!user && name) {
            const hashedPassword = await bcrypt.hash(password as string, 10);
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                email: email as string,
                name: name as string,
                password: hashedPassword,
                role: "ESTUDIANTE",
              })
              .select()
              .single();

            if (createError) {
              console.error('Error al crear usuario:', createError);
              throw new Error("Error al crear usuario");
            }
            
            return {
              id: newUser.id.toString(),
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            };
          }

          if (!user || !user.password) {
            throw new Error("Usuario o contraseña incorrectos");
          }

          const isValidPassword = await bcrypt.compare(
            password as string,
            user.password
          );

          if (!isValidPassword) {
            throw new Error("Contraseña incorrecta");
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Error en autenticación:', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
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

export { handler as GET, handler as POST };
