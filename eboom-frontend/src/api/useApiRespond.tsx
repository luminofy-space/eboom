import type { AxiosError, AxiosResponse } from "./axiosTypes";

export const useApiRespond = () => {
    const handleError = (_error: AxiosError) => {
        //TODO: add a snackbar here...
    
        // if (error?.response?.status === 404) {
        //   router.push(Routes.NOT_FOUND);
        // }
      };

      const handleSuccess = (_data: AxiosResponse) => {};

      return {
        handleError,
        handleSuccess,
      }
}