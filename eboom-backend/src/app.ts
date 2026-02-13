import './types/express';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';


dotenv.config();


const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


import apiRouter from './routes';
app.use('/api', apiRouter);


app.get('/', (req, res) => res.json({ ok: true, service: 'pfm-backend' }));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PFM backend listening at http://localhost:${PORT}`);

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