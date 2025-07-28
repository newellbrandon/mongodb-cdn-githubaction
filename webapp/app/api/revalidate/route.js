import { revalidatePath } from 'next/cache';  
import { NextResponse } from 'next/server';  
  
export async function POST() {  
  try {  
    // Revalidate the home page  
    revalidatePath('/');  
      
    return NextResponse.json({   
      revalidated: true,   
      timestamp: new Date().toISOString()   
    });  
  } catch (err) {  
    return NextResponse.json(  
      {   
        message: 'Error revalidating',   
        error: err.message   
      },  
      { status: 500 }  
    );  
  }  
}  
