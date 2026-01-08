/**
 * Chat API Controller
 *
 * POST /api/chat - Send a message to the AI Governance Copilot
 *
 * This endpoint:
 * 1. Accepts user message + page context
 * 2. Runs intent classification
 * 3. Routes to appropriate context provider
 * 4. Calls the appropriate prompt template
 * 5. Returns chatbot answer with detected mode
 */
import { Request, Response } from 'express';
/**
 * POST /api/chat
 */
export declare function chatHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=chat.controller.d.ts.map