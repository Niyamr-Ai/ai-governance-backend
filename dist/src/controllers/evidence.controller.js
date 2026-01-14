"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.processEvidence = processEvidence;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
// Polyfill for DOMMatrix (required by pdfjs-dist in Node.js)
if (typeof global.DOMMatrix === 'undefined') {
    // Simple DOMMatrix polyfill for Node.js
    global.DOMMatrix = class DOMMatrix {
        constructor(init) {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
            if (init) {
                if (typeof init === 'string') {
                    const values = init.match(/matrix\(([^)]+)\)/)?.[1]?.split(',').map(v => parseFloat(v.trim()));
                    if (values && values.length >= 6) {
                        this.a = values[0];
                        this.b = values[1];
                        this.c = values[2];
                        this.d = values[3];
                        this.e = values[4];
                        this.f = values[5];
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
    }
    catch (e) {
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
let modules = null;
let worker = null;
async function getWorker() {
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
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'tmp', 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});
// Extract text from PDF files
async function ocrPdf(buffer, fileName) {
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
        }
        else {
            console.log(`   ⚠️  [PDF] No text extracted - PDF may be image-based/scanned`);
            console.log(`   💡 [PDF] Note: For scanned PDFs, consider converting to images first`);
            return `[PDF file: ${fileName}] - Text extraction completed but no text found. This may be a scanned/image-based PDF.`;
        }
    }
    catch (error) {
        console.error(`   ❌ [PDF] Error processing PDF ${fileName}:`, error.message);
        throw error;
    }
}
// OCR image files
async function ocrImage(buffer, fileName) {
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
    }
    catch (error) {
        console.error(`   ❌ [OCR] OCR failed: ${error.message}`);
        throw error;
    }
}
// Read text files directly
function readTextFile(buffer, fileName) {
    console.log(`   📝 [TEXT] Reading file: ${fileName}, size: ${buffer.length} bytes`);
    const text = buffer.toString('utf-8');
    const textLength = text ? text.trim().length : 0;
    console.log(`   ✅ [TEXT] Read ${textLength} characters from ${fileName}`);
    return text;
}
async function processEvidence(req, res) {
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
        const files = req.files;
        if (!files || files.length === 0) {
            console.error(`❌ [EVIDENCE UPLOAD] No files in request`);
            return res.status(400).json({ error: 'No files provided' });
        }
        console.log(`📁 [EVIDENCE UPLOAD] Processing ${files.length} file(s) for OCR extraction\n`);
        const results = {};
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
                const fileBuffer = fs_1.default.readFileSync(filePath);
                console.log(`📖 [EVIDENCE UPLOAD] File buffer read: ${fileBuffer.length} bytes`);
                let extractedText = "";
                let usedOCR = false;
                if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
                    console.log(`\n📄 [PDF] PDF file detected - Starting text extraction...`);
                    console.log(`📄 [PDF] Method: pdf-parse (text extraction)\n`);
                    usedOCR = false; // PDF uses text extraction, not OCR
                    extractedText = await ocrPdf(fileBuffer, fileName);
                }
                else if (mimeType.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(fileName)) {
                    console.log(`\n🔍 [OCR] Image file detected - Starting OCR extraction process...`);
                    console.log(`🔍 [OCR] Method: Tesseract.js OCR (direct image processing)\n`);
                    usedOCR = true;
                    extractedText = await ocrImage(fileBuffer, fileName);
                }
                else if (mimeType === 'text/plain' || fileName.toLowerCase().endsWith('.txt')) {
                    console.log(`\n📝 [TEXT] Text file detected - Reading directly (no OCR needed)\n`);
                    extractedText = readTextFile(fileBuffer, fileName);
                }
                else {
                    console.warn(`\n⚠️  [EVIDENCE UPLOAD] Unsupported file type: ${mimeType} for ${fileName}\n`);
                    extractedText = `[Unsupported file type: ${mimeType}]`;
                }
                results[fileName] = extractedText;
                if (usedOCR) {
                    console.log(`\n✅ [OCR] OCR extraction completed for ${fileName}`);
                    console.log(`   Extracted text length: ${extractedText.length} characters`);
                }
                else if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
                    console.log(`\n✅ [PDF] PDF text extraction completed for ${fileName}`);
                    console.log(`   Extracted text length: ${extractedText.length} characters`);
                }
                else {
                    console.log(`\n✅ [EVIDENCE UPLOAD] File processed successfully: ${fileName}`);
                    console.log(`   Content length: ${extractedText.length} characters`);
                }
                console.log(`${'─'.repeat(80)}\n`);
                // Clean up temporary file
                try {
                    fs_1.default.unlinkSync(filePath);
                }
                catch (unlinkError) {
                    console.warn(`⚠️  [EVIDENCE UPLOAD] Could not delete temp file ${filePath}`);
                }
            }
            catch (fileError) {
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
    }
    catch (error) {
        console.error(`\n${'='.repeat(80)}`);
        console.error(`❌ [EVIDENCE UPLOAD] ===== Fatal Error =====`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        console.error(`${'='.repeat(80)}\n`);
        return res.status(500).json({ error: 'Failed to process evidence files', message: error.message });
    }
    finally {
        // Cleanup worker
        await cleanupWorker();
    }
}
//# sourceMappingURL=evidence.controller.js.map