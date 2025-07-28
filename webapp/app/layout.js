export const metadata = {  
  title: 'Dynamic Website from MongoDB',  
  description: 'Website generated from MongoDB file storage',  
}  
  
export default function RootLayout({ children }) {  
  return (  
    <html lang="en">  
      <body>{children}</body>  
    </html>  
  )  
}  
