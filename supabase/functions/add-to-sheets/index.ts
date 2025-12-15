import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JWT } from "https://esm.sh/google-auth-library@9.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '1yNxTNxN7SCRkEyI63koTMuiGr5etbr8YcWQeI4AllIs';
const SHEET_NAME = 'Sheet1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY') || '{}');
    
    if (!serviceAccountKey.client_email || !serviceAccountKey.private_key) {
      throw new Error('Invalid service account key');
    }

    const { childName, age, parentName, email, phone, experience, notes } = await req.json();

    console.log('Received registration data:', { childName, age, parentName, email });

    // Create JWT client for Google Sheets API
    const jwtClient = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const tokens = await jwtClient.authorize();
    const accessToken = tokens.access_token;

    // Prepare the row data
    const timestamp = new Date().toISOString();
    const values = [[timestamp, childName, age, parentName, email, phone, experience || 'Not specified', notes || '']];

    // Append to Google Sheet
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:H:append?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      throw new Error(`Failed to append to sheet: ${errorText}`);
    }

    const result = await response.json();
    console.log('Successfully added to sheet:', result);

    return new Response(JSON.stringify({ success: true, message: 'Registration added to spreadsheet' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in add-to-sheets function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
