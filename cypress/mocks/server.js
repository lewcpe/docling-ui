const express = require('express')
const multer = require('multer')
const cors = require('cors')
const path = require('path')

const app = express()
const port = 8080

// Middleware
app.use(cors())
app.use(express.json())

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
})

// Mock responses
const mockResponses = {
  success: {
    document: {
      text: 'This is extracted text from the test document. It contains multiple paragraphs and demonstrates the text extraction capabilities of the Docling API.',
      metadata: {
        pages: 2,
        words: 25,
        characters: 150,
        file_type: 'pdf',
        processing_time: 1.5
      }
    },
    status: 'success',
    processing_time: 1.5
  },
  error: {
    error: 'processing_failed',
    message: 'Failed to process the uploaded document',
    details: 'The document format is not supported or the file is corrupted'
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Mock Docling API endpoint
app.post('/v1/convert/file', upload.single('file'), (req, res) => {
  console.log(`[${new Date().toISOString()}] Received file conversion request`)
  
  if (!req.file) {
    return res.status(400).json({
      error: 'no_file',
      message: 'No file was uploaded'
    })
  }

  console.log(`File details: ${req.file.originalname}, size: ${req.file.size} bytes`)

  // Simulate processing delay
  const processingDelay = parseInt(req.query.delay) || 1000
  
  setTimeout(() => {
    // Check if we should simulate an error
    if (req.query.simulate_error === 'true') {
      console.log('Simulating processing error')
      return res.status(500).json(mockResponses.error)
    }

    // Check file type for different responses
    const fileExt = path.extname(req.file.originalname).toLowerCase()
    let response = { ...mockResponses.success }
    
    // Customize response based on file type
    if (fileExt === '.png' || fileExt === '.jpg' || fileExt === '.jpeg') {
      response.document.text = 'This is text extracted from an image using OCR technology. The image contained readable text that has been successfully processed.'
      response.document.metadata.file_type = 'image'
      response.document.metadata.ocr_confidence = 0.95
    }

    // Add original filename to metadata
    response.document.metadata.original_filename = req.file.originalname
    response.document.metadata.file_size = req.file.size

    console.log('Returning successful processing response')
    res.status(200).json(response)
  }, processingDelay)
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Mock API Error:', error)
  res.status(500).json({
    error: 'internal_error',
    message: 'An internal error occurred in the mock API'
  })
})

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Mock Docling API server running on port ${port}`)
  console.log(`Health check: http://localhost:${port}/health`)
  console.log(`Convert endpoint: http://localhost:${port}/v1/convert/file`)
})