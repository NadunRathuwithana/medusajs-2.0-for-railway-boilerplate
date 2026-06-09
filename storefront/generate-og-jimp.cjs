const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

async function createOgImage() {
  try {
    const inputPath = path.join(__dirname, 'public', 'Logo.png');
    const outputPath = path.join(__dirname, 'public', 'og-image.jpg');
    
    if (!fs.existsSync(inputPath)) {
      console.error(`Input file not found: ${inputPath}`);
      return;
    }

    console.log('Generating OG Image with Jimp...');
    
    // Create a 1200x630 white background
    const bg = new Jimp(1200, 630, '#FFFFFF');

    // Read the logo
    const logo = await Jimp.read(inputPath);
    
    // Resize logo to fit within 600x400
    logo.scaleToFit(600, 400);

    // Calculate center position
    const x = (1200 - logo.bitmap.width) / 2;
    const y = (630 - logo.bitmap.height) / 2;

    // Composite logo onto background
    bg.composite(logo, x, y);

    // Write the output
    await bg.writeAsync(outputPath);
    console.log(`Successfully created OpenGraph image at ${outputPath}`);
  } catch (err) {
    console.error('Error generating OG image:', err);
  }
}

createOgImage();
