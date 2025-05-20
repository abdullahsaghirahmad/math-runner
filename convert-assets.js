const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'src', 'assets');

// Convert SVG to PNG
async function convertSvgToPng(svgFile) {
  const pngFile = svgFile.replace('.svg', '.png');
  await sharp(svgFile)
    .png()
    .toFile(pngFile);
  console.log(`Converted ${svgFile} to ${pngFile}`);
}

// Convert all SVG files
async function convertAllAssets() {
  const files = ['player.svg', 'obstacle.svg', 'mathProblem.svg'];
  
  for (const file of files) {
    const svgPath = path.join(assetsDir, file);
    if (fs.existsSync(svgPath)) {
      await convertSvgToPng(svgPath);
    }
  }
}

convertAllAssets().catch(console.error); 