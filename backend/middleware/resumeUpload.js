const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '-');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
        cb(new Error('Only PDF and DOCX files are allowed'));
        return;
    }
    cb(null, true);
};

module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});
