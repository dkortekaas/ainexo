const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const publicDir = path.join(__dirname, '..', 'public');

  console.log('🖼️  Starting image optimization...\n');

  try {
    // 1. Optimize favicon.png (500KB -> <2KB)
    // Create multiple sizes for different use cases
    console.log('📝 Optimizing favicon.png (500KB -> <2KB)...');
    await sharp(path.join(publicDir, 'favicon.png'))
      .resize(32, 32, { fit: 'cover' })
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toFile(path.join(publicDir, 'favicon-32x32.png'));

    await sharp(path.join(publicDir, 'favicon.png'))
      .resize(16, 16, { fit: 'cover' })
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toFile(path.join(publicDir, 'favicon-16x16.png'));

    // Replace original with 192x192 for PWA
    await sharp(path.join(publicDir, 'favicon.png'))
      .resize(192, 192, { fit: 'cover' })
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(path.join(publicDir, 'favicon-192x192.png'));

    await sharp(path.join(publicDir, 'favicon.png'))
      .resize(512, 512, { fit: 'cover' })
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(path.join(publicDir, 'favicon-512x512.png'));

    console.log('✅ Favicon optimized\n');

    // 2. Optimize hero-illustration.jpg (96KB -> <35KB)
    console.log('🎨 Optimizing hero-illustration.jpg (96KB -> <35KB)...');

    // Create optimized JPEG version
    await sharp(path.join(publicDir, 'hero-illustration.jpg'))
      .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75, progressive: true, mozjpeg: true })
      .toFile(path.join(publicDir, 'hero-illustration-optimized.jpg'));

    // Create WebP version (better compression)
    await sharp(path.join(publicDir, 'hero-illustration.jpg'))
      .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(publicDir, 'hero-illustration.webp'));

    // Create mobile version (smaller)
    await sharp(path.join(publicDir, 'hero-illustration.jpg'))
      .resize(640, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(path.join(publicDir, 'hero-illustration-mobile.webp'));

    console.log('✅ Hero illustration optimized\n');

    // 3. Optimize ainexo-logo.png (74KB -> <8KB)
    console.log('🏷️  Optimizing ainexo-logo.png (74KB -> <8KB)...');

    // Create optimized PNG
    await sharp(path.join(publicDir, 'ainexo-logo.png'))
      .resize(200, null, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toFile(path.join(publicDir, 'ainexo-logo-optimized.png'));

    // Create WebP version
    await sharp(path.join(publicDir, 'ainexo-logo.png'))
      .resize(200, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90, lossless: true })
      .toFile(path.join(publicDir, 'ainexo-logo.webp'));

    console.log('✅ Logo optimized\n');

    // Print file sizes
    console.log('📊 File size comparison:');
    console.log('========================');

    const getFileSize = (filepath) => {
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        return `${(stats.size / 1024).toFixed(1)}KB`;
      }
      return 'N/A';
    };

    console.log('\nFavicon:');
    console.log(`  Original:        ${getFileSize(path.join(publicDir, 'favicon.png'))}`);
    console.log(`  16x16:           ${getFileSize(path.join(publicDir, 'favicon-16x16.png'))}`);
    console.log(`  32x32:           ${getFileSize(path.join(publicDir, 'favicon-32x32.png'))}`);
    console.log(`  192x192 (PWA):   ${getFileSize(path.join(publicDir, 'favicon-192x192.png'))}`);
    console.log(`  512x512 (PWA):   ${getFileSize(path.join(publicDir, 'favicon-512x512.png'))}`);

    console.log('\nHero Illustration:');
    console.log(`  Original:        ${getFileSize(path.join(publicDir, 'hero-illustration.jpg'))}`);
    console.log(`  Optimized JPEG:  ${getFileSize(path.join(publicDir, 'hero-illustration-optimized.jpg'))}`);
    console.log(`  WebP (desktop):  ${getFileSize(path.join(publicDir, 'hero-illustration.webp'))}`);
    console.log(`  WebP (mobile):   ${getFileSize(path.join(publicDir, 'hero-illustration-mobile.webp'))}`);

    console.log('\nLogo:');
    console.log(`  Original:        ${getFileSize(path.join(publicDir, 'ainexo-logo.png'))}`);
    console.log(`  Optimized PNG:   ${getFileSize(path.join(publicDir, 'ainexo-logo-optimized.png'))}`);
    console.log(`  WebP:            ${getFileSize(path.join(publicDir, 'ainexo-logo.webp'))}`);

    console.log('\n✅ All images optimized successfully!');
    console.log('\n⚠️  Next steps:');
    console.log('  1. Update image imports in components to use optimized versions');
    console.log('  2. Test the application to ensure images display correctly');
    console.log('  3. Run PageSpeed Insights to verify improvements');

  } catch (error) {
    console.error('❌ Error optimizing images:', error);
    process.exit(1);
  }
}

optimizeImages();
