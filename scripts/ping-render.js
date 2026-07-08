const https = require('https');

const RENDER_URL = 'https://daemon-5vo1.onrender.com/api/v1/salud';
const INTERVAL_MINUTES = 10;

console.log(`[Ping Bot] Iniciando bot gratuito para mantener Render despierto...`);
console.log(`[Ping Bot] Haciendo ping a ${RENDER_URL} cada ${INTERVAL_MINUTES} minutos.`);

function hacerPing() {
    console.log(`[${new Date().toLocaleTimeString()}] Enviando ping a Render...`);
    
    https.get(RENDER_URL, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log(`[${new Date().toLocaleTimeString()}] ✅ Ping exitoso. Render está despierto.`);
            } else {
                console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Ping recibido con código ${res.statusCode}`);
            }
        });
    }).on('error', (err) => {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Error al hacer ping: ${err.message}`);
    });
}

// Hacer el primer ping inmediatamente
hacerPing();

// Programar pings continuos
setInterval(hacerPing, INTERVAL_MINUTES * 60 * 1000);
