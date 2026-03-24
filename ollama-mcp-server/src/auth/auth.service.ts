export class AuthService {
	private readonly apiKey: string;

	constructor() {
		this.apiKey = process.env.API_KEY || "super-secret-mcp-key";
	}

	validate(key: string | undefined): boolean {
		if (!key) return false;
		return key === this.apiKey;
	}

	getApiKey(): string {
		return this.apiKey;
	}
}
