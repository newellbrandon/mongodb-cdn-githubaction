import { Suspense } from 'react';  
import clientPromise from '../lib/mongodb';  
import DynamicContent from './components/DynamicContent';  
  
async function getFiles() {  
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
      files: validFiles,  
      lastUpdated: new Date(lastUpdated).toISOString()  
    };  
  } catch (error) {  
    console.error('Error fetching files:', error);  
    return {  
      files: [],  
      lastUpdated: new Date().toISOString()  
    };  
  }  
}  
  
export default async function HomePage() {  
  const { files, lastUpdated } = await getFiles();  
  
  return (  
    <Suspense fallback={<div>Loading...</div>}>  
      <DynamicContent files={files} lastUpdated={lastUpdated} />  
    </Suspense>  
  );  
}  
  
// Enable ISR  
export const revalidate = 60; // Revalidate every 60 seconds  
