export interface Memory {
	id: string;
	project: string;
	type: string;
	title: string;
	content: string;
	tags: string;
	sessionId?: string;
	phase?: string;
	agent?: string;
	createdAt: number;
	updatedAt: number;
	score?: number; // solo para resultados semánticos
}
