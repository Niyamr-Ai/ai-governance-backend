import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { analyzeGovernanceDocument } from "../../services/ai/governance-document-analyzer";

// Polyfill for DOMMatrix (required by pdfjs-dist in Node.js)
if (typeof (global as any).DOMMatrix === 'undefined') {
  // Simple DOMMatrix polyfill for Node.js
  (global as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(init?: string | number[]) {
      if (init) {
        if (typeof init === 'string') {
          const values = init.match(/matrix\(([^)]+)\)/)?.[1]?.split(',').map(v => parseFloat(v.trim()));
          if (values && values.length >= 6) {
            this.a = values[0]; this.b = values[1]; this.c = values[2];
            this.d = values[3]; this.e = values[4]; this.f = values[5];
          }
        }
      }
    }
  };
}

// Lazy load native modules to avoid issues
function loadNativeModules() {
  const tesseract = require("tesseract.js");
  const pdfParse = require("pdf-parse");
  const canvas = require("canvas");
  
  // pdfjs-dist is not needed anymore - we only use pdf-parse for PDF text extraction
  // Keeping it optional in case we want to add OCR for scanned PDFs later
  let pdfjsLib = null;
  try {
    pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
    console.log("   ✅ [OCR] Loaded pdfjs-dist legacy build (optional, not currently used)");
  } catch (e) {
    // pdfjs-dist is optional - we don't use it for PDF processing anymore
    console.log("   ℹ️  [OCR] pdfjs-dist not available (optional, not needed for current implementation)");
  }
  
  return {
    createWorker: tesseract.createWorker,
    Worker: tesseract.Worker,
    pdfParse,
    pdfjsLib, // Optional, not used currently
    createCanvas: canvas.createCanvas,
  };
}

// Initialize modules and worker
let modules: any = null;
let worker: any = null;

async function getWorker(): Promise<any> {
  if (!modules) {
    modules = loadNativeModules();
  }
  if (!worker) {
    worker = await modules.createWorker('eng');
  }
  return worker;
}

async function cleanupWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Extract text from PDF files
async function ocrPdf(buffer: Buffer, fileName: string): Promise<string> {
  if (!modules) {
    modules = loadNativeModules();
  }
  
  console.log(`   📄 [PDF] File: ${fileName}`);
  console.log(`   📊 [PDF] File size: ${buffer.length} bytes`);
  
  try {
    // Use pdf-parse for text extraction (works for both text-based and scanned PDFs)
    // Note: For scanned PDFs, pdf-parse may return limited text, but it's more reliable
    // than trying to use pdfjs-dist which has Node.js compatibility issues
    console.log(`   🔍 [PDF] Extracting text using pdf-parse...`);
    const pdfData = await modules.pdfParse(buffer);
    const textLength = pdfData.text ? pdfData.text.trim().length : 0;
    console.log(`   📄 [PDF] Text extraction result: ${textLength} characters from ${pdfData.numpages} page(s)`);
    
    if (pdfData.text && pdfData.text.trim().length > 0) {
      console.log(`   ✅ [PDF] Text extracted successfully (${textLength} chars)`);
      return pdfData.text;
    } else {
      console.log(`   ⚠️  [PDF] No text extracted - PDF may be image-based/scanned`);
      console.log(`   💡 [PDF] Note: For scanned PDFs, consider converting to images first`);
      return `[PDF file: ${fileName}] - Text extraction completed but no text found. This may be a scanned/image-based PDF.`;
    }
  } catch (error: any) {
    console.error(`   ❌ [PDF] Error processing PDF ${fileName}:`, error.message);
    throw error;
  }
}

// OCR image files
async function ocrImage(buffer: Buffer, fileName: string): Promise<string> {
  console.log(`   🖼️  [OCR] Image file: ${fileName}`);
  console.log(`   📊 [OCR] File size: ${buffer.length} bytes`);
  console.log(`   🔧 [OCR] Initializing Tesseract.js OCR worker...`);
  try {
    const worker = await getWorker();
    console.log(`   ✅ [OCR] Tesseract.js worker ready`);
    console.log(`   🔍 [OCR] Running OCR extraction...`);
    const { data: { text } } = await worker.recognize(buffer);
    const textLength = text ? text.trim().length : 0;
    console.log(`   ✅ [OCR] OCR completed: ${textLength} characters extracted`);
    return text || "";
  } catch (error: any) {
    console.error(`   ❌ [OCR] OCR failed: ${error.message}`);
    throw error;
  }
}

// Read text files directly
function readTextFile(buffer: Buffer, fileName: string): string {
  console.log(`   📝 [TEXT] Reading file: ${fileName}, size: ${buffer.length} bytes`);
  const text = buffer.toString('utf-8');
  const textLength = text ? text.trim().length : 0;
  console.log(`   ✅ [TEXT] Read ${textLength} characters from ${fileName}`);
  return text;
}

export async function processEvidence(req: Request, res: Response) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📤 [EVIDENCE UPLOAD] ===== Evidence Upload Request Received =====`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    // Load native modules first
    if (!modules) {
      console.log(`🔧 [EVIDENCE UPLOAD] Loading OCR modules (Tesseract.js, pdfjs-dist, canvas)...`);
      modules = loadNativeModules();
      console.log(`✅ [EVIDENCE UPLOAD] OCR modules loaded successfully\n`);
    }
    
    // Get uploaded files from multer
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      console.error(`❌ [EVIDENCE UPLOAD] No files in request`);
      return res.status(400).json({ error: 'No files provided' });
    }
    
    console.log(`📁 [EVIDENCE UPLOAD] Processing ${files.length} file(s) for OCR extraction\n`);
    
    const results: Record<string, string> = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.originalname || file.filename || 'unknown';
      const filePath = file.path;
      const mimeType = file.mimetype || '';
      
      console.log(`${'─'.repeat(80)}`);
      console.log(`📄 [EVIDENCE UPLOAD] File ${i + 1}/${files.length}: ${fileName}`);
      console.log(`   Type: ${mimeType || 'unknown'}`);
      console.log(`   Size: ${file.size || 'unknown'} bytes`);
      console.log(`${'─'.repeat(80)}`);

      try {
        // Read file buffer
        const fileBuffer = fs.readFileSync(filePath);
        console.log(`📖 [EVIDENCE UPLOAD] File buffer read: ${fileBuffer.length} bytes`);

        let extractedText = "";
        let usedOCR = false;

        if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
          console.log(`\n📄 [PDF] PDF file detected - Starting text extraction...`);
          console.log(`📄 [PDF] Method: pdf-parse (text extraction)\n`);
          usedOCR = false; // PDF uses text extraction, not OCR
          extractedText = await ocrPdf(fileBuffer, fileName);
        } else if (mimeType.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(fileName)) {
          console.log(`\n🔍 [OCR] Image file detected - Starting OCR extraction process...`);
          console.log(`🔍 [OCR] Method: Tesseract.js OCR (direct image processing)\n`);
          usedOCR = true;
          extractedText = await ocrImage(fileBuffer, fileName);
        } else if (mimeType === 'text/plain' || fileName.toLowerCase().endsWith('.txt')) {
          console.log(`\n📝 [TEXT] Text file detected - Reading directly (no OCR needed)\n`);
          extractedText = readTextFile(fileBuffer, fileName);
        } else {
          console.warn(`\n⚠️  [EVIDENCE UPLOAD] Unsupported file type: ${mimeType} for ${fileName}\n`);
          extractedText = `[Unsupported file type: ${mimeType}]`;
        }

        results[fileName] = extractedText;
        
        if (usedOCR) {
          console.log(`\n✅ [OCR] OCR extraction completed for ${fileName}`);
          console.log(`   Extracted text length: ${extractedText.length} characters`);
        } else if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
          console.log(`\n✅ [PDF] PDF text extraction completed for ${fileName}`);
          console.log(`   Extracted text length: ${extractedText.length} characters`);
        } else {
          console.log(`\n✅ [EVIDENCE UPLOAD] File processed successfully: ${fileName}`);
          console.log(`   Content length: ${extractedText.length} characters`);
        }
        console.log(`${'─'.repeat(80)}\n`);
        
        // Clean up temporary file
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.warn(`⚠️  [EVIDENCE UPLOAD] Could not delete temp file ${filePath}`);
        }
      } catch (fileError: any) {
        console.error(`\n❌ [EVIDENCE UPLOAD] Error processing ${fileName}:`, fileError.message);
        console.error(`   Stack:`, fileError.stack);
        console.log(`${'─'.repeat(80)}\n`);
        results[fileName] = `[Error processing file: ${fileError.message}]`;
      }
    }

    console.log(`${'='.repeat(80)}`);
    console.log(`✅ [EVIDENCE UPLOAD] ===== All files processed successfully =====`);
    console.log(`   Total files: ${files.length}`);
    console.log(`   Results: ${Object.keys(results).length} file(s) processed`);
    console.log(`${'='.repeat(80)}\n`);
    
    return res.status(200).json({ files: results });
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [EVIDENCE UPLOAD] ===== Fatal Error =====`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`${'='.repeat(80)}\n`);
    return res.status(500).json({ error: 'Failed to process evidence files', message: error.message });
  } finally {
    // Cleanup worker
    await cleanupWorker();
  }
}

/**
 * POST /api/analyze-governance-document
 * Analyzes extracted text from a governance document and returns structured data
 * for auto-populating form fields
 * @deprecated Use /api/analyze-document instead
 */
export async function analyzeGovernanceDocumentEndpoint(req: Request, res: Response) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🤖 [GOVERNANCE ANALYZER] ===== Analyze Governance Document Request =====`);
  console.log(`⚠️  [GOVERNANCE ANALYZER] This endpoint is deprecated. Use /api/analyze-document instead.`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const { documentText, formType } = req.body;

    if (!documentText || typeof documentText !== 'string') {
      console.error(`❌ [GOVERNANCE ANALYZER] Missing or invalid documentText`);
      return res.status(400).json({ 
        error: 'documentText is required and must be a string' 
      });
    }

    const validFormType = formType === 'UK' ? 'UK' : 'MAS';
    const evidenceKey = validFormType === 'UK' ? 'uk_accountability_evidence' : 'governance_evidence';
    
    console.log(`📋 [GOVERNANCE ANALYZER] Form type: ${validFormType}`);
    console.log(`📋 [GOVERNANCE ANALYZER] Evidence key: ${evidenceKey}`);
    console.log(`📄 [GOVERNANCE ANALYZER] Document text length: ${documentText.length} characters`);

    // Use the new universal analyzer
    const { analyzeDocument } = await import("../../services/ai/universal-document-analyzer");
    const result = await analyzeDocument(documentText, evidenceKey);

    console.log(`${'='.repeat(80)}`);
    console.log(`✅ [GOVERNANCE ANALYZER] ===== Analysis completed successfully =====`);
    console.log(`${'='.repeat(80)}\n`);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [GOVERNANCE ANALYZER] ===== Error =====`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`${'='.repeat(80)}\n`);
    return res.status(500).json({ 
      error: 'Failed to analyze governance document', 
      message: error.message 
    });
  }
}

/**
 * POST /api/analyze-document
 * Universal endpoint for analyzing any evidence document and returning structured data
 * for auto-populating form fields
 */
export async function analyzeDocumentEndpoint(req: Request, res: Response) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🤖 [DOCUMENT ANALYZER] ===== Analyze Document Request =====`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const { documentText, evidenceKey } = req.body;

    if (!documentText || typeof documentText !== 'string') {
      console.error(`❌ [DOCUMENT ANALYZER] Missing or invalid documentText`);
      return res.status(400).json({ 
        error: 'documentText is required and must be a string' 
      });
    }

    if (!evidenceKey || typeof evidenceKey !== 'string') {
      console.error(`❌ [DOCUMENT ANALYZER] Missing or invalid evidenceKey`);
      return res.status(400).json({ 
        error: 'evidenceKey is required and must be a string' 
      });
    }

    console.log(`📋 [DOCUMENT ANALYZER] Evidence key: ${evidenceKey}`);
    console.log(`📄 [DOCUMENT ANALYZER] Document text length: ${documentText.length} characters`);

    const { analyzeDocument } = await import("../../services/ai/universal-document-analyzer");
    const result = await analyzeDocument(documentText, evidenceKey);

    console.log(`${'='.repeat(80)}`);
    console.log(`✅ [DOCUMENT ANALYZER] ===== Analysis completed successfully =====`);
    console.log(`${'='.repeat(80)}\n`);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [DOCUMENT ANALYZER] ===== Error =====`);
    console.error(`   Evidence Key: ${req.body.evidenceKey || 'unknown'}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`${'='.repeat(80)}\n`);
    return res.status(500).json({ 
      error: 'Failed to analyze document', 
      message: error.message 
    });
  }
}

