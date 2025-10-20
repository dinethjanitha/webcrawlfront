import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    const domain = searchParams.get('domain');

    if (!keyword || !domain) {
      return NextResponse.json(
        { error: 'Keyword and domain are required' },
        { status: 400 }
      );
    }

    // Get backend URL from environment variable
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1/crawl';

    // Build URL with query parameters
    const url = new URL(backendUrl);
    url.searchParams.append('keyword', keyword);
    url.searchParams.append('domain', domain);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Crawl API error:', error);
    return NextResponse.json(
      { error: 'Failed to process crawl request' },
      { status: 500 }
    );
  }
}
