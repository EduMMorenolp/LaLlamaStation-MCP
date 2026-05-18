import axios from "axios";
import { config } from "../config.js";

export async function embed(input: string): Promise<number[][]> {
	try {
		const response = await axios.post(`${config.ollamaUrl}/api/embed`, {
			model: config.embeddingModel,
			input,
		});
		return response.data.embeddings || [];
	} catch (error) {
		console.error("[LLM] Error generating embeddings:", error);
		return [];
	}
}

/**
 * Verifica si el modelo de embeddings está disponible.
 * Si no está descargado, lo descarga automáticamente.
 */
export async function ensureEmbeddingModelAvailable(): Promise<void> {
	try {
		console.error(`[LLM] 🔍 Verificando disponibilidad del modelo de embeddings: ${config.embeddingModel}...`);

		// Intentar un embedding de prueba
		await axios.post(
			`${config.ollamaUrl}/api/embed`,
			{
				model: config.embeddingModel,
				input: "test",
			},
			{ timeout: 10000 }
		);

		console.error(`[LLM] ✅ Modelo de embeddings disponible: ${config.embeddingModel}`);
	} catch (error: unknown) {
		const axiosError = error as { response?: { status: number } } | unknown;
		const status = (axiosError && typeof axiosError === "object" && "response" in axiosError) 
			? (axiosError as { response?: { status: number } }).response?.status 
			: undefined;

		if (status === 404 || status === 501) {
			console.error(
				`[LLM] ⚠️  Modelo no disponible (${status}). Iniciando descarga de: ${config.embeddingModel}...`
			);

			try {
				const pullResponse = await axios.post(
					`${config.ollamaUrl}/api/pull`,
					{ name: config.embeddingModel },
					{ timeout: 600000 } // 10 minutos para descarga
				);

				console.error(`[LLM] ✅ Modelo descargado exitosamente: ${config.embeddingModel}`);
				console.error(`[LLM] Response:`, JSON.stringify(pullResponse.data, null, 2));
			} catch (pullError: unknown) {
				const pullErrorMsg = pullError instanceof Error ? pullError.message : String(pullError);
				console.error(`[LLM] ❌ Error descargando modelo:`, pullErrorMsg);
				throw new Error(`No se pudo descargar el modelo de embeddings: ${config.embeddingModel}`);
			}
		} else {
			console.error(
				`[LLM] ❌ Error verificando modelo de embeddings:`,
				error instanceof Error ? error.message : String(error)
			);
			throw error;
		}
	}
}
