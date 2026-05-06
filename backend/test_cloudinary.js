require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
  try {
    const result = await cloudinary.api.resources({ max_results: 1 });
    console.log('✅ Cloudinary is working! Authenticated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cloudinary Error:', err.message || err);
    process.exit(1);
  }
}

testCloudinary();
