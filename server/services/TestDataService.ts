import { colors, MONTHS, TagColor } from "../../delfi-core/utils/constants";
import { v4 as uuid } from "uuid";
import { categoryByName, flatCategoriesMap } from "../../delfi-core/models/systemCategories";
import { BudgetType, RecurrenceType, type Budget } from "../../delfi-core/models/Budget";
import { date } from "../../delfi-core/utils/dateUtils";
import { type Account, type Institution } from "../../delfi-core/models/Account";
import { AccountService } from "./AccountService";
import { type Workspace } from "./WorkspaceService";
import { WorkspaceDao } from "server/data/WorkspaceDao";
import type { User } from "./UserService";
import type { Group, Tag } from "delfi-core/models/Transaction";
import { CategoryDao } from "server/data/CategoryDao";

export class TestDataService {
	public static get userId(): string {
		return this.users[0].user_id;
	}
	public static get workspaceId(): string {
		return this.workspaces[0].workspace_id;
	}

	public static users: Array<User> = [{
		user_id: "a911cba0-3f61-4bc7-86a6-0d1c407baf18",
		auth_id: "5etpEgtKBCdDWG7XrmxOrlKFTI92",
		email: "amjudd315@gmail.com",
		given_name: "Arthur",
		family_name: "Judd"
	}]

	public static workspaces: Array<Workspace> = [{
		name: "SimplyOlives",
		workspace_id: "f2b1c2d3-4e5f-6789-abcd-ef0123456789",
	}];


	public static my_institutions: Array<Institution> = [{
		institution_id: 'test-afcu-id',
		name: "America First Credit Union",
		logo: "https://www.abc4.com/wp-content/uploads/sites/4/2022/07/AFCU_Logo.jpg?resize=258",
		plaid_institution_id: null,
	}];

	public static async getAccounts(existingAccounts: Account[] = []): Promise<Account[]> {
		// 	const accountStuff = {
		// 		mask: "0942",
		// 		iso_currency_code: "USD",
		// 		plaid_item_id: "afcu_checking",
		// 		workspace_id: "myself",
		// 		external_account_id: uuid(),
		// 		external_name: "asdfgtrf",
		// 		type: AccountType.depository,
		// 		subtype: AccountSubtype.checking,
		// 		institution_id: my_institutions[0].institution_id,
		// 		source: 'manual',
		// 		created_at: new Date('2021-04-01T00:00:00Z'),
		// 	}

		// 	public static asyncmy_accounts: { [key: string]: Account } = {
		// 		afcu_checking: {
		// 			account_id: uuid(),
		// 			display_name: "AFCU Checking",
		// 			current_balance: 200,
		// 			available_balance: 200,
		// 			partitions: [],
		// 			...accountStuff,
		// 		},
		// 		afcu_savings: {
		// 			account_id: uuid(),
		// 			display_name: "AFCU Savings",
		// 			current_balance: 5100,
		// 			available_balance: 5100,
		// 			partitions: [],
		// 			...accountStuff,
		// 		},
		// 		us_savings: {
		// 			account_id: uuid(),
		// 			display_name: "US Bank",
		// 			current_balance: 3000,
		// 			available_balance: 3000,
		// 			partitions: [],
		// 			...accountStuff,
		// 		},
		// 	};

		const savingsAccount = existingAccounts.find(account => account.external_name === 'Expense Savings');
		if (savingsAccount) {
			savingsAccount.partitions = [
				{
					account_partition_id: 'test-partition-id',
					account_id: savingsAccount.account_id,
					name: 'New Car',
					current_balance: 100,
					savings_goal: {
						savings_goal_id: 'test-savings-goal-id',
						account_partition_id: 'test-partition-id',
						target_balance: 7000,
						target_date: new Date(2024, MONTHS.SEP, 1),
						// schedule_details: {
						// 	budget_id: uuid(),
						// 	amount: -2100,
						// 	memo: "New Car Savings",
						// 	type: BudgetBudgetType.TRANSFER,
						// 	origin_account_id: getAccountByName('Checking').account_id,
						// 	workspace_id: 'myself',
						// 	schedule: { start: '2021-04-25', frequency: 'MONTHLY', byDayOfMonth: [25] },
						// 	category_id: categoryByName("Transfer").category_id,
						// 	Category: categoryByName("Transfer"),
						// },
					}
				}

			];
		}

		return existingAccounts;
	}


	public static tags: Array<Tag> = []

	public static tagId(name: string): string | undefined {
		return this.tags.find(tag => tag.name === name)?.tag_id;
	}


	public static groups: Array<Group> = [
		{
			group_id: 'test-montreal-2025',
			name: 'Montreal 2025',
			workspace_id: this.workspaceId,
			color: TagColor.tag_yellow4,
		}
	]

	public static groupId(name: string): string | undefined {
		return this.groups.find(group => group.name === name)?.group_id;
	}


	public static async getBudgets(): Promise<Budget[]> {
		await CategoryDao.setupTestData();
		
		const workspace = (await WorkspaceDao.getAllWorkspaces())[0];
		if (!workspace) {
			return [];
		}

		const my_accounts = await AccountService.getAllAccounts(workspace.workspace_id);

		function getAccountByName(name: string): Account {
			return Object.values(my_accounts).find(account => account.external_name === name)!;
		}

		return <Budget[]>[
			/**
			 * EVERY MONTH
			 */
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Arthur Life Insurance",
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-05', frequency: 'MONTHLY', byDayOfMonth: [5] },
					amount: -300,
				}],
				category_id: categoryByName("Life Insurance").category_id,
				Category: categoryByName("Life Insurance"),
			},
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Rachel Life Insurance",
				amount: -70,
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-05', frequency: 'MONTHLY', byDayOfMonth: [5] },
					amount: -70,
				}],
				category_id: categoryByName("Life Insurance").category_id,
				Category: categoryByName("Life Insurance"),
			},
			{ // Car Insurance
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Car Insurance",
				amount: -81,
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-08', frequency: 'MONTHLY', byDayOfMonth: [8] },
					amount: -81,
				}],
				category_id: categoryByName("Auto Insurance").category_id,
				Category: categoryByName("Auto Insurance"),
			},

			{ // Clozd fulltime
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Clozd Salary",
				amount: -3140,
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-08', frequency: 'MONTHLY', byDayOfMonth: [14, 27] },
					amount: 3140,
				}],
				category_id: categoryByName("Paycheck").category_id,
				Category: categoryByName("Paycheck"),
			},
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Tithing",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Tithing").category_id,
				Category: categoryByName("Tithing"),
				recurrence_type: RecurrenceType.TRIGGER,
				triggerVariants: [{
					trigger: {
						type: 'immediateMatch',
						filter: [{
							property: 'Category.type',
							operator: 'eq',
							operand: 'INCOME',
						}],
						computation: {
							operator: 'percent',
							operand: -10
						}
					},
				}]
			},
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Fast Offering",
				amount: -100,
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Fast Offering").category_id,
				Category: categoryByName("Fast Offering"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-05-07', frequency: 'MONTHLY', byDayOfMonth: [7] },
					amount: -100,
				}],
			},

			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Mortgage",
				amount: -2445,
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Mortgage & Rent").category_id,
				Category: categoryByName("Mortgage & Rent"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] },
					amount: -2445,
				}],
			},
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "HOA",
				amount: -215,
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Home Services").category_id,
				Category: categoryByName("Home Services"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-18', frequency: 'MONTHLY', byDayOfMonth: [18] },
					amount: -215,
				}],
			},
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Gas Bill",
				amount: -50,
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Utilities").category_id,
				Category: categoryByName("Utilities"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-18', frequency: 'MONTHLY', byDayOfMonth: [18] },
					amount: -50,
				}],
			},
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Power Bill",
				amount: -30,
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Utilities").category_id,
				Category: categoryByName("Utilities"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] },
					amount: -30,
				}],
			},
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Internet",
				amount: -50,
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Utilities").category_id,
				Category: categoryByName("Utilities"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] },
					amount: -50,
				}],
			},

			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSACTION,
				memo: "Preschool",
				amount: -170,
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Tuition").category_id,
				Category: categoryByName("Tuition"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2024-09-01', end: '2025-05-31', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: -170,
				}],
			},

			/**
			 * SAVINGS
			 */
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSFER,
				memo: "Emergency Savings Transfer",
				account_id: getAccountByName('Expense Savings').account_id,
				origin_account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: 300,
				}],
				category_id: categoryByName("Transfer").category_id,
				Category: categoryByName("Transfer"),
			},
			{
				budget_id: uuid(),
				budgetType: BudgetType.TRANSFER,
				memo: "To Car Fund",
				account_id: getAccountByName('Expense Savings').account_id,
				target_account_partition_id: getAccountByName('Expense Savings').partitions[0].account_partition_id, // New Car
				origin_account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: 500,
				}],
				category_id: categoryByName("Transfer").category_id,
				Category: categoryByName("Transfer"),
			},


			// BROUGHT IN FROM OLD "BUDGETS"
			{
				budget_id: uuid(),
				memo: 'Groceries',
				schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
				category_id: categoryByName("Groceries").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: -300,
					projectionInterval: {
						interval: 'week',
						quantity: 2,
					},
				}],
				account_id: getAccountByName('Checking').account_id,
			} as any,
			{
				budget_id: uuid(),
				memo: "Fuel",
				category_id: categoryByName("Fuel").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: -50,
				}],
				account_id: getAccountByName('Checking').account_id,
				num_months: 1,
			},
			// Fun Money
			{
				budget_id: uuid(),
				memo: "Arthur $",
				category_id: null,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: -50,
				}],
				account_id: getAccountByName('Checking').account_id,
				num_months: 1,
			},
			{
				budget_id: uuid(),
				memo: "Rachel $",
				category_id: null,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: -50,
				}],
				account_id: getAccountByName('Checking').account_id,
				num_months: 1,
			},
			{
				budget_id: uuid(),
				memo: "Family Fun",
				category_id: null,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: -50,
				}],
				account_id: getAccountByName('Checking').account_id,
				num_months: 1,
			},
			// // Baby Care
			// {
			// 	budget_id: uuid(),
			// 	memo: "Baby Care",
			// 	category_id: categoryByName("Baby Supplies").category_id,
			// 	budgetType: BudgetType.TRANSACTION,
			// 	recurrence_type: RecurrenceType.SCHEDULE,
			// 	scheduleVariants: [{
			// 		schedule: { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
			// 		amount: -50,
			// 	}],
			// 	account_id: getAccountByName('Checking').account_id,
			// 	num_months: 1,
			// },



			// LARGE budgets with children

			{
				budget_id: 'yearly-travel-budget',
				memo: 'Travel',
				category_id: categoryByName("Groceries").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				account_id: getAccountByName('Checking').account_id,
				scheduleVariants: [{
					schedule: { start: '2022-01-01', frequency: 'YEARLY' },
					amount: -2000,
					projectionInterval: {
						interval: 'month',
						quantity: 3,
					},
				}],
				childItems: [
					// MONTREAL 2025
					{
						memo: 'Round-trip flights to Montreal',
						amount: -500,
						group_id: this.groupId('Montreal 2025')!,
						category_id: categoryByName("Flights").category_id,
						Category: categoryByName("Flights"),
						date: date('2025-06-15'), // June 15, 2025
						budgetType: BudgetType.TRANSACTION,
						account_id: getAccountByName('Expense Savings').account_id,
						target_account_partition_id: null,
						budget_id: 'yearly-travel-budget',
					},
					{
						group_id: this.groupId('Montreal 2025')!,
						budget_id: 'yearly-travel-budget',
						category_id: categoryByName("Lodging").category_id,
						Category: categoryByName("Lodging"),
						memo: 'Airbnb',
						amount: -1000,
						date: date('2025-06-16'), // June 16, 2025
						budgetType: BudgetType.TRANSACTION,
						account_id: getAccountByName('Expense Savings').account_id,
						target_account_partition_id: null,
					},
					{
						group_id: this.groupId('Montreal 2025')!,
						budget_id: 'yearly-travel-budget',
						category_id: categoryByName("Activities").category_id,
						Category: categoryByName("Activities"),
						memo: 'All Activities',
						amount: -500,
						date: date('2025-06-18'), // June 18, 2025
						budgetType: BudgetType.TRANSACTION,
						account_id: getAccountByName('Expense Savings').account_id,
						target_account_partition_id: null,
					},
				]
			},
		];
	}

}
