import express from 'express';
import dotenv from 'dotenv';
import { customerRouter } from './src/routes/customerRoutes.js';

dotenv.config();
const app = express();

app.use(express.json());
app.get('/', (req, res) => res.send('eKYC API is running'));

app.use('/api/v1', customerRouter);


 app.use((req, res) => {
  res.status(404).json({ status: 'NOT_FOUND', message: 'Route not found' });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`eKYC API running on :${PORT}`));

