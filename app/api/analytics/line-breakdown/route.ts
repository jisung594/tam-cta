import { NextResponse } from 'next/server';
import { getLineBreakdownData } from '@/db/queries/analytics';

export async function GET() {
  try {
    const data = await getLineBreakdownData();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch line breakdown data' },
      { status: 500 }
    );
  }
}