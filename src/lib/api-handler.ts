import { NextRequest, NextResponse } from 'next/server'

type HandlerFn = (req: NextRequest, context: { params: Record<string, string> }) => Promise<Response | NextResponse>

/**
 * Wraps an API route handler with centralized error handling.
 * Catches unhandled errors and returns a consistent 500 response.
 */
export function apiHandler(fn: HandlerFn): HandlerFn {
  return async (req, context) => {
    try {
      return await fn(req, context)
    } catch (error: unknown) {
      // Log the error server-side
      console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error)

      // Prisma errors
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: { cause?: string } }
        if (prismaError.code === 'P2002') {
          return NextResponse.json({ error: 'A record with this value already exists' }, { status: 409 })
        }
        if (prismaError.code === 'P2025') {
          return NextResponse.json({ error: 'Record not found' }, { status: 404 })
        }
        if (prismaError.code === 'P2003') {
          return NextResponse.json({ error: 'Related record not found' }, { status: 400 })
        }
      }

      // Generic error
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json(
        { error: process.env.NODE_ENV === 'production' ? 'Internal server error' : message },
        { status: 500 }
      )
    }
  }
}
