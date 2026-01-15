import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { phoneOtpRequestSchema, phoneOtpVerifySchema, telegramLoginSchema } from '@dashboarduz/shared';
import { prisma } from '@dashboarduz/db';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  // Phone OTP: Request code
  requestOtp: publicProcedure
    .input(phoneOtpRequestSchema)
    .mutation(async ({ input }) => {
      try {
        const { otpService } = await import('../../services/auth/otp');
        const result = await otpService.sendOTP(input.phone);
        
        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send OTP',
          });
        }

        return {
          success: true,
          message: 'OTP sent successfully',
          sessionId: result.messageId,
        };
      } catch (error: any) {
        console.error('[Auth] OTP request error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to send OTP',
        });
      }
    }),

  // Phone OTP: Verify code and create/login user
  verifyOtp: publicProcedure
    .input(phoneOtpVerifySchema)
    .mutation(async ({ input }) => {
      try {
        // Verify OTP with provider
        const { otpService } = await import('../../services/auth/otp');
        const { signJWT } = await import('../../services/auth/jwt');
        
        const verification = await otpService.verifyOTP(input.phone, input.code);
        
        if (!verification.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'OTP verification service error',
          });
        }

        if (!verification.verified) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid OTP code',
          });
        }

        // Find or create user
        let user = await prisma.user.findFirst({
          where: { phone: input.phone },
        });

        let tenantId: string;
        
        if (!user) {
          // Create tenant and user for first signup
          const tenant = await prisma.tenant.create({
            data: {
              name: `Tenant ${input.phone}`,
              plan: 'free',
            },
          });

          user = await prisma.user.create({
            data: {
              tenantId: tenant.id,
              phone: input.phone,
              roles: ['Admin'],
              authProvider: 'phone',
            },
          });
          
          tenantId = tenant.id;
        } else {
          tenantId = user.tenantId;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Generate JWT token
        const jwtPayload = {
          userId: user.id,
          tenantId,
          roles: user.roles,
          phone: user.phone,
        };

        const token = signJWT(jwtPayload);

        return {
          success: true,
          user: jwtPayload,
          token,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error('[Auth] OTP verify error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'OTP verification failed',
        });
      }
    }),

  // Telegram Login: Verify and link account
  telegramLogin: publicProcedure
    .input(telegramLoginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify Telegram authentication
        const { telegramAuthService } = await import('../../services/auth/telegram');
        const { signJWT } = await import('../../services/auth/jwt');
        
        const verification = telegramAuthService.verifyUser(input);
        
        if (!verification.isValid || !verification.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: verification.error || 'Invalid Telegram authentication',
          });
        }

        const { user: telegramUser } = verification;

        // Find or create user
        let user = await prisma.user.findFirst({
          where: { telegramId: String(telegramUser.id) },
        });

        let tenantId: string;
        
        if (!user) {
          // Create tenant and user
          const tenant = await prisma.tenant.create({
            data: {
              name: `Tenant ${telegramUser.firstName}`,
              plan: 'free',
            },
          });

          user = await prisma.user.create({
            data: {
              tenantId: tenant.id,
              name: `${telegramUser.firstName} ${telegramUser.lastName || ''}`.trim(),
              telegramId: String(telegramUser.id),
              roles: ['Admin'],
              authProvider: 'telegram',
            },
          });
          
          tenantId = tenant.id;
        } else {
          tenantId = user.tenantId;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLoginAt: new Date(),
            name: `${telegramUser.firstName} ${telegramUser.lastName || ''}`.trim(),
          },
        });

        // Generate JWT token
        const jwtPayload = {
          userId: user.id,
          tenantId,
          roles: user.roles,
        };

        const token = signJWT(jwtPayload);

        return {
          success: true,
          user: jwtPayload,
          token,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error('[Auth] Telegram login error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Telegram authentication failed',
        });
      }
    }),

  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.user.userId },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return user;
  }),

  // Link additional auth method
  linkAccount: protectedProcedure
    .input(z.object({
      provider: z.enum(['phone', 'google', 'telegram']),
      providerId: z.string(),
      token: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Create auth link
      await prisma.userAuthLink.create({
        data: {
          userId: ctx.user.userId,
          provider: input.provider,
          providerId: input.providerId,
          verified: true,
        },
      });

      return { success: true };
    }),
});
