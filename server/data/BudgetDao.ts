import { RecurrenceType, type Budget, type ScheduledBudget, type TriggeredBudget } from "delfi-core/models/Budget";
import { prisma } from "../../prisma/client";
import { TestDataService } from "../services/TestDataService";
import { asAny } from "delfi-core/utils/miscUtils";

export const BudgetDao = {
	async setupTestData() {
		// setup default budgets for the test workspace
		const workspace_id = TestDataService.workspaceId;

		for (const budget of await TestDataService.getBudgets()) {
			const exists = Boolean(await this.getBudgetById(workspace_id, budget.budget_id));
			if (exists) {
				await this.updateBudget(workspace_id, budget.budget_id, budget);
			} else {
				await this.createBudget(workspace_id, budget);
			}
		}
	},

	dbToBudget(budget: NonNullable<{[key: string]: any}>): Budget {
		const budgetData: any = {
			budget_id: budget.budget_id,
			memo: budget.memo,
			recurrence_type: budget.recurrence_type as any,
			budgetType: budget.transaction_type,
			account_id: budget.account_id,
			origin_account_id: budget.origin_account_id,
			target_account_partition_id: budget.target_account_partition_id,
			origin_account_partition_id: budget.origin_account_partition_id,

			group_id: budget.group_id,
			Group: budget.Group as any,
			category_id: budget.category_id,
			Category: budget.Category as any,
			Tags: budget.Tags as any,

			scheduleVariants: budget.scheduleVariants?.map((variant: any) => ({
				amount: variant.amount,
				schedule: variant.schedule as any,
				window: variant.window_interval ? {
					interval: variant.window_interval as any,
					quantity: variant.window_quantity as any,
				} : undefined,
				projectionInterval: variant.projection_interval ? {
					interval: variant.projection_interval as any,
					quantity: variant.projection_quantity as any,
				} : undefined,
			})),
			// triggerVariants: [],
			triggerVariants: budget.triggerVariants?.map((variant: any) => ({
				start: variant.start ? new Date(variant.start) : undefined,
				end: variant.end ? new Date(variant.end) : undefined,
				trigger: {
					filter: variant.trigger_filter as any,
					computation: {
						operator: variant.trigger_operator as any,
						operand: variant.trigger_operand as any,
					},
				},
			})),
			childItems: [],
			// childItems: budget.childItems?.map((item: any) => ({
			// 	budget_child_item_id: item.budget_child_item_id,
			// 	amount: item.amount,
			// 	date: item.date ? new Date(item.date) : undefined,
			// })),
		}

		return budgetData as Budget;
	},

	async getAllBudgets(workspace_id: string) {
		await this.setupTestData(); // Ensure test data is set up before fetching
		return (await prisma.budget.findMany({
			where: {
				workspace_id,
			},
			include: {
				Group: true,
				Category: {
					include: {
						ParentCategory: true,
					}
				},
				Tags: true,
				scheduleVariants: true,
				triggerVariants: true,
			},
		})).map(this.dbToBudget);
	},

	async getBudgetById(workspace_id: string, budget_id: string) {
		return await prisma.budget.findUnique({
			where: {
				budget_id,
				workspace_id,
			},
		});
	},

	async createInsertInstructions(workspace_id: string, budgetData: Budget) {
		return {
			memo: budgetData.memo,
			workspace_id,
			budget_id: budgetData.budget_id || undefined,
			transaction_type: budgetData.budgetType,
			recurrence_type: budgetData.recurrence_type,

			// ACCOUNTS
			account_id: budgetData.account_id,
			// target_account_partition_id: budgetData.target_account_partition_id,
			origin_account_id: budgetData.origin_account_id,
			// origin_account_partition_id: budgetData.origin_account_partition_id,

			// ASSOCIATIONS
			category_id: budgetData.category_id,
			// Tags: {
			// 	[connectOrSet]: budgetData.tag_ids?.map(tagId => ({
			// 		tag_id: tagId,
			// 	})) || [],
			// },
		};
	},

	async createBudget(workspace_id: string, budgetData: Budget) {
		const insertInstructions = await this.createInsertInstructions(workspace_id, budgetData);

		await prisma.budget.create({
			data: {
				...insertInstructions,
			},
		});

		// set schedule variants
		if (asAny(budgetData).scheduleVariants) {
			await this.setAllScheduleVariantsForBudget(budgetData.budget_id, asAny(budgetData).scheduleVariants);
		}

		// set trigger variants
		if (asAny(budgetData).triggerVariants) {
			await this.setAllTriggerVariantsForBudget(budgetData.budget_id, asAny(budgetData).triggerVariants);
		}
	},



	/**
	 * PUT - Updates an ENTIRE budget and variants
	 * @param workspace_id 
	 * @param budget_id 
	 * @param budgetData 
	 * @returns 
	 */
	async updateBudget(workspace_id: string, budget_id: string, budgetData: Budget) {
		const insertInstructions = await this.createInsertInstructions(workspace_id, budgetData);
		// Don't update these fields
		const fieldsToOmit = ['recurrence_type', 'transaction_type'];
		for (const field of fieldsToOmit) {
			delete insertInstructions[field];
		}

		await prisma.budget.update({
			where: {
				budget_id,
				workspace_id,
			},
			data: {
				...insertInstructions,
			}
		});

		// Update schedule variants
		if (asAny(budgetData).scheduleVariants) {
			await this.setAllScheduleVariantsForBudget(budget_id, asAny(budgetData).scheduleVariants);
		}

		// Update trigger variants
		if (asAny(budgetData).triggerVariants) {
			await this.setAllTriggerVariantsForBudget(budget_id, asAny(budgetData).triggerVariants);
		}

	},

	async setAllScheduleVariantsForBudget(budget_id: string, scheduleVariants: ScheduledBudget["scheduleVariants"]) {
		// delete all prior attributions
		await prisma.budgetScheduleVariant.deleteMany({
			where: {
				budget_id,
			},
		});

		// create new attributions
		await prisma.budgetScheduleVariant.createMany({
			data: scheduleVariants.map(variant => ({
				budget_id,
				amount: variant.amount,
				schedule: variant.schedule as any,
				window_interval: variant.window?.interval,
				window_quantity: variant.window?.quantity,
				projection_interval: variant.projectionInterval?.interval,
				projection_quantity: variant.projectionInterval?.quantity,
			})),
		});
	},

	async setAllTriggerVariantsForBudget(budget_id: string, triggerVariants: TriggeredBudget["triggerVariants"]) {
		// delete all prior attributions
		await prisma.budgetTriggerVariant.deleteMany({
			where: {
				budget_id,
			},
		});

		// create new attributions
		await prisma.budgetTriggerVariant.createMany({
			data: triggerVariants.map(variant => ({
				budget_id,
				end: variant.end?.toString(),
				trigger_filter: variant.trigger.filter as any,
				trigger_operand: variant.trigger.computation.operand,
				trigger_operator: variant.trigger.computation.operator,
			})),
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