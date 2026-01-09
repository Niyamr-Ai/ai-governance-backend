"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_1 = require("../middleware/index");
const error_1 = require("./utils/error");
// Import routes
const ai_systems_routes_1 = __importDefault(require("./routes/ai-systems.routes"));
const automated_risk_assessment_routes_1 = __importDefault(require("./routes/automated-risk-assessment.routes"));
const lifecycle_routes_1 = __importDefault(require("./routes/lifecycle.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const compliance_routes_1 = __importDefault(require("./routes/compliance.routes"));
const cron_routes_1 = __importDefault(require("./routes/cron.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const discovery_routes_1 = __importDefault(require("./routes/discovery.routes"));
const documentation_routes_1 = __importDefault(require("./routes/documentation.routes"));
const governance_routes_1 = __importDefault(require("./routes/governance.routes"));
const mas_compliance_routes_1 = __importDefault(require("./routes/mas-compliance.routes"));
const policies_routes_1 = __importDefault(require("./routes/policies.routes"));
const policy_compliance_routes_1 = __importDefault(require("./routes/policy-compliance.routes"));
const red_teaming_routes_1 = __importDefault(require("./routes/red-teaming.routes"));
const regulatory_changes_routes_1 = __importDefault(require("./routes/regulatory-changes.routes"));
const risk_assessment_routes_1 = __importDefault(require("./routes/risk-assessment.routes"));
const risk_assessments_routes_1 = __importDefault(require("./routes/risk-assessments.routes"));
const uk_compliance_routes_1 = __importDefault(require("./routes/uk-compliance.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const app = (0, express_1.default)();
console.log("🔥🔥🔥 BACKEND APP STARTING 🔥🔥🔥");
app.use(index_1.logger);
// Add request logging middleware
app.use((req, res, next) => {
    console.log(`📨 [BACKEND] ${req.method} ${req.url} - Request received`);
    next();
});
// Middleware
app.use((0, cors_1.default)({
    origin: true, // Allow all origins in development
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api/ai-systems', ai_systems_routes_1.default);
app.use('/api/ai-systems', automated_risk_assessment_routes_1.default);
app.use('/api/ai-systems', lifecycle_routes_1.default);
app.use('/api', chat_routes_1.default);
app.use('/api/compliance', compliance_routes_1.default);
app.use('/api', cron_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/discovery', discovery_routes_1.default);
app.use('/api/documentation', documentation_routes_1.default);
app.use('/api/governance-tasks', governance_routes_1.default);
app.use('/api/mas-compliance', mas_compliance_routes_1.default);
app.use('/api/policies', policies_routes_1.default);
app.use('/api', policy_compliance_routes_1.default);
app.use('/api/red-teaming', red_teaming_routes_1.default);
app.use('/api', regulatory_changes_routes_1.default);
app.use('/api/risk-assessment', risk_assessment_routes_1.default);
app.use('/api/risk-assessments', risk_assessments_routes_1.default);
app.use('/api/uk-compliance', uk_compliance_routes_1.default);
app.use('/api/user', user_routes_1.default);
// console.log("🔍 [BACKEND] User routes registered at /api/user");
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error handling middleware (must be last)
app.use(error_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map