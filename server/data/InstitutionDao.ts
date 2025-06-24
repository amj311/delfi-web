import type { Institution } from "delfi-core/models/Account";
import { prisma } from "../../prisma/client";
import { TestDataService } from "server/services/TestDataService";
import type { Replace } from "delfi-core/utils/typeUtils";

export const InstitutionDao = {
	async prepTestData() {
		const my_institutions = TestDataService.my_institutions;
		
		for (const institution of my_institutions) {
			// Check if institution already exists
			const existingInstitution = await prisma.institution.findUnique({
				where: { institution_id: institution.institution_id },
			});

			// If it exists, skip to the next one
			if (existingInstitution) {
				continue;
			}

			await prisma.institution.create({
				data: {
					institution_id: institution.institution_id,
					name: institution.name,
					logo: institution.logo,
					plaid_institution_id: institution.plaid_institution_id,
				},
			});
		}
	},

    async getAllInstitutions(): Promise<Institution[]> {
        return await prisma.institution.findMany();
    },

	async matchAny(search: Partial<Institution>): Promise<Institution | null> {
		console.log("Searching for institution with criteria:", search);
		const found = await prisma.institution.findFirst({
			where: {
				OR: Object.entries(search).map(([key, value]) => ({ [key]: value })),
			},
		});
		console.log("Found institution:", found);
		return found || null;
	},

	async createInstitution(institution: Institution): Promise<Institution> {
		return await prisma.institution.create({
			data: {
				institution_id: institution.institution_id,
				name: institution.name,
				logo: institution.logo,
				plaid_institution_id: institution.plaid_institution_id,
			},
		});
	},

	async updateInstitution(institutionId: string, updates: Partial<Replace<Institution, { institution_id: string }>>): Promise<Institution | null> {
		const updatedInstitution = await prisma.institution.update({
			where: { institution_id: institutionId },
			data: updates,
		});
		return updatedInstitution || null;
	},
};
