import { NextResponse } from 'next/server';

export async function GET() {
  // With Supabase CRM, backup table is no longer needed - all data is in Supabase
  return NextResponse.json({
    message: 'CRM backup not needed - all data is in Supabase',
    data: [],
    count: 0,
  });
}
