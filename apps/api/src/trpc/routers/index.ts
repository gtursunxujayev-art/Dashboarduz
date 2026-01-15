import { router } from '../trpc';
import { authRouter } from './auth';
import { integrationsRouter } from './integrations';
import { leadsRouter } from './leads';

export const appRouter = router({
  auth: authRouter,
  integrations: integrationsRouter,
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
