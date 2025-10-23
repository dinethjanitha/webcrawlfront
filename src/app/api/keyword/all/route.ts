import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendHost = process.env.BACKEND_API_HOST || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendHost}/api/v1/keyword/all`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
