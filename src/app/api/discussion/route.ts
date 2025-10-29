import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywordId, user_prompt } = body;

    if (!keywordId || !user_prompt) {
      return NextResponse.json(
        { error: 'keywordId and user_prompt are required' },
        { status: 400 }
      );
    }

    const backendHost = process.env.BACKEND_API_HOST || 'http://127.0.0.1:8000';
    const url = new URL(`${backendHost}/api/v1/dicission`);
    url.searchParams.append('keywordId', keywordId);
    url.searchParams.append('user_prompt', user_prompt);

    console.log('Discussion API - Fetching from:', url.toString());

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
    console.error('Discussion API error:', error);
    return NextResponse.json(
      { error: 'Failed to process discussion request' },
      { status: 500 }
    );
  }
}
