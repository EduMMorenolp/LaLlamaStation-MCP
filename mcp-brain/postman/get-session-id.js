/**
 * 🧠 Helper: Obtener sessionId de la conexión SSE del Brain MCP
 *
 * Uso:
 *   node postman/get-session-id.js
 *   node postman/get-session-id.js http://localhost:3015   (URL personalizada)
 *
 * Este script se conecta al endpoint SSE del brain y extrae
 * el sessionId del primer evento. Luego imprime el comando curl
 * exacto para probar las herramientas MCP.
 */

const http = require("http");

const BRAIN_URL = process.argv[2] || "http://localhost:3015";
const url = new URL(BRAIN_URL);
const SSE_PATH = "/sse";

console.log(`\n🔌 Conectando a ${BRAIN_URL}${SSE_PATH}...\n`);

const req = http.get(
	{
		hostname: url.hostname,
		port: url.port || 3015,
		path: SSE_PATH,
		headers: { Accept: "text/event-stream" },
	},
	(res) => {
		let buffer = "";

		res.on("data", (chunk) => {
			buffer += chunk.toString();

			// Buscar sessionId en los datos SSE
			const endpointMatch = buffer.match(/\/messages\?sessionId=([a-zA-Z0-9_-]+)/);
			if (endpointMatch) {
				const sessionId = endpointMatch[1];

				console.log("✅ ¡Conexión SSE establecida!");
				console.log(`📋 sessionId: ${sessionId}\n`);

				console.log("=".repeat(60));
				console.log("🧪 PRUEBA RÁPIDA — Copia y pega en Postman o terminal:\n");

				// Initialize
				console.log("📋 1. Initialize (negociar protocolo):");
				console.log(
					`curl -X POST "${BRAIN_URL}/messages?sessionId=${sessionId}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"Debug Client","version":"1.0.0"}}}'\n`
				);

				// ListTools
				console.log("📋 2. ListTools (ver herramientas):");
				console.log(
					`curl -X POST "${BRAIN_URL}/messages?sessionId=${sessionId}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'\n`
				);

				// mem_my_compliance
				console.log("📋 3. mem_my_compliance (ver compliance):");
				console.log(
					`curl -X POST "${BRAIN_URL}/messages?sessionId=${sessionId}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"mem_my_compliance","arguments":{"agent":"Debug-CLI"}}}'\n`
				);

				// mem_save
				console.log("📋 4. mem_save (guardar memoria de prueba):");
				console.log(
					`curl -X POST "${BRAIN_URL}/messages?sessionId=${sessionId}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"mem_save","arguments":{"agent":"Debug-CLI","project":"lallamaollama","type":"test","title":"🧪 Prueba desde CLI","content":"**What**: Prueba de conexión MCP desde terminal\\n**Why**: Debugging","tags":"test,debug","topic_key":"test/cli-test"}}}'\n`
				);

				// mem_search
				console.log("📋 5. mem_search (buscar):");
				console.log(
					`curl -X POST "${BRAIN_URL}/messages?sessionId=${sessionId}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"mem_search","arguments":{"agent":"Debug-CLI","query":"test","project":"lallamaollama","mode":"hybrid","limit":5}}}'\n`
				);

				console.log("=".repeat(60));
				console.log("\n💡 Para usar en Postman:");
				console.log(`   1. Copia este sessionId: ${sessionId}`);
				console.log(`   2. Pégalo en la variable {{session_id}} de Postman`);
				console.log(
					"   3. Las peticiones del folder 'MCP Protocol' ya están configuradas\n"
				);

				// Cerrar después de 3 segundos
				setTimeout(() => {
					console.log("🔌 Cerrando conexión SSE...");
					req.destroy();
					process.exit(0);
				}, 3000);
			}
		});

		res.on("error", (err) => {
			console.error("❌ Error en conexión SSE:", err.message);
			process.exit(1);
		});
	}
);

req.on("error", (err) => {
	console.error(`❌ No se pudo conectar a ${BRAIN_URL}${SSE_PATH}`);
	console.error(`   Error: ${err.message}`);
	console.error("\n   ¿Está corriendo el brain server?");
	console.error("   Ejecuta: cd mcp-brain && npm start\n");
	process.exit(1);
});

// Timeout de 10 segundos
setTimeout(() => {
	console.error("\n⏰ Timeout: No se recibió sessionId en 10 segundos");
	console.error("   Verifica que el brain server esté corriendo.");
	req.destroy();
	process.exit(1);
}, 10000);
