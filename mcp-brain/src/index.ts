import "dotenv/config";
import { DatabaseService } from "./database/connection.js";
import { validateEnv } from "./env.js";
import { startApiServer } from "./server/api.js";
import { startCronJobs } from "./server/cron.js";
import { startMcpServer } from "./server/mcp.js";

async function bootstrap() {
	console.error(`\n╔════════════════════════════════════════════════════════════╗`);
	console.error(`║      🧠 LaLlamaStation Brain Bootstrap                   ║`);
	console.error(`╚════════════════════════════════════════════════════════════╝\n`);

	// 1. Validar Entorno
	console.error(`[Bootstrap] 📋 Validando variables de entorno...`);
	validateEnv();
	console.error(`[Bootstrap] ✅ Variables de entorno válidas\n`);

	// 2. Iniciar Base de Datos
	console.error(`[Bootstrap] 🗄️  Inicializando base de datos...`);
	const dbService = new DatabaseService();
	await dbService.initialize();
	console.error(`[Bootstrap] ✅ Base de datos inicializada\n`);

	// 3. Iniciar Servidores
	console.error(`[Bootstrap] 🚀 Iniciando servidores...\n`);
	await startMcpServer(dbService);
	console.error(`[Bootstrap] ✅ MCP Stdio Server iniciado\n`);
	
	startApiServer(dbService);
	console.error(`[Bootstrap] ✅ API Server iniciado\n`);
	
	startCronJobs(dbService);
	console.error(`[Bootstrap] ✅ Cron Jobs iniciados\n`);
	
	console.error(`[Bootstrap] 🎯 Sistema completamente inicializado y listo\n`);
}

bootstrap().catch((err) => {
	console.error("\n❌ [FATAL ERROR] Bootstrap falló:");
	console.error(err);
	console.error("\n");
	process.exit(1);
});
