"use strict";
/**
 * Automated Risk Assessment API Controller
 *
 * GET /api/ai-systems/[id]/automated-risk-assessment - Fetch existing automated risk assessment
 * POST /api/ai-systems/[id]/automated-risk-assessment - Generate new automated risk assessment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAutomatedRiskAssessment = getAutomatedRiskAssessment;
exports.createAutomatedRiskAssessment = createAutomatedRiskAssessment;
exports.approveAutomatedRiskAssessment = approveAutomatedRiskAssessment;
const server_1 = require("../../utils/supabase/server");
const auth_1 = require("../../middleware/auth");
const automated_risk_scoring_1 = require("../../services/risk-assessment/automated-risk-scoring");
const openai_1 = require("openai");
function getOpenAIClient() {
    const key = process.env.OPEN_AI_KEY;
    if (!key) {
        throw new Error("OPEN_AI_KEY is missing");
    }
    return new openai_1.OpenAI({ apiKey: key });
}
/**
 * Gather all system data needed for risk assessment
 */
async function gatherSystemData(systemId) {
    const supabase = await (0, server_1.createClient)();
    // Fetch compliance assessments (EU, UK, MAS)
    const [euResult, ukResult, masResult] = await Promise.all([
        supabase.from("eu_ai_act_check_results").select("*").eq("id", systemId).maybeSingle(),
        supabase.from("uk_ai_assessments").select("*").eq("id", systemId).maybeSingle(),
        supabase.from("mas_ai_risk_assessments").select("*").eq("id", systemId).maybeSingle(),
    ]);
    // Fetch approved risk assessments
    const { data: riskAssessments } = await supabase
        .from("risk_assessments")
        .select("*")
        .eq("ai_system_id", systemId)
        .eq("status", "approved");
    // Determine which compliance data to use
    const complianceData = euResult.data || ukResult.data || masResult.data;
    return {
        complianceData,
        riskAssessments: riskAssessments || [],
        hasEuData: !!euResult.data,
        hasUkData: !!ukResult.data,
        hasMasData: !!masResult.data,
    };
}
/**
 * Map UK risk level to automated risk assessment level
 */
function mapUkRiskLevel(ukRiskLevel) {
    if (!ukRiskLevel)
        return 'Medium';
    const level = ukRiskLevel.toLowerCase();
    if (level.includes('frontier') || level.includes('high-impact')) {
        return 'Critical';
    }
    if (level.includes('high-risk') || level.includes('high')) {
        return 'High';
    }
    if (level.includes('medium')) {
        return 'Medium';
    }
    if (level.includes('low')) {
        return 'Low';
    }
    // Default fallback
    return 'Medium';
}
/**
 * Get compliance risk level for UK/MAS systems
 * Returns null for EU systems (which use composite score calculation)
 */
function getComplianceRiskLevel(complianceData, hasUkData, hasMasData) {
    if (hasMasData && complianceData?.overall_risk_level) {
        // MAS uses direct mapping: Critical, High, Medium, Low
        const level = complianceData.overall_risk_level;
        if (['Critical', 'High', 'Medium', 'Low'].includes(level)) {
            return level;
        }
    }
    if (hasUkData && complianceData?.risk_level) {
        // UK needs mapping
        return mapUkRiskLevel(complianceData.risk_level);
    }
    // EU systems return null to use composite score calculation
    return null;
}
/**
 * Generate compliance checklist from system data
 */
function generateComplianceChecklist(data) {
    const checklist = [];
    // EU AI Act specific items
    if (data.complianceData?.risk_tier) {
        checklist.push({
            id: 'risk_tier',
            category: 'Classification',
            item: `Risk Tier: ${data.complianceData.risk_tier}`,
            status: data.complianceData.risk_tier === 'Prohibited' ? 'non_compliant' : 'compliant',
            regulation_reference: 'EU AI Act',
        });
    }
    if (data.complianceData?.prohibited_practices_detected !== undefined) {
        checklist.push({
            id: 'prohibited_practices',
            category: 'Prohibited Practices',
            item: 'No prohibited practices detected',
            status: data.complianceData.prohibited_practices_detected ? 'non_compliant' : 'compliant',
            regulation_reference: 'EU AI Act Article 5',
        });
    }
    if (data.complianceData?.high_risk_all_fulfilled !== undefined) {
        checklist.push({
            id: 'high_risk_obligations',
            category: 'High-Risk Obligations',
            item: 'All high-risk obligations fulfilled',
            status: data.complianceData.high_risk_all_fulfilled ? 'compliant' : 'non_compliant',
            regulation_reference: 'EU AI Act Chapter II',
        });
    }
    if (data.complianceData?.fria_completed !== undefined) {
        checklist.push({
            id: 'fria',
            category: 'Impact Assessment',
            item: 'Fundamental Rights Impact Assessment completed',
            status: data.complianceData.fria_completed ? 'compliant' : 'needs_review',
            regulation_reference: 'EU AI Act Article 29',
        });
    }
    // Risk assessment items
    data.riskAssessments.forEach((ra, index) => {
        checklist.push({
            id: `risk_assessment_${index}`,
            category: 'Risk Assessment',
            item: `${ra.category} assessment - ${ra.risk_level} risk`,
            status: ra.mitigation_status === 'mitigated' ? 'compliant' : 'needs_review',
        });
    });
    return checklist;
}
/**
 * Generate report content using OpenAI
 */
async function generateReportContent(scores, dimensionDetails, systemData) {
    const systemName = systemData.complianceData?.system_name || 'AI System';
    const riskLevel = scores.overallRiskLevel;
    const compositeScore = scores.compositeScore;
    const openai = getOpenAIClient();
    const prompt = `You are an expert risk assessment analyst. Generate a comprehensive risk assessment report for an AI system.

System Information:
- Name: ${systemName}
- Overall Risk Level: ${riskLevel}
- Composite Risk Score: ${compositeScore}/10

Risk Dimension Scores:
- Technical Risk: ${scores.scores.technical}/10
- Operational Risk: ${scores.scores.operational}/10
- Legal/Regulatory Risk: ${scores.scores.legal_regulatory}/10
- Ethical/Societal Risk: ${scores.scores.ethical_societal}/10
- Business Risk: ${scores.scores.business}/10

Dimension Details:
${JSON.stringify(dimensionDetails, null, 2)}

Compliance Status: ${systemData.complianceData?.compliance_status || 'Unknown'}
Risk Tier: ${systemData.complianceData?.risk_tier || 'Unknown'}
Lifecycle Stage: ${systemData.complianceData?.lifecycle_stage || 'Unknown'}

Generate a professional risk assessment report. Write all sections as READABLE TEXT, not JSON structures.

1. EXECUTIVE SUMMARY (max 300 words):
   Write a clear paragraph summarizing:
   - Overall risk assessment
   - Key findings
   - Critical risks requiring immediate attention
   - Recommended actions

2. DETAILED FINDINGS (comprehensive analysis):
   Write as formatted text with clear sections. For each risk dimension (Technical, Operational, Legal/Regulatory, Ethical/Societal, Business), include:
   - Dimension name as heading
   - Score and brief rationale
   - Key findings (as bullet points or paragraphs)
   - Compliance gaps (if any)
   - Impact assessment
   - Evidence and rationale

   Format example:
   ## Technical Risk (5/10)
   The technical risk dimension shows...
   - Finding 1
   - Finding 2

   ## Operational Risk (10/10)
   Operational risks are critical...

   Continue for all 5 dimensions. Write as readable prose, NOT as JSON.

3. REMEDIATION PLAN:
   Write as formatted text with:
   - Prioritized action items (grouped by priority: Critical, High, Medium, Low)
   - Specific recommendations for each risk dimension
   - Implementation steps with timelines
   - Resource requirements
   - Success metrics

   Format as readable text with headings and bullet points, NOT JSON.

4. RE-ASSESSMENT TIMELINE:
   Write as formatted text describing:
   - Recommended frequency for re-assessment
   - Triggers for immediate re-assessment
   - Monitoring schedule

   Write as readable paragraphs and bullet points, NOT JSON.

Return ONLY a JSON object with these 4 string fields. Each field value must be formatted TEXT (with markdown-style formatting like ## for headings, - for bullets), NOT nested JSON objects:

{
  "executiveSummary": "Text here...",
  "detailedFindings": "Formatted text here with ## headings and - bullets...",
  "remediationPlan": "Formatted text here...",
  "reAssessmentTimeline": "Formatted text here..."
}`;
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "You are an expert risk assessment analyst specializing in AI governance and compliance. Generate comprehensive, actionable risk assessment reports.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.3,
    });
    const content = completion.choices[0]?.message?.content || "{}";
    try {
        const jsonString = content.replace(/^```json\s*/g, "").replace(/```$/g, "").trim();
        const parsed = JSON.parse(jsonString);
        // Helper function to format JSON strings back to readable text
        const formatText = (text) => {
            if (!text)
                return "";
            // If it's a JSON string, try to parse and format it
            try {
                const jsonParsed = JSON.parse(text);
                // If it parsed successfully, format it nicely
                if (typeof jsonParsed === 'object') {
                    return formatObjectAsText(jsonParsed);
                }
            }
            catch {
                // Not JSON, return as-is
            }
            return text;
        };
        // Helper to format JSON objects as readable text
        const formatObjectAsText = (obj, indent = 0) => {
            if (typeof obj !== 'object' || obj === null)
                return String(obj);
            if (Array.isArray(obj)) {
                return obj.map(item => `${'  '.repeat(indent)}• ${formatObjectAsText(item, indent + 1)}`).join('\n');
            }
            return Object.entries(obj)
                .map(([key, value]) => {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                if (typeof value === 'object' && value !== null) {
                    return `\n${'  '.repeat(indent)}## ${formattedKey}\n${formatObjectAsText(value, indent + 1)}`;
                }
                return `${'  '.repeat(indent)}**${formattedKey}**: ${value}`;
            })
                .join('\n');
        };
        return {
            executiveSummary: parsed.executiveSummary || "Executive summary not generated",
            detailedFindings: formatText(parsed.detailedFindings) || "Detailed findings not generated",
            remediationPlan: formatText(parsed.remediationPlan) || "Remediation plan not generated",
            reAssessmentTimeline: formatText(parsed.reAssessmentTimeline) || "Re-assessment timeline not generated",
        };
    }
    catch (err) {
        console.error("Error parsing OpenAI response:", err);
        // Fallback content
        return {
            executiveSummary: `This ${systemName} has been assessed with an overall risk level of ${riskLevel} (composite score: ${compositeScore}/10).`,
            detailedFindings: `Risk assessment completed across 5 dimensions. Technical: ${scores.scores.technical}/10, Operational: ${scores.scores.operational}/10, Legal/Regulatory: ${scores.scores.legal_regulatory}/10, Ethical/Societal: ${scores.scores.ethical_societal}/10, Business: ${scores.scores.business}/10.`,
            remediationPlan: "Review dimension details and implement recommended actions.",
            reAssessmentTimeline: "Re-assess quarterly or upon major system changes.",
        };
    }
}
/**
 * GET /api/ai-systems/[id]/automated-risk-assessment - Fetch existing automated risk assessment
 */
async function getAutomatedRiskAssessment(req, res) {
    try {
        const userId = await (0, auth_1.getUserId)(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { id: systemId } = req.params;
        const supabase = await (0, server_1.createClient)();
        // Fetch most recent assessment
        const { data, error } = await supabase
            .from("automated_risk_assessments")
            .select("*")
            .eq("ai_system_id", systemId)
            .order("assessed_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) {
            console.error("Error fetching automated risk assessment:", error);
            return res.status(500).json({ error: "Failed to fetch assessment" });
        }
        if (!data) {
            return res.status(404).json({ error: "No assessment found" });
        }
        return res.json(data);
    }
    catch (err) {
        console.error("GET /api/ai-systems/[id]/automated-risk-assessment error:", err);
        return res.status(500).json({
            error: err.message || "Internal server error"
        });
    }
}
/**
 * POST /api/ai-systems/[id]/automated-risk-assessment - Generate new automated risk assessment
 */
async function createAutomatedRiskAssessment(req, res) {
    try {
        const userId = await (0, auth_1.getUserId)(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { id: systemId } = req.params;
        const body = req.body || {};
        const { trigger_type = "manual", weights } = body;
        // Gather system data
        const systemData = await gatherSystemData(systemId);
        if (!systemData.complianceData) {
            return res.status(404).json({
                error: "No compliance assessment found for this system"
            });
        }
        // Normalize risk tier for scoring (map UK/MAS to EU-style risk_tier)
        let normalizedRiskTier;
        if (systemData.hasUkData && systemData.complianceData?.risk_level) {
            // Map UK risk levels to normalized risk tier
            const ukLevel = systemData.complianceData.risk_level.toLowerCase();
            if (ukLevel.includes('frontier') || ukLevel.includes('high-impact')) {
                normalizedRiskTier = 'High-risk'; // Treat as high-risk for scoring
            }
            else if (ukLevel.includes('high-risk') || ukLevel.includes('high')) {
                normalizedRiskTier = 'High-risk';
            }
            else if (ukLevel.includes('medium')) {
                normalizedRiskTier = 'Limited-risk';
            }
            else {
                normalizedRiskTier = 'Minimal-risk';
            }
        }
        else if (systemData.hasMasData && systemData.complianceData?.overall_risk_level) {
            // Map MAS risk levels to normalized risk tier
            const masLevel = systemData.complianceData.overall_risk_level;
            if (masLevel === 'Critical') {
                normalizedRiskTier = 'High-risk'; // Critical maps to high-risk for scoring
            }
            else if (masLevel === 'High') {
                normalizedRiskTier = 'High-risk';
            }
            else if (masLevel === 'Medium') {
                normalizedRiskTier = 'Limited-risk';
            }
            else {
                normalizedRiskTier = 'Minimal-risk';
            }
        }
        else {
            // EU systems use risk_tier directly
            normalizedRiskTier = systemData.complianceData?.risk_tier;
        }
        // Prepare data for scoring
        const scoringData = {
            compliance_status: systemData.complianceData.compliance_status,
            risk_tier: normalizedRiskTier, // Use normalized risk tier
            prohibited_practices_detected: systemData.complianceData.prohibited_practices_detected,
            high_risk_all_fulfilled: systemData.complianceData.high_risk_all_fulfilled,
            high_risk_missing: systemData.complianceData.high_risk_missing,
            transparency_required: systemData.complianceData.transparency_required,
            post_market_monitoring: systemData.complianceData.post_market_monitoring,
            fria_completed: systemData.complianceData.fria_completed,
            lifecycle_stage: systemData.complianceData.lifecycle_stage,
            sector: systemData.complianceData.sector,
            accountable_person: systemData.complianceData.accountable_person,
            system_name: systemData.complianceData.system_name,
            approved_risk_assessments: systemData.riskAssessments.map((ra) => ({
                category: ra.category,
                risk_level: ra.risk_level,
                mitigation_status: ra.mitigation_status,
            })),
            // Add framework-specific data for better scoring
            _framework: (systemData.hasEuData ? 'EU' : systemData.hasUkData ? 'UK' : 'MAS'),
            _original_risk_level: systemData.hasUkData
                ? systemData.complianceData?.risk_level
                : systemData.hasMasData
                    ? systemData.complianceData?.overall_risk_level
                    : systemData.complianceData?.risk_tier,
        };
        // Calculate risk scores
        console.log(`[Auto-Risk] Scoring data for ${systemData.hasEuData ? 'EU' : systemData.hasUkData ? 'UK' : 'MAS'} system:`, {
            normalized_risk_tier: normalizedRiskTier,
            original_risk_level: scoringData._original_risk_level,
            compliance_status: scoringData.compliance_status,
            sector: scoringData.sector,
        });
        const scores = (0, automated_risk_scoring_1.calculateRiskScores)(scoringData, weights);
        console.log(`[Auto-Risk] Calculated scores:`, {
            technical: scores.scores.technical,
            operational: scores.scores.operational,
            legal_regulatory: scores.scores.legal_regulatory,
            ethical_societal: scores.scores.ethical_societal,
            business: scores.scores.business,
            composite: scores.compositeScore,
            calculated_risk_level: scores.overallRiskLevel,
        });
        // Use the calculated composite score's risk level for all systems
        // The automated risk assessment should reflect its own calculation, independent of compliance assessment
        const finalRiskLevel = scores.overallRiskLevel;
        console.log(`[Auto-Risk] Using composite score calculation for ${systemData.hasEuData ? 'EU' : systemData.hasUkData ? 'UK' : 'MAS'} system: ${finalRiskLevel} (composite score: ${scores.compositeScore})`);
        // Generate compliance checklist
        const complianceChecklist = generateComplianceChecklist(systemData);
        // Generate report content using OpenAI (use final risk level)
        const reportContent = await generateReportContent({ ...scores, overallRiskLevel: finalRiskLevel }, scores.dimensionDetails, systemData);
        // Prepare data sources tracking
        const dataSources = {
            compliance_assessments: [
                ...(systemData.hasEuData ? ['EU AI Act'] : []),
                ...(systemData.hasUkData ? ['UK AI Act'] : []),
                ...(systemData.hasMasData ? ['MAS'] : []),
            ],
            risk_assessments: systemData.riskAssessments.map((ra) => ra.id),
            system_metadata: true,
            questionnaire_responses: true,
        };
        // Parse re-assessment timeline to determine review frequency
        // Default to 6 months if not specified
        let reviewFrequencyMonths = 6;
        const timelineText = reportContent.reAssessmentTimeline.toLowerCase();
        if (timelineText.includes('quarterly') || timelineText.includes('3 month')) {
            reviewFrequencyMonths = 3;
        }
        else if (timelineText.includes('monthly') || timelineText.includes('1 month')) {
            reviewFrequencyMonths = 1;
        }
        else if (timelineText.includes('yearly') || timelineText.includes('annual') || timelineText.includes('12 month')) {
            reviewFrequencyMonths = 12;
        }
        else if (timelineText.includes('6 month') || timelineText.includes('semi-annual')) {
            reviewFrequencyMonths = 6;
        }
        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setMonth(nextReviewDate.getMonth() + reviewFrequencyMonths);
        // Save to database
        const supabase = await (0, server_1.createClient)();
        const { data: assessment, error: insertError } = await supabase
            .from("automated_risk_assessments")
            .insert([
            {
                ai_system_id: systemId,
                technical_risk_score: scores.scores.technical,
                operational_risk_score: scores.scores.operational,
                legal_regulatory_risk_score: scores.scores.legal_regulatory,
                ethical_societal_risk_score: scores.scores.ethical_societal,
                business_risk_score: scores.scores.business,
                composite_score: scores.compositeScore,
                overall_risk_level: finalRiskLevel,
                weights: scores.finalWeights,
                dimension_details: scores.dimensionDetails,
                executive_summary: reportContent.executiveSummary,
                detailed_findings: reportContent.detailedFindings,
                compliance_checklist: complianceChecklist,
                remediation_plan: reportContent.remediationPlan,
                re_assessment_timeline: reportContent.reAssessmentTimeline,
                trigger_type,
                data_sources: dataSources,
                assessed_by: userId,
                // TEMPORARY: org_id currently maps 1:1 to user_id.
                // This will change when true organizations are introduced.
                org_id: userId,
                approval_status: 'pending', // New assessments start as pending
                review_frequency_months: reviewFrequencyMonths,
                next_review_date: nextReviewDate.toISOString(),
                monitoring_enabled: true,
            },
        ])
            .select()
            .single();
        if (insertError) {
            console.error("Error inserting automated risk assessment:", insertError);
            return res.status(500).json({ error: "Failed to save assessment" });
        }
        return res.json(assessment);
    }
    catch (err) {
        console.error("POST /api/ai-systems/[id]/automated-risk-assessment error:", err);
        return res.status(500).json({
            error: err.message || "Internal server error"
        });
    }
}
/**
 * PATCH /api/ai-systems/[id]/automated-risk-assessment/[assessmentId]/approve
 * Approve, reject, or request revision for an automated risk assessment
 */
async function approveAutomatedRiskAssessment(req, res) {
    try {
        const userId = await (0, auth_1.getUserId)(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { assessmentId } = req.params;
        const body = req.body;
        const { status, reviewer_notes, rejection_reason } = body;
        if (!['approved', 'rejected', 'needs_revision'].includes(status)) {
            return res.status(400).json({
                error: "Invalid status. Must be 'approved', 'rejected', or 'needs_revision'"
            });
        }
        const supabase = await (0, server_1.createClient)();
        // Update assessment with approval status
        const updateData = {
            approval_status: status,
            approved_by: userId,
            approved_at: new Date().toISOString(),
        };
        if (reviewer_notes) {
            updateData.reviewer_notes = reviewer_notes;
        }
        if (status === 'rejected' && rejection_reason) {
            updateData.rejection_reason = rejection_reason;
        }
        const { data, error } = await supabase
            .from("automated_risk_assessments")
            .update(updateData)
            .eq("id", assessmentId)
            .select()
            .single();
        if (error) {
            console.error("Error updating assessment approval:", error);
            return res.status(500).json({
                error: "Failed to update approval status"
            });
        }
        return res.json(data);
    }
    catch (err) {
        console.error("PATCH /api/ai-systems/[id]/automated-risk-assessment/[assessmentId]/approve error:", err);
        return res.status(500).json({
            error: err.message || "Internal server error"
        });
    }
}
//# sourceMappingURL=automated-risk-assessment.controller.js.map