export class AuthService {
	private readonly apiKey: string;
	private ollamaAuthEnabled = true;
	private mcpAuthEnabled = true;

	constructor() {
		const key = process.env.API_KEY;
		if (!key || key.trim() === "") {
			console.error("\n[FATAL] API_KEY environment variable is required and cannot be empty.");
			console.error("Set API_KEY in your .env file or docker-compose.yml environment section.\n");
			process.exit(1);
		}
		this.apiKey = key;
	}

	validate(key: string | undefined): boolean {
		if (!key) return false;
		return key === this.apiKey;
	}

	isOllamaAuthEnabled(): boolean {
		return this.ollamaAuthEnabled;
	}

	isMcpAuthEnabled(): boolean {
		return this.mcpAuthEnabled;
	}

	setOllamaAuthEnabled(enabled: boolean): void {
		this.ollamaAuthEnabled = enabled;
	}

	setMcpAuthEnabled(enabled: boolean): void {
		this.mcpAuthEnabled = enabled;
	}

	getSettings() {
		return {
			ollamaAuthEnabled: this.ollamaAuthEnabled,
			mcpAuthEnabled: this.mcpAuthEnabled,
		};
	}

	getApiKey(): string {
		return this.apiKey;
	}
}
