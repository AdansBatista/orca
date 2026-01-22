import { NextRequest, NextResponse } from 'next/server';
import { fetchCyclesForRange, type FlattenedCycle } from '@/lib/sterilization/autoclave-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, port, limit, range } = body;

    if (!ipAddress) {
      return NextResponse.json(
        { success: false, error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Default range to 'today' if not specified
    const dateRange = range || 'today';
    console.log(`[get-cycles] Fetching cycles from ${ipAddress}:${port || 80}, range=${dateRange}`);

    // Fetch cycles for the requested date range
    const cycles = await fetchCyclesForRange(ipAddress, port || 80, dateRange);

    console.log(`[get-cycles] Found ${cycles.length} cycles for range '${dateRange}'`);

    // Reverse to get newest first
    let resultCycles: FlattenedCycle[] = [...cycles].reverse();

    // Limit the results if specified (takes the most recent N cycles)
    if (limit) {
      resultCycles = resultCycles.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      cycles: resultCycles,
    });
  } catch (error) {
    console.error('[get-cycles] Error fetching cycles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
