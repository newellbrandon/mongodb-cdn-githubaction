'use client';  
  
import { useState, useEffect } from 'react';  
import Head from 'next/head';  
  
export default function DynamicContent({ files, lastUpdated }) {  
  const [htmlContent, setHtmlContent] = useState('');  
  
  useEffect(() => {  
    // Find the HTML and CSS files  
    const htmlFile = files.find(f => f.path === 'index.html');  
    const cssFile = files.find(f => f.path === 'public/styles.css' || f.path === 'styles.css');  
    const svgFile = files.find(f => f.path === 'public/mongodb-icon.svg' || f.path === 'mongodb-icon.svg');
    
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
        // If we have SVG content, inject it into the HTML
      if (svgFile) {  
        // Replace the SVG link with inline SVG  
        content = content.replace(  
          /<img[^>]*src="public\/mongodb-icon\.svg"[^>]*>/gi,  
          `<svg width="300">${svgFile.content}</svg>`  
        );  
      }
        
      setHtmlContent(content);  
    }  
  }, [files]);  
  
  // Extract title from HTML content for document head  
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);  
  const title = titleMatch ? titleMatch[1] : 'Dynamic Website';  
  
  useEffect(() => {  
    // Update document title  
    if (title) {  
      document.title = title;  
    }  
  }, [title]);  
  
  return (  
    <>  
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
