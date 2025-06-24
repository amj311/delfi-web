import type { User } from "./UserService";

export type Workspace = {
	name: string;
	workspace_id: string;

	Users?: User[];
}

export const WorkspaceService = {
};
