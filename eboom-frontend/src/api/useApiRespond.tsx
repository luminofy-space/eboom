import { AxiosError, AxiosResponse } from "axios";
import logger from "./logger";

export const useApiRespond = () => {
    // const router = useRouter();
    const isDevelopMode = process.env.NODE_ENV === 'development';

    const handleError = (error: AxiosError) => {

        if (isDevelopMode) logError(error);

        //TODO: add a snackbar here...
    
        // if (error?.response?.status === 404) {
        //   router.push(Routes.NOT_FOUND);
        // }
      };

      const handleSuccess = (data: AxiosResponse) => {
        if (isDevelopMode) logSuccess(data);
      };

      return {
        handleError,
        handleSuccess,
      }
}

const logError = (error: AxiosError) => {
    logger.error(error.message, {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
    });
}

const logSuccess = (data: AxiosResponse) => {
    logger.info(data.statusText, {
        status: data.status,
        data: data.data,
        config: data.config,
    });
}