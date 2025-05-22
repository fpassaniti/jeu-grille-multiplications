// src/routes/api/session/start/+server.js
import { json } from '@sveltejs/kit';
import { activeGameTokens } from '../../../lib/server/tokenStore.js'; // Adjust path if necessary, this should be correct

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { sessionToken } = await request.json();

    if (!sessionToken) {
      return json({ error: 'Session token is required' }, { status: 400 });
    }

    activeGameTokens.add(sessionToken);
    // console.log(`Token registered: ${sessionToken}`, activeGameTokens); // For server-side debugging

    return json({ success: true, message: 'Session token registered' }, { status: 201 });
  } catch (error) {
    console.error('Error registering session token:', error);
    // Check if the error is due to invalid JSON
    if (error instanceof SyntaxError) {
      return json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return json({ error: 'Failed to register session token' }, { status: 500 });
  }
}
