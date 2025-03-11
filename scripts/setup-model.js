const https = require('https');
const fs = require('fs');
const path = require('path');

// Create models directory if it doesn't exist
const modelsDir = path.join(__dirname, '../public/models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

console.log('Please download a Dewoitine D.520 3D model from Sketchfab:');
console.log('1. Visit https://sketchfab.com');
console.log('2. Search for "Dewoitine D.520"');
console.log('3. Find a model with a free download license');
console.log('4. Download the model in GLB format');
console.log('5. Save it as "dewoitine-d520.glb" in the public/models directory');
console.log('\nModel directory:', modelsDir);

// Check if model exists
const modelPath = path.join(modelsDir, 'dewoitine-d520.glb');
if (fs.existsSync(modelPath)) {
    console.log('\n✅ Model file found!');
} else {
    console.log('\n❌ Model file not found. Please download it and try again.');
} 