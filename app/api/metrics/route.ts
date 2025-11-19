import { NextRequest, NextResponse } from 'next/server'

import { metrics } from '@/lib/monitoring/metrics'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const endpoint = searchParams.get('endpoint') || undefined
  const limit = Number.parseInt(searchParams.get('limit') || '50', 10)

  const stats = metrics.getStats(endpoint)
  const recentEvents = metrics.getRecentEvents(limit)

  return NextResponse.json({
    stats,
    recentEvents,
    timestamp: Date.now(),
  })
}

