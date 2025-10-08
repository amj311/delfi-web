import { TestDataService } from "./TestDataService";

export type User = {
	auth_id: string;
	user_id: string;
	given_name: string;
	family_name: string;
	email: string;
}

export const ExternalsService = {
	async getAllTokens() {
		return [{
			external_token_id: process.env.EXTERNAL_TOKEN_ID,
			workspace_id: TestDataService.workspaceId,
		}]
	},


	async getWorkspaceTokens(workspace_id: string) {
		return this.getAllTokens().then(tokens => tokens.filter(t => t.workspace_id === workspace_id));
    },

	async getValidToken(external_token_id: string) {
		const tokens = await this.getAllTokens();
		return tokens.find(t => t.external_token_id === external_token_id);
	},
};
