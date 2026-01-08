import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createSmartAssessment, getDiscovery, postDiscovery, getLinkSuggestions, getPrioritization, linkDiscoveredAsset, markAsShadowAI, resolveDiscoveredAsset, createSystemFromAsset } from '../controllers/discovery.controller';

const router = Router();

// GET /api/discovery
router.get('/', authenticateToken, getDiscovery);

// POST /api/discovery
router.post('/', authenticateToken, postDiscovery);

// POST /api/discovery/smart-assessment
router.post('/smart-assessment', authenticateToken, createSmartAssessment);

// POST /api/discovery/link-suggestions
router.post('/link-suggestions', authenticateToken, getLinkSuggestions);

// POST /api/discovery/prioritization
router.post('/prioritization', authenticateToken, getPrioritization);

// POST /api/discovery/:id/link
router.post('/:id/link', authenticateToken, linkDiscoveredAsset);

// POST /api/discovery/:id/mark-shadow
router.post('/:id/mark-shadow', authenticateToken, markAsShadowAI);

// POST /api/discovery/:id/resolve
router.post('/:id/resolve', authenticateToken, resolveDiscoveredAsset);

// POST /api/discovery/:id/create-system
router.post('/:id/create-system', authenticateToken, createSystemFromAsset);

export default router;
