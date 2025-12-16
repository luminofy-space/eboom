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
app.listen(PORT, () => console.log(`PFM backend listening at http://localhost:${PORT}`));


module.exports = app;