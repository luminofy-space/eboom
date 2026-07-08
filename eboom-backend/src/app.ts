import "dotenv/config";
import './types/express';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';


const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: "10mb" }));


import apiRouter from './routes';
import { startNotificationEmailJob } from './jobs/notificationEmailJob';
import { errorHandler } from './middleware/errorHandler';
app.use('/api', apiRouter);


app.get('/', (req, res) => res.json({ ok: true, service: 'pfm-backend' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PFM backend listening at http://localhost:${PORT}`);

  const skipEmailVerification = false && ["1", "true", "yes"].includes(
    process.env.SKIP_EMAIL_VERIFICATION?.trim().toLowerCase() ?? ""
  );
  if (skipEmailVerification) {
    console.warn(
      "SKIP_EMAIL_VERIFICATION is enabled — new users are auto-verified and verification emails are not sent."
    );
  }

  startNotificationEmailJob();

  // Check if testing mode is enabled
  const TEST_USER_ID = process.env.TEST_USER_ID;
  if (TEST_USER_ID) {
    console.log('\n');
    console.log('========================================');
    console.log('WARNING: TESTING MODE ENABLED');
    console.log(`Bypassing authentication for user ID: ${TEST_USER_ID}`);
    console.log('Remove TEST_USER_ID from .env in production!');
    console.log('========================================');
    console.log('\n');
  }
});


module.exports = app;