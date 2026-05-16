export interface TemplateVariable {
	name: string;
	description: string;
	required: boolean;
	default?: string;
}

export interface Template {
	id: string;
	tool: string;
	type: string;
	name: string;
	description: string | null;
	content: string;
	variables: TemplateVariable[];
	output_path: string | null;
	is_seed: boolean;
	created_at: number;
	updated_at: number;
}

export interface RenderResult {
	content: string;
	output_path: string;
	missing: string[];
	template_id: string;
}
