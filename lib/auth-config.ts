// 🔧 Configuración de NextAuth compartida
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import type { NextAuthOptions } from "next-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', { email: credentials?.email, password: credentials?.password ? '[HIDDEN]' : 'missing' });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null
        }

        try {
          console.log('Querying Supabase for user:', credentials.email);
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single()

          console.log('Supabase response:', { user: user ? 'found' : 'not found', error: error?.message });

          if (error || !user) {
            console.log('User not found or error:', error)
            return null
          }

          console.log('User found, returning user data');
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name || user.email,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/campus/login',
    signOut: '/campus/logout',
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
};
