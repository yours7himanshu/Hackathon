import fs from 'fs';
import path from 'path';

/**
 * This script fixes the pdf-parse library issue on serverless environments like Vercel.
 * The pdf-parse library attempts to read './test/data/05-versions-space.pdf' in some conditions,
 * causing an ENOENT error on serverless environments.
 */
export function setupPdfParseEnvironment() {
  try {
    // Ensure the directory exists
    const testDataDir = path.join(process.cwd(), 'test', 'data');
    const testPdfPath = path.join(testDataDir, '05-versions-space.pdf');
    
    // Check if directory exists, create it if not
    if (!fs.existsSync(testDataDir)) {
      console.log('Creating test/data directory for pdf-parse compatibility');
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Create a minimal valid PDF file if it doesn't exist
    if (!fs.existsSync(testPdfPath)) {
      console.log('Creating placeholder PDF file for pdf-parse compatibility');
      
      // This is the simplest possible valid PDF file
      const minimalPdf = Buffer.from('%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\ntrailer<</Root 1 0 R>>');
      fs.writeFileSync(testPdfPath, minimalPdf);
    }
    
    console.log('pdf-parse environment setup complete');
    return true;
  } catch (error) {
    console.error('Failed to setup pdf-parse environment:', error);
    return false;
  }
}