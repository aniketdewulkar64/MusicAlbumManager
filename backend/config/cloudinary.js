const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET &&
                               process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Fallback Local Storage
const localDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

const localImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, localDir),
  filename: (req, file, cb) => cb(null, `img-${Date.now()}-${file.originalname}`)
});

const localAudioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, localDir),
  filename: (req, file, cb) => cb(null, `audio-${Date.now()}-${file.originalname}`)
});

// Image storage (album covers, avatars)
const imageStorage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'music-app/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
}) : localImageStorage;

// Audio storage (song files)
const audioStorage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'music-app/audio',
    allowed_formats: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma'],
    resource_type: 'video', 
  },
}) : localAudioStorage;

// File size limits
const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'), false);
    }
  },
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(null, true); 
    }
  },
});

// Mixed storage for song uploads (audio + cover image)
// Each field gets the correct prefix and folder
const songLocalStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, localDir),
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'coverImage' ? 'img' : 'audio';
    cb(null, `${prefix}-${Date.now()}-${file.originalname}`);
  }
});

const songCloudinaryStorage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'coverImage') {
      return {
        folder: 'music-app/covers',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
      };
    }
    return {
      folder: 'music-app/audio',
      resource_type: 'video',
    };
  },
}) : songLocalStorage;

const songUpload = multer({
  storage: songCloudinaryStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true),
});

module.exports = { cloudinary, imageUpload, audioUpload, songUpload, isCloudinaryConfigured };
