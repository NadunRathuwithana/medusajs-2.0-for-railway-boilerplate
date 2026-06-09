const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createOgImage() {
  try {
    const inputPath = path.join(__dirname, 'public', 'Logo.png');
    const outputPath = path.join(__dirname, 'public', 'og-image.jpg');
    
    // Check if Logo.png exists
    if (!fs.existsSync(inputPath)) {
      console.error(`Input file not found: ${inputPath}`);
      return;
    }

    console.log('Generating OG Image...');
    
    // Create a 1200x630 white background image
    const background = await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    }).jpeg().toBuffer();

    // Resize the logo to fit nicely (e.g., 600px max width/height)
    const logo = await sharp(inputPath)
      .resize({ width: 600, height: 400, fit: 'inside' })
      .toBuffer();

    // Composite the logo onto the center of the white background
    await sharp(background)
      .composite([
        {
          input: logo,
          gravity: 'center'
        }
      ])
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    console.log(`Successfully created OpenGraph image at ${outputPath}`);
  } catch (err) {
    console.error('Error generating OG image:', err);
  }
}

createOgImage();
