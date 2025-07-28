import { revalidatePath } from 'next/cache';  
import { NextResponse } from 'next/server';  
  
export async function POST(request) {  
  try {  
    // You can add authentication here if needed  
    // const authorization = request.headers.get('authorization');  
      
    // Trigger revalidation when files are updated  
    revalidatePath('/');  
      
    return NextResponse.json({   
      success: true,   
      revalidated: true,  
      timestamp: new Date().toISOString()  
    });  
  } catch (err) {  
    return NextResponse.json(  
      {   
        message: 'Error processing webhook',   
        error: err.message   
      },  
      { status: 500 }  
    );  
  }  
}  
