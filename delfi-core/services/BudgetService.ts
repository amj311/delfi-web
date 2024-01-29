import { Budget, BudgetAccumulator } from "../models/Budget";

export default class BudgetService {
	static createBudgetAccumulator(budget: Budget, startingBalance: number = 0): BudgetAccumulator {
		return new BudgetAccumulator(
			budget.budget_id,
			startingBalance,
			[{
				property: 'budgetId',
				operator: 'eq',
				operand: budget.budget_id
			}],
			budget,
		)
	}
}