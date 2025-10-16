import type { Institution } from "delfi-core/models/Account";
import { InstitutionDao } from "server/data/InstitutionDao";

export class InstitutionService {
    // Gets all institutions for workspace, including my_institutions from myData
    public static async getAllInstitutions(): Promise<Institution[]> {
        return await InstitutionDao.getAllInstitutions();
    }

	public static getInstitutionCreds(institution_id: string, workspace_id: string) {
		return {
			username: process.env[`INSTITUTION_${institution_id}_USERNAME`],
			password: process.env[`INSTITUTION_${institution_id}_PASSWORD`],
		}
	}
};
