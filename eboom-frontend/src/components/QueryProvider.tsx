'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useApiRespond } from '../api/useApiRespond';
import { AxiosError, AxiosResponse } from 'axios';

interface Props {
  children: ReactNode;
}

const QueryProvider = ({ children }: Props) => {
  const { handleError, handleSuccess } = useApiRespond();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            handleError(error as AxiosError);
          },
          onSuccess: (data) => {
            handleSuccess(data as AxiosResponse<unknown>);
          }
        })
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
