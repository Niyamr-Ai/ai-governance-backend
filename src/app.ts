import express from 'express';
import cors from 'cors';
import { logger } from "../middleware/index";
import { errorHandler } from './utils/error';

// Import routes
import aiSystemsRoutes from './routes/ai-systems.routes';
import automatedRiskAssessmentRoutes from './routes/automated-risk-assessment.routes';
import lifecycleRoutes from './routes/lifecycle.routes';
import chatRoutes from './routes/chat.routes';
import complianceRoutes from './routes/compliance.routes';
import cronRoutes from './routes/cron.routes';
import dashboardRoutes from './routes/dashboard.routes';
import discoveryRoutes from './routes/discovery.routes';
import documentationRoutes from './routes/documentation.routes';
import governanceTasksRoutes from './routes/governance.routes';
import masComplianceRoutes from './routes/mas-compliance.routes';
import policiesRoutes from './routes/policies.routes';
import policyComplianceRoutes from './routes/policy-compliance.routes';
import redTeamingRoutes from './routes/red-teaming.routes';
import regulatoryChangesRoutes from './routes/regulatory-changes.routes';
import riskAssessmentRoutes from './routes/risk-assessment.routes';
import riskAssessmentsRoutes from './routes/risk-assessments.routes';
import ukComplianceRoutes from './routes/uk-compliance.routes';
import userRoutes from './routes/user.routes';

const app = express();

console.log("🔥🔥🔥 BACKEND APP STARTING 🔥🔥🔥");

app.use(logger);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 [BACKEND] ${req.method} ${req.url} - Request received`);
  next();
}); 

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/ai-systems', aiSystemsRoutes);
app.use('/api/ai-systems', automatedRiskAssessmentRoutes);
app.use('/api/ai-systems', lifecycleRoutes);
app.use('/api', chatRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api', cronRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/documentation', documentationRoutes);
app.use('/api/governance-tasks', governanceTasksRoutes);
app.use('/api/mas-compliance', masComplianceRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api', policyComplianceRoutes);
app.use('/api/red-teaming', redTeamingRoutes);
app.use('/api', regulatoryChangesRoutes);
app.use('/api/risk-assessment', riskAssessmentRoutes);
app.use('/api/risk-assessments', riskAssessmentsRoutes);
app.use('/api/uk-compliance', ukComplianceRoutes);
app.use('/api/user', userRoutes);
// console.log("🔍 [BACKEND] User routes registered at /api/user");

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
