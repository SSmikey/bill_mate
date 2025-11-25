const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDir(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const sourceDir = path.join(__dirname, '..', 'node_modules', 'bootstrap-icons', 'font');
  const destDir = path.join(__dirname, '..', 'public', 'bootstrap-icons', 'font');

  console.log('Copying bootstrap-icons fonts...');
  console.log('From:', sourceDir);
  console.log('To:', destDir);

  if (fs.existsSync(sourceDir)) {
    copyDir(sourceDir, destDir);
    console.log('✓ Bootstrap icons fonts copied successfully!');
  } else {
    console.warn('⚠ Bootstrap icons source directory not found. Skipping...');
  }
} catch (error) {
  console.error('Error copying bootstrap icons:', error.message);
  // Don't fail the build if copying fails
  process.exit(0);
}
