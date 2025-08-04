export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy',
    service: 'docling-frontend',
    timestamp: new Date().toISOString()
  })
}