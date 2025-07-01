import express from 'express';
import { agentAuth } from '../middleware/agentAuth.js';   // <-- NEW
import {
  handleAgentLogin,
  handleGetEkycUser,
  handleCreateEkyc,
  handleGetDocument,
  handleCreateDocument,
  handleCreateDocumentBase64
} from '../controllers/agentController.js';

import multer from 'multer';
const upload = multer()

export const agentRouter = express.Router();

agentRouter.post('/institution-agent/login', handleAgentLogin);
agentRouter.post('/get-ekyc-user',agentAuth, handleGetEkycUser);
agentRouter.post('/get-document', agentAuth,handleGetDocument); 
agentRouter.post('/create-ekyc',agentAuth,   handleCreateEkyc);

agentRouter.post(
  '/create-document',
  upload.any(),                // we only need form fields, no disk storage
  agentAuth,
  handleCreateDocument,
);


agentRouter.post('/create-document-base64',agentAuth, handleCreateDocumentBase64); 
