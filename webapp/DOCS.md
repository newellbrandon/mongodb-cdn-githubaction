I'll help you create a NextJS ISR application that assembles a website from MongoDB file assets. Here's a complete solution:

## 1. First, set up the project structure:

```bash
npx create-next-app@latest mongodb-isr-website
cd mongodb-isr-website
npm install mongodb
```

## 2. Create the environment file:

**.env.local**
```env
MONGODB_URI=your_mongodb_connection_string_here
```

## 3. Create the MongoDB connection utility:

**lib/mongodb.js**
```javascript
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
```

## 4. Create the main page component:

**pages/index.js**
```javascript
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DynamicWebsite({ files, lastUpdated }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');

  useEffect(() => {
    // Find the HTML and CSS files
    const htmlFile = files.find(f => f.path === 'index.html');
    const cssFile = files.find(f => f.path === 'public/styles.css' || f.path === 'styles.css');

    if (htmlFile) {
      let content = htmlFile.content;
      
      // If we have CSS content, inject it into the HTML
      if (cssFile) {
        // Replace the CSS link with inline styles
        content = content.replace(
          /<link[^>]*href="public\/styles\.css"[^>]*>/gi,
          `<style>${cssFile.content}</style>`
        );
      }
      
      setHtmlContent(content);
    }
  }, [files]);

  // Extract title from HTML content
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : 'Dynamic Website';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Dynamic website generated from MongoDB" />
      </Head>
      
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ minHeight: '100vh' }}
      />
      
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '5px 10px', 
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </div>
    </>
  );
}

export async function getStaticProps() {
  const clientPromise = (await import('../lib/mongodb')).default;
  
  try {
    const client = await clientPromise;
    const db = client.db('file_versions');
    const collection = db.collection('file_history');

    // Get all unique file paths
    const uniquePaths = await collection.distinct('path');
    
    // Get the most recent version of each file
    const files = await Promise.all(
      uniquePaths.map(async (path) => {
        const file = await collection
          .findOne(
            { path },
            { sort: { timestamp: -1 } }
          );
        return file;
      })
    );

    // Filter out null results and serialize the data
    const validFiles = files
      .filter(file => file !== null)
      .map(file => ({
        _id: file._id.toString(),
        filename: file.filename,
        path: file.path,
        content: file.content,
        version: file.version,
        timestamp: file.timestamp.toISOString(),
        createdAt: file.createdAt.toISOString()
      }));

    const lastUpdated = validFiles.length > 0 
      ? Math.max(...validFiles.map(f => new Date(f.timestamp).getTime()))
      : Date.now();

    return {
      props: {
        files: validFiles,
        lastUpdated: new Date(lastUpdated).toISOString()
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (error) {
    console.error('Error fetching files:', error);
    return {
      props: {
        files: [],
        lastUpdated: new Date().toISOString()
      },
      revalidate: 60,
    };
  }
}
```

## 5. Create an API route for manual revalidation:

**pages/api/revalidate.js**
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Revalidate the home page
    await res.revalidate('/');
    
    return res.json({ 
      revalidated: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    return res.status(500).json({ 
      message: 'Error revalidating', 
      error: err.message 
    });
  }
}
```

## 6. Create a dynamic file server for assets:

**pages/api/files/[...path].js**
```javascript
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  const { path } = req.query;
  const filePath = Array.isArray(path) ? path.join('/') : path;

  try {
    const client = await clientPromise;
    const db = client.db('file_versions');
    const collection = db.collection('file_history');

    // Get the most recent version of the requested file
    const file = await collection.findOne(
      { path: filePath },
      { sort: { timestamp: -1 } }
    );

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set appropriate content type based on file extension
    const ext = filePath.split('.').pop().toLowerCase();
    const contentTypes = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'txt': 'text/plain',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };

    const contentType = contentTypes[ext] || 'text/plain';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).send(file.content);
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
```

## 7. Create a webhook endpoint for automatic updates:

**pages/api/webhook.js**
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // You can add authentication here if needed
    // const { authorization } = req.headers;
    
    // Trigger revalidation when files are updated
    await res.revalidate('/');
    
    return res.json({ 
      success: true, 
      revalidated: true,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ 
      message: 'Error processing webhook', 
      error: err.message 
    });
  }
}
```

## 8. Update your Next.js configuration:

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: false
  }
};

module.exports = nextConfig;
```

## 9. Add a package.json script for easy deployment:

**package.json** (add to scripts section)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## How it works:

1. **ISR Implementation**: The `getStaticProps` function fetches the latest version of each file from MongoDB and uses ISR with a 60-second revalidation period.

2. **File Assembly**: The component automatically finds `index.html` and `styles.css` files and injects the CSS directly into the HTML.

3. **Dynamic Updates**: Files are automatically updated every 60 seconds, or you can trigger manual updates via the `/api/revalidate` endpoint.

4. **Webhook Support**: The `/api/webhook` endpoint allows external systems to trigger page revalidation when files are updated.

5. **File Serving**: The `/api/files/[...path]` endpoint serves individual files directly from MongoDB.

## Usage:

1. Set your `MONGODB_URI` in `.env.local`
2. Run `npm run dev` to start development
3. The site will automatically update when files in MongoDB are modified
4. Use `POST /api/revalidate` to manually trigger updates
5. Use `POST /api/webhook` for automated updates from external systems

The application will render your HTML content with embedded CSS and JavaScript, creating a fully functional website that updates automatically based on your MongoDB file storage system.