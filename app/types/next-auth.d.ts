declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "student" | "teacher" | "admin";
      year?: number;
      division?: string;
      avatar?: string;
      settings?: any;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "student" | "teacher" | "admin";
    year?: number;
    division?: string;
    avatar?: string;
    settings?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    year?: number;
    division?: string;
    avatar?: string;
    settings?: any;
  }
}
