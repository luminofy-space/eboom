import cors from 'cors';

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const isProd = process.env.NODE_ENV === 'production';
const appUrl = process.env.APP_URL;

function isAllowedOrigin(origin: string): boolean {
  if (appUrl && origin === appUrl) return true;
  if (!isProd && LOCALHOST_ORIGIN.test(origin)) return true;
  return false;
}

/**
 * Allow the public app URL; in non-production also allow any localhost/127.0.0.1
 * port so local dev works regardless of which port the frontend runs on.
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
});
