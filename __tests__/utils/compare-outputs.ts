/**
 * Pixelmatch Comparison Script
 *
 * Compares generated PDF images against golden references
 * and outputs difference statistics and diff images.
 *
 * Usage: npx tsx __tests__/utils/compare-outputs.ts
 */

import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const OUTPUT_DIR = path.join(__dirname, '../output');
const GOLDEN_DIR = path.join(__dirname, '../golden/pdf');
const DIFF_DIR = path.join(__dirname, '../output/diffs');

const templates = ['classic', 'modern', 'executive'] as const;

interface ComparisonResult {
  template: string;
  page: number;
  generatedFile: string;
  goldenFile: string;
  diffFile: string;
  width: number;
  height: number;
  totalPixels: number;
  differentPixels: number;
  percentDifferent: number;
  status: 'MATCH' | 'CLOSE' | 'DIFFERENT' | 'VERY_DIFFERENT' | 'MISSING';
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadPNG(filePath: string): PNG | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function compareImages(
  template: string,
  page: number,
  generatedPath: string,
  goldenPath: string
): ComparisonResult {
  const diffPath = path.join(DIFF_DIR, `${template}-page${page}-diff.png`);

  // Check if files exist
  if (!fs.existsSync(generatedPath)) {
    return {
      template,
      page,
      generatedFile: generatedPath,
      goldenFile: goldenPath,
      diffFile: diffPath,
      width: 0,
      height: 0,
      totalPixels: 0,
      differentPixels: 0,
      percentDifferent: 100,
      status: 'MISSING',
    };
  }

  if (!fs.existsSync(goldenPath)) {
    return {
      template,
      page,
      generatedFile: generatedPath,
      goldenFile: goldenPath,
      diffFile: diffPath,
      width: 0,
      height: 0,
      totalPixels: 0,
      differentPixels: 0,
      percentDifferent: 100,
      status: 'MISSING',
    };
  }

  // Load images
  const generated = loadPNG(generatedPath);
  const golden = loadPNG(goldenPath);

  if (!generated || !golden) {
    return {
      template,
      page,
      generatedFile: generatedPath,
      goldenFile: goldenPath,
      diffFile: diffPath,
      width: 0,
      height: 0,
      totalPixels: 0,
      differentPixels: 0,
      percentDifferent: 100,
      status: 'MISSING',
    };
  }

  // Handle size differences by using the larger dimensions
  const width = Math.max(generated.width, golden.width);
  const height = Math.max(generated.height, golden.height);

  // Create canvases of the same size
  const genCanvas = new PNG({ width, height });
  const goldCanvas = new PNG({ width, height });
  const diffCanvas = new PNG({ width, height });

  // Fill with white background
  for (let i = 0; i < width * height * 4; i += 4) {
    genCanvas.data[i] = 255;
    genCanvas.data[i + 1] = 255;
    genCanvas.data[i + 2] = 255;
    genCanvas.data[i + 3] = 255;
    goldCanvas.data[i] = 255;
    goldCanvas.data[i + 1] = 255;
    goldCanvas.data[i + 2] = 255;
    goldCanvas.data[i + 3] = 255;
  }

  // Copy generated image
  for (let y = 0; y < generated.height; y++) {
    for (let x = 0; x < generated.width; x++) {
      const srcIdx = (y * generated.width + x) * 4;
      const dstIdx = (y * width + x) * 4;
      genCanvas.data[dstIdx] = generated.data[srcIdx];
      genCanvas.data[dstIdx + 1] = generated.data[srcIdx + 1];
      genCanvas.data[dstIdx + 2] = generated.data[srcIdx + 2];
      genCanvas.data[dstIdx + 3] = generated.data[srcIdx + 3];
    }
  }

  // Copy golden image
  for (let y = 0; y < golden.height; y++) {
    for (let x = 0; x < golden.width; x++) {
      const srcIdx = (y * golden.width + x) * 4;
      const dstIdx = (y * width + x) * 4;
      goldCanvas.data[dstIdx] = golden.data[srcIdx];
      goldCanvas.data[dstIdx + 1] = golden.data[srcIdx + 1];
      goldCanvas.data[dstIdx + 2] = golden.data[srcIdx + 2];
      goldCanvas.data[dstIdx + 3] = golden.data[srcIdx + 3];
    }
  }

  // Run pixelmatch comparison
  const differentPixels = pixelmatch(
    genCanvas.data,
    goldCanvas.data,
    diffCanvas.data,
    width,
    height,
    {
      threshold: 0.1, // Color difference threshold (0-1)
      includeAA: false, // Ignore anti-aliasing differences
      alpha: 0.1, // Blend original image into diff
      diffColor: [255, 0, 0], // Red for differences
      diffColorAlt: [0, 255, 0], // Green for anti-aliased differences
    }
  );

  // Save diff image
  fs.writeFileSync(diffPath, PNG.sync.write(diffCanvas));

  const totalPixels = width * height;
  const percentDifferent = (differentPixels / totalPixels) * 100;

  let status: ComparisonResult['status'];
  if (percentDifferent === 0) {
    status = 'MATCH';
  } else if (percentDifferent < 1) {
    status = 'CLOSE';
  } else if (percentDifferent < 10) {
    status = 'DIFFERENT';
  } else {
    status = 'VERY_DIFFERENT';
  }

  return {
    template,
    page,
    generatedFile: generatedPath,
    goldenFile: goldenPath,
    diffFile: diffPath,
    width,
    height,
    totalPixels,
    differentPixels,
    percentDifferent,
    status,
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    PIXELMATCH COMPARISON                        ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();

  ensureDir(DIFF_DIR);

  const results: ComparisonResult[] = [];

  for (const template of templates) {
    console.log(`\n📁 ${template.toUpperCase()} TEMPLATE`);
    console.log('─'.repeat(50));

    // Find all generated pages
    const outputDir = path.join(OUTPUT_DIR, template);
    const goldenDir = path.join(GOLDEN_DIR, template);

    // Get page count from golden (reference)
    const goldenFiles = fs.existsSync(goldenDir)
      ? fs.readdirSync(goldenDir).filter(f => f.startsWith('reference-page') && f.endsWith('.png'))
      : [];

    const generatedFiles = fs.existsSync(outputDir)
      ? fs.readdirSync(outputDir).filter(f => f.startsWith('generated-page') && f.endsWith('.png'))
      : [];

    const maxPages = Math.max(goldenFiles.length, generatedFiles.length);

    if (maxPages === 0) {
      console.log('  ⚠️  No pages found for comparison');
      continue;
    }

    for (let page = 1; page <= maxPages; page++) {
      const generatedPath = path.join(outputDir, `generated-page${page}.png`);
      const goldenPath = path.join(goldenDir, `reference-page${page}.png`);

      const result = compareImages(template, page, generatedPath, goldenPath);
      results.push(result);

      const statusIcon = {
        'MATCH': '✅',
        'CLOSE': '🟡',
        'DIFFERENT': '🟠',
        'VERY_DIFFERENT': '🔴',
        'MISSING': '❌',
      }[result.status];

      console.log(`  Page ${page}: ${statusIcon} ${result.status}`);
      console.log(`         Dimensions: ${result.width}x${result.height}`);
      console.log(`         Different pixels: ${result.differentPixels.toLocaleString()} / ${result.totalPixels.toLocaleString()}`);
      console.log(`         Difference: ${result.percentDifferent.toFixed(2)}%`);

      if (result.status !== 'MISSING') {
        console.log(`         Diff image: ${result.diffFile}`);
      }
    }
  }

  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                         SUMMARY                                 ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();

  const summary = {
    total: results.length,
    match: results.filter(r => r.status === 'MATCH').length,
    close: results.filter(r => r.status === 'CLOSE').length,
    different: results.filter(r => r.status === 'DIFFERENT').length,
    veryDifferent: results.filter(r => r.status === 'VERY_DIFFERENT').length,
    missing: results.filter(r => r.status === 'MISSING').length,
  };

  console.log(`  Total comparisons: ${summary.total}`);
  console.log(`  ✅ Perfect match (0%):     ${summary.match}`);
  console.log(`  🟡 Close (<1%):            ${summary.close}`);
  console.log(`  🟠 Different (1-10%):      ${summary.different}`);
  console.log(`  🔴 Very different (>10%):  ${summary.veryDifferent}`);
  console.log(`  ❌ Missing:                ${summary.missing}`);
  console.log();

  // Calculate overall score
  const avgDiff = results
    .filter(r => r.status !== 'MISSING')
    .reduce((sum, r) => sum + r.percentDifferent, 0) / results.filter(r => r.status !== 'MISSING').length;

  console.log(`  📊 Average difference: ${avgDiff.toFixed(2)}%`);
  console.log();

  // Table view
  console.log('┌────────────┬──────┬────────────────┬─────────────┐');
  console.log('│ Template   │ Page │ Different (%)  │ Status      │');
  console.log('├────────────┼──────┼────────────────┼─────────────┤');
  for (const r of results) {
    const tmpl = r.template.padEnd(10);
    const pg = String(r.page).padStart(4);
    const pct = r.percentDifferent.toFixed(2).padStart(12) + '%';
    const st = r.status.padEnd(11);
    console.log(`│ ${tmpl} │ ${pg} │ ${pct} │ ${st} │`);
  }
  console.log('└────────────┴──────┴────────────────┴─────────────┘');

  console.log('\n📁 Diff images saved to:', DIFF_DIR);
  console.log('\n💡 To view diffs: open __tests__/output/diffs/');
}

main().catch(console.error);
