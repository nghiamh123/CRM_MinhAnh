const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../lib/s3Config');
const multer = require('multer');
const path = require('path');

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận định dạng ảnh (jpeg, jpg, png, webp)'));
  }
}).single('image');

exports.uploadImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
    }

    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    
    const params = {
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileName}`;
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Error uploading to R2:', error);
      res.status(500).json({ error: 'Lỗi khi upload ảnh lên Cloudflare' });
    }
  });
};
