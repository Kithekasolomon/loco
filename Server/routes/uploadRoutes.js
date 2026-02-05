const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/upload'); 
router.post(
    '/service-request-image',
    auth,
    (req, res, next) => {
        uploadSingle(req, res, function (err) {
            if (err) {
                // Multer-specific errors come here first
                console.error('Multer error during upload:');
                console.error('Error name:', err.name);
                console.error('Error message:', err.message);
                console.error('Full error:', JSON.stringify(err, null, 2)); 
                console.error('Stack:', err.stack);

                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'File too large (max 10MB)' });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ message: 'Unexpected field name – must be "file"' });
                }

                return res.status(400).json({
                    message: err.message || 'File upload rejected by multer',
                    code: err.code,
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            console.log('File successfully processed by multer:', {
                originalname: req.file?.originalname,
                mimetype: req.file?.mimetype,
                size: req.file?.size,
                path: req.file?.path,
                filename: req.file?.filename,
            });

            if (!req.file) {
                return res.status(400).json({ message: 'No file received' });
            }

            if (!req.file.path) {
                console.error('Cloudinary did not return a path!');
                return res.status(500).json({ message: 'Upload succeeded but no URL returned from Cloudinary' });
            }

            res.status(200).json({
                success: true,
                url: req.file.path,           
                public_id: req.file.filename, 
            });
        } catch (err) {
            console.error('Post-multer upload error:');
            console.error('Name:', err.name);
            console.error('Message:', err.message);
            console.error('Stack:', err.stack || 'No stack');
            const safeErr = {
                name: err.name,
                message: err.message,
                code: err.code,
                http_code: err.http_code,
            };
            res.status(500).json({
                message: 'Server error during image processing',
                error: safeErr,
            });
        }
    }
);

module.exports = router;