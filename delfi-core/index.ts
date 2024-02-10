
/**
 * Central Delfi instance for registering all financial entities
 * and handling 
 */

import { AccountAccumulator, type Account } from "./models/Account";
import { TransactionScheduleType, type TransactionSchedule } from "./models/Transaction";
import Forecast from "./models/Forecast";
import Accumulator from "./models/Accumulator";
import { CategorySummary, type Category, type UserCategory, type SystemCategory, type ParentCategory } from "./models/Category";
import type { Budget, BudgetAccumulator } from "./models/Budget";
import BudgetService from "./services/BudgetService";
import type { TransactionEvent, TransactionTrigger } from "./models/Transaction";
import { date, type DelfiDate } from "./utils/dateUtils";
import { flatCategoriesMap, nestedCategories } from "./models/systemCategories";

export type DelfiConfig = {
	readonly accounts: Account[],
	readonly budgets: Budget[],
	readonly transactionSchedules: TransactionSchedule[],
	readonly userCategories: UserCategory[],
}

export interface Delfi extends DelfiConfig {}

export class Delfi {
	public forecast!: Forecast;
	readonly composedCategories!: ParentCategory[];


	constructor(config: DelfiConfig) {
		Object.assign(this, config);
		this.composedCategories = JSON.parse(JSON.stringify(nestedCategories));
		this.userCategories.forEach(c => this.composedCategories.find(p => p.category_id === c.parent_id)?.children?.push(c));
	}

	get flatCategories(): Category[] {
		return this.composedCategories.flatMap(c => [c, ...c.children]);
	}

	public async createFullForecast(start: DelfiDate, end: DelfiDate): Promise<Forecast> {
		const accumulators: Accumulator[] = [];
		accumulators.push(new Accumulator(
			'total',
			this.accounts.reduce((balance, a) => balance + a.current_balance, 0),
			[{
				operator: '*'
			}]
		));
		accumulators.push(new Accumulator(
			'income',
			0,
			[{
				property: 'type',
				operator: 'eq',
				operand: 'income',
			}]
		));
		accumulators.push(new Accumulator(
			'expense',
			0,
			[{
				property: 'type',
				operator: 'eq',
				operand: 'expense',
			}]
		));
		for (const account of this.accounts) {
			const acc = new AccountAccumulator(account, start);
			accumulators.push(acc);
		};

		// Prepare categories w/ accumulators
		for (const category of this.flatCategories) {
			const accumulator = new Accumulator(
				'cat_' + category.category_id,
				0,
				[{
					property: 'categoryId',
					operator: 'eq',
					operand: category.category_id,
				}]
			);
			accumulators.push(accumulator);
		}

		// Prepare budgets w/ categories
		for (const budget of this.budgets) {
			const accumulator = BudgetService.createBudgetAccumulator(budget);
			accumulators.push(accumulator);
		};

		// Put everything in the forecast
		this.forecast = new Forecast({
			accumulators,
			transactionSchedules: this.transactionSchedules.filter(s => s.recurrenceType === 'schedule'),
			transactionTriggers: this.transactionSchedules.filter(s => s.recurrenceType === 'trigger') as unknown as TransactionTrigger[],
			start,
			end,
		});
		return this.forecast;
	}


	getMonthSummary(monthDate: DelfiDate) {
		// make extra sure we have the start and end date
		const monthStart = date(monthDate.startOf('month'));
		const monthEnd = date(monthDate.endOf('month'));
		
		const timeline = this.forecast.getTimeline(monthStart, monthEnd, 'day');

		const accountSummaries = this.accounts.map(account => (
			(this.forecast.accumulatorMap[account.account_id] as AccountAccumulator).createSummary(monthStart, monthEnd)
		));

		const categorySummaries = this.composedCategories.map((category: ParentCategory) => (
			new CategorySummary(
				monthStart,
				monthEnd,
				category,
				timeline.accumulatorEvents['cat_' + category.category_id],
				this.budgets.filter(b => b.categoryId === category.category_id).map(b => this.forecast.accumulatorMap[b.budget_id] as BudgetAccumulator),
				category.children?.map(child => new CategorySummary(
					monthStart,
					monthEnd,
					child,
					timeline.accumulatorEvents['cat_' + child.category_id],
					this.budgets.filter(b => b.categoryId === child.category_id).map(b => this.forecast.accumulatorMap[b.budget_id] as BudgetAccumulator),
				)),
			)
		));

		const incomeSummary = categorySummaries.find(c => c.category.name === 'Income');
		const transferSummary = categorySummaries.find(c => c.category.name === 'Transfer');
		const spendingCategories = categorySummaries.filter(c => !['Income', 'Transfer'].includes(c.category.name));

		return {
			timeline,
			accountSummaries,
			categorySummaries,
			incomeSummary,
			transferSummary,
			spendingCategories,
		};
	}
}
