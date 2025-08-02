import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import bcrypt from "bcryptjs";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .eq("is_active", true)
            .single();

          if (error || !user) {
            console.log("Usuario no encontrado:", credentials.email);
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            console.log("Contraseña incorrecta para:", credentials.email);
            return null;
          }

          // Actualizar last_login
          await supabaseAdmin
            .from("users")
            .update({ last_login: new Date().toISOString() })
            .eq("id", user.id);

          console.log(
            "Usuario autenticado exitosamente:",
            user.email,
            "Rol:",
            user.role
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            year: user.year,
            division: user.division,
            avatar: user.avatar_url,
            settings: user.settings,
          };
        } catch (error) {
          console.error("Error durante la autenticación:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.year = user.year;
        token.division = user.division;
        token.avatar = user.avatar;
        token.settings = user.settings;
      }
      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.year = token.year;
        session.user.division = token.division;
        session.user.avatar = token.avatar;
        session.user.settings = token.settings;
      }
      return session;
    },
  },

  pages: {
    signIn: "/campus/auth/login",
    error: "/campus/auth/login",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
