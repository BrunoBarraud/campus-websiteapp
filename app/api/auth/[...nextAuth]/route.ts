import NextAuth, { User, Session, DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user?: {
      role?: string;
    } & DefaultSession["user"];
  }
}

const prisma = new PrismaClient();

const authOptions = {
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

        // Registro automático si es nuevo
        let user = await prisma.user.findUnique({
          where: { email: email as string },
        });

        if (!user && name) {
          const hashedPassword = await bcrypt.hash(password as string, 10);
          user = await prisma.user.create({
            data: {
              email: email as string,
              name: name as string,
              password: hashedPassword,
              role: "ESTUDIANTE",
            },
          });
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
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt({ token, user }: { token: JWT; user: User | null }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user) {
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
