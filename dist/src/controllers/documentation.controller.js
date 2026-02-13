"use strict";
/**
 * Global Documentation API Controller
 *
 * GET /api/documentation - Returns all documentation across all AI systems with system information
 * GET /api/documentation/:id/pdf - Downloads documentation as PDF
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentation = getDocumentation;
exports.getDocumentationPDF = getDocumentationPDF;
const supabase_1 = require("../../src/lib/supabase");
const puppeteer_1 = __importDefault(require("puppeteer"));
const marked_1 = require("marked");
/**
 * GET /api/documentation
 * Returns all documentation across all AI systems with system information
 */
async function getDocumentation(req, res) {
    try {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const supabase = supabase_1.supabaseAdmin;
        // Filter parameters
        const regulationType = req.query.regulation_type;
        const documentType = req.query.document_type;
        const systemId = req.query.ai_system_id;
        const status = req.query.status;
        // Build query
        let query = supabase
            .from("compliance_documentation")
            .select("*")
            .eq("org_id", userId)
            .order("created_at", { ascending: false });
        // Apply filters
        if (regulationType) {
            query = query.eq("regulation_type", regulationType);
        }
        if (documentType) {
            query = query.eq("document_type", documentType);
        }
        if (systemId) {
            query = query.eq("ai_system_id", systemId);
        }
        if (status) {
            query = query.eq("status", status);
        }
        const { data: docs, error } = await query;
        if (error) {
            console.error("Error fetching documentation:", error);
            return res.status(500).json({ error: "Failed to fetch documentation" });
        }
        // Enrich with system names
        const enrichedDocs = await Promise.all((docs || []).map(async (doc) => {
            let systemName = "Unknown System";
            let systemType = null;
            // Try to get system name from different tables
            const [euCheck, ukCheck, masCheck] = await Promise.all([
                supabase
                    .from("eu_ai_act_check_results")
                    .select("system_name, id")
                    .eq("id", doc.ai_system_id)
                    .maybeSingle(),
                supabase
                    .from("uk_ai_assessments")
                    .select("system_name, id")
                    .eq("id", doc.ai_system_id)
                    .maybeSingle(),
                supabase
                    .from("mas_ai_risk_assessments")
                    .select("system_name, id")
                    .eq("id", doc.ai_system_id)
                    .maybeSingle(),
            ]);
            if (euCheck.data) {
                systemName = euCheck.data.system_name || `EU System ${doc.ai_system_id.substring(0, 8)}`;
                systemType = "EU AI Act";
            }
            else if (ukCheck.data) {
                systemName = ukCheck.data.system_name || `UK System ${doc.ai_system_id.substring(0, 8)}`;
                systemType = "UK AI Act";
            }
            else if (masCheck.data) {
                systemName = masCheck.data.system_name || `MAS System ${doc.ai_system_id.substring(0, 8)}`;
                systemType = "MAS";
            }
            return {
                ...doc,
                system_name: systemName,
                system_type: systemType,
            };
        }));
        return res.status(200).json({
            documentation: enrichedDocs,
            total: enrichedDocs.length
        });
    }
    catch (error) {
        console.error("GET /api/documentation error:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
/**
 * GET /api/documentation/:id/pdf
 * Downloads a specific documentation as PDF
 */
async function getDocumentationPDF(req, res) {
    const docId = req.params.id;
    console.log(`\n📄 [PDF DOWNLOAD] === PDF Download Request Started ===`);
    console.log(`📄 [PDF DOWNLOAD] Document ID: ${docId}`);
    console.log(`📄 [PDF DOWNLOAD] Request URL: ${req.url}`);
    try {
        const userId = req.user?.sub;
        console.log(`📄 [PDF DOWNLOAD] User ID: ${userId || 'NOT FOUND'}`);
        if (!userId) {
            console.error(`❌ [PDF DOWNLOAD] Unauthorized - No user ID found`);
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!docId) {
            console.error(`❌ [PDF DOWNLOAD] Bad Request - No document ID provided`);
            return res.status(400).json({ error: "Documentation ID is required" });
        }
        console.log(`📄 [PDF DOWNLOAD] Fetching documentation from database...`);
        const supabase = supabase_1.supabaseAdmin;
        // Fetch the documentation
        const { data: doc, error } = await supabase
            .from("compliance_documentation")
            .select("*")
            .eq("id", docId)
            .eq("org_id", userId)
            .single();
        if (error) {
            console.error(`❌ [PDF DOWNLOAD] Database error:`, error);
            console.error(`❌ [PDF DOWNLOAD] Error code: ${error.code}`);
            console.error(`❌ [PDF DOWNLOAD] Error message: ${error.message}`);
            return res.status(404).json({ error: "Documentation not found" });
        }
        if (!doc) {
            console.error(`❌ [PDF DOWNLOAD] Documentation not found for ID: ${docId}`);
            console.error(`❌ [PDF DOWNLOAD] User ID: ${userId}`);
            return res.status(404).json({ error: "Documentation not found" });
        }
        console.log(`✅ [PDF DOWNLOAD] Documentation found:`);
        console.log(`   - Regulation: ${doc.regulation_type}`);
        console.log(`   - Version: ${doc.version}`);
        console.log(`   - Document Type: ${doc.document_type || 'N/A'}`);
        console.log(`   - Content Length: ${doc.content?.length || 0} characters`);
        console.log(`   - Created: ${doc.created_at}`);
        const filename = `${doc.regulation_type.replace(/\s+/g, '_')}_v${doc.version}_${docId.substring(0, 8)}.pdf`;
        console.log(`📄 [PDF DOWNLOAD] Filename: ${filename}`);
        console.log(`📄 [PDF DOWNLOAD] Converting markdown to HTML...`);
        // Convert markdown to HTML using marked
        const htmlContent = await marked_1.marked.parse(doc.content || '');
        console.log(`📄 [PDF DOWNLOAD] Creating beautiful HTML template...`);
        // Create beautiful HTML with professional styling
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1a1a1a;
      background-color: #ffffff;
      padding: 0;
    }
    
    .header {
      margin-bottom: 40px;
      padding-bottom: 25px;
      border-bottom: 3px solid #2563eb;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      padding: 30px 20px;
      border-radius: 8px;
      margin-bottom: 35px;
    }
    
    .header h1 {
      font-size: 28pt;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    
    .header-meta {
      font-size: 10.5pt;
      color: #64748b;
      line-height: 1.8;
    }
    
    .header-meta strong {
      color: #334155;
      font-weight: 600;
    }
    
    .content {
      padding: 0 5px;
    }
    
    h1 {
      font-size: 24pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 35px;
      margin-bottom: 18px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
      letter-spacing: -0.3px;
    }
    
    h2 {
      font-size: 19pt;
      font-weight: 600;
      color: #334155;
      margin-top: 30px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    h3 {
      font-size: 15pt;
      font-weight: 600;
      color: #475569;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    
    h4 {
      font-size: 13pt;
      font-weight: 600;
      color: #64748b;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    p {
      margin-bottom: 14px;
      margin-top: 0;
      text-align: justify;
      color: #1e293b;
      line-height: 1.75;
    }
    
    ul, ol {
      margin-top: 12px;
      margin-bottom: 18px;
      padding-left: 30px;
    }
    
    li {
      margin-bottom: 10px;
      line-height: 1.8;
      color: #334155;
    }
    
    li::marker {
      color: #2563eb;
    }
    
    strong {
      font-weight: 600;
      color: #1e293b;
    }
    
    em {
      font-style: italic;
      color: #475569;
    }
    
    code {
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 10pt;
      border: 1px solid #e2e8f0;
    }
    
    pre {
      background-color: #f8fafc;
      color: #0f172a;
      padding: 18px;
      border-radius: 6px;
      margin: 20px 0;
      overflow-x: auto;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 9.5pt;
      line-height: 1.6;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    pre code {
      background: none;
      padding: 0;
      border: none;
      font-size: inherit;
    }
    
    blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 20px;
      margin: 20px 0;
      color: #475569;
      font-style: italic;
      background-color: #f8fafc;
      padding: 15px 20px;
      border-radius: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 6px;
      overflow: hidden;
    }
    
    th, td {
      border: 1px solid #e2e8f0;
      padding: 12px 15px;
      text-align: left;
      color: #1e293b;
    }
    
    th {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10pt;
      letter-spacing: 0.5px;
    }
    
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    tr:hover {
      background-color: #f1f5f9;
    }
    
    hr {
      border: none;
      border-top: 2px solid #e2e8f0;
      margin: 30px 0;
    }
    
    a {
      color: #2563eb;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${doc.regulation_type}</h1>
    <div class="header-meta">
      <strong>Version:</strong> ${doc.version} &nbsp;|&nbsp;
      <strong>Generated:</strong> ${new Date(doc.created_at).toLocaleString()}
      ${doc.document_type && doc.document_type !== 'Compliance Summary' ? ` &nbsp;|&nbsp; <strong>Type:</strong> ${doc.document_type}` : ''}
      ${doc.ai_system_version ? ` &nbsp;|&nbsp; <strong>System Version:</strong> ${doc.ai_system_version}` : ''}
      ${doc.risk_assessment_version ? ` &nbsp;|&nbsp; <strong>Risk Assessment Version:</strong> ${doc.risk_assessment_version}` : ''}
    </div>
  </div>
  <div class="content">
    ${htmlContent}
  </div>
</body>
</html>
    `;
        console.log(`📄 [PDF DOWNLOAD] Launching Puppeteer browser...`);
        // Launch Puppeteer
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        try {
            console.log(`📄 [PDF DOWNLOAD] Creating new page...`);
            const page = await browser.newPage();
            console.log(`📄 [PDF DOWNLOAD] Setting content and waiting for fonts...`);
            await page.setContent(html, { waitUntil: 'networkidle0' });
            console.log(`📄 [PDF DOWNLOAD] Generating PDF...`);
            // Generate PDF with high quality settings
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                printBackground: true,
                preferCSSPageSize: true,
                displayHeaderFooter: false
            });
            console.log(`📄 [PDF DOWNLOAD] PDF generated successfully (${pdfBuffer.length} bytes)`);
            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length.toString());
            console.log(`📄 [PDF DOWNLOAD] Sending PDF to client...`);
            res.send(pdfBuffer);
            console.log(`✅ [PDF DOWNLOAD] PDF generation completed successfully`);
            console.log(`📄 [PDF DOWNLOAD] === PDF Download Request Completed ===\n`);
        }
        finally {
            console.log(`📄 [PDF DOWNLOAD] Closing browser...`);
            await browser.close();
        }
    }
    catch (error) {
        console.error(`\n❌ [PDF DOWNLOAD] === PDF Download Error ===`);
        console.error(`❌ [PDF DOWNLOAD] Document ID: ${docId}`);
        console.error(`❌ [PDF DOWNLOAD] Error Type: ${error?.constructor?.name || 'Unknown'}`);
        console.error(`❌ [PDF DOWNLOAD] Error Message: ${error?.message || 'Unknown error'}`);
        console.error(`❌ [PDF DOWNLOAD] Error Stack:`, error?.stack);
        console.error(`❌ [PDF DOWNLOAD] Headers Sent: ${res.headersSent}`);
        if (!res.headersSent) {
            console.error(`❌ [PDF DOWNLOAD] Sending error response to client...`);
            return res.status(500).json({
                error: "Internal server error",
                details: error.message
            });
        }
        else {
            console.error(`❌ [PDF DOWNLOAD] Cannot send error response - headers already sent`);
        }
        console.error(`❌ [PDF DOWNLOAD] === Error Handling Completed ===\n`);
    }
}
//# sourceMappingURL=documentation.controller.js.map