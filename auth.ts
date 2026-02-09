import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "@/app/lib/supabaseClient"
import bcrypt from "bcryptjs"
import { sanitizeText } from "./app/lib/utils/sanitize"
import { isAccountLocked, recordLoginAttempt } from "./app/lib/security/brute-force-protection"
import { notifySuspiciousLogin } from "./app/lib/services/security-notifications"
import { UAParser } from './app/lib/utils/user-agent-parser'
import { logAuditEvent, AuditAction } from './app/lib/services/audit-service'
import speakeasy from 'speakeasy'

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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: 'openid email profile',
          hd: process.env.GOOGLE_HD,
          prompt: 'consent'
        }
      }
    }),
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
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const allowed = (process.env.ALLOWED_GOOGLE_DOMAINS || '')
          .split(',')
          .map(d => d.trim().toLowerCase())
          .filter(Boolean)
        const adminEmails = (process.env.ADMIN_EMAILS || '')
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean)
        const emailAddr = (user?.email || '').toLowerCase()
        const domain = emailAddr.split('@')[1]
        const isAdminEmail = adminEmails.includes(emailAddr)
        
        // Solo validar dominio si ALLOWED_GOOGLE_DOMAINS está configurado
        if (!isAdminEmail && allowed.length > 0) {
          if (!domain || !allowed.includes(domain)) {
            console.log(`[Google OAuth] Acceso denegado: dominio ${domain} no está en la lista permitida`)
            return false
          }
        }

        try {
          // Ensure user exists in DB and is active
          const { data: existing, error: findErr } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', emailAddr)
            .single()
          
          if (findErr || !existing) {
            // Usuario no existe, crear uno nuevo
            console.log(`[Google OAuth] Creando nuevo usuario: ${emailAddr}`)
            const defaultRole = isAdminEmail ? 'admin' : 'student';
            
            const { error: createErr } = await supabaseAdmin
              .from('users')
              .insert({
                email: emailAddr,
                name: user?.name || emailAddr.split('@')[0],
                role: defaultRole,
                is_active: true,
                year: null, // Sin año asignado inicialmente para estudiantes
                division: null,
                last_login: new Date().toISOString()
              })
              .select('*')
              .single()
            
            if (createErr) {
              console.error('[Google OAuth] Error al crear usuario:', createErr)
              return false
            }
            console.log(`[Google OAuth] Usuario creado exitosamente: ${emailAddr} (${defaultRole})`)
          } else {
            // Usuario existe, actualizar last_login
            console.log(`[Google OAuth] Usuario existente: ${emailAddr} (${existing.role})`)
            const updates: any = { last_login: new Date().toISOString() }
            if (isAdminEmail && existing.role !== 'admin') {
              updates.role = 'admin'
            }
            await supabaseAdmin
              .from('users')
              .update(updates)
              .eq('id', existing.id)
          }
        } catch (error) {
          console.error('[Google OAuth] Error en signIn callback:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.division = (user as any).division;
        token.year = (user as any).year;
      }
      
      // Actualizar desde BD si es un update trigger o si faltan campos
      if (trigger === 'update' || !token.id || !token.role) {
        if (token.email) {
          try {
            const { data: dbUser } = await supabaseAdmin
              .from('users')
              .select('id, role, division, year')
              .eq('email', token.email)
              .single()
            if (dbUser) {
              token.id = dbUser.id
              token.role = dbUser.role
              token.division = dbUser.division
              token.year = dbUser.year
            }
          } catch (error) {
            console.error('[JWT] Error refrescando datos del usuario:', error)
          }
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