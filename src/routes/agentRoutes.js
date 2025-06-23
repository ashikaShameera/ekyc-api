import express from 'express';
import {
  handleAgentLogin,
  handleGetEkycUser,
} from '../controllers/agentController.js';

export const agentRouter = express.Router();

agentRouter.post('/institution-agent/login', handleAgentLogin);
agentRouter.post('/get-ekyc-user',           handleGetEkycUser);
