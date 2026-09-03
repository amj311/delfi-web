import { RecurrenceType, type Budget, type BudgetChildItem, type FixedAmount, type ScheduledBudget, type SeasonalAmount, type TriggeredAmount, type TriggeredBudget } from "delfi-core/models/Budget";
import { prisma } from "../../prisma/client";
import { asAny } from "delfi-core/utils/miscUtils";
import { ddate } from "delfi-core/utils/dateUtils";

export class BudgetDao {
	private static hasInit = false;

	private static dbToBudget(budget: NonNullable<{[key: string]: any}>): Budget {
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
				schedule_variant_id: variant.schedule_variant_id,
				amountTemplate: {
					type: variant.amount_type as 'fixed' | 'triggered' | 'seasonal',
					amount: variant.amount,
					monthAmounts: variant.month_amounts,
					trigger: variant.amount_type === 'triggered' ? {
						filter: variant.trigger_filter as any,
						computation: {
							operator: variant.trigger_operator as any,
							operand: variant.trigger_operand as any,
						}
					} : undefined
				},
				schedule: variant.schedule as any,
				projectionSchedule: variant.projectionSchedule as any,
				notes: variant.notes,
				// window: variant.window_interval ? {
				// 	interval: variant.window_interval as any,
				// 	quantity: variant.window_quantity as any,
				// } : undefined,
				// projectionInterval: variant.projection_interval ? {
				// 	interval: variant.projection_interval as any,
				// 	quantity: variant.projection_quantity as any,
				// } : undefined,
			})),
			childItems: budget.childItems?.map(BudgetDao.dbToBudgetChildItem),
			// childItems: budget.childItems?.map((item: any) => ({
			// 	budget_child_item_id: item.budget_child_item_id,
			// 	amount: item.amount,
			// 	date: item.date ? new Date(item.date) : undefined,
			// })),
		}

		return budgetData as Budget;
	}

	private static dbToBudgetChildItem(childItem: NonNullable<{[key: string]: any}>): BudgetChildItem {
		return {
			...BudgetDao.dbToBudget(childItem),
			budget_child_item_id: childItem.budget_child_item_id,
			amount: childItem.amount,
			date: ddate(childItem.date),
		}
	}

	public static async getAllBudgets(workspace_id: string) {
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
				// triggerVariants: true,
				childItems: true,
			}
		})).map(BudgetDao.dbToBudget);
	}

	public static async getBudgetById(workspace_id: string, budget_id: string) {
		return await prisma.budget.findUnique({
			where: {
				budget_id,
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
				// triggerVariants: true,
				childItems: true,
			}
		});
	}

	public static async createBudgetInsertData(workspace_id: string, budgetData: Budget) {
		const sharedInsertData = await BudgetDao.createSharedInsertData(budgetData as any);
		return {
			...sharedInsertData,
			workspace_id,
		};
	}

	public static async createBudgetChildItemInsertData(budget_id: string, budgetData: BudgetChildItem) {
		const sharedInsertData = await BudgetDao.createSharedInsertData(budgetData as any);
		return {
			...sharedInsertData,
			budget_id,
			amount: budgetData.amount,
			date: ddate(budgetData.date).toString(),
		};
	}

	public static async createSharedInsertData(budgetData: Budget) {
		return {
			memo: budgetData.memo,
			budget_id: budgetData.budget_id || undefined,
			transaction_type: budgetData.displayShape,
			recurrence_type: budgetData.recurrence_type,

			// ACCOUNTS
			account_id: budgetData.account_id,
			// target_account_partition_id: budgetData.target_account_partition_id,
			origin_account_id: budgetData.origin_account_id,
			// origin_account_partition_id: budgetData.origin_account_partition_id,

			// ASSOCIATIONS
			category_id: budgetData.category_id,
			group_id: budgetData.group_id,
			// Tags: {
			// 	[connectOrSet]: budgetData.tag_ids?.map(tagId => ({
			// 		tag_id: tagId,
			// 	})) || [],
			// }
		};
	}

	public static async createBudget(workspace_id: string, budgetData: Budget) {
		const insertInstructions = await BudgetDao.createBudgetInsertData(workspace_id, budgetData);

		const created = await prisma.budget.create({
			data: {
					...insertInstructions,
				}
			});

			// set schedule variants
		if (asAny(budgetData).scheduleVariants) {
			await BudgetDao.setAllScheduleVariantsForBudget(created.budget_id, asAny(budgetData).scheduleVariants);
		}

			// Return the created budget with all relations
		return this.dbToBudget(await BudgetDao.getBudgetById(workspace_id, created.budget_id));
	}

	/**
	  * PUT - Updates an ENTIRE budget and variants
	  * @param workspace_id 
	  * @param budget_id 
	  * @param budgetData 
	  * @returns 
	  */
	public static async updateBudget(workspace_id: string, budget_id: string, budgetData: Budget) {
		const insertInstructions = await BudgetDao.createBudgetInsertData(workspace_id, budgetData);
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
			await BudgetDao.setAllScheduleVariantsForBudget(budget_id, asAny(budgetData).scheduleVariants);
		}

			// Return the updated budget with all relations
		return this.dbToBudget(await BudgetDao.getBudgetById(workspace_id, budget_id));
	}
	public static async setAllScheduleVariantsForBudget(budget_id: string, scheduleVariants: ScheduledBudget["scheduleVariants"]) {
		await prisma.budgetScheduleVariant.deleteMany({
			where: {
				budget_id,
			}
		});

		// create new attributions
		await prisma.budgetScheduleVariant.createMany({
			data: scheduleVariants.map(variant => ({
				budget_id,
				
				amount_type: variant.amountTemplate?.type,
				amount: (variant.amountTemplate as FixedAmount).amount || null,
				month_amounts: (variant.amountTemplate as SeasonalAmount).monthAmounts || null,
				trigger_filter: (variant.amountTemplate as TriggeredAmount).trigger?.filter as any,
				trigger_operand: (variant.amountTemplate as TriggeredAmount).trigger?.computation.operand,
				trigger_operator: (variant.amountTemplate as TriggeredAmount).trigger?.computation.operator,

				schedule: variant.schedule as any,
				projectionSchedule: variant.projectionSchedule as any,
				// window_interval: variant.window?.interval,
				// window_quantity: variant.window?.quantity,
				// projection_interval: variant.projectionInterval?.interval,
				// projection_quantity: variant.projectionInterval?.quantity,
			})),
		});
	}

	public static async createBudgetChildItem(budget_id: string, item: BudgetChildItem) {
		const insertInstructions = await BudgetDao.createBudgetChildItemInsertData(budget_id, item as any);
		await prisma.budgetChildItem.create({
			data: {
				...insertInstructions,
				budget_id,
				budget_child_item_id: item.budget_child_item_id || undefined,
				amount: item.amount,
				date: ddate(item.date).toString(),
			}
		});
	}


	public static async updateBudgetChildItem(budget_id: string, budget_child_item_id: string, item: BudgetChildItem) {
		const insertInstructions = await BudgetDao.createBudgetChildItemInsertData(budget_id, item as any);
		await prisma.budgetChildItem.update({
			where: {
				budget_child_item_id,
				budget_id,
			},
			data: {
				...insertInstructions,
				amount: item.amount,
				date: ddate(item.date).toString(),
			}
		});
	}

	public static async deleteBudget(workspace_id: string, budget_id: string) {
		await prisma.budget.delete({
			where: {
				budget_id,
				workspace_id,
			}
		});
	}
};