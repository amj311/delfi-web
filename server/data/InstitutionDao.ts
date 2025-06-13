import type { Institution } from "delfi-core/models/Account";
import { prisma } from "../../prisma/client";
import { TestDataService } from "server/services/TestDataService";

export const InstitutionDao = {
    async getAllInstitutions(): Promise<Institution[]> {
		// First make sure custom data is upserted
		const my_institutions = TestDataService.my_institutions;
		
		for (const institution of my_institutions) {
			await prisma.institution.upsert({
				where: { institution_id: institution.institution_id },
				update: {
					name: institution.name,
					logo: institution.logo,
					plaid_institution_id: institution.plaid_institution_id,
				},
				create: {
					institution_id: institution.institution_id,
					name: institution.name,
					logo: institution.logo,
					plaid_institution_id: institution.plaid_institution_id,
				},
			});
		}

        return await prisma.institution.findMany();
    }
};
