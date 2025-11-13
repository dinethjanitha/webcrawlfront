import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Get the URL list from the request body
    const urlList = await request.json();

    // if (!Array.isArray(urlList) || urlList.length === 0) {
    //   return NextResponse.json(
    //     { error: 'URL list must be a non-empty array' },
    //     { status: 400 }
    //   );
    // }

    // Get backend host from environment variable
    const backendHost = process.env.BACKEND_API_HOST || 'http://127.0.0.1:8000';

    // Build URL with query parameters
    const url = new URL(`${backendHost}/api/v1/crawl`);
    url.searchParams.append('keyword', keyword);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(urlList),
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
