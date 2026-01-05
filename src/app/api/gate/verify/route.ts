import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const verifySchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const COOKIE_NAME = 'league_access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = verifySchema.parse(body);

    const expectedPassword = process.env.LEAGUE_PASSWORD || 'football';
    const isValid = password === expectedPassword;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, 'granted', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
