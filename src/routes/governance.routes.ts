import { Router } from 'express';
import { getGovernanceSuggestions, analyzeCompletionImpact, updateGovernanceTask, getContextualHelp } from '../controllers/governance.controller';

const router = Router();

// POST /api/governance-tasks/suggestions
router.post('/suggestions', getGovernanceSuggestions);

// POST /api/governance-tasks/completion-impact
router.post('/completion-impact', analyzeCompletionImpact);

// PATCH /api/governance-tasks/:taskId
router.patch('/:taskId', updateGovernanceTask);

// POST /api/governance-tasks/contextual-help
router.post('/contextual-help', getContextualHelp);

export default router;
