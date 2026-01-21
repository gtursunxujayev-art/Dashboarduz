// Vercel build script - builds only the frontend
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Starting Vercel build ===');

// 1. Install root dependencies
console.log('Installing root dependencies...');
execSync('npm install', { stdio: 'inherit' });

// 2. Install shared package dependencies
console.log('Installing shared package dependencies...');
const sharedPath = path.join(__dirname, 'packages/shared');
if (fs.existsSync(path.join(sharedPath, 'package.json'))) {
  process.chdir(sharedPath);
  execSync('npm install', { stdio: 'inherit' });
  process.chdir(__dirname);
}

// 3. Type-check shared package
console.log('Type-checking shared package...');
execSync('cd packages/shared && npx tsc --noEmit', { stdio: 'inherit' });

// 4. Install and build frontend
console.log('Building frontend...');
const webPath = path.join(__dirname, 'apps/web');
process.chdir(webPath);
execSync('npm install', { stdio: 'inherit' });
execSync('npm run build', { stdio: 'inherit' });

console.log('=== Vercel build completed successfully ===');