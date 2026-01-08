// EU AI Act Compliance API Controller
import { Request, Response } from "express";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import { getUserId } from "../../middleware/auth";
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
    const userId = await getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
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
    const user_id = await getUserId(req);
    const userId = user_id ? user_id : null;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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
    const regulationContext = await getRegulationContextString(
      "EU AI Act classification and risk assessment",
      "EU",
      10
    );

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
    } catch (parseError) {
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

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: "Missing required parameter: id" });
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

    // Build prompt (simplified version)
    const prompt = `
You are an expert compliance assessor for the EU Artificial Intelligence Act.

Context:
${contextChunks}

Questions with answers:
${JSON.stringify(answers)}

Please provide detailed compliance assessment in JSON format with the required fields.
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

    // Parse JSON
    let checkResult;
    try {
      const jsonString = content
        .replace(/^```json\s*/g, "")
        .replace(/```$/g, "")
        .trim();
      checkResult = JSON.parse(jsonString);
    } catch (err) {
      console.error("Error parsing AI response:", content);
      return res.status(500).json({ message: "AI returned invalid JSON" });
    }

    // Insert into ai_system_compliance table directly
    checkResult.compliance_id = basicId;
    const { data: resultData, error: resultError } = await supabase
      .from("ai_system_compliance")
      .insert([checkResult])
      .select()
      .single();

    if (resultError) {
      console.error("Supabase insert error:", resultError);
      return res.status(500).json({ message: "Failed to store result" });
    }

    console.log(resultData, "Result stored successfully");

    // Auto-generate documentation (non-blocking)
    void (async () => {
      try {
        const { autoGenerateDocumentationIfNeeded } = await import("../../services/documentation/documentation-auto-generate");
        console.log(`[Auto-Doc] Starting auto-generation for EU AI Act system ${basicId}`);
        await autoGenerateDocumentationIfNeeded(basicId, ['EU AI Act']);
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
