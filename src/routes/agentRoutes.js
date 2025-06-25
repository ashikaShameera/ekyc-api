import express from 'express';
import { agentAuth } from '../middleware/agentAuth.js';   // <-- NEW
import {
  handleAgentLogin,
  handleGetEkycUser,
  handleCreateEkyc,
} from '../controllers/agentController.js';

export const agentRouter = express.Router();

agentRouter.post('/institution-agent/login', handleAgentLogin);
agentRouter.post('/get-ekyc-user',agentAuth, handleGetEkycUser);
agentRouter.post('/create-ekyc',   agentAuth, handleCreateEkyc);

