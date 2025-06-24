import { RecurrenceType, type Budget } from "delfi-core/models/Budget";
import { prisma } from "../../prisma/client";
import { TestDataService } from "../services/TestDataService";

export const BudgetDao = {

	async getAllBudgets(workspace_id: string) {
		return (await prisma.budget.findMany({
			where: {
				workspace_id,
			},
		})).concat(await TestDataService.getBudgets() as any);
	},

	async getBudgetById(workspace_id: string, budget_id: string) {
		const transaction = await prisma.budget.findUnique({
			where: {
				budget_id,
				workspace_id,
			},
		});
		return transaction;
	},

	async createInsertInstructions(workspace_id: string, budgetData: Budget, isUpdate = false) {
		const createOrSet = isUpdate ? 'set' : 'create';
		const connectOrSet = isUpdate ? 'set' : 'connect';
		
		return {
			memo: budgetData.memo,
			workspace_id,
			budget_id: budgetData.budget_id || undefined,
			transaction_type: budgetData.budgetType,
			recurrence_type: budgetData.recurrence_type,

			// ACCOUNTS
			account_id: budgetData.account_id,
			target_account_partition_id: budgetData.target_account_partition_id,
			origin_account_id: budgetData.origin_account_id,
			origin_account_partition_id: budgetData.origin_account_partition_id,

			// ASSOCIATIONS
			category_id: budgetData.category_id,
			Tags: {
				[connectOrSet]: budgetData.tag_ids?.map(tagId => ({
					tag_id: tagId,
				})) || [],
			},

			// VARIANTS
			scheduleVariants: {
				[createOrSet]: budgetData.recurrence_type === RecurrenceType.TRIGGER ? [] : budgetData.scheduleVariants.map(variant => ({
					schedule_variant_id: variant.schedule_variant_id || undefined,
					amount: variant.amount,
					schedule: variant.schedule as any,
					window_interval: variant.window?.interval,
					window_quantity: variant.window?.quantity,
					projection_interval: variant.projectionInterval?.interval,
					projection_quantity: variant.projectionInterval?.quantity,
				}))
			},
			triggerVariants: {
				[createOrSet]: budgetData.recurrence_type === RecurrenceType.SCHEDULE ? [] : budgetData.triggerVariants.map(variant => ({
					trigger_variant_id: variant.trigger_variant_id || undefined,
					start: variant.start?.toString(),
					end: variant.end?.toString(),
					trigger: variant.trigger as any,
					trigger_filter: variant.trigger.filter as any,
					trigger_operand: variant.trigger.computation.operand,
					trigger_operator: variant.trigger.computation.operator,
				}))
			},
		};
	},

	async createBudget(workspace_id: string, budgetData: Budget) {
		const insertInstructions = await this.createInsertInstructions(workspace_id, budgetData);

		return await prisma.budget.create({
			data: {
				...insertInstructions,
			},
		});
	},



	/**
	 * PUT - Updates an ENTIRE budget and variants
	 * @param workspace_id 
	 * @param budget_id 
	 * @param budgetData 
	 * @returns 
	 */
	async updateBudget(workspace_id: string, budget_id: string, budgetData: Budget) {
		const insertInstructions = await this.createInsertInstructions(workspace_id, budgetData, true);
		// Don't update these fields
		const fieldsToOmit = ['recurrence_type', 'transaction_type'];
		for (const field of fieldsToOmit) {
			delete insertInstructions[field];
		}

		return await prisma.budget.update({
			where: {
				budget_id,
				workspace_id,
			},
			data: {
				...insertInstructions,
			}
		});
	},

	async deleteBudget(workspace_id: string, budget_id: string) {
		await prisma.budget.delete({
			where: {
				budget_id,
				workspace_id,
			},
		});
	},
};