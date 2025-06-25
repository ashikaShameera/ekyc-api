import { verifyToken } from '../services/tokenService.js';
import { findByUsername } from '../models/institutionAgentModel.js';

/**
 * Re-usable middleware that
 *   • takes the JWT from req.body.token  **or**  the “Bearer <token>” header
 *   • verifies signature / expiry
 *   • looks up the agent in INSTITUTION_AGENT
 *   • confirms STATUS = 'ACT' and DB.TOKEN === incoming token
 *
 * On success attaches:
 *   req.agent      – full DB row
 *   req.jwtPayload – decoded JWT
 */
export async function agentAuth (req, res, next) {
    
  const jwt =
    req.body?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);
    
  if (!jwt) {
    return res.status(400).json({
      status : 'BAD_REQUEST',
      message: 'token is required',
      content: null,
    });
  }

  try {
    // 1 verify signature / expiry
    const payload  = verifyToken(jwt);           // throws on failure
    const { username } = payload;

    // 2 fetch agent row
    const agentRow = await findByUsername(username);
    if (!agentRow || agentRow[2] !== 'ACT' || agentRow[3] !== jwt) {
      return res.status(401).json({
        status : 'FAIL',
        message: 'Token invalid, expired or agent inactive',
        content: null,
      });
    }

    // 3 enrich request & continue
    req.agent       = agentRow;
    req.jwtPayload  = payload;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      status : 'FAIL',
      message: 'Invalid or expired token',
      content: null,
    });
  }
}
