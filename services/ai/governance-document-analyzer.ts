/**
 * Governance Document Analyzer Service
 * 
 * Analyzes governance policy documents (PDF/DOC/TXT) and extracts structured information
 * to auto-populate compliance form fields.
 */

import { OpenAI } from "openai";

const OPEN_AI_KEY = process.env.OPEN_AI_KEY;

function getOpenAIClient(): OpenAI {
  if (!OPEN_AI_KEY) {
    throw new Error("OPEN_AI_KEY is missing");
  }
  return new OpenAI({ apiKey: OPEN_AI_KEY });
}

export interface GovernanceAnalysisResult {
  // MAS Form Fields
  governance_policy_type?: string;
  governance_framework?: string;
  governance_board_role?: string;
  governance_senior_management?: string;
  governance_policy_assigned?: string;
  
  // UK Form Fields
  accountability_framework_structure?: string;
  accountability_roles?: string;
  governance_board_involvement?: string;
  senior_management_oversight?: string;
}

/**
 * Analyze governance document text and extract structured information
 * 
 * @param documentText - Extracted text from the governance document
 * @param formType - 'MAS' or 'UK' to determine which fields to extract
 * @returns Structured data for form auto-population
 */
export async function analyzeGovernanceDocument(
  documentText: string,
  formType: 'MAS' | 'UK' = 'MAS'
): Promise<GovernanceAnalysisResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🤖 [GOVERNANCE ANALYZER] Starting AI analysis for ${formType} form`);
  console.log(`📄 [GOVERNANCE ANALYZER] Document text length: ${documentText.length} characters`);
  console.log(`${'='.repeat(80)}\n`);

  if (!documentText || documentText.trim().length === 0) {
    console.warn(`⚠️  [GOVERNANCE ANALYZER] Empty document text provided`);
    return {};
  }

  // Truncate text if too long (to avoid token limits)
  const MAX_TEXT_LENGTH = 20000; // ~5000 tokens
  const truncatedText = documentText.length > MAX_TEXT_LENGTH
    ? documentText.substring(0, MAX_TEXT_LENGTH) + "\n\n[Document truncated for analysis...]"
    : documentText;

  try {
    const openai = getOpenAIClient();

    // Build prompt based on form type
    const systemPrompt = formType === 'MAS'
      ? `You are an expert AI governance consultant specializing in analyzing governance policy documents for MAS (Monetary Authority of Singapore) compliance forms.

Your task is to analyze the provided governance policy document and extract specific information to populate form fields.

EXTRACT THE FOLLOWING INFORMATION:

1. **Type of Governance Policy** (governance_policy_type):
   - The type or category of governance policy (e.g., "AI Risk Governance Policy", "Enterprise AI Governance Framework")
   - Policy name and version if available
   - Keep it concise (1-2 sentences or a short phrase)

2. **Framework or Standard Followed** (governance_framework):
   - Industry standards, frameworks, or regulations referenced (e.g., MAS FEAT, ISO/IEC 23053, NIST AI RMF, COSO)
   - Compliance frameworks mentioned
   - List all frameworks/standards found, separated by commas
   - Keep it concise (one line or short list)

3. **Board of Directors Role** (governance_board_role):
   - Board responsibilities and oversight functions
   - Board review frequency and processes
   - Board approval requirements
   - Board involvement in AI governance decisions
   - Summarize in 2-4 sentences

4. **Senior Management Responsibilities** (governance_senior_management):
   - Roles and responsibilities of senior management (CTO, CRO, CCO, etc.)
   - Accountable executives and their specific duties
   - Management oversight processes
   - Summarize in 3-5 sentences, listing key roles and responsibilities

5. **Assigned Responsibilities** (governance_policy_assigned) - Optional:
   - Who is assigned to implement or manage the governance policy
   - Specific roles, teams, or departments responsible
   - Summarize in 2-3 sentences

CRITICAL REQUIREMENTS:
- Extract ONLY information that is explicitly stated in the document
- If information is not found, return empty string for that field
- Be concise but comprehensive - capture key points
- Use clear, professional language
- Do not make assumptions or infer information not in the document
- If multiple frameworks are mentioned, list them all

RESPONSE FORMAT: Return a valid JSON object with these exact keys:
{
  "governance_policy_type": "string or empty",
  "governance_framework": "string or empty",
  "governance_board_role": "string or empty",
  "governance_senior_management": "string or empty",
  "governance_policy_assigned": "string or empty"
}`

      : `You are an expert AI governance consultant specializing in analyzing governance policy documents for UK AI Act compliance forms.

Your task is to analyze the provided governance policy document and extract specific information to populate form fields.

EXTRACT THE FOLLOWING INFORMATION:

1. **Framework Structure** (accountability_framework_structure):
   - Description of the accountability framework structure
   - How accountability is organized and structured
   - Framework components and elements
   - Summarize in 2-4 sentences

2. **Accountability Roles** (accountability_roles):
   - Who is accountable for what
   - Role definitions and responsibilities
   - Accountability assignments
   - Summarize in 2-4 sentences

3. **Board Involvement** (governance_board_involvement):
   - How the board is involved in AI governance
   - Board oversight mechanisms
   - Board-level governance activities
   - Summarize in 2-3 sentences

4. **Senior Management Oversight** (senior_management_oversight):
   - How senior management oversees AI systems
   - Management oversight processes
   - Senior management responsibilities
   - Summarize in 2-4 sentences

CRITICAL REQUIREMENTS:
- Extract ONLY information that is explicitly stated in the document
- If information is not found, return empty string for that field
- Be concise but comprehensive - capture key points
- Use clear, professional language
- Do not make assumptions or infer information not in the document

RESPONSE FORMAT: Return a valid JSON object with these exact keys:
{
  "accountability_framework_structure": "string or empty",
  "accountability_roles": "string or empty",
  "governance_board_involvement": "string or empty",
  "senior_management_oversight": "string or empty"
}`;

    const userPrompt = `Analyze the following governance policy document and extract the required information:

${truncatedText}

Return the extracted information as a JSON object with the exact structure specified.`;

    console.log(`🤖 [GOVERNANCE ANALYZER] Calling OpenAI API...`);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    console.log(`✅ [GOVERNANCE ANALYZER] Received response from OpenAI`);
    console.log(`📊 [GOVERNANCE ANALYZER] Response length: ${content.length} characters`);

    // Parse JSON response
    let result: GovernanceAnalysisResult;
    try {
      result = JSON.parse(content);
      console.log(`✅ [GOVERNANCE ANALYZER] Successfully parsed JSON response`);
    } catch (parseError: any) {
      console.error(`❌ [GOVERNANCE ANALYZER] Failed to parse JSON:`, parseError.message);
      console.error(`📄 [GOVERNANCE ANALYZER] Raw response:`, content);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Log extracted fields
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📋 [GOVERNANCE ANALYZER] Extracted Information:`);
    if (formType === 'MAS') {
      console.log(`   - Policy Type: ${result.governance_policy_type ? '✓' : '✗'}`);
      console.log(`   - Framework: ${result.governance_framework ? '✓' : '✗'}`);
      console.log(`   - Board Role: ${result.governance_board_role ? '✓' : '✗'}`);
      console.log(`   - Senior Management: ${result.governance_senior_management ? '✓' : '✗'}`);
      console.log(`   - Assigned Responsibilities: ${result.governance_policy_assigned ? '✓' : '✗'}`);
    } else {
      console.log(`   - Framework Structure: ${result.accountability_framework_structure ? '✓' : '✗'}`);
      console.log(`   - Accountability Roles: ${result.accountability_roles ? '✓' : '✗'}`);
      console.log(`   - Board Involvement: ${result.governance_board_involvement ? '✓' : '✗'}`);
      console.log(`   - Senior Management Oversight: ${result.senior_management_oversight ? '✓' : '✗'}`);
    }
    console.log(`${'─'.repeat(80)}\n`);

    console.log(`${'='.repeat(80)}`);
    console.log(`✅ [GOVERNANCE ANALYZER] Analysis completed successfully`);
    console.log(`${'='.repeat(80)}\n`);

    return result;
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [GOVERNANCE ANALYZER] Error during analysis`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`${'='.repeat(80)}\n`);
    throw error;
  }
}

