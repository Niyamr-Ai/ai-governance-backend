import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getGovernanceSuggestions, analyzeCompletionImpact, updateGovernanceTask, getContextualHelp } from '../controllers/governance.controller';

const router = Router();

// POST /api/governance-tasks/suggestions
router.post('/suggestions', authenticateToken, getGovernanceSuggestions);

// POST /api/governance-tasks/completion-impact
router.post('/completion-impact', authenticateToken, analyzeCompletionImpact);

// PATCH /api/governance-tasks/:taskId
router.patch('/:taskId', authenticateToken, updateGovernanceTask);

// POST /api/governance-tasks/contextual-help
router.post('/contextual-help', authenticateToken, getContextualHelp);

export default router;
