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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMasCompliance = getMasCompliance;
exports.postMasCompliance = postMasCompliance;
exports.getMasComplianceById = getMasComplianceById;
const openai_1 = require("openai");
const supabase_js_1 = require("@supabase/supabase-js");
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("../../middleware/auth");
const rag_service_1 = require("../../services/ai/rag-service");
function getEnvVars() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
    const SITE_URL = "http://localhost:3000";
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
        SITE_URL,
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
function defaultPillar() {
    return {
        status: "Partially compliant",
        score: 0,
        gaps: [],
        recommendations: [],
    };
}
function defaultAssessment() {
    return {
        id: "",
        overall_status: "Partially compliant",
        overall_score: 0,
        governance: defaultPillar(),
        accountability: defaultPillar(),
        capability: defaultPillar(),
        fairness_transparency: defaultPillar(),
        data_protection_privacy: defaultPillar(),
        security_robustness: defaultPillar(),
        human_oversight: defaultPillar(),
        transparency_disclosure: defaultPillar(),
        assigned_to: "",
        reviewed_by: "",
        created_at: "",
        updated_at: "",
    };
}
/**
 * Generate MAS compliance assessment using AI
 */
async function generateMasAssessment(systemDescription, systemName, regulationContext) {
    const openai = getOpenAIClient();
    const prompt = `You are an expert in Singapore's MAS AI regulatory framework. Analyze this AI system for MAS compliance across all 12 pillars.

SYSTEM DESCRIPTION:
${systemDescription}

SYSTEM NAME:
${systemName}

REGULATORY CONTEXT:
${regulationContext}

REQUIRED OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "overall_status": "Fully compliant" | "Partially compliant" | "Non-compliant",
  "overall_score": <number 0-100>,
  "governance": {
    "status": "Fully compliant" | "Partially compliant" | "Non-compliant",
    "score": <number 0-100>,
    "gaps": [<array of gap descriptions>],
    "recommendations": [<array of recommendations>]
  },
  "accountability": {
    "status": "Fully compliant" | "Partially compliant" | "Non-compliant",
    "score": <number 0-100>,
    "gaps": [<array of gap descriptions>],
    "recommendations": [<array of recommendations>]
  },
  "capability": {
    "status": "Fully compliant" | "Partially compliant" | "Non-compliant",
    "score": <number 0-100>,
    "gaps": [<array of gap descriptions>],
    "recommendations": [<array of recommendations>]
  },
  "fairness_transparency": {
    "status": "Fully compliant" | "Partially compliant" | "Non-compliant",
    "score": <number 0-100>,
    "gaps": [<array of gap descriptions>],
    "recommendations": [<array of recommendations>]
  },
  "data_protection_privacy": {
    "status": "Fully compliant" | "Partially compliant" | "Non-compliant",
    "score": <number 0-100>,
    "gaps": [<array of gap descriptions>],
    "recommendations": [<array of recommendations>]
  },
  "security_robustness": {
    "status": "Fully compliant" | "Partially compliant" | "Non-compliant",
    "score": <number 0-100>,
    "gaps": [<array of gap descriptions>],
    "recommendations": [<array of recommendations>]
  },
  "human_oversight": {
    "status": "Fully compliant" | "Partially compliant" | "Non-compliant",
    "score": <number 0-100>,
    "gaps": [<array of gap descriptions>],
    "recommendations": [<array of recommendations>]
  },
  "transparency_disclosure": {
    "status": "Fully compliant" | "Partially compliant" | "Non-compliant",
    "score": <number 0-100>,
    "gaps": [<array of gap descriptions>],
    "recommendations": [<array of recommendations>]
  }
}

ANALYSIS REQUIREMENTS:
- Evaluate each of the 8 MAS pillars independently
- Be specific about gaps and provide actionable recommendations
- Consider the system description, use case, and MAS guidelines
- Score should reflect actual compliance level, not assumptions
- Gaps should be specific technical or process issues
- Recommendations should be practical and implementable

Ensure the response is valid JSON.`;
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a MAS AI regulatory compliance expert. Always return valid JSON.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.1,
            max_tokens: 4000,
        });
        const response = completion.choices?.[0]?.message?.content;
        if (!response) {
            throw new Error("Failed to generate MAS assessment from OpenAI");
        }
        // Parse the JSON response
        const assessment = JSON.parse(response.trim());
        // Validate the response structure
        if (!assessment.overall_status || typeof assessment.overall_score !== "number") {
            throw new Error("Invalid assessment structure from AI");
        }
        return assessment;
    }
    catch (error) {
        console.error("Error generating MAS assessment:", error);
        return defaultAssessment();
    }
}
/**
 * GET /api/mas-compliance
 */
async function getMasCompliance(req, res) {
    try {
        // Check authentication
        const userId = await (0, auth_1.getUserId)(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const supabase = getSupabaseClient();
        // Get all MAS compliance assessments for the user
        const { data, error } = await supabase
            .from("mas_ai_risk_assessments")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) {
            console.error("Database error:", error);
            return res.status(500).json({ message: "Database error" });
        }
        return res.json(data || []);
    }
    catch (err) {
        console.error("GET /mas-compliance error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
/**
 * POST /api/mas-compliance
 */
async function postMasCompliance(req, res) {
    try {
        // Check authentication
        const userId = await (0, auth_1.getUserId)(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { systemDescription, systemName, assigned_to, reviewed_by } = req.body;
        if (!systemDescription || !systemName) {
            return res.status(400).json({
                message: "systemDescription and systemName are required",
            });
        }
        const supabase = getSupabaseClient();
        // Get MAS regulatory context
        const regulationContext = await (0, rag_service_1.getRegulationContextString)(`MAS AI regulatory framework for ${systemDescription}`, "MAS", 10);
        // Generate MAS compliance assessment
        const assessment = await generateMasAssessment(systemDescription, systemName, regulationContext);
        // Store the assessment in database
        const { data, error } = await supabase
            .from("mas_ai_risk_assessments")
            .insert({
            user_id: userId,
            system_name: systemName,
            system_description: systemDescription,
            overall_status: assessment.overall_status,
            overall_score: assessment.overall_score,
            governance: assessment.governance,
            accountability: assessment.accountability,
            capability: assessment.capability,
            fairness_transparency: assessment.fairness_transparency,
            data_protection_privacy: assessment.data_protection_privacy,
            security_robustness: assessment.security_robustness,
            human_oversight: assessment.human_oversight,
            transparency_disclosure: assessment.transparency_disclosure,
            assigned_to: assigned_to || null,
            reviewed_by: reviewed_by || null,
        })
            .select()
            .single();
        if (error) {
            console.error("Database error:", error);
            return res.status(500).json({ message: "Database error" });
        }
        // Auto-generate documentation (non-blocking)
        // Don't await - let it run in background
        Promise.resolve().then(() => __importStar(require("../../services/documentation/documentation-auto-generate"))).then(({ autoGenerateDocumentationIfNeeded }) => autoGenerateDocumentationIfNeeded(data.id, ["MAS"]))
            .catch(() => { });
        // Auto-generate automated risk assessment (non-blocking)
        const { SITE_URL } = getEnvVars();
        axios_1.default
            .post(`${SITE_URL}/api/ai-systems/${data.id}/automated-risk-assessment`, {
            trigger_type: "registration",
        })
            .catch(() => { });
        return res.status(201).json({ id: data.id });
    }
    catch (err) {
        console.error("POST /mas-compliance error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
/**
 * GET /api/mas-compliance/[id]
 * Fetch a single MAS compliance assessment by ID
 */
async function getMasComplianceById(req, res) {
    try {
        const { id } = req.params;
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from("mas_ai_risk_assessments")
            .select("*")
            .eq("id", id)
            .single();
        if (error) {
            console.error("Supabase fetch error (mas_ai_risk_assessments):", error);
            return res.status(500).json({ error: "Failed to fetch assessment" });
        }
        if (!data) {
            return res.status(404).json({ error: "Not found" });
        }
        return res.status(200).json(data);
    }
    catch (err) {
        console.error("GET /api/mas-compliance/[id] error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
//# sourceMappingURL=mas-compliance.controller.js.map