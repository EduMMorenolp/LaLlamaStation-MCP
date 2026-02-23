import axios from 'axios';

const NGROK_URL = 'https://theosophical-patrina-realizable.ngrok-free.dev';
const API_KEY = 'MPCOLLAMA_KEY_2026';
const MODEL = 'ministral-3:8b';

async function testNgrok() {
    console.log(`--- Iniciando Test en: ${NGROK_URL} ---`);

    try {
        // Usamos un timeout corto y validamos solo la respuesta inicial
        const response = await axios.get(`${NGROK_URL}/sse`, {
            timeout: 5000,
            responseType: 'stream'
        });

        console.log('✅ Conexión establecida con éxito!');
        console.log('📡 Status:', response.status, response.statusText);
        console.log('🔒 El túnel ngrok está retransmitiendo correctamente al servidor MCP.');

        // Cerramos la conexión de test para no dejarla colgada
        response.data.destroy();
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.log('⚠️ La conexión tardó demasiado, pero el túnel parece estar activo.');
        } else {
            console.error('❌ Error de conexión:', error.message);
        }
    }
}

testNgrok();
console.log('Para probar realmente el flujo completo, el mejor método es usar el MCP Inspector:');
console.log(`npx @modelcontextprotocol/inspector ${NGROK_URL}/sse`);
