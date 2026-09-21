import { NextRequest, NextResponse } from 'next/server';
import { getLineBreakdownData } from '@/db/queries/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weeksAgoParam = searchParams.get('weeksAgo');

    // Parse to an integer, defaulting to 0 if missing or invalid
    const weeksAgo = weeksAgoParam ? parseInt(weeksAgoParam, 10) : 0;
    const validWeeksAgo = Number.isNaN(weeksAgo) ? 0 : weeksAgo;

    const data = await getLineBreakdownData(validWeeksAgo);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch line breakdown data' },
      { status: 500 }
    );
  }
}