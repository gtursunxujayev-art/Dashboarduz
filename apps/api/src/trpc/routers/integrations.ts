import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { amocrmConnectSchema, telegramBotConnectSchema, googleSheetsConnectSchema, voipConnectSchema } from '@dashboarduz/shared';
import { prisma } from '@dashboarduz/db';
import { TRPCError } from '@trpc/server';

export const integrationsRouter = router({
  // List all integrations for tenant
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return await prisma.integration.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Get integration by type
  getByType: protectedProcedure
    .input(z.object({ type: z.enum(['amocrm', 'telegram', 'google_sheets', 'voip_utel']) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return await prisma.integration.findUnique({
        where: {
          tenantId_type: {
            tenantId: ctx.tenantId,
            type: input.type,
          },
        },
      });
    }),

  // Connect AmoCRM
  connectAmoCRM: protectedProcedure
    .input(amocrmConnectSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // TODO: Exchange code for tokens via AmoCRM OAuth2
      // For now, create placeholder integration
      const integration = await prisma.integration.upsert({
        where: {
          tenantId_type: {
            tenantId: ctx.tenantId,
            type: 'amocrm',
          },
        },
        update: {
          status: 'active',
          // tokensEncrypted: encryptTokens(tokens),
        },
        create: {
          tenantId: ctx.tenantId,
          type: 'amocrm',
          status: 'active',
          // tokensEncrypted: encryptTokens(tokens),
        },
      });

      return integration;
    }),

  // Connect Telegram Bot
  connectTelegram: protectedProcedure
    .input(telegramBotConnectSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // TODO: Validate bot token with Telegram API
      const integration = await prisma.integration.upsert({
        where: {
          tenantId_type: {
            tenantId: ctx.tenantId,
            type: 'telegram',
          },
        },
        update: {
          status: 'active',
          config: { botToken: input.botToken },
        },
        create: {
          tenantId: ctx.tenantId,
          type: 'telegram',
          status: 'active',
          config: { botToken: input.botToken },
        },
      });

      return integration;
    }),

  // Connect Google Sheets
  connectGoogleSheets: protectedProcedure
    .input(googleSheetsConnectSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // TODO: Exchange code for tokens via Google OAuth2
      const integration = await prisma.integration.upsert({
        where: {
          tenantId_type: {
            tenantId: ctx.tenantId,
            type: 'google_sheets',
          },
        },
        update: {
          status: 'active',
        },
        create: {
          tenantId: ctx.tenantId,
          type: 'google_sheets',
          status: 'active',
        },
      });

      return integration;
    }),

  // Connect VoIP (UTeL)
  connectVoIP: protectedProcedure
    .input(voipConnectSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // TODO: Validate API token with UTeL API
      const integration = await prisma.integration.upsert({
        where: {
          tenantId_type: {
            tenantId: ctx.tenantId,
            type: 'voip_utel',
          },
        },
        update: {
          status: 'active',
          config: { apiToken: input.apiToken, apiUrl: input.apiUrl },
        },
        create: {
          tenantId: ctx.tenantId,
          type: 'voip_utel',
          status: 'active',
          config: { apiToken: input.apiToken, apiUrl: input.apiUrl },
        },
      });

      return integration;
    }),

  // Disconnect integration
  disconnect: protectedProcedure
    .input(z.object({ type: z.enum(['amocrm', 'telegram', 'google_sheets', 'voip_utel']) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.tenantId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      await prisma.integration.updateMany({
        where: {
          tenantId: ctx.tenantId,
          type: input.type,
        },
        data: {
          status: 'disconnected',
          tokensEncrypted: null,
          refreshToken: null,
        },
      });

      return { success: true };
    }),
});
