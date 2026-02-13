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
exports.getUkCompliance = getUkCompliance;
exports.postUkCompliance = postUkCompliance;
exports.getUkComplianceById = getUkComplianceById;
const openai_1 = require("openai");
const supabase_js_1 = require("@supabase/supabase-js");
const rag_service_1 = require("../../services/ai/rag-service");
function getEnvVars() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
    if (!SUPABASE_URL) {
        throw new Error("SUPABASE_URL is missing");
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
    }
    if (!OPEN_AI_KEY) {
        throw new Error("OPEN_AI_KEY is missing");
    }
    return {
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        OPEN_AI_KEY,
    };
}
function getSupabaseClient() {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getEnvVars();
    return (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
function getOpenAIClient() {
    const { OPEN_AI_KEY } = getEnvVars();
    return new openai_1.OpenAI({ apiKey: OPEN_AI_KEY });
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
/**
 * GET /api/uk-compliance
 * Fetch all UK compliance assessments for the authenticated user
 */
async function getUkCompliance(req, res) {
    try {
        const userId = req.user.sub;
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from("uk_ai_assessments")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) {
            console.error("Supabase fetch error (uk_ai_assessments):", error);
            return res.status(500).json({ error: "Failed to fetch assessments" });
        }
        return res.status(200).json(data || []);
    }
    catch (err) {
        console.error("GET /api/uk-compliance error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
/**
 * POST /api/uk-compliance
 * Create a new UK compliance assessment
 */
async function postUkCompliance(req, res) {
    try {
        console.log("[UK API] ===== POST /api/uk-compliance =====");
        const body = req.body;
        const { answers, contextChunks: providedContext, system_id, system_name, company_name, company_use_case } = body;
        if (!answers) {
            console.log("[UK API] ❌ Answers are required");
            return res.status(400).json({ error: "Answers are required" });
        }
        const userId = req.user.sub;
        if (!userId) {
            console.log("[UK API] ❌ Unauthorized - No user ID");
            return res.status(401).json({ error: "Unauthorized" });
        }
        const supabase = getSupabaseClient();
        const openai = getOpenAIClient();
        console.log("[UK API] Received payload keys:", Object.keys(body));
        console.log("[UK API] System name:", system_name);
        console.log("[UK API] Company name:", company_name);
        console.log("[UK API] Company use case:", company_use_case);
        // Extract from answers if not provided at top level (for backward compatibility)
        const finalSystemName = system_name || answers?.system_name || null;
        const finalCompanyName = company_name || answers?.owner || answers?.company_name || null;
        const finalCompanyUseCase = company_use_case || answers?.business_use_case || null;
        console.log("[UK API] Final values - System name:", finalSystemName);
        console.log("[UK API] Final values - Company name:", finalCompanyName);
        console.log("[UK API] Final values - Company use case:", finalCompanyUseCase);
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
        console.log(`[UK API] Extracted ${Object.keys(evidenceContent).length} evidence fields`);
        console.log(`[UK API] Answers without evidence: ${Object.keys(answersWithoutEvidence).length} fields`);
        // Get context from RAG service if not provided
        let contextChunks = providedContext;
        if (!contextChunks) {
            // Build user input including evidence content for better context
            const evidenceText = Object.values(evidenceContent).join(' ');
            const answersText = Object.values(answersWithoutEvidence || {}).join(" ");
            const userInput = `${answersText} ${evidenceText}`.trim();
            console.log(`[UK API] RAG query input length: ${userInput.length} characters`);
            // Use RAG service to get UK regulation context
            contextChunks = await (0, rag_service_1.getRegulationContextString)(userInput, 'UK', 5);
        }
        // Use the UK compliance assessment prompt
        const prompt = `
You are an expert compliance assessor for the United Kingdom AI Regulatory Framework, following:

- The UK AI Regulation White Paper (2023)
- Government Consultation Response (2024)
- King's Speech commitments (2024–2025)
- UK AI Safety Institute requirements
- Sector-specific regulator expectations (ICO, FCA, Ofcom, CMA, MHRA)

You will receive:
1. Context about UK AI regulatory principles.
2. Answers from the company about their AI system.

Your task:
Evaluate the system's alignment with UK AI regulatory expectations using the five core UK AI principles:

1. Safety, Security, Robustness
2. Appropriate Transparency & Explainability
3. Fairness
4. Accountability & Governance
5. Contestability & Redress

In addition, evaluate:
- Whether the system triggers sector-specific regulatory concerns
- Whether it qualifies as a "high-impact" or "frontier-risk" model under UK 2025 policy updates
- Whether mandatory model evaluations or safety tests should apply
- Whether additional oversight or documentation is required

Return ONLY a JSON object matching the schema below.

---

Context:
${contextChunks}

Company Information:
${company_name ? `- Company Name: ${company_name}` : ''}
${company_use_case ? `- Company Use Case: ${company_use_case}` : ''}
${system_name ? `- System Name: ${system_name}` : ''}

Answers:
${JSON.stringify(answersWithoutEvidence)}

Evidence Documents (OCR extracted text):
${Object.keys(evidenceContent).length > 0 ? Object.entries(evidenceContent).map(([key, content]) => `\n${key}:\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`).join('\n\n') : 'No evidence documents provided.'}

---

### Classification Rules

riskLevel must be one of:
- "Frontier / High-Impact Model" → If system develops or deploys powerful foundation models or poses critical systemic risks.
- "High-Risk (Sector)" → If system operates in heavily regulated sectors (finance, healthcare, employment, online platforms, biometrics, safety-critical applications).
- "Medium-Risk" → If system impacts users but does not fall into a regulated domain.
- "Low-Risk" → Minimal individual or societal impact.

No category is "prohibited" under UK law, but non-compliant systems may be flagged as "Critical Concern".

### CRITICAL: Risk Level Classification Priority

You MUST classify riskLevel using a RISK-FIRST approach, prioritizing decision criticality and sector impact over compliance scores.

**Classification Priority (in order):**

1. **"Frontier / High-Impact Model"** - Assign if:
   - System is explicitly a foundation model (large language model, generative AI with 100B+ parameters)
   - System poses critical systemic risks to national security or public safety
   - System has broad, unpredictable impact across multiple sectors

2. **"High-Risk (Sector)"** - Assign if:
   - System operates in Finance sector AND makes critical financial decisions (credit scoring, loan approval, algorithmic trading, fraud detection for transactions, biometric identity verification for financial services)
   - System operates in Healthcare sector AND makes diagnostic or treatment recommendations (clinical decision support, medical diagnosis, drug dosage recommendations)
   - System operates in Employment sector AND makes hiring/firing/promotion decisions
   - System uses biometric identification for access control or identity verification in regulated sectors
   - System is safety-critical (medical devices, autonomous vehicles, industrial control systems)

3. **"Medium-Risk"** - Assign if:
   - System processes personal data and impacts users BUT does NOT make critical financial/health/employment decisions
   - E-commerce product recommendation systems (even if processing personal browsing/purchase data)
   - Content moderation systems for online platforms (even if in Telecommunications sector - these require transparency but are not High-Risk)
   - Customer service chatbots in regulated sectors (transparency requirement, but low decision impact)
   - Systems with transparency requirements (AI interaction disclosure) but limited individual impact

4. **"Low-Risk"** - Assign if:
   - Minimal individual or societal impact
   - Email spam filters
   - Low-impact content recommendation (news articles, general content)
   - Systems that do NOT process personal data AND do NOT make critical decisions

### Important Notes:
- **DO NOT** automatically assign "High-Risk (Sector)" just because a system is in a regulated sector
- **PRIORITIZE** decision criticality: Systems making critical financial/health/employment decisions = High-Risk, even if compliance is strong
- Content moderation systems are typically Medium-Risk (transparency requirement) NOT High-Risk, even in Telecommunications sector
- E-commerce recommendation systems are Medium-Risk (personal data + user impact) NOT Low-Risk, even without explicit sector regulation
- Sector selection alone does NOT determine risk level - consider the actual use case and decision impact

---

### Output Rules

"safetyAndSecurity":
- Evaluate robustness, testing, red-teaming, misuse prevention, cybersecurity.
- Identify missing safety controls.

"transparency":
- Evaluate disclosure, explainability, user notification, documentation.

"fairness":
- Evaluate bias testing, discriminatory risk mitigation, data quality.

"governance":
- Evaluate accountability, human oversight, risk management processes.

"contestability":
- Evaluate user rights, appeal mechanisms, ability to challenge outcomes.

"sectorRegulation":
- Flag obligations based on industry (FCA, ICO, Ofcom, MHRA, CMA, etc.)

"overallAssessment":
- "Compliant", "Partially compliant", or "Non-compliant"
- Must reflect gaps in principles or sector regulations.

"summary":
- 150-word max plain-language summary of findings.

---

### Output JSON Schema

{
  "riskLevel": "string",
  "overallAssessment": "string",
  "safetyAndSecurity": {
    "meetsPrinciple": true,
    "missing": ["string"]
  },
  "transparency": {
    "meetsPrinciple": true,
    "missing": ["string"]
  },
  "fairness": {
    "meetsPrinciple": true,
    "missing": ["string"]
  },
  "governance": {
    "meetsPrinciple": true,
    "missing": ["string"]
  },
  "contestability": {
    "meetsPrinciple": true,
    "missing": ["string"]
  },
  "sectorRegulation": {
    "sector": "string",
    "requiredControls": ["string"],
    "gaps": ["string"]
  },
  "summary": "string"
}

Only return valid JSON. No explanation outside the JSON.
`.trim();
        // Log key input factors for classification
        console.log("\n========== [UK Compliance] Risk Classification Debug ==========");
        console.log("[UK] System Description:", answers.q1 || "N/A");
        console.log("[UK] Sector:", answers.uk2 || "N/A");
        console.log("[UK] Is Foundation Model:", answers.uk8 || "N/A");
        console.log("[UK] Safety & Security Implemented:", answers.uk3 || []);
        console.log("[UK] Transparency Implemented:", answers.uk4 || []);
        console.log("[UK] Fairness Implemented:", answers.uk5 || []);
        console.log("[UK] Governance Implemented:", answers.uk6 || []);
        console.log("[UK] Contestability Implemented:", answers.uk7 || []);
        console.log("================================================================\n");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
        });
        const content = completion.choices?.[0]?.message?.content ?? null;
        // Log raw LLM response for debugging
        console.log("\n========== [UK Compliance] LLM Response ==========");
        console.log("[UK] Raw LLM Response:", content);
        console.log("================================================\n");
        const parsed = sanitizeContent(content);
        if (!parsed) {
            console.error("[UK] Failed to parse AI response:", content);
            return res.status(500).json({ message: "Failed to parse assessment result" });
        }
        // Log parsed result and risk level
        console.log("\n========== [UK Compliance] Parsed Result ==========");
        console.log("[UK] Parsed Result (Full):", JSON.stringify(parsed, null, 2));
        console.log("[UK] Parsed riskLevel:", parsed?.riskLevel);
        console.log("[UK] Parsed riskLevel type:", typeof parsed?.riskLevel);
        console.log("[UK] Parsed overallAssessment:", parsed?.overallAssessment);
        console.log("[UK] Parsed sectorRegulation.sector:", parsed?.sectorRegulation?.sector);
        console.log("==================================================\n");
        // Validate and structure the response according to schema
        const assessment = {
            riskLevel: parsed.riskLevel || "Medium-Risk",
            overallAssessment: parsed.overallAssessment || "Partially compliant",
            safetyAndSecurity: {
                meetsPrinciple: parsed.safetyAndSecurity?.meetsPrinciple ?? false,
                missing: Array.isArray(parsed.safetyAndSecurity?.missing)
                    ? parsed.safetyAndSecurity.missing
                    : [],
            },
            transparency: {
                meetsPrinciple: parsed.transparency?.meetsPrinciple ?? false,
                missing: Array.isArray(parsed.transparency?.missing)
                    ? parsed.transparency.missing
                    : [],
            },
            fairness: {
                meetsPrinciple: parsed.fairness?.meetsPrinciple ?? false,
                missing: Array.isArray(parsed.fairness?.missing)
                    ? parsed.fairness.missing
                    : [],
            },
            governance: {
                meetsPrinciple: parsed.governance?.meetsPrinciple ?? false,
                missing: Array.isArray(parsed.governance?.missing)
                    ? parsed.governance.missing
                    : [],
            },
            contestability: {
                meetsPrinciple: parsed.contestability?.meetsPrinciple ?? false,
                missing: Array.isArray(parsed.contestability?.missing)
                    ? parsed.contestability.missing
                    : [],
            },
            sectorRegulation: {
                sector: parsed.sectorRegulation?.sector || "",
                requiredControls: Array.isArray(parsed.sectorRegulation?.requiredControls)
                    ? parsed.sectorRegulation.requiredControls
                    : [],
                gaps: Array.isArray(parsed.sectorRegulation?.gaps)
                    ? parsed.sectorRegulation.gaps
                    : [],
            },
            summary: parsed.summary || "",
        };
        // Log final classification
        console.log("\n========== [UK Compliance] Final Classification ==========");
        console.log("[UK] Final riskLevel:", assessment.riskLevel);
        console.log("[UK] Final overallAssessment:", assessment.overallAssessment);
        console.log("[UK] Final sectorRegulation.sector:", assessment.sectorRegulation.sector);
        console.log("===========================================================\n");
        // Extract accountable person from uk9
        const accountablePerson = answers.uk9 || "";
        // Store in database
        const payload = {
            user_id: userId,
            org_id: userId, // Set org_id to user_id (1:1 mapping for tenant isolation)
            system_id: system_id || null, // Link to ai_systems table for multi-jurisdiction support
            risk_level: assessment.riskLevel,
            overall_assessment: assessment.overallAssessment,
            safety_and_security: assessment.safetyAndSecurity,
            transparency: assessment.transparency,
            fairness: assessment.fairness,
            governance: assessment.governance,
            contestability: assessment.contestability,
            sector_regulation: assessment.sectorRegulation,
            summary: assessment.summary,
            system_name: finalSystemName,
            company_name: finalCompanyName,
            company_use_case: finalCompanyUseCase,
            raw_answers: answers, // Include all answers including evidence content
            accountable_person: accountablePerson || null,
        };
        console.log("[UK API] Attempting to insert assessment with payload keys:", Object.keys(payload));
        console.log("[UK API] Company fields:", {
            company_name: payload.company_name,
            company_use_case: payload.company_use_case
        });
        const { data, error } = await supabase
            .from("uk_ai_assessments")
            .insert([payload])
            .select()
            .single();
        if (error) {
            console.error("[UK API] Supabase insert error:", error);
            // Check if error is about missing columns
            const missingColumns = [];
            if (error.message?.includes("company_name"))
                missingColumns.push("company_name");
            if (error.message?.includes("company_use_case"))
                missingColumns.push("company_use_case");
            if (error.message?.includes("org_id"))
                missingColumns.push("org_id");
            if (missingColumns.length > 0) {
                console.log(`[UK API] Retrying insert without columns: ${missingColumns.join(", ")}`);
                const payloadWithoutMissingColumns = { ...payload };
                missingColumns.forEach(col => {
                    delete payloadWithoutMissingColumns[col];
                });
                const { data: retryData, error: retryError } = await supabase
                    .from("uk_ai_assessments")
                    .insert([payloadWithoutMissingColumns])
                    .select()
                    .single();
                if (retryError) {
                    console.error("[UK API] Supabase retry insert error:", retryError);
                    return res.status(500).json({
                        error: "Failed to store assessment",
                        message: retryError.message || "Database error occurred",
                        missingColumns: missingColumns
                    });
                }
                console.log("[UK API] Successfully inserted without missing columns.");
                return res.status(200).json({
                    id: retryData.id,
                    ...assessment,
                    warning: `Assessment saved but some fields were skipped (${missingColumns.join(", ")}). Please run migration.`
                });
            }
            return res.status(500).json({
                error: "Failed to store assessment",
                message: error.message || "Database error occurred"
            });
        }
        if (!data || !data.id) {
            console.error("[UK API] No data or ID returned from insert");
            return res.status(500).json({
                error: "Failed to create assessment",
                message: "Assessment was processed but could not be saved"
            });
        }
        console.log("[UK API] ✅ Successfully inserted assessment with ID:", data.id);
        // Auto-generate documentation (non-blocking)
        void (async () => {
            try {
                const { autoGenerateDocumentationIfNeeded } = await Promise.resolve().then(() => __importStar(require("../../services/documentation/documentation-auto-generate")));
                console.log(`[Auto-Doc] Starting auto-generation for UK AI Act system ${data.id}`);
                await autoGenerateDocumentationIfNeeded(data.id, ['UK AI Act'], userId);
                console.log(`[Auto-Doc] Completed auto-generation for system ${data.id}`);
            }
            catch (err) {
                console.error(`[Auto-Doc] Failed to auto-generate docs for system ${data.id}:`, err.message || err);
            }
        })();
        // Auto-generate automated risk assessment (non-blocking)
        void (async () => {
            try {
                const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
                const response = await fetch(`${baseUrl}/api/ai-systems/${data.id}/automated-risk-assessment`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ trigger_type: "registration" }),
                });
                if (response.ok) {
                    console.log(`[Auto-Risk] Generated automated risk assessment for UK system ${data.id}`);
                }
            }
            catch (err) {
                console.error(`[Auto-Risk] Failed to auto-generate risk assessment for UK system ${data.id}:`, err.message || err);
            }
        })();
        return res.status(200).json({ id: data.id, ...assessment });
    }
    catch (err) {
        console.error("[UK API] POST /api/uk-compliance error:", err);
        console.error("[UK API] Error stack:", err.stack);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
/**
 * GET /api/uk-compliance/[id]
 * Fetch a single UK compliance assessment by ID
 */
async function getUkComplianceById(req, res) {
    try {
        const userId = req.user.sub;
        const { id } = req.params;
        // Validate ID
        if (!id || id === "undefined" || id.trim() === "") {
            return res.status(400).json({ error: "Invalid assessment ID" });
        }
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from("uk_ai_assessments")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error) {
            console.error("Supabase fetch error (uk_ai_assessments):", error);
            return res.status(500).json({ error: "Failed to fetch assessment" });
        }
        if (!data) {
            return res.status(404).json({ error: "Assessment not found" });
        }
        // Check if user has access (optional - remove if assessments should be public)
        if (userId && data.user_id && data.user_id !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        return res.status(200).json(data);
    }
    catch (err) {
        console.error("GET /api/uk-compliance/[id] error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
//# sourceMappingURL=uk-compliance.controller.js.map