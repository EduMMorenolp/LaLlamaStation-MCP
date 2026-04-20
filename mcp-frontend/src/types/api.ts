/**
 * Tipos compartidos para API responses y componentes
 */

export interface StatusResponse {
	gpuMemoryTotal?: number;
	gpuMemoryUsed?: number;
	gpuMemoryAvailable?: number;
	vramFreeMb?: number;
	vramTotalMb?: number;
	vramUsedMb?: number;
	models?: LoadedModel[];
	recentLogs?: AccessLogEntry[];
	auth?: {
		ollamaAuthEnabled?: boolean;
		mcpAuthEnabled?: boolean;
	};
	[key: string]: any;
}

export interface AccessLogEntry {
	ip: string;
	action: string;
	timestamp: string;
	status: "Success" | "Failed";
}

export interface OllamaModel {
	name: string;
	model: string;
	modified_at: string;
	size: number;
	digest: string;
	[key: string]: any;
}

export interface LoadedModel {
	name?: string | unknown;
	size_vram?: number;
	percentage?: number;
	[key: string]: any;
}

export type PullProgressData = Record<string, any>;

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	[key: string]: any;
}

export interface EngineStats extends Record<string, any> {
	totalTokensSession?: number;
	totalTimeSession?: number;
	[key: string]: any;
}

// Para casos donde se necesita tipado estricto
export interface VramInfo {
	total: number;
	used: number;
	free: number;
	available?: number;
}

export interface ChatCompletionOptions {
	temperature?: number;
	num_ctx?: number;
	top_p?: number;
	top_k?: number;
	[key: string]: any;
}
