'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface Props {
  children: ReactNode;
}

const QueryProvider = ({ children }: Props) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // List/detail failures stay quiet; mutations notify via useMutationApi.
            retry: 1,
          },
        },
      })
  );

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default QueryProvider;
