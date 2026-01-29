/**
 * Global Documentation API Controller
 *
 * GET /api/documentation - Returns all documentation across all AI systems with system information
 * GET /api/documentation/:id/pdf - Downloads documentation as PDF
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../../src/lib/supabase';
import PDFDocument from 'pdfkit';

/**
 * GET /api/documentation
 * Returns all documentation across all AI systems with system information
 */
export async function getDocumentation(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const supabase = supabaseAdmin;

    // Filter parameters
    const regulationType = req.query.regulation_type as string;
    const documentType = req.query.document_type as string;
    const systemId = req.query.ai_system_id as string;
    const status = req.query.status as string;

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
    const enrichedDocs = await Promise.all(
      (docs || []).map(async (doc) => {
        let systemName = "Unknown System";
        let systemType: string | null = null;

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
        } else if (ukCheck.data) {
          systemName = ukCheck.data.system_name || `UK System ${doc.ai_system_id.substring(0, 8)}`;
          systemType = "UK AI Act";
        } else if (masCheck.data) {
          systemName = masCheck.data.system_name || `MAS System ${doc.ai_system_id.substring(0, 8)}`;
          systemType = "MAS";
        }

        return {
          ...doc,
          system_name: systemName,
          system_type: systemType,
        };
      })
    );

    return res.status(200).json({
      documentation: enrichedDocs,
      total: enrichedDocs.length
    });
  } catch (error: any) {
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
export async function getDocumentationPDF(req: Request, res: Response) {
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
    const supabase = supabaseAdmin;

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

    console.log(`📄 [PDF DOWNLOAD] Creating PDF document...`);
    // Create PDF
    const doc_pdf = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    const filename = `${doc.regulation_type.replace(/\s+/g, '_')}_v${doc.version}_${docId.substring(0, 8)}.pdf`;
    console.log(`📄 [PDF DOWNLOAD] Setting response headers...`);
    console.log(`📄 [PDF DOWNLOAD] Filename: ${filename}`);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    console.log(`📄 [PDF DOWNLOAD] Piping PDF to response stream...`);
    doc_pdf.pipe(res);

    console.log(`📄 [PDF DOWNLOAD] Adding title and metadata to PDF...`);
    // Add title
    doc_pdf.fontSize(20).font('Helvetica-Bold').text(doc.regulation_type, { align: 'center' });
    doc_pdf.moveDown(0.5);
    doc_pdf.fontSize(14).font('Helvetica').text(`Version ${doc.version}`, { align: 'center' });
    doc_pdf.moveDown(1);

    // Add metadata
    doc_pdf.fontSize(10).font('Helvetica').fillColor('gray');
    if (doc.document_type) {
      doc_pdf.text(`Document Type: ${doc.document_type}`);
    }
    doc_pdf.text(`Generated: ${new Date(doc.created_at).toLocaleString()}`);
    if (doc.ai_system_version) {
      doc_pdf.text(`AI System Version: ${doc.ai_system_version}`);
    }
    if (doc.risk_assessment_version) {
      doc_pdf.text(`Risk Assessment Version: ${doc.risk_assessment_version}`);
    }
    doc_pdf.moveDown(1);

    // Add content
    console.log(`📄 [PDF DOWNLOAD] Processing content (${doc.content?.length || 0} chars)...`);
    doc_pdf.fontSize(12).font('Helvetica').fillColor('black');
    
    // Convert markdown to plain text for PDF (simple conversion)
    const content = doc.content || '';
    
    // Split content into lines and process
    const lines = content.split('\n');
    console.log(`📄 [PDF DOWNLOAD] Content split into ${lines.length} lines`);
    let inCodeBlock = false;
    let lineCount = 0;
    
    for (const line of lines) {
      lineCount++;
      try {
        if (line.trim().startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          continue;
        }
        
        if (inCodeBlock) {
          // Code block - use monospace font
          doc_pdf.font('Courier').fontSize(10).fillColor('black');
          doc_pdf.text(line, { continued: false });
          doc_pdf.font('Helvetica').fontSize(12);
        } else if (line.trim().startsWith('# ')) {
          // H1
          doc_pdf.fontSize(18).font('Helvetica-Bold').text(line.substring(2), { paragraphGap: 5 });
          doc_pdf.moveDown(0.5);
        } else if (line.trim().startsWith('## ')) {
          // H2
          doc_pdf.fontSize(16).font('Helvetica-Bold').text(line.substring(3), { paragraphGap: 5 });
          doc_pdf.moveDown(0.5);
        } else if (line.trim().startsWith('### ')) {
          // H3
          doc_pdf.fontSize(14).font('Helvetica-Bold').text(line.substring(4), { paragraphGap: 5 });
          doc_pdf.moveDown(0.5);
        } else if (line.trim().startsWith('#### ')) {
          // H4
          doc_pdf.fontSize(12).font('Helvetica-Bold').text(line.substring(5), { paragraphGap: 5 });
          doc_pdf.moveDown(0.5);
        } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          // List item
          doc_pdf.text(`  • ${line.substring(2)}`, { paragraphGap: 3 });
        } else if (line.trim() === '') {
          // Empty line
          doc_pdf.moveDown(0.5);
        } else {
          // Regular text
          doc_pdf.text(line, { paragraphGap: 3 });
        }
      } catch (lineError: any) {
        console.error(`⚠️  [PDF DOWNLOAD] Error processing line ${lineCount}:`, lineError.message);
        console.error(`⚠️  [PDF DOWNLOAD] Line content (first 100 chars): ${line.substring(0, 100)}`);
        // Continue processing other lines
      }
    }

    console.log(`📄 [PDF DOWNLOAD] Processed ${lineCount} lines successfully`);
    console.log(`📄 [PDF DOWNLOAD] Finalizing PDF...`);
    
    // Finalize PDF
    doc_pdf.end();
    
    console.log(`✅ [PDF DOWNLOAD] PDF generation completed successfully`);
    console.log(`📄 [PDF DOWNLOAD] === PDF Download Request Completed ===\n`);

  } catch (error: any) {
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
    } else {
      console.error(`❌ [PDF DOWNLOAD] Cannot send error response - headers already sent`);
    }
    console.error(`❌ [PDF DOWNLOAD] === Error Handling Completed ===\n`);
  }
}