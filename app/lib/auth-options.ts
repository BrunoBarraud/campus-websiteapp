import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import bcrypt from "bcryptjs";
import { sanitizeText } from "./utils/sanitize";
import { isAccountLocked, recordLoginAttempt } from "./security/brute-force-protection";
import { notifySuspiciousLogin, notifyAccountLocked } from "./services/security-notifications";
import { UAParser } from './utils/user-agent-parser';
import { logAuditEvent, AuditAction } from './services/audit-service';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Obtener IP del cliente
        const ipAddress = req?.headers?.['x-forwarded-for'] || 
                         req?.headers?.['x-real-ip'] || 
                         'unknown';

        try {
          // Verificar si la cuenta está bloqueada temporalmente
          const isLocked = await isAccountLocked(credentials.email);
          if (isLocked) {
            await logAuditEvent({
              email: credentials.email,
              action: AuditAction.LOGIN_FAILURE,
              details: { reason: 'account_locked' },
              ipAddress: ipAddress.toString(),
              userAgent: req?.headers?.['user-agent'] || 'unknown'
            });
            throw new Error('account_locked');
          }

          // Get user from database
          const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .eq("is_active", true)
            .single();

          if (error || !user) {
            // Usuario no encontrado o error en la consulta
            await logAuditEvent({
              email: credentials.email,
              action: AuditAction.LOGIN_FAILURE,
              details: { reason: 'user_not_found' },
              ipAddress: ipAddress.toString(),
              userAgent: req?.headers?.['user-agent'] || 'unknown'
            });
            await recordLoginAttempt(credentials.email, ipAddress.toString(), false);
            return null;
          }

          // Verify password

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            String(user.password)
          );

          if (!passwordMatch) {
            // Contraseña incorrecta
            await logAuditEvent({
              email: credentials.email,
              action: AuditAction.LOGIN_FAILURE,
              details: { reason: 'invalid_password' },
              ipAddress: ipAddress.toString(),
              userAgent: req?.headers?.['user-agent'] || 'unknown'
            });
            await recordLoginAttempt(credentials.email, ipAddress.toString(), false);
            return null;
          }
          
          // Verificar autenticación de dos factores si está habilitada
          if (user.two_factor_enabled && (credentials as any).twoFactorCode) {
            // Importar speakeasy para verificar el código
            const speakeasy = require('speakeasy');
            
            // Verificar el código 2FA
            const verified = speakeasy.totp.verify({
              secret: user.two_factor_secret,
              encoding: 'base32',
              token: (credentials as any).twoFactorCode,
              window: 1 // Permite una ventana de 1 intervalo (30 segundos antes/después)
            });
            
            if (!verified) {
              // Código 2FA incorrecto
              await logAuditEvent({
                email: credentials.email,
                action: AuditAction.LOGIN_FAILURE,
                details: { reason: 'invalid_2fa_code' },
                ipAddress: ipAddress.toString(),
                userAgent: req?.headers?.['user-agent'] || 'unknown'
              });
              await recordLoginAttempt(credentials.email, ipAddress.toString(), false);
              throw new Error('invalid_2fa_code');
            }
          } else if (user.two_factor_enabled && !(credentials as any).twoFactorCode) {
            // 2FA está habilitado pero no se proporcionó código
            throw new Error(`two_factor_required, user_id:${user.id}`);
          }

          // Sanitizar datos del usuario antes de devolverlos
          const sanitizedUser = {
            id: user.id.toString(),
            email: sanitizeText(user.email),
            name: sanitizeText(user.name),
            role: sanitizeText(user.role),
            division: sanitizeText(user.division),
            year: user.year,
          };
          
          // Registrar inicio de sesión exitoso
          await logAuditEvent({
            userId: sanitizedUser.id,
            email: sanitizedUser.email,
            action: AuditAction.LOGIN_SUCCESS,
            ipAddress: ipAddress.toString(),
            userAgent: req?.headers?.['user-agent'] || 'unknown',
            details: {
              method: 'credentials'
            }
          });
          await recordLoginAttempt(sanitizedUser.email, ipAddress.toString(), true);
          
          // Verificar si es un inicio de sesión desde una ubicación nueva/inusual
          // y enviar notificación si es sospechoso
          try {
            const { data: lastLogin } = await supabaseAdmin
              .from("users")
              .select("last_login_ip")
              .eq("id", sanitizedUser.id)
              .single();
            
            // Si la IP es diferente a la última IP de inicio de sesión y no es la primera vez
            if (lastLogin?.last_login_ip && lastLogin.last_login_ip !== ipAddress.toString()) {
              // Crear notificación de inicio de sesión sospechoso
              await notifySuspiciousLogin(
                sanitizedUser.id, 
                ipAddress.toString(), 
                req?.headers?.['user-agent'] || 'unknown'
              );
            }
            
            // Actualizar la última IP de inicio de sesión
            await supabaseAdmin
              .from("users")
              .update({ 
                last_login_at: new Date().toISOString(),
                last_login_ip: ipAddress.toString()
              })
              .eq("id", sanitizedUser.id);
          } catch (error) {
            console.error('Error al verificar ubicación de inicio de sesión:', error);
          }
          
          // Return user object
          return sanitizedUser;
        } catch (error) {
          // Error en el proceso de autenticación
          const errorMessage = error instanceof Error ? error.message : "server_error";
          await logAuditEvent({
            email: credentials.email,
            action: AuditAction.LOGIN_FAILURE,
            details: { reason: errorMessage },
            ipAddress: ipAddress.toString(),
            userAgent: req?.headers?.['user-agent'] || 'unknown'
          });
          
          // Si el error es que la cuenta está bloqueada, crear notificación y devolver un error específico
          if (errorMessage === 'account_locked') {
            // Intentar obtener el ID del usuario para la notificación
            try {
              const { data: lockedUser } = await supabaseAdmin
                .from("users")
                .select("id")
                .eq("email", credentials.email)
                .single();
              
              if (lockedUser) {
                // Crear notificación de cuenta bloqueada
                await notifyAccountLocked(lockedUser.id, 'multiple_failed_attempts');
              }
            } catch (notifError) {
              console.error('Error al crear notificación de bloqueo:', notifError);
            }
            
            return Promise.reject(new Error('Tu cuenta ha sido bloqueada temporalmente por demasiados intentos fallidos. Por favor, inténtalo más tarde.'));
          }
          
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
  events: {
    async signIn({ user, account, isNewUser, profile }) {
      // Registrar la sesión del usuario
      if (user) {
        try {
          // Obtener información del navegador y sistema operativo
          const req = (arguments[0] as any)?.req;
          const userAgent = req?.headers['user-agent'] || 'Unknown';
          const ip = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || 'Unknown';
          
          const parser = new UAParser(userAgent);
          const browserInfo = parser.getBrowser();
          const osInfo = parser.getOS();
          
          const browser = `${browserInfo.name || 'Unknown'} ${browserInfo.version || ''}`;
          const os = `${osInfo.name || 'Unknown'} ${osInfo.version || ''}`;
          const deviceName = `${browser} en ${os}`;
          
          // Almacenar la sesión en la tabla user_sessions
          const { data: sessionData, error: sessionError } = await supabaseAdmin
            .from('user_sessions')
            .insert({
              user_id: user.id,
              session_token: (user as any).sessionToken,
              device_name: deviceName,
              browser,
              os,
              ip_address: ip,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
            });
          
          if (sessionError) {
            console.error('Error al registrar sesión:', sessionError);
          }
        } catch (error) {
          console.error('Error al procesar evento de inicio de sesión:', error);
        }
      }
    },
    async signOut({ session, token }) {
      // Eliminar la sesión de la tabla user_sessions
      if (session) {
        try {
          const { error } = await supabaseAdmin
            .from('user_sessions')
            .delete()
            .eq('session_token', (session as any).sessionToken);
          
          if (error) {
            console.error('Error al eliminar sesión:', error);
          }
        } catch (error) {
          console.error('Error al procesar evento de cierre de sesión:', error);
        }
      }
    }
  },
  pages: {
    signIn: "/campus/login",
    signOut: "/campus/logout",
  },
};
