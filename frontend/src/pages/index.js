import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Docling File Processor</title>
        <meta name="description" content="Document processing with Docling API" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
        <h1>Docling File Processor</h1>
        <p>Welcome to the Docling File Processor application.</p>
        
        <div style={{ marginTop: '2rem' }}>
          <h2>Upload Documents</h2>
          <div 
            data-cy="file-upload-dropzone"
            style={{
              border: '2px dashed #ccc',
              padding: '2rem',
              textAlign: 'center',
              marginTop: '1rem'
            }}
          >
            Drop files here or click to upload
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2>Processing Status</h2>
          <p>No files currently being processed.</p>
        </div>
      </main>
    </div>
  )
}