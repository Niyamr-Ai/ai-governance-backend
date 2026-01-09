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
exports.getCompliance = getCompliance;
exports.postCompliance = postCompliance;
exports.getComplianceById = getComplianceById;
exports.getDetailedCompliance = getDetailedCompliance;
exports.postDetailedCompliance = postDetailedCompliance;
const openai_1 = require("openai");
const supabase_js_1 = require("@supabase/supabase-js");
const rag_service_1 = require("../../services/ai/rag-service");
function getSupabaseClient() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL) {
        throw new Error("SUPABASE_URL is missing");
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
    }
    return (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
function getOpenAIClient() {
    const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
    if (!OPEN_AI_KEY) {
        throw new Error("OPEN_AI_KEY is missing");
    }
    return new openai_1.OpenAI({ apiKey: OPEN_AI_KEY });
}
/**
 * GET /api/compliance
 * Fetch all basic compliance checks for the authenticated user
 */
async function getCompliance(req, res) {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const supabase = getSupabaseClient();
        // Fetch all basic compliance checks for this user
        const { data: basicChecks, error: basicError } = await supabase
            .from("eu_ai_act_check_results")
            .select("*")
            .eq("user_id", userId);
        if (basicError) {
            console.error("Supabase error (basic):", basicError);
            return res.status(500).json({ error: "Failed to fetch compliance results" });
        }
        if (!basicChecks || basicChecks.length === 0) {
            return res.status(200).json([]);
        }
        // Extract all compliance IDs to check detailed availability
        const complianceIds = basicChecks.map((c) => c.id);
        const { data: detailedChecks, error: detailedError } = await supabase
            .from("ai_system_compliance")
            .select("compliance_id")
            .in("compliance_id", complianceIds);
        if (detailedError) {
            console.error("Supabase error (detailed):", detailedError);
            return res.status(500).json({ error: "Failed to fetch detailed check info" });
        }
        // Create a quick lookup map for faster matching
        const detailedMap = new Set((detailedChecks || []).map((d) => d.compliance_id));
        // Merge info into response
        const response = basicChecks.map((check) => ({
            ...check,
            has_detailed_check: detailedMap.has(check.id),
        }));
        return res.status(200).json(response);
    }
    catch (err) {
        console.error("Unexpected error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
/**
 * POST /api/compliance
 * Process EU AI Act compliance assessment
 */
async function postCompliance(req, res) {
    try {
        const user_id = req.user?.sub;
        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = user_id;
        const body = req.body;
        const { system_name, ...answers } = body;
        console.log(answers, "---x-x-x-x-x-x---");
        const supabase = getSupabaseClient();
        const openai = getOpenAIClient();
        // 1. Store answers in Supabase
        const { data: storedAnswers, error: insertError } = await supabase
            .from("eu_ai_act_answers")
            .insert({
            user_id: userId,
            system_name: system_name || "Unnamed System",
            answers: answers,
        })
            .select()
            .single();
        if (insertError) {
            console.error("Insert error:", insertError);
            return res.status(500).json({ error: "Failed to store answers" });
        }
        // 2. Analyze answers using AI
        const questions = {
            q1: "Does the AI system perform classification of people based on sensitive characteristics?",
            q2: "Does the AI system perform social scoring of individuals?",
            q3: "Does the AI system perform real-time biometric identification in public spaces?",
            q4: "Does the AI system manage critical infrastructure?",
            q5: "Does the AI system provide education and vocational training?",
            q6: "Does the AI system evaluate eligibility for social security benefits?",
            q7: "Does the AI system control access to essential private/public services?",
            q8: "Does the AI system influence law enforcement decisions?",
            q9: "Does the AI system control migration, asylum, or border control processes?",
            q10: "Does the AI system assist in making judicial decisions?",
        };
        // Build context from answers
        let contextString = `System Name: ${system_name || "Unnamed System"}\n\n`;
        contextString += "Answers to EU AI Act Classification Questions:\n";
        for (const [key, question] of Object.entries(questions)) {
            const answer = answers[key];
            contextString += `${question}: ${answer ? "Yes" : "No"}\n`;
        }
        // Get regulatory context
        const regulationContext = await (0, rag_service_1.getRegulationContextString)("EU AI Act classification and risk assessment", "EU", 10);
        contextString += `\nRegulatory Context:\n${regulationContext}`;
        // AI Analysis Prompt
        const prompt = `
You are an expert in EU AI Act compliance. Analyze the following AI system answers and determine its risk classification.

${contextString}

Based on the EU AI Act, classify this AI system into one of these categories:
1. "Unacceptable risk" - If it performs any of the prohibited practices (social scoring, real-time biometric ID in public spaces, etc.)
2. "High-risk" - If it falls under Annex III high-risk AI systems
3. "Limited risk" - General purpose AI, emotion recognition, etc.
4. "Minimal risk" - Most other AI systems

Provide your analysis in this JSON format:
{
  "classification": "Unacceptable risk" | "High-risk" | "Limited risk" | "Minimal risk",
  "reasoning": "Brief explanation of the classification",
  "high_risk_obligations": ["List of applicable high-risk obligations if applicable"],
  "prohibited_practices_detected": ["List of prohibited practices if any"],
  "recommendations": ["Actionable recommendations"]
}

Be precise and follow EU AI Act guidelines exactly.`;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an EU AI Act compliance expert. Always return valid JSON.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.1,
        });
        const aiResponse = completion.choices?.[0]?.message?.content;
        if (!aiResponse) {
            throw new Error("Failed to get AI response");
        }
        let analysis;
        try {
            analysis = JSON.parse(aiResponse);
        }
        catch (parseError) {
            console.error("Failed to parse AI response:", aiResponse);
            analysis = {
                classification: "Unknown",
                reasoning: "Analysis failed",
                high_risk_obligations: [],
                prohibited_practices_detected: [],
                recommendations: ["Manual review recommended"],
            };
        }
        // 3. Store compliance result
        const complianceResult = {
            user_id: userId,
            system_name: system_name || "Unnamed System",
            classification: analysis.classification,
            reasoning: analysis.reasoning,
            high_risk_obligations: analysis.high_risk_obligations || [],
            prohibited_practices_detected: analysis.prohibited_practices_detected || [],
            recommendations: analysis.recommendations || [],
            answers_id: storedAnswers.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { data: complianceData, error: complianceError } = await supabase
            .from("eu_ai_act_check_results")
            .insert(complianceResult)
            .select()
            .single();
        if (complianceError) {
            console.error("Compliance insert error:", complianceError);
            return res.status(500).json({ error: "Failed to store compliance result" });
        }
        // 4. Return the compliance result
        return res.status(201).json({
            id: complianceData.id,
            ...complianceResult,
        });
    }
    catch (err) {
        console.error("POST /compliance error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
/**
 * GET /api/compliance/[id]
 * Fetch a single compliance result by ID
 */
async function getComplianceById(req, res) {
    try {
        console.log("🔍 [BACKEND] getComplianceById called with params:", req.params, "query:", req.query);
        const { id } = req.params;
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from("eu_ai_act_check_results")
            .select("*")
            .eq("id", id)
            .single();
        if (error || !data) {
            console.log("Error fetching result:", error);
            return res.status(404).json({ error: "Result not found" });
        }
        return res.status(200).json(data);
    }
    catch (err) {
        console.error("GET /compliance/[id] error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
/**
 * GET /api/compliance/detailed
 * Fetch detailed compliance assessment by ID
 */
async function getDetailedCompliance(req, res) {
    try {
        const { id } = req.query;
        console.log("🔍 [BACKEND] getDetailedCompliance called with query:", req.query);
        console.log("🔍 [BACKEND] id parameter:", id, "type:", typeof id);
        if (!id || typeof id !== 'string') {
            console.log("❌ [BACKEND] Invalid id parameter:", { id, type: typeof id });
            return res.status(400).json({ message: "Missing required parameter: id" });
        }
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            console.log("❌ [BACKEND] Invalid UUID format:", id);
            return res.status(400).json({ message: "Invalid ID format" });
        }
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from("ai_system_compliance")
            .select("*")
            .eq("compliance_id", id)
            .maybeSingle();
        if (error) {
            console.error("Supabase fetch error:", error);
            return res.status(500).json({ message: "Failed to fetch compliance result" });
        }
        if (!data) {
            return res.status(404).json({ message: "No record found for the given id" });
        }
        return res.status(200).json(data);
    }
    catch (err) {
        console.error("GET /compliance/detailed error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
/**
 * POST /api/compliance/detailed
 * Perform detailed EU AI Act compliance assessment
 */
async function postDetailedCompliance(req, res) {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const body = req.body;
        const basicId = body.compliance_id;
        if (!basicId) {
            return res.status(400).json({ message: "Missing required parameter: compliance_id" });
        }
        delete body.compliance_id;
        const answers = body;
        const supabase = getSupabaseClient();
        const openai = getOpenAIClient();
        console.log(answers, "---x-x-x-x-x-x---");
        const userInput = Object.values(answers).join(" ");
        // Get regulation context using RAG service
        const contextChunks = await (0, rag_service_1.getRegulationContextString)(userInput, 'EU', 5);
        // Build prompt with specific JSON structure requirements
        const prompt = `
You are an expert compliance assessor for the EU Artificial Intelligence Act.

Based on the following questions and answers, provide a detailed compliance assessment.

Questions with answers:
${JSON.stringify(answers)}

Context from EU AI Act:
${contextChunks}

IMPORTANT: Respond with ONLY a valid JSON object in this exact format (no markdown, no explanations):

{
  "documented_risk_management_system": boolean,
  "risk_identification_and_analysis": boolean,
  "risk_evaluation_process": "string description",
  "specific_risk_mitigation_measures": "string description",
  "data_relevance_and_quality": boolean,
  "data_governance_measures": "string description",
  "data_contextual_relevance": "string description",
  "technical_documentation_available": boolean,
  "technical_documentation_summary": "string description",
  "automatic_event_logging": boolean,
  "logged_events_description": "string description",
  "operation_transparency": "string description",
  "instructions_for_use_available": boolean,
  "human_oversight_measures": "string description",
  "accuracy_robustness_cybersecurity": boolean,
  "resilience_measures": "string description",
  "security_controls": "string description",
  "conformity_assessment_completed": boolean,
  "quality_management_system": boolean,
  "eu_declaration_and_ce_marking": boolean,
  "fundamental_rights_impact_assessment": "string description"
}

Each field should be evaluated based on the answers provided. Use the context from the EU AI Act to inform your assessment.
`.trim();
        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
        });
        const content = completion.choices?.[0]?.message?.content;
        if (typeof content !== "string") {
            return res.status(500).json({ message: "Invalid AI response" });
        }
        // Parse JSON - handle various AI response formats
        let checkResult;
        let jsonString = "";
        try {
            jsonString = content.trim();
            // Remove markdown code blocks and any explanatory text
            jsonString = jsonString.replace(/^```(?:json)?\s*/gm, "").replace(/```\s*$/gm, "");
            // If the response contains explanations before/after JSON, extract just the JSON
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
            }
            // Clean up any remaining text
            jsonString = jsonString
                .replace(/^[\s\S]*?(\{)/m, "$1") // Remove everything before first {
                .replace(/\}[\s\S]*$/m, "}") // Remove everything after last }
                .trim();
            console.log("Final JSON string to parse:", jsonString.substring(0, 200) + "...");
            checkResult = JSON.parse(jsonString);
            // Validate that we have the expected structure
            const requiredFields = [
                'documented_risk_management_system', 'risk_identification_and_analysis',
                'risk_evaluation_process', 'specific_risk_mitigation_measures'
            ];
            const missingFields = requiredFields.filter(field => !(field in checkResult));
            if (missingFields.length > 0) {
                console.error("Missing required fields:", missingFields);
                return res.status(500).json({ message: "AI response missing required fields" });
            }
        }
        catch (err) {
            console.error("Error parsing AI response:", content);
            console.error("Parsed attempt:", jsonString);
            return res.status(500).json({ message: "AI returned invalid JSON" });
        }
        // Insert into ai_system_compliance table directly
        checkResult.compliance_id = basicId;
        // Sanitize and validate data before insertion
        // Ensure string fields are not too long and clean up any problematic characters
        Object.keys(checkResult).forEach(key => {
            if (typeof checkResult[key] === 'string') {
                // Truncate very long strings
                if (checkResult[key].length > 2000) {
                    checkResult[key] = checkResult[key].substring(0, 2000) + '...';
                }
                // Remove any null bytes or problematic characters
                checkResult[key] = checkResult[key].replace(/\0/g, '').replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            }
        });
        const dataSize = JSON.stringify(checkResult).length;
        console.log(`Inserting sanitized data (${dataSize} chars):`, JSON.stringify(checkResult, null, 2));
        if (dataSize > 50000) { // Arbitrary limit to prevent oversized inserts
            console.error("Data too large for insertion:", dataSize);
            return res.status(400).json({ message: "Assessment data too large" });
        }
        // Test connection with a simple query first
        try {
            const { data: testData, error: testError } = await supabase
                .from("ai_system_compliance")
                .select("compliance_id")
                .limit(1);
            if (testError) {
                // If table doesn't exist, try to create it
                if (testError.code === '42P01') { // Table doesn't exist
                    console.log("ai_system_compliance table doesn't exist, creating it...");
                    const createTableSQL = `
            CREATE TABLE IF NOT EXISTS ai_system_compliance (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              compliance_id UUID NOT NULL,
              documented_risk_management_system BOOLEAN NOT NULL,
              risk_identification_and_analysis BOOLEAN NOT NULL,
              risk_evaluation_process TEXT,
              specific_risk_mitigation_measures TEXT,
              data_relevance_and_quality BOOLEAN NOT NULL,
              data_governance_measures TEXT,
              data_contextual_relevance TEXT,
              technical_documentation_available BOOLEAN NOT NULL,
              technical_documentation_summary TEXT,
              automatic_event_logging BOOLEAN NOT NULL,
              logged_events_description TEXT,
              operation_transparency TEXT,
              instructions_for_use_available BOOLEAN NOT NULL,
              human_oversight_measures TEXT,
              accuracy_robustness_cybersecurity BOOLEAN NOT NULL,
              resilience_measures TEXT,
              security_controls TEXT,
              conformity_assessment_completed BOOLEAN NOT NULL,
              quality_management_system BOOLEAN NOT NULL,
              eu_declaration_and_ce_marking BOOLEAN NOT NULL,
              fundamental_rights_impact_assessment TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(compliance_id)
            );
          `;
                    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
                    if (createError) {
                        console.error("Failed to create ai_system_compliance table:", createError);
                        return res.status(500).json({ message: "Database setup failed" });
                    }
                    console.log("ai_system_compliance table created successfully");
                }
                else {
                    console.error("Supabase connection test failed:", testError);
                    return res.status(500).json({ message: "Database connection issue" });
                }
            }
            else {
                console.log("Supabase connection test passed");
            }
        }
        catch (connError) {
            console.error("Supabase connection error:", connError);
            return res.status(500).json({ message: "Database connection failed" });
        }
        const { data: resultData, error: resultError } = await supabase
            .from("ai_system_compliance")
            .upsert([checkResult], { onConflict: 'compliance_id' })
            .select()
            .single();
        if (resultError) {
            console.error("Supabase insert error:", resultError);
            console.error("Data that failed to insert:", checkResult);
            return res.status(500).json({ message: "Failed to store result" });
        }
        console.log(resultData, "Result stored successfully");
        // Auto-generate documentation (non-blocking)
        void (async () => {
            try {
                const { autoGenerateDocumentationIfNeeded } = await Promise.resolve().then(() => __importStar(require("../../services/documentation/documentation-auto-generate")));
                console.log(`[Auto-Doc] Starting auto-generation for EU AI Act system ${basicId}`);
                await autoGenerateDocumentationIfNeeded(basicId, ['EU AI Act'], userId);
                console.log(`[Auto-Doc] Completed auto-generation for system ${basicId}`);
            }
            catch (err) {
                console.error(`[Auto-Doc] Failed to auto-generate docs for system ${basicId}:`, err.message || err);
            }
        })();
        return res.status(200).json({ id: resultData.id });
    }
    catch (err) {
        console.error("POST /compliance/detailed error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
//# sourceMappingURL=compliance.controller.js.map