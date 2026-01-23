/**
 * Generate Golden Files from Reference PDFs
 *
 * This script converts the reference PDF templates to PNG images
 * for use in visual regression testing.
 *
 * Usage: npx tsx __tests__/utils/generate-goldens.ts
 */

import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.join(__dirname, '../../docs');
const GOLDEN_DIR = path.join(__dirname, '../golden/pdf');

// Map reference PDFs to template names
const TEMPLATE_MAP: Record<string, string> = {
  'Template 2 .pdf': 'classic',
  'Template 5.pdf': 'modern',
  'Template 6.pdf': 'executive',
};

async function generateGoldens() {
  // Dynamic import for ESM module
  const { pdf } = await import('pdf-to-img');

  for (const [pdfFile, templateName] of Object.entries(TEMPLATE_MAP)) {
    const pdfPath = path.join(DOCS_DIR, pdfFile);
    const outputDir = path.join(GOLDEN_DIR, templateName);

    if (!fs.existsSync(pdfPath)) {
      console.log(`[Skip] PDF not found: ${pdfPath}`);
      continue;
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`[Processing] ${pdfFile} -> ${templateName}`);

    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const document = await pdf(pdfBuffer, { scale: 2 }); // 150 DPI equivalent

      let pageNum = 1;
      for await (const page of document) {
        const outputPath = path.join(outputDir, `reference-page${pageNum}.png`);
        fs.writeFileSync(outputPath, page);
        console.log(`  [Saved] ${outputPath}`);
        pageNum++;
      }
    } catch (error) {
      console.error(`[Error] Failed to process ${pdfFile}:`, error);
    }
  }

  console.log('\n[Done] Golden files generated successfully!');
}

generateGoldens().catch(console.error);
