import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import pdfRoutes from './routes/pdf.js';
import imageRoutes from './routes/image.js';
import engineerRoutes from './routes/engineer.js';
import researcherRoutes from './routes/researcher.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || './uploads');
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const FILE_RETENTION_MINUTES = Number(process.env.FILE_RETENTION_MINUTES) || 30;
const FILE_RETENTION_MS = FILE_RETENTION_MINUTES * 60 * 1000;
const CLEANUP_INTERVAL_MS = Number(process.env.CLEANUP_INTERVAL_MS) || 5 * 60 * 1000;

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const cleanupExpiredUploads = async () => {
    try {
        const entries = await fsPromises.readdir(UPLOAD_DIR, { withFileTypes: true });
        const now = Date.now();
        let removedCount = 0;

        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const filePath = path.join(UPLOAD_DIR, entry.name);
            try {
                const stats = await fsPromises.stat(filePath);
                const ageMs = now - stats.mtimeMs;
                if (ageMs >= FILE_RETENTION_MS) {
                    await fsPromises.unlink(filePath);
                    removedCount += 1;
                }
            } catch (error) {
                if (error?.code !== 'ENOENT') {
                    console.error('Cleanup file error:', error.message);
                }
            }
        }

        if (removedCount > 0) {
            console.log(`Cleanup removed ${removedCount} expired upload file(s).`);
        }
    } catch (error) {
        console.error('Cleanup scan error:', error.message);
    }
};

cleanupExpiredUploads();
const cleanupTimer = setInterval(cleanupExpiredUploads, CLEANUP_INTERVAL_MS);
if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
}

// Security middleware
app.use(helmet());

// CORS configuration - Allow production and local development
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'https://anyfileforge.web.app'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`Blocked by CORS: origin ${origin} not in ${allowedOrigins}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const sanitizedFieldname = (file.fieldname || 'file').replace(/[^a-z0-9]/gi, '_');
        cb(null, sanitizedFieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const ALLOWED_EXTENSIONS = new Set(['.jpeg', '.jpg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv']);
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain'
]);

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const mimetype = file.mimetype.toLowerCase();

        if (ALLOWED_EXTENSIONS.has(extension) && ALLOWED_MIME_TYPES.has(mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and office documents are allowed.'));
        }
    }
});

// Make upload middleware available to routes
app.set('upload', upload);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'AnyFileForge Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root and simple health aliases (useful for platform checks and manual testing)
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'AnyFileForge API is running',
        health: '/api/health',
        endpoints: ['/api/pdf/*', '/api/image/*', '/api/engineer/*', '/api/researcher/*']
    });
});

app.get('/health', (req, res) => {
    res.redirect(302, '/api/health');
});

// API Routes
app.use('/api/pdf', pdfRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/engineer', engineerRoutes);
app.use('/api/researcher', researcherRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: `File size cannot exceed ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`
            });
        }
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AnyFileForge Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'https://anyfileforge.web.app'}`);
    console.log(`Upload retention: ${FILE_RETENTION_MINUTES} minute(s), cleanup every ${Math.round(CLEANUP_INTERVAL_MS / 60000)} minute(s)`);
});

export default app;
