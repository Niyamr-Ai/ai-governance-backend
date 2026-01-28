/**
 * Universal Document Analyzer Service
 * 
 * Analyzes various types of evidence documents (PDF/DOC/TXT) and extracts structured information
 * to auto-populate compliance form fields based on the evidence type.
 */

import { OpenAI } from "openai";
import { getEvidenceFieldMapping, type EvidenceFieldMapping } from "./evidence-field-mapper";

const OPEN_AI_KEY = process.env.OPEN_AI_KEY;

function getOpenAIClient(): OpenAI {
  if (!OPEN_AI_KEY) {
    throw new Error("OPEN_AI_KEY is missing");
  }
  return new OpenAI({ apiKey: OPEN_AI_KEY });
}

export interface DocumentAnalysisResult {
  [fieldName: string]: string | undefined;
}

/**
 * Analyze document text and extract structured information based on evidence type
 * 
 * @param documentText - Extracted text from the document
 * @param evidenceKey - The evidence key (e.g., 'governance_evidence', 'inventory_evidence')
 * @returns Structured data for form auto-population
 */
export async function analyzeDocument(
  documentText: string,
  evidenceKey: string
): Promise<DocumentAnalysisResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🤖 [UNIVERSAL ANALYZER] Starting AI analysis`);
  console.log(`📋 [UNIVERSAL ANALYZER] Evidence key: ${evidenceKey}`);
  console.log(`📄 [UNIVERSAL ANALYZER] Document text length: ${documentText.length} characters`);
  console.log(`${'='.repeat(80)}\n`);

  if (!documentText || documentText.trim().length === 0) {
    console.warn(`⚠️  [UNIVERSAL ANALYZER] Empty document text provided`);
    return {};
  }

  // Get field mapping for this evidence key
  const mapping = getEvidenceFieldMapping(evidenceKey);
  if (!mapping) {
    console.warn(`⚠️  [UNIVERSAL ANALYZER] No field mapping found for evidence key: ${evidenceKey}`);
    console.log(`💡 [UNIVERSAL ANALYZER] Skipping auto-population for this evidence type`);
    return {};
  }

  console.log(`📊 [UNIVERSAL ANALYZER] Found mapping:`);
  console.log(`   - Form Type: ${mapping.formType}`);
  console.log(`   - Analysis Type: ${mapping.analysisType}`);
  console.log(`   - Fields to Populate: ${mapping.fieldsToPopulate.join(', ')}`);

  // Truncate text if too long (to avoid token limits)
  const MAX_TEXT_LENGTH = 20000; // ~5000 tokens
  const truncatedText = documentText.length > MAX_TEXT_LENGTH
    ? documentText.substring(0, MAX_TEXT_LENGTH) + "\n\n[Document truncated for analysis...]"
    : documentText;

  if (documentText.length > MAX_TEXT_LENGTH) {
    console.log(`⚠️  [UNIVERSAL ANALYZER] Document truncated from ${documentText.length} to ${MAX_TEXT_LENGTH} characters`);
  }

  try {
    const openai = getOpenAIClient();

    // Build prompt based on evidence type and fields to populate
    const systemPrompt = buildSystemPrompt(mapping);
    const userPrompt = `Analyze the following document and extract the required information:

${truncatedText}

Return the extracted information as a JSON object with the exact structure specified.`;

    console.log(`🤖 [UNIVERSAL ANALYZER] Calling OpenAI API with model: gpt-4o`);
    console.log(`📝 [UNIVERSAL ANALYZER] Prompt length: ${systemPrompt.length + userPrompt.length} characters`);
    
    // Check if API key is available
    if (!OPEN_AI_KEY) {
      throw new Error('OPEN_AI_KEY environment variable is not set. Please configure your OpenAI API key.');
    }
    console.log(`🔑 [UNIVERSAL ANALYZER] API key configured (length: ${OPEN_AI_KEY.length} chars)`);

    const startTime = Date.now();
    let response;
    try {
      response = await openai.chat.completions.create({
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
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }, {
        timeout: 60000 // 60 second timeout in RequestOptions
      });
    } catch (apiError: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`\n${'─'.repeat(80)}`);
      console.error(`❌ [UNIVERSAL ANALYZER] OpenAI API call failed`);
      console.error(`   Duration: ${duration}ms`);
      console.error(`   Error Type: ${apiError.constructor.name}`);
      console.error(`   Error Message: ${apiError.message}`);
      
      // Provide more specific error messages
      if (apiError.message?.includes('Connection error') || apiError.message?.includes('ECONNREFUSED')) {
        console.error(`   💡 Possible causes:`);
        console.error(`      - Network connectivity issues`);
        console.error(`      - Firewall/proxy blocking OpenAI API`);
        console.error(`      - OpenAI API service is down`);
        console.error(`      - Check your internet connection`);
      } else if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
        console.error(`   💡 Possible causes:`);
        console.error(`      - Invalid OpenAI API key`);
        console.error(`      - API key expired or revoked`);
        console.error(`      - Check OPEN_AI_KEY environment variable`);
      } else if (apiError.message?.includes('429') || apiError.message?.includes('rate limit')) {
        console.error(`   💡 Possible causes:`);
        console.error(`      - Rate limit exceeded`);
        console.error(`      - Too many requests to OpenAI API`);
        console.error(`      - Wait a few minutes and try again`);
      } else if (apiError.message?.includes('timeout')) {
        console.error(`   💡 Possible causes:`);
        console.error(`      - Request took too long (>60s)`);
        console.error(`      - Network latency issues`);
        console.error(`      - OpenAI API is slow to respond`);
      }
      
      console.error(`   Stack: ${apiError.stack}`);
      console.error(`${'─'.repeat(80)}\n`);
      
      throw new Error(`OpenAI API call failed: ${apiError.message}. Check network connection and API key configuration.`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    console.log(`✅ [UNIVERSAL ANALYZER] Received response from OpenAI (${duration}ms)`);
    console.log(`📊 [UNIVERSAL ANALYZER] Response length: ${content.length} characters`);
    console.log(`💰 [UNIVERSAL ANALYZER] Tokens used: ${response.usage?.total_tokens || 'unknown'}`);

    // Parse JSON response
    let result: DocumentAnalysisResult;
    try {
      result = JSON.parse(content);
      console.log(`✅ [UNIVERSAL ANALYZER] Successfully parsed JSON response`);
    } catch (parseError: any) {
      console.error(`❌ [UNIVERSAL ANALYZER] Failed to parse JSON:`, parseError.message);
      console.error(`📄 [UNIVERSAL ANALYZER] Raw response (first 500 chars):`, content.substring(0, 500));
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Log extracted fields
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📋 [UNIVERSAL ANALYZER] Extracted Information:`);
    let extractedCount = 0;
    mapping.fieldsToPopulate.forEach(field => {
      const hasValue = result[field] && result[field]!.trim().length > 0;
      if (hasValue) extractedCount++;
      console.log(`   ${hasValue ? '✓' : '✗'} ${field}: ${hasValue ? `${result[field]!.substring(0, 50)}...` : 'not found'}`);
    });
    console.log(`📊 [UNIVERSAL ANALYZER] Successfully extracted ${extractedCount}/${mapping.fieldsToPopulate.length} fields`);
    console.log(`${'─'.repeat(80)}\n`);

    console.log(`${'='.repeat(80)}`);
    console.log(`✅ [UNIVERSAL ANALYZER] Analysis completed successfully`);
    console.log(`${'='.repeat(80)}\n`);

    return result;
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [UNIVERSAL ANALYZER] Error during analysis`);
    console.error(`   Evidence Key: ${evidenceKey}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`${'='.repeat(80)}\n`);
    throw error;
  }
}

/**
 * Build system prompt based on evidence field mapping
 */
function buildSystemPrompt(mapping: EvidenceFieldMapping): string {
  const fieldDescriptions = getFieldDescriptions(mapping);
  
  return `You are an expert AI governance consultant specializing in analyzing compliance documents for ${mapping.formType} (${mapping.formType === 'MAS' ? 'Monetary Authority of Singapore' : 'UK AI Act'}) compliance forms.

Your task is to analyze the provided document and extract specific information to populate form fields related to ${mapping.analysisType.replace(/_/g, ' ')}.

EXTRACT THE FOLLOWING INFORMATION:

${fieldDescriptions}

CRITICAL REQUIREMENTS:
- Extract ONLY information that is explicitly stated in the document
- If information is not found, return empty string for that field
- Be concise but comprehensive - capture key points
- Use clear, professional language
- Do not make assumptions or infer information not in the document
- If multiple items are mentioned, list them appropriately

RESPONSE FORMAT: Return a valid JSON object with these exact keys:
{
${mapping.fieldsToPopulate.map(field => `  "${field}": "string or empty"`).join(',\n')}
}`;
}

/**
 * Get field descriptions for the prompt
 */
function getFieldDescriptions(mapping: EvidenceFieldMapping): string {
  const descriptions: Record<string, string> = {
    // Governance fields
    'governance_policy_type': '1. **Type of Governance Policy** (governance_policy_type):\n   - The type or category of governance policy\n   - Policy name and version if available\n   - Keep it concise (1-2 sentences)',
    'governance_framework': '2. **Framework or Standard Followed** (governance_framework):\n   - Industry standards, frameworks, or regulations referenced\n   - List all frameworks/standards found, separated by commas\n   - Keep it concise (one line or short list)',
    'governance_board_role': '3. **Board of Directors Role** (governance_board_role):\n   - Board responsibilities and oversight functions\n   - Board review frequency and processes\n   - Summarize in 2-4 sentences',
    'governance_senior_management': '4. **Senior Management Responsibilities** (governance_senior_management):\n   - Roles and responsibilities of senior management\n   - Accountable executives and their specific duties\n   - Summarize in 3-5 sentences',
    'governance_policy_assigned': '5. **Assigned Responsibilities** (governance_policy_assigned):\n   - Who is assigned to implement or manage the governance policy\n   - Summarize in 2-3 sentences',
    
    // Inventory fields
    'inventory_location': '1. **Where is this system recorded?** (inventory_location):\n   - Location of system record (e.g., Central AI Registry, Confluence, Excel)\n   - System or platform used for inventory management',
    'inventory_risk_classification': '2. **What is the risk classification assigned?** (inventory_risk_classification):\n   - Risk level (High/Medium/Low)\n   - Classification criteria or methodology used',
    
    // Data quality fields
    'data_quality_methods': '1. **What data quality checks have you implemented?** (data_quality_methods):\n   - Data completeness checks, accuracy validation, freshness monitoring\n   - Data consistency checks and validation methods',
    'data_bias_analysis': '2. **How have you analyzed and documented bias in your data?** (data_bias_analysis):\n   - Bias detection methods\n   - Bias mitigation strategies\n   - Demographic representation analysis',
    
    // Transparency fields
    'transparency_doc_types': '1. **What transparency documentation exists?** (transparency_doc_types):\n   - Types of documentation (model cards, system descriptions, etc.)\n   - Documentation formats and locations',
    'transparency_user_explanations': '2. **How do you explain system decisions to users?** (transparency_user_explanations):\n   - Explanation methods (feature importance, decision trees, etc.)\n   - When and how explanations are provided',
    
    // Fairness fields
    'fairness_testing_methods': '1. **What fairness testing methods are used?** (fairness_testing_methods):\n   - Testing approaches and methodologies\n   - Fairness metrics and evaluation criteria',
    'fairness_test_results': '2. **What are the fairness test results?** (fairness_test_results):\n   - Test outcomes and findings\n   - Fairness scores or metrics',
    
    // Human oversight fields
    'human_oversight_type': '1. **What type of human oversight is implemented?** (human_oversight_type):\n   - Oversight approach (HITL, HOTL, etc.)\n   - Oversight mechanisms',
    'human_oversight_processes': '2. **What are the human oversight processes?** (human_oversight_processes):\n   - Process descriptions\n   - When and how oversight occurs',
    
    // UK-specific fields
    'accountability_framework_structure': '1. **Framework Structure** (accountability_framework_structure):\n   - Description of the accountability framework structure\n   - How accountability is organized\n   - Summarize in 2-4 sentences',
    'accountability_roles': '2. **Accountability Roles** (accountability_roles):\n   - Who is accountable for what\n   - Role definitions and responsibilities\n   - Summarize in 2-4 sentences',
    'human_oversight_who': '1. **Who provides oversight?** (human_oversight_who):\n   - Review team, senior management, domain experts',
    'human_oversight_when': '2. **When does oversight occur?** (human_oversight_when):\n   - Before deployment, for high-risk decisions, continuously',
    'human_oversight_how': '3. **How is oversight implemented?** (human_oversight_how):\n   - Describe oversight processes',
    'risk_management_processes': '1. **What processes are in place?** (risk_management_processes):\n   - Describe your risk management approach',
    'risk_management_documentation': '2. **Documentation** (risk_management_documentation):\n   - How are risks documented?',
    'audit_trail_what': '1. **What is logged?** (audit_trail_what):\n   - Decisions, inputs, model versions, user actions',
    'audit_trail_retention': '2. **Retention period** (audit_trail_retention):\n   - e.g., 7 years, indefinitely',
    'audit_trail_access': '3. **Who has access?** (audit_trail_access):\n   - Compliance team, auditors, regulators',
  };

  return mapping.fieldsToPopulate
    .map((field, index) => {
      const description = descriptions[field] || `${index + 1}. **${field.replace(/_/g, ' ')}** (${field}):\n   - Extract relevant information for this field`;
      return description;
    })
    .join('\n\n');
}

