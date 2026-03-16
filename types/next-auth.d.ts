import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    division?: string;
    year?: number;
    approval_status?: string;
    school_id: string;
  }
  interface Session {
    user?: {
      id: string;
      role?: string;
      division?: string;
      year?: number;
      approval_status?: string;
      school_id: string;
      subdomain?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    division?: string;
    year?: number;
    approval_status?: string;
    school_id: string;
    subdomain?: string;
  }
}
