const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skillx_videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mkv', 'avi', 'mov']
  }
});

const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skillx_evidence',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf']
  }
});

const upload = multer({ storage: videoStorage });
const uploadEvidence = multer({ storage: imageStorage });

module.exports = { cloudinary, upload, uploadEvidence };
