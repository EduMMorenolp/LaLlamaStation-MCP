import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const validateEnv = () => {
	const requiredVariables = ["VITE_API_URL", "VITE_SOCKET_URL"];

	const missing = requiredVariables.filter((key) => !import.meta.env[key] || import.meta.env[key].trim() === "");

	if (missing.length > 0) {
		const msg = `[FATAL] Faltan variables de entorno requeridas en el Frontend: ${missing.join(", ")}. Por favor define estas variables en tu archivo .env o en el docker-compose.yml.`;

		// Imprimir con estilos de consola en el navegador
		console.error(
			`%c❌ ${msg}`,
			"color: #ff3333; font-size: 14px; font-weight: bold; padding: 8px; border: 2px solid red; border-radius: 4px; background: rgba(255,0,0,0.1);"
		);

		// Detener la ejecución para no montar React roto
		throw new Error(msg);
	}
};

validateEnv();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
