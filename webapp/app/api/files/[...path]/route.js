import { NextResponse } from 'next/server';  
import clientPromise from '../../../../lib/mongodb';  
  
export async function GET(request, { params }) {  
  const { path } = params;  
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
      return NextResponse.json(  
        { message: 'File not found' },  
        { status: 404 }  
      );  
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
      
    return new Response(file.content, {  
      status: 200,  
      headers: {  
        'Content-Type': contentType,  
        'Cache-Control': 's-maxage=60, stale-while-revalidate',  
      },  
    });  
  } catch (error) {  
    console.error('Error serving file:', error);  
    return NextResponse.json(  
      { message: 'Internal server error' },  
      { status: 500 }  
    );  
  }  
}  
