import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "@/app/lib/supabaseClient"
import bcrypt from "bcryptjs"
import { sanitizeText } from "./app/lib/utils/sanitize"
import { getSchoolByHost } from "@/app/lib/schools"
import { isAccountLocked, recordLoginAttempt } from "./app/lib/security/brute-force-protection"
import speakeasy from 'speakeasy'

export const { auth, handlers, signIn, signOut } = NextAuth(async (req) => {
  // 🌐 Detección dinámica de sede
  const host = req?.headers?.get('host') || null;
  const url = req?.url ? new URL(req.url) : null;
  const searchParams = url?.searchParams;
  const school = getSchoolByHost(host, searchParams);

  return {
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          twoFactorToken: { label: "2FA Token", type: "text" },
        },
        async authorize(credentials, authReq) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email y contraseña son requeridos');
          }

          const email = sanitizeText(credentials.email as string);
          const password = sanitizeText(credentials.password as string);
          const twoFactorToken = credentials?.twoFactorToken;
          
          // Usamos authReq que viene directamente del provider
          const ipAddress = authReq?.headers?.get('x-forwarded-for') || authReq?.headers?.get('x-real-ip') || 'unknown';

          try {
            if (await isAccountLocked(email)) {
              throw new Error('Cuenta temporalmente bloqueada por múltiples intentos fallidos');
            }

            const { data: user, error } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', email)
              .single();

            if (error || !user) {
              await recordLoginAttempt(email, ipAddress, false);
              throw new Error('Credenciales inválidas');
            }

            // 🔒 Validación de Sede: Los alumnos/profes deben coincidir con la sede actual.
            // Los Admins pueden entrar a cualquier sede.
            if (user.role !== 'admin' && user.school_id !== school.id) {
              throw new Error('No tienes permiso para acceder a esta institución');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
              await recordLoginAttempt(email, ipAddress, false);
              throw new Error('Credenciales inválidas');
            }

            if (user.two_factor_enabled && user.two_factor_secret) {
              if (!twoFactorToken) throw new Error('Token de 2FA requerido');
              const isValid2FA = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: twoFactorToken.toString(),
                window: 2
              });
              if (!isValid2FA) {
                await recordLoginAttempt(email, ipAddress, false);
                throw new Error('Token de 2FA inválido');
              }
            }

            if (!user.is_active) throw new Error('Cuenta desactivada');

            await recordLoginAttempt(email, ipAddress, true);

            // Actualizar último login
            await supabaseAdmin.from('users').update({ 
                last_login: new Date().toISOString(),
                last_ip: ipAddress
              }).eq('id', user.id);

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              division: user.division,
              year: user.year,
              school_id: user.school_id,
            };
          } catch (error: any) {
            console.error('Error en autorización:', error);
            throw new Error(error.message || 'Error de autenticación');
          }
        },
      }),
      GoogleProvider({
        clientId: (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) as string,
        clientSecret: (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET) as string,
        authorization: {
          params: {
            scope: 'openid email profile',
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
      maxAge: 24 * 60 * 60,
    },
    callbacks: {
      async signIn({ user, account }) {
        if (account?.provider === 'google') {
          const emailAddr = (user?.email || '').toLowerCase();
          const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
          const isAdminEmail = adminEmails.includes(emailAddr);
          
          try {
            const { data: existing, error: findErr } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', emailAddr)
              .single();
            
            if (findErr || !existing) {
              // 🆕 Registro Automático en la Sede Correcta
              // IMPORTANTE: En Vercel, el host puede ser el dominio principal. 
              // Usamos la sede detectada (que puede ser la default)
              console.log(`[OAuth] Registrando ${emailAddr} en sede: ${school.name}`);
              const defaultRole = isAdminEmail ? 'admin' : 'student';
              const approvalStatus = defaultRole === 'student' ? 'pending' : 'approved';
              
              const { error: createErr } = await supabaseAdmin
                .from('users')
                .insert({
                  email: emailAddr,
                  name: user?.name || emailAddr.split('@')[0],
                  role: defaultRole,
                  school_id: school.id,
                  is_active: true,
                  approval_status: approvalStatus,
                  last_login: new Date().toISOString()
                });
              
              if (createErr) return false;
            } else {
              // 🔄 Actualización de último login y validación de sede
              if (existing.school_id !== school.id && !isAdminEmail && existing.role !== 'admin') {
                console.warn(`[OAuth] Acceso denegado: Usuario ${emailAddr} pertenece a otra sede y no es Admin.`);
                return false;
              }
              
              await supabaseAdmin.from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', existing.id);
            }
          } catch (error) {
            console.error('[OAuth] Error en callback:', error);
            return false;
          }
        }
        return true;
      },
      async jwt({ token, user, trigger }) {
        if (user) {
          token.id = (user as any).id;
          token.role = (user as any).role;
          token.school_id = (user as any).school_id;
          token.subdomain = school.subdomain;
        }
        
        // Refresco de datos si es necesario (Optimizado)
        if (trigger === 'update' || !token.school_id) {
          if (token.email) {
            const { data: dbUser } = await supabaseAdmin
              .from('users')
              .select('id, role, school_id')
              .eq('email', token.email)
              .single();
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.school_id = dbUser.school_id;
              token.subdomain = school.subdomain;
            }
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (token) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.school_id = token.school_id as string;
          session.user.subdomain = token.subdomain as string;
        }
        return session;
      },
    },
  }
})