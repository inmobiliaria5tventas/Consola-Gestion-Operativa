const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://imihpdvscotqbyqylgpq.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltaWhwZHZzY290cWJ5cXlsZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODIxMTgsImV4cCI6MjA5NzM1ODExOH0.1DVMjeEjrrqlQh9WMfxYAvI5ef9ebuxHvAX_6O7knZM';

async function run() {
  const fetch = (await import('node-fetch')).default;
  const resp = await fetch(`${SUPABASE_URL}propiedades?select=id,nombre,superficie`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!resp.ok) {
    console.error('Error fetching:', await resp.text());
    return;
  }

  const data = await resp.json();
  let count = 0;
  
  for (const p of data) {
    if (p.superficie && p.superficie > 10000) {
      const fixed = p.superficie / 10;
      console.log(`Updating ${p.nombre || p.id} from ${p.superficie} to ${fixed}...`);
      
      const updateResp = await fetch(`${SUPABASE_URL}propiedades?id=eq.${p.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ superficie: fixed })
      });
      
      if (!updateResp.ok) {
        console.error(`Failed to update ${p.id}:`, await updateResp.text());
      } else {
        count++;
      }
    }
  }

  console.log(`Successfully updated ${count} records!`);
}

run();
