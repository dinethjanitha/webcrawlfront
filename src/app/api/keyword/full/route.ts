import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    const backendHost = process.env.BACKEND_API_HOST || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendHost}/api/v1/keyword/full?keyword=${id}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch keyword details' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching keyword details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
