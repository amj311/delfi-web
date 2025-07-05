import { MONTHS, TagColor } from "../../delfi-core/utils/constants";
import { categoryByName } from "../../delfi-core/models/systemCategories";
import { BudgetType, RecurrenceType, type Budget } from "../../delfi-core/models/Budget";
import { date } from "../../delfi-core/utils/dateUtils";
import { type Account, type Institution } from "../../delfi-core/models/Account";
import { AccountService } from "./AccountService";
import { type Workspace } from "./WorkspaceService";
import { WorkspaceDao } from "server/data/WorkspaceDao";
import type { User } from "./UserService";
import type { BudgetGroup, Tag } from "delfi-core/models/Transaction";
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


	public static budgetGroups: Array<BudgetGroup> = [
		{
			group_id: 'test-montreal-2025',
			name: 'Montreal 2025',
			workspace_id: this.workspaceId,
			color: TagColor.yellow2,
		}
	]

	public static groupId(name: string): string | undefined {
		return this.budgetGroups.find(group => group.name === name)?.group_id;
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
				budget_id: 'fe89138d-43e6-4733-aa6e-77b4f76e8582',
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
				budget_id: 'a3c1d3e4-5f6a-7890-abcd-ef0123456789',
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
				budget_id: 'd3e4f5a6-7890-abcd-ef01-234567890123',
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
				budget_id: 'd4e5f6a7-8901-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Clozd Salary",
				amount: -3140,
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-08', frequency: 'MONTHLY', byDayOfMonth: [14, 27] },
					amount: 3594,
				}],
				category_id: categoryByName("Paycheck").category_id,
				Category: categoryByName("Paycheck"),
			},
			{
				budget_id: 'c5d6e7f8-9012-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Tithing",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Church Donations").category_id,
				Category: categoryByName("Church Donations"),
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
				budget_id: 'd6e7f8a9-0123-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Fast Offering",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Charitable Donations").category_id,
				Category: categoryByName("Charitable Donations"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-05-07', frequency: 'MONTHLY', byDayOfMonth: [7] },
					amount: -100,
				}],
			},

			{
				budget_id: 'd7e8f9a0-1234-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Mortgage",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Mortgage & Rent").category_id,
				Category: categoryByName("Mortgage & Rent"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] },
					amount: -2725,
				}],
			},
			{
				budget_id: 'd8e9f0a1-2345-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "HOA",
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
				budget_id: 'd9e0f1a2-3456-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Gas Bill",
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
				budget_id: 'a20e1f2-4567-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Power Bill",
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
				budget_id: 'b30e1f2-4567-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Internet",
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
				budget_id: 'c40e1f2-4567-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Preschool",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Tuition").category_id,
				Category: categoryByName("Tuition"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2024-09-01', end: '2025-05-31', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: -170,
				}],
			},

			{
				budget_id: 'd50e1f2-4567-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Rachel Focus Babysitter",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Babysitter & Daycare").category_id,
				Category: categoryByName("Babysitter & Daycare"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
					amount: -60,
				}],
			},

			/**
			 * SAVINGS
			 */
			{
				budget_id: 'e12f34a5-67b8-90cd-ef12-345678901234',
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
				budget_id: '42f56a78-90b1-2c3d-e4f5-678901234567',
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
				budget_id: 'f9e8d7c6-5b4a-3210-9876-543210fedcba',
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
				budget_id: '98765432-1fed-cba9-8765-432109876543',
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
				budget_id: '1a2b3c4d-5e6f-7890-abcd-ef0123456789',
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
				budget_id: '2b3c4d5e-6f78-90ab-cdef-0123456789ab',
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
				budget_id: '3c4d5e6f-7890-abcd-ef01-23456789abcd',
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
			// 	budget_id: '8f9a0b1c-2d3e-4f56-7890-123456789abc',
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
				budget_id: '4d5e6f78-90ab-cdef-0123-456789abcdef',
				memo: 'Travel',
				category_id: null,
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
						budget_child_item_id: '5e6f7890-abcd-ef01-2345-6789abcdef01',
						memo: 'Round-trip flights to Montreal',
						amount: -500,
						group_id: this.groupId('Montreal 2025')!,
						category_id: categoryByName("Flights").category_id,
						Category: categoryByName("Flights"),
						date: date('2025-06-15'), // June 15, 2025
						budgetType: BudgetType.TRANSACTION,
						account_id: getAccountByName('Expense Savings').account_id,
						target_account_partition_id: null,
						budget_id: '5e6f7890-abcd-ef01-2345-6789abcdef01',
					},
					{
						budget_child_item_id: '6f7890ab-cdef-0123-4567-89abcdef0123',
						group_id: this.groupId('Montreal 2025')!,
						budget_id: '6f7890ab-cdef-0123-4567-89abcdef0123',
						category_id: categoryByName("Lodging").category_id,
						Category: categoryByName("Lodging"),
						memo: 'Airbnb',
						amount: -1000,
						date: date('2025-06-16'), // June 16, 2025
						budgetType: BudgetType.TRANSACTION,
						account_id: getAccountByName('Expense Savings').account_id,
						target_account_partition_id: null,
					},
					// Leave a catch-all as uncategorized
					{
						budget_child_item_id: '7890abcd-ef01-2345-6789-abcdef012345',
						group_id: this.groupId('Montreal 2025')!,
						budget_id: '7890abcd-ef01-2345-6789-abcdef012345',
						category_id: null,
						memo: 'Activities and Purchases',
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
