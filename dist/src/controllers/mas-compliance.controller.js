"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMasCompliance = getMasCompliance;
exports.postMasCompliance = postMasCompliance;
exports.getMasComplianceById = getMasComplianceById;
const openai_1 = require("openai");
const supabase_1 = require("../lib/supabase");
const rag_service_1 = require("../../services/ai/rag-service");
function defaultPillar() {
    return {
        status: "Partially compliant",
        score: 0,
        gaps: [],
        recommendations: [],
    };
}
function sanitizeContent(content) {
    if (typeof content !== "string")
        return null;
    try {
        const jsonString = content
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim();
        return JSON.parse(jsonString);
    }
    catch {
        return null;
    }
}
function mergeWithDefaults(result, answers, userId) {
    const getPillar = (key) => {
        const pillar = result?.[key];
        if (!pillar || typeof pillar !== "object")
            return defaultPillar();
        return {
            status: pillar.status === "Compliant" ||
                pillar.status === "Partially compliant" ||
                pillar.status === "Non-compliant"
                ? pillar.status
                : "Partially compliant",
            score: typeof pillar.score === "number" ? pillar.score : 0,
            gaps: Array.isArray(pillar.gaps) ? pillar.gaps : [],
            recommendations: Array.isArray(pillar.recommendations) ? pillar.recommendations : [],
        };
    };
    const riskLevel = result?.overall_risk_level === "Low" ||
        result?.overall_risk_level === "Medium" ||
        result?.overall_risk_level === "High" ||
        result?.overall_risk_level === "Critical"
        ? result.overall_risk_level
        : "Medium";
    console.log("[MAS Compliance] Risk Level Validation:");
    console.log("  - Input value:", result?.overall_risk_level);
    console.log("  - Input type:", typeof result?.overall_risk_level);
    console.log("  - Final risk level:", riskLevel);
    const complianceStatus = result?.overall_compliance_status === "Compliant" ||
        result?.overall_compliance_status === "Partially compliant" ||
        result?.overall_compliance_status === "Non-compliant"
        ? result.overall_compliance_status
        : "Partially compliant";
    // Extract company info and sub-question answers for raw_answers
    const rawAnswersData = {};
    // Store all sub-question fields in raw_answers
    const subQuestionFields = [
        'personal_data_types', 'personal_data_logged_where', 'personal_data_use_cases', 'personal_data_evidence',
        'sensitive_data_types', 'sensitive_data_logged_where', 'sensitive_data_evidence',
        'third_party_services_list', 'third_party_services_safety', 'third_party_services_evidence',
        'governance_policy_type', 'governance_framework', 'governance_board_role', 'governance_senior_management',
        'governance_policy_assigned', 'governance_evidence',
        'inventory_location', 'inventory_risk_classification', 'inventory_evidence',
        'data_quality_methods', 'data_bias_analysis', 'data_quality_evidence',
        'transparency_doc_types', 'transparency_user_explanations', 'transparency_evidence',
        'fairness_testing_methods', 'fairness_test_results', 'fairness_evidence',
        'human_oversight_type', 'human_oversight_processes', 'human_oversight_evidence',
        'third_party_due_diligence', 'third_party_contracts', 'third_party_controls_evidence',
        'algo_selection_process', 'algo_feature_engineering', 'algo_documentation_evidence',
        'evaluation_test_types', 'evaluation_robustness_checks', 'evaluation_evidence',
        'security_cybersecurity_measures', 'security_prompt_injection', 'security_data_leakage', 'security_evidence',
        'monitoring_drift_detection', 'monitoring_incident_management', 'monitoring_version_control', 'monitoring_evidence',
        'capability_team_skills', 'capability_training_programs', 'capability_infrastructure', 'capability_evidence',
    ];
    subQuestionFields.forEach(field => {
        if (answers[field] !== undefined && answers[field] !== null && answers[field] !== '') {
            rawAnswersData[field] = answers[field];
        }
    });
    // Store evidence content if present
    Object.keys(answers).forEach(key => {
        if (key.endsWith('_content') && answers[key]) {
            rawAnswersData[key] = answers[key];
        }
    });
    return {
        user_id: userId,
        org_id: userId, // Set org_id to user_id (1:1 mapping for tenant isolation)
        system_id: answers.system_id || null, // Link to ai_systems table for multi-jurisdiction support
        system_name: result?.system_name || answers.system_name || "Untitled system",
        description: result?.description || answers.description || "",
        owner: result?.owner || answers.owner || "",
        jurisdiction: result?.jurisdiction || answers.jurisdiction || "",
        sector: result?.sector || answers.sector || "",
        system_status: result?.system_status || answers.system_status || "envision",
        business_use_case: result?.business_use_case || answers.business_use_case || "",
        data_types: result?.data_types || answers.data_types || "",
        uses_personal_data: Boolean(result?.uses_personal_data ?? answers.uses_personal_data),
        uses_special_category_data: Boolean(result?.uses_special_category_data ?? answers.uses_special_category_data),
        uses_third_party_ai: Boolean(result?.uses_third_party_ai ?? answers.uses_third_party_ai),
        // Company fields
        ...(answers.company_name !== undefined && { company_name: answers.company_name || null }),
        ...(answers.company_use_case !== undefined && { company_use_case: answers.company_use_case || null }),
        raw_answers: Object.keys(rawAnswersData).length > 0 ? rawAnswersData : null,
        governance: getPillar("governance"),
        inventory: getPillar("inventory"),
        dataManagement: getPillar("dataManagement"),
        transparency: getPillar("transparency"),
        fairness: getPillar("fairness"),
        humanOversight: getPillar("humanOversight"),
        thirdParty: getPillar("thirdParty"),
        algoSelection: getPillar("algoSelection"),
        evaluationTesting: getPillar("evaluationTesting"),
        techCybersecurity: getPillar("techCybersecurity"),
        monitoringChange: getPillar("monitoringChange"),
        capabilityCapacity: getPillar("capabilityCapacity"),
        overall_risk_level: riskLevel,
        overall_compliance_status: complianceStatus,
        summary: typeof result?.summary === "string" ? result.summary : "",
    };
}
/**
 * GET /api/mas-compliance
 */
async function getMasCompliance(req, res) {
    try {
        console.log("[MAS API] GET /api/mas-compliance - Fetching assessments");
        const userId = req.user?.sub;
        if (!userId) {
            console.log("[MAS API] ❌ Unauthorized - No user ID");
            return res.status(401).json({ message: "Unauthorized" });
        }
        const supabase = supabase_1.supabaseAdmin;
        const { data, error } = await supabase
            .from("mas_ai_risk_assessments")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) {
            console.error("[MAS API] Database error:", error);
            return res.status(500).json({ message: "Database error" });
        }
        console.log(`[MAS API] ✅ Retrieved ${data?.length || 0} assessments`);
        return res.json(data || []);
    }
    catch (err) {
        console.error("[MAS API] GET /mas-compliance error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
/**
 * POST /api/mas-compliance
 */
async function postMasCompliance(req, res) {
    try {
        console.log("[MAS API] ===== POST /api/mas-compliance =====");
        const userId = req.user.sub;
        if (!userId) {
            console.log("[MAS API] ❌ Unauthorized - No user ID");
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Accept full form payload (not just systemDescription/systemName)
        const answers = req.body;
        const { system_id } = answers; // Extract system_id for multi-jurisdiction support
        console.log("[MAS API] Received payload keys:", Object.keys(answers));
        console.log("[MAS API] System ID:", system_id);
        const supabase = supabase_1.supabaseAdmin;
        const openai = new openai_1.OpenAI({ apiKey: process.env.OPEN_AI_KEY });
        // Extract evidence content from answers
        const evidenceContent = {};
        const answersWithoutEvidence = {};
        Object.keys(answers).forEach(key => {
            if (key.endsWith('_content')) {
                const evidenceKey = key.replace('_content', '');
                evidenceContent[evidenceKey] = answers[key];
            }
            else {
                answersWithoutEvidence[key] = answers[key];
            }
        });
        console.log(`[MAS API] Extracted ${Object.keys(evidenceContent).length} evidence fields`);
        console.log(`[MAS API] Answers without evidence: ${Object.keys(answersWithoutEvidence).length} fields`);
        // Build user input for RAG query
        const keyFields = [
            answers.system_name,
            answers.description,
            answers.business_use_case,
            answers.company_name,
            answers.company_use_case,
            answers.uses_personal_data ? 'uses personal data' : '',
            answers.uses_special_category_data ? 'uses sensitive data' : '',
            answers.uses_third_party_ai ? 'uses third party AI' : '',
            answers.governance_policy ? 'has governance policy' : '',
            answers.system_status,
            answers.sector,
        ].filter(Boolean).join(' ');
        const otherAnswers = Object.entries(answersWithoutEvidence)
            .filter(([key]) => !['system_name', 'description', 'business_use_case', 'company_name', 'company_use_case', 'system_status', 'sector'].includes(key))
            .filter(([_, value]) => value && typeof value === 'string' && value.length > 0)
            .slice(0, 20)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' ');
        const userInput = `${keyFields} ${otherAnswers}`.trim();
        const MAX_INPUT_LENGTH = 20000;
        const truncatedInput = userInput.length > MAX_INPUT_LENGTH
            ? userInput.substring(0, MAX_INPUT_LENGTH) + '...'
            : userInput;
        console.log(`[MAS API] RAG query input length: ${truncatedInput.length} characters`);
        // Get MAS regulatory context
        let contextChunks = "";
        try {
            contextChunks = await (0, rag_service_1.getRegulationContextString)(truncatedInput, 'MAS', 5);
        }
        catch (error) {
            console.error("[MAS API] Error retrieving RAG context:", error);
            if (error.message?.includes("context length") || error.message?.includes("tokens")) {
                console.log("[MAS API] Retrying with shorter query");
                const shortQuery = keyFields.substring(0, 10000);
                try {
                    contextChunks = await (0, rag_service_1.getRegulationContextString)(shortQuery, 'MAS', 5);
                }
                catch (retryError) {
                    console.error("[MAS API] RAG retry also failed, proceeding without context");
                    contextChunks = "Unable to retrieve regulation context. Proceeding with assessment based on provided answers.";
                }
            }
            else {
                console.error("[MAS API] RAG error (non-token related), proceeding without context");
                contextChunks = "Unable to retrieve regulation context. Proceeding with assessment based on provided answers.";
            }
        }
        // Build evidence section for prompt
        let evidenceSection = "";
        if (Object.keys(evidenceContent).length > 0) {
            evidenceSection = "\n\n## EVIDENCE DOCUMENTS PROVIDED:\n\n";
            Object.keys(evidenceContent).forEach(key => {
                const evidenceName = key.replace(/_evidence$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                evidenceSection += `### ${evidenceName} Evidence:\n${evidenceContent[key]}\n\n`;
            });
        }
        const prompt = `
You are an expert in the MAS / UK-style AI Risk Management Guidelines (Singapore MAS AI guidelines).
Assess the provided AI system against the following 12 pillars and return ONLY a JSON object.

Pillars:
1) Governance & Oversight
2) AI System Identification, Inventory & Risk Classification
3) Data Management (quality, representativeness, bias, privacy, security, lineage)
4) Transparency & Explainability
5) Fairness (bias and discrimination)
6) Human Oversight (HITL / HOTL)
7) Third-Party / Vendor Management (external models, SaaS, APIs)
8) Algorithm & Feature Selection
9) Evaluation & Testing (pre-deployment testing, robustness checks)
10) Technology & Cybersecurity (security, prompt injection, data leakage)
11) Monitoring & Change Management (drift, incidents, kill switches, versioning)
12) Capability & Capacity (skills, training, infra)

Context (from EU AI Act corpus may be present; use only if relevant):
${contextChunks}
${evidenceSection}
User answers:
${JSON.stringify(answersWithoutEvidence)}

## CRITICAL: Risk Level Classification Rules

You MUST classify overall_risk_level using a RISK-FIRST approach, prioritizing sector impact and systemic risk over pillar compliance scores.

**overall_risk_level** must be one of: "Low" | "Medium" | "High" | "Critical"

### Classification Criteria (in priority order):

1. **CRITICAL Risk** - Assign if ANY of the following apply:
   - Finance sector systems with systemic market impact (e.g., high-frequency trading, algorithmic trading, market-making systems that execute thousands of trades/second)
   - Systems that could cause widespread financial market disruption or instability
   - Systems processing critical infrastructure data (power grids, water systems, transportation networks)
   - Systems with potential for catastrophic failure affecting public safety at scale

2. **HIGH Risk** - Assign if ANY of the following apply:
   - Finance sector systems making critical financial decisions (credit scoring, loan approval, insurance underwriting, fraud detection for financial transactions)
   - Healthcare sector systems making diagnostic or treatment recommendations (medical image analysis, clinical decision support, drug dosage recommendations)
   - Systems processing special category data (health records, financial records, biometrics) AND making critical decisions affecting individuals
   - Insurance sector systems determining policy eligibility, coverage, or pricing using health or financial data
   - Systems in regulated sectors (Finance, Healthcare, Insurance) that process personal data and make decisions affecting individuals' rights or access to services

3. **MEDIUM Risk** - Assign if:
   - Systems processing personal data but NOT making critical financial/health decisions
   - Systems in regulated sectors (Finance, Healthcare) but with low-impact use cases (e.g., customer service chatbots, content recommendation)
   - Systems with transparency requirements but limited individual impact
   - Content moderation systems for online platforms
   - E-commerce recommendation systems processing personal browsing/purchase data

4. **LOW Risk** - Assign if:
   - Systems with minimal individual or societal impact
   - Non-personal data processing systems
   - Low-impact content recommendation (news articles, general content)
   - Email spam filters
   - Systems that do NOT process personal data AND do NOT make critical decisions

### Important Notes:
- **DO NOT** classify based solely on pillar compliance count (e.g., "9/12 compliant = Medium")
- **PRIORITIZE** sector impact and decision criticality over compliance scores
- Finance sector + market disruption potential = CRITICAL (regardless of compliance)
- Finance/Healthcare sector + critical decisions + special category data = HIGH (regardless of compliance)
- Pillar compliance affects overall_compliance_status, NOT overall_risk_level
- Risk level reflects POTENTIAL IMPACT, not current compliance status

Instructions:
- For EACH of the 12 pillars, output a JSON object with these EXACT keys:
  - governance: { status, score (0-100), gaps (array), recommendations (array) }
  - inventory: { status, score (0-100), gaps (array), recommendations (array) }
  - dataManagement: { status, score (0-100), gaps (array), recommendations (array) }
  - transparency: { status, score (0-100), gaps (array), recommendations (array) }
  - fairness: { status, score (0-100), gaps (array), recommendations (array) }
  - humanOversight: { status, score (0-100), gaps (array), recommendations (array) }
  - thirdParty: { status, score (0-100), gaps (array), recommendations (array) }
  - algoSelection: { status, score (0-100), gaps (array), recommendations (array) }
  - evaluationTesting: { status, score (0-100), gaps (array), recommendations (array) }
  - techCybersecurity: { status, score (0-100), gaps (array), recommendations (array) }
  - monitoringChange: { status, score (0-100), gaps (array), recommendations (array) }
  - capabilityCapacity: { status, score (0-100), gaps (array), recommendations (array) }
  
  For each pillar:
  - status: "Compliant" | "Partially compliant" | "Non-compliant"
  - score: number 0-100 (REQUIRED - must be a number, not null or undefined)
  - gaps: array of short bullet strings
  - recommendations: array of short action items

- Also output:
  - system_name, description, owner, jurisdiction, sector, system_status, business_use_case, data_types
  - uses_personal_data, uses_special_category_data, uses_third_party_ai (booleans)
  - overall_risk_level: "Low" | "Medium" | "High" | "Critical" (MUST follow classification rules above)
  - overall_compliance_status: "Compliant" | "Partially compliant" | "Non-compliant" (based on pillar compliance)
  - summary: 100-200 words

- Return ONLY a JSON object with these exact keys, no markdown fences.
- CRITICAL: Every pillar MUST have a numeric score (0-100). Do not omit scores or return null/undefined.
`.trim();
        // Log key input factors for classification
        console.log("\n========== [MAS Compliance] Risk Classification Debug ==========");
        console.log("[MAS] System Name:", answers.system_name || "N/A");
        console.log("[MAS] Sector:", answers.sector || "N/A");
        console.log("[MAS] Business Use Case:", answers.business_use_case || "N/A");
        console.log("[MAS] Uses Personal Data:", answers.uses_personal_data || false);
        console.log("[MAS] Uses Special Category Data:", answers.uses_special_category_data || false);
        console.log("[MAS] Uses Third-Party AI:", answers.uses_third_party_ai || false);
        console.log("===============================================================\n");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
        });
        const content = completion.choices?.[0]?.message?.content ?? null;
        console.log("\n========== [MAS Compliance] LLM Response ==========");
        console.log("[MAS] Raw LLM Response:", content);
        console.log("==================================================\n");
        const parsed = sanitizeContent(content);
        console.log("\n========== [MAS Compliance] Parsed Result ==========");
        console.log("[MAS] Parsed Result (Full):", JSON.stringify(parsed, null, 2));
        console.log("[MAS] Parsed overall_risk_level:", parsed?.overall_risk_level);
        console.log("[MAS] Parsed overall_compliance_status:", parsed?.overall_compliance_status);
        console.log("====================================================\n");
        const payload = mergeWithDefaults(parsed, answers, userId);
        console.log("\n========== [MAS Compliance] Final Classification ==========");
        console.log("[MAS] Final overall_risk_level:", payload.overall_risk_level);
        console.log("[MAS] Final overall_compliance_status:", payload.overall_compliance_status);
        console.log("===========================================================\n");
        console.log("[MAS API] Attempting to insert assessment with payload keys:", Object.keys(payload));
        console.log("[MAS API] Company fields:", {
            company_name: payload.company_name,
            company_use_case: payload.company_use_case
        });
        const { data, error } = await supabase
            .from("mas_ai_risk_assessments")
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error("[MAS API] Supabase insert error:", error);
            // Check if error is about missing columns
            const missingColumns = [];
            if (error.message?.includes("company_name"))
                missingColumns.push("company_name");
            if (error.message?.includes("company_use_case"))
                missingColumns.push("company_use_case");
            if (error.message?.includes("raw_answers"))
                missingColumns.push("raw_answers");
            if (missingColumns.length > 0) {
                console.log(`[MAS API] Retrying insert without columns: ${missingColumns.join(", ")}`);
                const payloadWithoutMissingColumns = { ...payload };
                missingColumns.forEach(col => {
                    delete payloadWithoutMissingColumns[col];
                });
                const { data: retryData, error: retryError } = await supabase
                    .from("mas_ai_risk_assessments")
                    .insert([payloadWithoutMissingColumns])
                    .select()
                    .single();
                if (retryError) {
                    console.error("[MAS API] Supabase retry insert error:", retryError);
                    return res.status(500).json({
                        message: "Failed to store result. Migration required.",
                        error: retryError.message,
                        missingColumns: missingColumns
                    });
                }
                console.log("[MAS API] Successfully inserted without missing columns.");
                return res.status(201).json({
                    id: retryData.id,
                    warning: `Assessment saved but some fields were skipped (${missingColumns.join(", ")}). Please run migration.`
                });
            }
            return res.status(500).json({ message: "Failed to store result", error: error.message });
        }
        console.log("[MAS API] ✅ Successfully inserted assessment with ID:", data.id);
        // Auto-generate documentation (non-blocking)
        void (async () => {
            try {
                const { autoGenerateDocumentationIfNeeded } = await Promise.resolve().then(() => __importStar(require("../../services/documentation/documentation-auto-generate")));
                console.log(`[Auto-Doc] Starting auto-generation for MAS system ${data.id}`);
                await autoGenerateDocumentationIfNeeded(data.id, ["MAS"], userId);
                console.log(`[Auto-Doc] Completed auto-generation for system ${data.id}`);
            }
            catch (err) {
                console.error(`[Auto-Doc] Failed to auto-generate docs for system ${data.id}:`, err.message || err);
            }
        })();
        return res.status(201).json({ id: data.id });
    }
    catch (err) {
        console.error("[MAS API] POST /mas-compliance error:", err);
        console.error("[MAS API] Error stack:", err.stack);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
/**
 * GET /api/mas-compliance/:id
 * Fetch a single MAS compliance assessment by ID
 */
async function getMasComplianceById(req, res) {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const supabase = supabase_1.supabaseAdmin;
        const { data, error } = await supabase
            .from("mas_ai_risk_assessments")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();
        if (error) {
            console.error("[MAS API] Supabase fetch error:", error);
            return res.status(500).json({ error: "Failed to fetch assessment" });
        }
        if (!data) {
            return res.status(404).json({ error: "Not found" });
        }
        return res.status(200).json(data);
    }
    catch (err) {
        console.error("[MAS API] GET /api/mas-compliance/[id] error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
//# sourceMappingURL=mas-compliance.controller.js.map