# AnyFileForge Server

Backend server for AnyFileForge file processing platform.

## Features

- **PDF Processing**: Merge, split, and compress PDF files
- **Image Processing**: Resize, compress, convert, and crop images
- **Engineer Tools**: JSON formatter, Base64 encoder, regex tester, code minifier
- **Researcher Tools**: CSV plotter, BibTeX parser, statistical analysis

## Tech Stack

- Node.js + Express
- pdf-lib for PDF processing
- Sharp for image processing
- Multer for file uploads
- Helmet for security
- Rate limiting for API protection

## Server Type

This project uses a **Node.js + Express REST API server** for online mode processing.
The frontend calls endpoints under `/api/*` when online mode is enabled.

## Installation

```bash
cd server
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=52428800
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

In the frontend root `.env`, set:

```env
VITE_SERVER_URL=http://localhost:5000
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Then start the frontend in the project root:

```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### PDF Operations
- `POST /api/pdf/merge` - Merge multiple PDFs
- `POST /api/pdf/split` - Split PDF pages
- `POST /api/pdf/compress` - Compress PDF

### Image Operations
- `POST /api/image/resize` - Resize image
- `POST /api/image/compress` - Compress image
- `POST /api/image/convert` - Convert image format
- `POST /api/image/crop` - Crop image

### Engineer Tools
- `POST /api/engineer/json-format` - Format/minify JSON
- `POST /api/engineer/base64` - Encode/decode Base64
- `POST /api/engineer/regex-test` - Test regex patterns
- `POST /api/engineer/minify` - Minify code
- `POST /api/engineer/hash` - Generate hash

### Researcher Tools
- `POST /api/researcher/csv-to-json` - Convert CSV to JSON
- `POST /api/researcher/csv-plot` - Generate chart data from CSV
- `POST /api/researcher/bibtex-parse` - Parse BibTeX entries
- `POST /api/researcher/stats` - Statistical analysis

## Security Features

- Helmet.js for HTTP headers security
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- File size limits (50MB max)
- File type validation

## License

MIT
