/**
 * Universal Document Analyzer Service
 *
 * Analyzes various types of evidence documents (PDF/DOC/TXT) and extracts structured information
 * to auto-populate compliance form fields based on the evidence type.
 */
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
export declare function analyzeDocument(documentText: string, evidenceKey: string): Promise<DocumentAnalysisResult>;
//# sourceMappingURL=universal-document-analyzer.d.ts.map