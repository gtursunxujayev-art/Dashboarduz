import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@dashboarduz/api/src/trpc/routers';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/trpc`,
        headers() {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          return {
            Authorization: token ? `Bearer ${token}` : '',
          };
        },
      }),
    ],
    transformer: superjson,
  });
}

export const trpcClient = typeof window !== 'undefined' ? createTRPCClient() : null as any;

export type { AppRouter };
