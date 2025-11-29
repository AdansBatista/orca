/**
 * Script to convert PNG to ICO
 * Run with: node scripts/generate-ico.mjs
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const pngPath = 'public/images/logo/orca-icon.png';
const icoPath = 'public/images/logo/orca-icon.ico';

if (!existsSync(pngPath)) {
  console.error(`Error: ${pngPath} not found`);
  process.exit(1);
}

console.log('Converting PNG to ICO...');
console.log('');
console.log('Since Node.js cannot natively create ICO files, please use one of these methods:');
console.log('');
console.log('1. Online converter (recommended):');
console.log('   - https://convertio.co/png-ico/');
console.log('   - https://cloudconvert.com/png-to-ico');
console.log('   - https://favicon.io/favicon-converter/');
console.log('');
console.log('2. ImageMagick (if installed):');
console.log('   magick convert public/images/logo/orca-icon.png -define icon:auto-resize=256,128,64,48,32,16 public/images/logo/orca-icon.ico');
console.log('');
console.log('3. GIMP:');
console.log('   - Open the PNG in GIMP');
console.log('   - Export as .ico');
console.log('   - Select sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256');
console.log('');
