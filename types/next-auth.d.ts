import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    division?: string;
    year?: number;
  }
  interface Session {
    user?: {
      id: string;
      role?: string;
      division?: string;
      year?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    division?: string;
    year?: number;
  }
}
