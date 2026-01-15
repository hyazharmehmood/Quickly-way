import { NextResponse } from 'next/server';

// This route is used by Socket.IO for the connection path
// The actual Socket.IO server is initialized in server.js
export async function GET() {
  return NextResponse.json({ message: 'Socket.IO endpoint' });
}

