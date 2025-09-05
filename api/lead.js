// Vercel API endpoint for lead tracking
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Log the lead data
    console.log('Lead received:', {
      timestamp: new Date().toISOString(),
      body: req.body,
      headers: req.headers,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    // Here you can add your lead processing logic:
    // - Save to database
    // - Send to CRM
    // - Send email notification
    // - etc.

    // For now, just return success
    res.status(200).json({ 
      success: true, 
      message: 'Lead received successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing lead:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
