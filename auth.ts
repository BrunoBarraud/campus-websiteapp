import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
// import GoogleProvider from "next-auth/providers/google"
import type { JWT } from "next-auth/jwt"
import { supabaseAdmin } from "@/app/lib/supabaseClient"
import bcrypt from "bcryptjs"
import { sanitizeText } from "./app/lib/utils/sanitize"
import { isAccountLocked, recordLoginAttempt } from "./app/lib/security/brute-force-protection"
import { notifySuspiciousLogin, notifyAccountLocked } from "./app/lib/services/security-notifications"
import { UAParser } from './app/lib/utils/user-agent-parser'
import { logAuditEvent, AuditAction } from './app/lib/services/audit-service'
import speakeasy from 'speakeasy'
import { determineRole } from './app/lib/utils/teacher-roles'

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorToken: { label: "2FA Token", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        const email = sanitizeText(credentials.email as string);
        const password = sanitizeText(credentials.password as string);
        const twoFactorToken = credentials?.twoFactorToken;
        const userAgent = req?.headers?.get('user-agent') || 'unknown';
        const ipAddress = req?.headers?.get('x-forwarded-for') || req?.headers?.get('x-real-ip') || 'unknown';

        try {
          // Verificar si la cuenta está bloqueada
          if (await isAccountLocked(email)) {
            throw new Error('Cuenta temporalmente bloqueada por múltiples intentos fallidos');
          }

          // Buscar usuario en la base de datos
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (error || !user) {
            await recordLoginAttempt(email, ipAddress, false);
            throw new Error('Credenciales inválidas');
          }

          // Verificar contraseña
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            await recordLoginAttempt(email, ipAddress, false);
            throw new Error('Credenciales inválidas');
          }

          // Verificar 2FA si está habilitado
          if (user.two_factor_enabled && user.two_factor_secret) {
            if (!twoFactorToken) {
              throw new Error('Token de autenticación de dos factores requerido');
            }

            const isValid2FA = speakeasy.totp.verify({
              secret: user.two_factor_secret,
              encoding: 'base32',
              token: twoFactorToken.toString(),
              window: 2
            });

            if (!isValid2FA) {
              await recordLoginAttempt(email, ipAddress, false);
              throw new Error('Token de autenticación de dos factores inválido');
            }
          }

          // Verificar si la cuenta está activa
          if (!user.is_active) {
            throw new Error('Cuenta desactivada. Contacte al administrador.');
          }

          // Registrar intento exitoso
          await recordLoginAttempt(email, ipAddress, true);

          // Detectar login sospechoso
          const parser = new UAParser(userAgent);
          const deviceInfo = {
            browser: parser.getBrowser().name || 'unknown',
            os: parser.getOS().name || 'unknown',
            device: parser.getDevice().type || 'desktop'
          };

          // Verificar si es un dispositivo/ubicación nueva
          const { data: recentLogins } = await supabaseAdmin
            .from('login_attempts')
            .select('ip_address, user_agent')
            .eq('email', email)
            .eq('success', true)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .limit(10);

          const isNewDevice = !recentLogins?.some(login => 
            login.user_agent === userAgent || login.ip_address === ipAddress
          );

          if (isNewDevice && recentLogins && recentLogins.length > 0) {
            await notifySuspiciousLogin(user.id, ipAddress, userAgent);
          }

          // Registrar evento de auditoría
          await logAuditEvent({
            userId: user.id,
            action: AuditAction.LOGIN_SUCCESS,
            details: { message: `Login exitoso desde ${deviceInfo.browser} en ${deviceInfo.os}` },
            ipAddress,
            userAgent
          });

          // Actualizar último login
          await supabaseAdmin
            .from('users')
            .update({ 
              last_login: new Date().toISOString(),
              last_ip: ipAddress
            })
            .eq('id', user.id);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            division: user.division,
            year: user.year,
          };
        } catch (error: any) {
          console.error('Error en autorización:', error);
          throw new Error(error.message || 'Error de autenticación');
        }
      },
    }),
    // GoogleProvider temporalmente deshabilitado para desarrollo/testing
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   authorization: {
    //     params: {
    //       hd: "ipdvs.ar", // Restringir a dominio específico
    //       prompt: "select_account",
    //     },
    //   },
    // }),
  ],
  pages: {
    signIn: '/campus/auth/login',
    signOut: '/campus/auth/logout',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Verificar que el email pertenezca al dominio autorizado
          if (!user.email?.endsWith("@ipdvs.ar")) {
            return false;
          }

          // Buscar si el usuario ya existe
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Determinar rol automáticamente basado en la lista de profesores
            const userRole = determineRole(user.email);
            
            // Crear nuevo usuario con rol determinado automáticamente
            const { error } = await supabaseAdmin
              .from('users')
              .insert({
                email: user.email,
                name: user.name || '',
                role: userRole, // Rol determinado automáticamente
                google_id: profile?.sub,
                email_verified: true,
                created_at: new Date().toISOString(),
              });

            if (error) {
              console.error('Error creating Google user:', error);
              return false;
            }
          } else {
            // Actualizar google_id si no existe
            if (!existingUser.google_id) {
              await supabaseAdmin
                .from('users')
                .update({ google_id: profile?.sub })
                .eq('id', existingUser.id);
            }
          }

          return true;
        } catch (error) {
          console.error('Error in Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Para usuarios de Google, obtener información desde la base de datos
        if (account?.provider === "google") {
          const { data: dbUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
            token.division = dbUser.division;
            token.year = dbUser.year;
          }
        } else {
          // Para usuarios con credenciales
          token.role = user.role;
          token.id = user.id;
          token.division = user.division;
          token.year = user.year;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.division = token.division as string;
        session.user.year = token.year as number;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      if (token?.id) {
        await logAuditEvent({
          userId: token.id as string,
          action: AuditAction.LOGOUT,
          details: { message: 'Usuario cerró sesión' },
          ipAddress: 'unknown',
          userAgent: 'unknown'
        });
      }
    },
  },
})