/**
 * Tipos compartidos para API responses y componentes
 */

export interface VramInfo {
	total: number;
	used: number;
	free: number;
	available?: number;
}

export interface LoadedModel {
	name: string;
	size?: number;
	size_vram?: number;
}

export interface OllamaModel {
	name: string;
	size: number;
	modified_at: string;
}

export interface AccessLogEntry {
	ip: string;
	action: string;
	timestamp: string;
	status: "Success" | "Failed";
}

export interface PullProgressData {
	model: string;
	percent: number;
	status: "pulling" | "done" | "failed";
}

export interface StatusResponse {
	recentLogs?: AccessLogEntry[];
	vram?: VramInfo;
	loadedModels?: LoadedModel[];
	ngrokInfo?: {
		active: boolean;
		url?: string | null;
	};
	autoUnloadMinutes?: number;
	globalNumCtx?: number;
}

export interface ChatCompletionOptions {
	temperature?: number;
	num_ctx?: number;
	top_p?: number;
	top_k?: number;
	[key: string]: unknown;
}

export interface EngineStats {
	stats?: {
		electricityRateARS: number;
		cloudPricePerMToken: number;
		tokens?: number;
		costSaved?: number;
	};
}

export type ChatMessage = {
	role: "user" | "assistant" | "system";
	content: string;
};
