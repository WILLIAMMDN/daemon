const SUPABASE_URL = 'https://lbxdcvsrmkkynttgwblc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieGRjdnNybWtreW50dGd3YmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTQ0MTQsImV4cCI6MjA5ODE3MDQxNH0.457VHljBnyK-0sUXFni7fG_y_BczZUBgOL7Dtu3NVZU';

async function test() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?rol=eq.alumno&select=id,nombre_completo,usuario,avatar`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  console.log('Alumnos encontrados:', data.length);
  console.log(data.slice(0, 3));
}
test();
