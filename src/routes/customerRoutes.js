import express from 'express';
import { handleRequestOtp, handleVerifyOtp } from '../controllers/otpController.js';

export const customerRouter = express.Router();

customerRouter.post('/request-otp',handleRequestOtp);
customerRouter.post('/verify-otp',  handleVerifyOtp);
