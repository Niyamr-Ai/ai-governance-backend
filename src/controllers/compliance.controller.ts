// EU AI Act Compliance API Controller
import { Request, Response } from "express";
import { OpenAI } from "openai";
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase';
import { getRegulationContextString } from "../../services/ai/rag-service";

function getSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is missing");
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function getOpenAIClient() {
  const OPEN_AI_KEY = process.env.OPEN_AI_KEY;

  if (!OPEN_AI_KEY) {
    throw new Error("OPEN_AI_KEY is missing");
  }

  return new OpenAI({ apiKey: OPEN_AI_KEY });
}

/**
 * GET /api/compliance
 * Fetch all basic compliance checks for the authenticated user
 */
export async function getCompliance(req: Request, res: Response) {
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
    const detailedMap = new Set(
      (detailedChecks || []).map((d) => d.compliance_id)
    );

    // Merge info into response
    const response = basicChecks.map((check) => ({
      ...check,
      has_detailed_check: detailedMap.has(check.id),
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * POST /api/compliance
 * Process EU AI Act compliance assessment
 */
export async function postCompliance(req: Request, res: Response) {
  try {
    const user_id = req.user?.sub;
if (!user_id) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const userId = user_id;

    const body = req.body;
    const { system_id, system_name, ...answers } = body;
    console.log(answers, "---x-x-x-x-x-x---");
    console.log("[EU API] System ID:", system_id);

    const supabase = getSupabaseClient();
    const openai = getOpenAIClient();

    // 1. Analyze answers using AI
    // Build context from actual form answers
    let contextString = `System Name: ${system_name || "Unnamed System"}\n\n`;
    contextString += "EU AI Act Assessment Answers:\n\n";
    
    // q1: Does your AI system affect users in the European Union?
    const affectsEU = answers.q1 === 'yes';
    contextString += `Q1 - Affects EU users: ${affectsEU ? 'Yes' : 'No'}\n`;
    
    // q2: What does your AI system do? (text description)
    const systemDescription = answers.q2 || '';
    contextString += `Q2 - System Description: ${systemDescription || '(Not provided)'}\n`;
    
    // q3: How company uses/provides the system
    const usageTypes = Array.isArray(answers.q3) ? answers.q3 : [];
    contextString += `Q3 - Usage Type: ${usageTypes.length > 0 ? usageTypes.join(', ') : 'Not specified'}\n`;
    
    // q4: Does your AI system do any of the following? (high-risk activities)
    const activities = Array.isArray(answers.q4) ? answers.q4 : [];
    const hasHighRiskActivities = activities.length > 0 && !activities.includes('none');
    contextString += `Q4 - High-risk Activities: ${hasHighRiskActivities ? activities.filter(a => a !== 'none').join(', ') : 'None'}\n`;
    
    // q5: Does your AI system do any banned/controversial things? (PROHIBITED PRACTICES)
    const bannedActivities = Array.isArray(answers.q5) ? answers.q5 : [];
    const hasBannedActivities = bannedActivities.length > 0 && !bannedActivities.includes('none');
    contextString += `Q5 - Banned/Prohibited Activities: ${hasBannedActivities ? bannedActivities.filter(a => a !== 'none').join(', ') : 'None'}\n`;
    
    // q6: Risk management actions taken
    const riskActions = Array.isArray(answers.q6) ? answers.q6 : [];
    contextString += `Q6 - Risk Management Actions: ${riskActions.length > 0 && !riskActions.includes('none') ? riskActions.filter(a => a !== 'none').join(', ') : 'None'}\n`;
    
    // q7: Interacts with people or creates synthetic content
    const interactsWithPeople = answers.q7 === 'yes';
    contextString += `Q7 - Interacts with People/Creates Synthetic Content: ${interactsWithPeople ? 'Yes' : 'No'}\n`;
    if (interactsWithPeople && answers.q7a) {
      contextString += `Q7a - User Notification: ${answers.q7a}\n`;
    }
    
    // q8: Assessment completion status
    contextString += `Q8 - Assessment Status: ${answers.q8 || 'Not specified'}\n`;
    
    // q9: Accountability & Governance measures
    const governanceMeasures = Array.isArray(answers.q9) ? answers.q9 : [];
    contextString += `Q9 - Governance Measures: ${governanceMeasures.length > 0 && !governanceMeasures.includes('none') ? governanceMeasures.filter(a => a !== 'none').join(', ') : 'None'}\n`;
    
    // q10: Accountable person
    contextString += `Q10 - Accountable Person: ${answers.q10 || 'Not specified'}\n`;
    
    contextString += `\n`;

    // Get regulatory context
    const regulationContext = await getRegulationContextString(
      "EU AI Act classification and risk assessment",
      "EU",
      10
    );

    contextString += `\nRegulatory Context:\n${regulationContext}`;

    // AI Analysis Prompt
    const prompt = `
You are an expert in EU AI Act compliance. Analyze the following AI system assessment answers and determine its risk classification.

${contextString}

Based on the EU AI Act, classify this AI system into one of these categories:
1. "Unacceptable risk" - ONLY if Q5 (Banned Activities) explicitly includes prohibited practices
2. "High-risk" - If Q4 (High-risk Activities) includes activities like credit scoring, employment decisions, biometric identification, etc.
3. "Limited risk" - General purpose AI, emotion recognition, systems that interact with people
4. "Minimal risk" - Most other AI systems, including systems with unclear descriptions or minimal information

CRITICAL CLASSIFICATION RULES (MUST FOLLOW):

1. **If Q1 (Affects EU users) = "No":**
   - Classify as "Minimal risk" - System does not affect EU users, so EU AI Act may not apply

2. **If Q5 (Banned Activities) = "None" or empty:**
   - DO NOT classify as "Unacceptable risk" (Prohibited)
   - System has no prohibited practices detected
   - Only classify as Prohibited if Q5 explicitly lists banned activities (social_scoring, subliminal, facial_scraping, emotion_tracking, biometric_grouping)

3. **If Q4 (High-risk Activities) = "None" or empty:**
   - DO NOT classify as "High-risk"
   - System does not perform high-risk activities

4. **If System Description (Q2) is unclear, incomplete, or appears to be placeholder text:**
   - Default to "Minimal risk"
   - Do not assume prohibited or high-risk practices without clear evidence

5. **Classification Priority:**
   - First check Q5: If it contains banned activities → "Unacceptable risk"
   - Then check Q4: If it contains high-risk activities → "High-risk"
   - Then check Q7: If interacts with people → Consider "Limited risk" (transparency requirements)
   - Otherwise → "Minimal risk"

6. **When in doubt, choose "Minimal risk"** - Do not assume prohibited practices without explicit evidence from Q5.

Provide your analysis in this JSON format:
{
  "classification": "Unacceptable risk" | "High-risk" | "Limited risk" | "Minimal risk",
  "reasoning": "Brief explanation referencing specific answers (Q1, Q4, Q5, Q7, etc.)",
  "high_risk_obligations": ["List of applicable high-risk obligations if Q4 indicates high-risk activities"],
  "prohibited_practices_detected": ["List of prohibited practices ONLY if Q5 explicitly contains banned activities"],
  "recommendations": ["Actionable recommendations"]
}

Be precise and follow EU AI Act guidelines exactly. Default to Minimal risk when information is unclear or answers indicate no prohibited/high-risk activities.`;

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

    // Strip markdown code fences if present (```json ... ```)
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith('```')) {
      // Remove opening ```json or ```
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/, '');
      // Remove closing ```
      cleanedResponse = cleanedResponse.replace(/\n?```\s*$/, '');
    }

    let analysis;
    try {
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanedResponse);
      analysis = {
        classification: "Unknown",
        reasoning: "Analysis failed",
        high_risk_obligations: [],
        prohibited_practices_detected: [],
        recommendations: ["Manual review recommended"],
      };
    }

    // 2. Map classification to risk_tier
    const riskTierMap: Record<string, string> = {
      "Unacceptable risk": "Prohibited",
      "High-risk": "High-risk",
      "Limited risk": "Limited-risk",
      "Minimal risk": "Minimal-risk",
      "Unknown": "Unknown"
    };

    const riskTier = riskTierMap[analysis.classification] || "Unknown";
    const hasProhibitedPractices = (analysis.prohibited_practices_detected || []).length > 0;
    const highRiskObligations = analysis.high_risk_obligations || [];
    const hasAllHighRiskFulfilled = riskTier === "High-risk" && highRiskObligations.length === 0;

    // Determine compliance status
    let complianceStatus = "Compliant";
    if (hasProhibitedPractices) {
      complianceStatus = "Non-compliant";
    } else if (riskTier === "High-risk" && highRiskObligations.length > 0) {
      complianceStatus = "Partially compliant";
    } else if (riskTier === "Prohibited") {
      complianceStatus = "Non-compliant";
    }

    // 3. Store compliance result
    const complianceResult = {
      user_id: userId,
      system_id: system_id || null, // Link to ai_systems table for multi-jurisdiction support
      system_name: system_name || "Unnamed System",
      risk_tier: riskTier,
      compliance_status: complianceStatus,
      prohibited_practices_detected: hasProhibitedPractices,
      high_risk_all_fulfilled: hasAllHighRiskFulfilled,
      high_risk_missing: highRiskObligations,
      transparency_required: false, // Will be determined by analysis if needed
      transparency_missing: [],
      monitoring_required: riskTier === "High-risk",
      post_market_monitoring: false, // Default, can be updated later
      incident_reporting: false, // Default, can be updated later
      fria_completed: false, // Default, can be updated later
      raw_answers: answers, // Store raw form answers
      summary: analysis.reasoning || "", // Store reasoning as summary
      reference: {
        prohibited_practices: analysis.prohibited_practices_detected || [], // Store list of prohibited practices
        riskTierBasis: analysis.reasoning || "",
      },
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
      system_id: complianceData.system_id,
      system_name: complianceData.system_name,
      risk_tier: complianceData.risk_tier,
      compliance_status: complianceData.compliance_status,
      prohibited_practices_detected: complianceData.prohibited_practices_detected,
      high_risk_all_fulfilled: complianceData.high_risk_all_fulfilled,
      high_risk_missing: complianceData.high_risk_missing,
      reference: complianceData.reference || {},
      created_at: complianceData.created_at,
    });
  } catch (err: any) {
    console.error("POST /compliance error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * GET /api/compliance/[id]
 * Fetch a single compliance result by ID
 */
export async function getComplianceById(req: Request, res: Response) {
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
  } catch (err) {
    console.error("GET /compliance/[id] error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * GET /api/compliance/detailed
 * Fetch detailed compliance assessment by ID
 */
export async function getDetailedCompliance(req: Request, res: Response) {
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

    // Fetch detailed compliance data
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

    // Fetch system_name and created_at from eu_ai_act_check_results table (where the compliance assessment is stored)
    const { data: complianceData, error: complianceError } = await supabase
      .from("eu_ai_act_check_results")
      .select("system_name, system_id, created_at")
      .eq("id", id)
      .maybeSingle();

    if (complianceError) {
      console.error("Error fetching system_name:", complianceError);
    }

    let systemName = complianceData?.system_name || null;

    // If system_name is missing but system_id exists, fetch from ai_systems table
    if (!systemName && complianceData?.system_id) {
      const { data: systemData, error: systemError } = await supabase
        .from("ai_systems")
        .select("name")
        .eq("id", complianceData.system_id)
        .maybeSingle();

      if (!systemError && systemData?.name) {
        systemName = systemData.name;
      }
    }

    // Add system_name and assessment_date (from created_at) to the response
    const responseData = {
      ...data,
      system_name: systemName || null,
      assessment_date: complianceData?.created_at || data.created_at || null,
    };

    return res.status(200).json(responseData);
  } catch (err) {
    console.error("GET /compliance/detailed error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/compliance/detailed
 * Perform detailed EU AI Act compliance assessment
 */
export async function postDetailedCompliance(req: Request, res: Response) {
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
    const contextChunks = await getRegulationContextString(
      userInput,
      'EU',
      5
    );

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
    let checkResult: any;
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

    } catch (err) {
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
        } else {
          console.error("Supabase connection test failed:", testError);
          return res.status(500).json({ message: "Database connection issue" });
        }
      } else {
        console.log("Supabase connection test passed");
      }
    } catch (connError) {
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
        const { autoGenerateDocumentationIfNeeded } = await import("../../services/documentation/documentation-auto-generate");
        console.log(`[Auto-Doc] Starting auto-generation for EU AI Act system ${basicId}`);
        await autoGenerateDocumentationIfNeeded(basicId, ['EU AI Act'], userId);
        console.log(`[Auto-Doc] Completed auto-generation for system ${basicId}`);
      } catch (err: any) {
        console.error(`[Auto-Doc] Failed to auto-generate docs for system ${basicId}:`, err.message || err);
      }
    })();

    return res.status(200).json({ id: resultData.id });
  } catch (err) {
    console.error("POST /compliance/detailed error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
