import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user from database
          const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .eq("is_active", true)
            .single();

          if (error || !user) {
            console.log("User not found:", credentials.email);
            return null;
          }

          console.log("User found:", {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            password: typeof user.password,
            passwordValue: user.password,
          });

          // Verify password
          console.log("About to compare passwords:", {
            credentialsPassword: credentials.password,
            userPassword: user.password,
            userPasswordType: typeof user.password,
          });

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            String(user.password)
          );

          if (!passwordMatch) {
            console.log("Password mismatch for user:", credentials.email);
            return null;
          }

          // Return user object
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            division: user.division,
            year: user.year,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.division = user.division;
        token.year = user.year;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
        session.user.role = token.role;
        session.user.division = token.division;
        session.user.year = token.year;
      }
      return session;
    },
  },
  pages: {
    signIn: "/campus/login",
    signOut: "/campus/logout",
  },
};
