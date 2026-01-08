import { Router } from 'express';
import { analyzePolicyComplianceHandler, analyzePolicyConflicts, analyzePolicyGaps } from '../controllers/policy-compliance.controller';

const router = Router();

// POST /api/policy-compliance/analyze
router.post('/analyze', analyzePolicyComplianceHandler);

// POST /api/policy-compliance/conflicts
router.post('/conflicts', analyzePolicyConflicts);

// POST /api/policy-compliance/gaps
router.post('/gaps', analyzePolicyGaps);

export default router;
