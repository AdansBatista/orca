import { NextRequest, NextResponse } from 'next/server';
import { testAutoclaveConnection } from '@/lib/sterilization/autoclave-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, port } = body;

    if (!ipAddress) {
      return NextResponse.json(
        { success: false, error: 'IP address is required' },
        { status: 400 }
      );
    }

    console.log(`🔌 API: Testing connection to ${ipAddress}:${port || 80}`);

    // Test the connection using the autoclave service
    const result = await testAutoclaveConnection(ipAddress, port || 80);

    console.log(`🧪 API: Test result:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ API: Error testing connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
