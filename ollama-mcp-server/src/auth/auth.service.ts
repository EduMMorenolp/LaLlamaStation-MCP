export class AuthService {
	private readonly apiKey: string;

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

	getApiKey(): string {
		return this.apiKey;
	}
}
