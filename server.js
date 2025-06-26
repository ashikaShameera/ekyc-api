import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';   
import { customerRouter } from './src/routes/customerRoutes.js';
import { agentRouter }    from './src/routes/agentRoutes.js';

dotenv.config();
const app = express();

app.use(cors()); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('eKYC API is running'));

app.use('/api/v1', customerRouter);
app.use('/api/v1', agentRouter);


 app.use((req, res) => {
  res.status(404).json({ status: 'NOT_FOUND', message: 'Route not found' });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`eKYC API running on :${PORT}`));

