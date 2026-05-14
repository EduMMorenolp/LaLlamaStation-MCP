import axios from "axios";
import { config } from "../config.js";

export async function generate(model: string, prompt: string, options: Record<string, unknown> = {}): Promise<string> {
	try {
		const response = await axios.post(`${config.ollamaUrl}/api/generate`, {
			model,
			prompt,
			options,
			stream: false,
		});
		return response.data.response || "";
	} catch (error) {
		console.error("[LLM] Error generating text:", error);
		throw error;
	}
}
