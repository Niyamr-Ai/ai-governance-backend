"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const discovery_controller_1 = require("../controllers/discovery.controller");
const router = (0, express_1.Router)();
// GET /api/discovery
router.get('/', auth_1.authenticateToken, discovery_controller_1.getDiscovery);
// POST /api/discovery
router.post('/', auth_1.authenticateToken, discovery_controller_1.postDiscovery);
// POST /api/discovery/smart-assessment
router.post('/smart-assessment', auth_1.authenticateToken, discovery_controller_1.createSmartAssessment);
// POST /api/discovery/link-suggestions
router.post('/link-suggestions', auth_1.authenticateToken, discovery_controller_1.getLinkSuggestions);
// POST /api/discovery/prioritization
router.post('/prioritization', auth_1.authenticateToken, discovery_controller_1.getPrioritization);
// POST /api/discovery/:id/link
router.post('/:id/link', auth_1.authenticateToken, discovery_controller_1.linkDiscoveredAsset);
// POST /api/discovery/:id/mark-shadow
router.post('/:id/mark-shadow', auth_1.authenticateToken, discovery_controller_1.markAsShadowAI);
// POST /api/discovery/:id/resolve
router.post('/:id/resolve', auth_1.authenticateToken, discovery_controller_1.resolveDiscoveredAsset);
// POST /api/discovery/:id/create-system
router.post('/:id/create-system', auth_1.authenticateToken, discovery_controller_1.createSystemFromAsset);
exports.default = router;
//# sourceMappingURL=discovery.routes.js.map