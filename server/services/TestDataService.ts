import { MONTHS, TagColor } from "../../delfi-core/utils/constants";
import { categoryByName } from "../../delfi-core/models/systemCategories";
import { BudgetType, RecurrenceType, type Budget, type TriggeredBudget } from "../../delfi-core/models/Budget";
import { ddate } from "../../delfi-core/utils/dateUtils";
import { type Account, type Institution } from "../../delfi-core/models/Account";
import { AccountService } from "./AccountService";
import { type Workspace } from "./WorkspaceService";
import { WorkspaceDao } from "server/data/WorkspaceDao";
import type { User } from "./UserService";
import type { BudgetGroup, Tag } from "delfi-core/models/Transaction";
import { CategoryDao } from "server/data/CategoryDao";
import type { TransactionRule } from "delfi-core/models/TransactionRule";

export class TestDataService {
	public static get userId(): string {
		return this.users[0].user_id;
	}
	public static get workspaceId(): string {
		return this.workspaces[0].workspace_id;
	}

	public static users: Array<User> = [{
		user_id: "a911cba0-3f61-4bc7-86a6-0d1c407baf18",
		auth_id: "BFBbDd1tb1cEEZjAmPEYaQMCIDi1",
		email: "simplyolives2018@gmail.com",
		given_name: "Arthur",
		family_name: "Judd"
	}]

	public static workspaces: Array<Workspace> = [{
		name: "SimplyOlives",
		workspace_id: "f2b1c2d3-4e5f-6789-abcd-ef0123456789",
	}];


	public static my_institutions: Array<Institution> = [
		{
			institution_id: 'test-afcu-id',
			name: "America First Credit Union",
			logo: "https://www.abc4.com/wp-content/uploads/sites/4/2022/07/AFCU_Logo.jpg?resize=258",
			plaid_institution_id: null,
			loginUrl: 'https://secure.americafirst.com/#/login',
			scraper: 'scraper'
		},
		{
			institution_id: 'test-betterment-id',
			name: "Betterment",
			logo: "https://media.licdn.com/dms/image/C4D0BAQHD-kRGjmwQtQ/company-logo_200_200/0/1637070868010/betterment_logo?e=2147483647&v=beta&t=R_wIOyd244kG2zZBj0dlgDubceiCtMmUrjHwBmPqm3w",
			plaid_institution_id: null,
			loginUrl: 'https://wwws.betterment.com/app/login',
			scraper: 'extension',
		},
		{
			institution_id: 'test-health-equity-id',
			name: "HealthEquity",
			logo: "https://m.bbb.org/prod/ProfileImages/38f8bb37-8e33-46e4-8d7e-c9d2ff7bf962.png",
			plaid_institution_id: null,
			loginUrl: 'https://my.healthequity.com/ClientLogin.aspx',
			scraper: 'extension',
		},
		{
			institution_id: 'test-principal-id',
			name: "Principal",
			logo: "https://www.principalcdn.com/css/principal-design-system/apple-touch-icon.png",
			plaid_institution_id: null,
			loginUrl: 'https://accounts.principal.com/app/bookmark/0oadm2qe1orihoKba5d7/login',
			scraper: 'extension',
		},
		{
			institution_id: 'test-wealthfront-id',
			name: "Wealthfront",
			logo: "https://logodix.com/logo/2119922.png",
			plaid_institution_id: null,
			loginUrl: 'https://www.wealthfront.com/login',
			scraper: 'extension',
		},
		// {
		// 	institution_id: 'test-carta-id',
		// 	name: "Carta",
		// 	logo: "https://images.ctfassets.net/y88td1zx1ufe/3NUunpYQon5SRBWGU061bP/eff07a366b9521eccf493bfe7e6707d0/carta-logo.png",
		// 	plaid_institution_id: null,
		// 	loginUrl: 'https://login.app.carta.com/credentials/login',
		// 	scraper: 'extension',
		// }
	];

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
						// 	schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
						// 	projectionSchedule: { byDayOfMonth: [25] },
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
		},
		{
			group_id: 'test-wyoming-2025',
			name: 'Wyoming 2025',
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
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [15] },
					amountTemplate: {
						type: 'fixed',
						amount: -300,
					}
				}],
				category_id: categoryByName("Life Insurance").category_id,
				Category: categoryByName("Life Insurance"),
			},
			{
				budget_id: 'a3c1d3e4-5f6a-7890-abcd-ef0123456789',
				budgetType: BudgetType.TRANSACTION,
				memo: "Rachel Life Insurance",
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [15] },
					amountTemplate: {
						type: 'fixed',
						amount: -70,
					}
				}],
				category_id: categoryByName("Life Insurance").category_id,
				Category: categoryByName("Life Insurance"),
			},
			{ // Car Insurance
				budget_id: 'd3e4f5a6-7890-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Car Insurance",
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [18] },
					amountTemplate: {
						type: 'fixed',
						amount: -55,
					}
				}],
				category_id: categoryByName("Auto Insurance").category_id,
				Category: categoryByName("Auto Insurance"),
			},

			// MONTHLY INCOME AND BENEFITS

			{
				budget_id: 'd4e5f6a7-8901-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Clozd Salary",
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					projectionSchedule: { frequency: 'MONTHLY', byDayOfMonth: [14, 27] },
					amountTemplate: {
						type: 'fixed',
						amount: 3593 * 2,
					}
				}],
				category_id: categoryByName("Paycheck").category_id,
				Category: categoryByName("Paycheck"),
			},
			{
				budget_id: '0023f6a7-8901-abcd-ef01-234567895002',
				budgetType: BudgetType.TRANSACTION,
				memo: "HSA Contribution",
				account_id: getAccountByName('Health Savings Account').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					projectionSchedule: { frequency: 'MONTHLY', byDayOfMonth: [14, 27] },
					amountTemplate: {
						type: 'fixed',
						amount: 256 * 2,
					}
				}],
				category_id: categoryByName("Employee Benefits").category_id,
				Category: categoryByName("Employee Benefits"),
			},
			{
				budget_id: '0033f6a7-8901-abcd-ef01-234567895003',
				budgetType: BudgetType.TRANSACTION,
				memo: "401(k) Contribution",
				account_id: getAccountByName('401(k)').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					projectionSchedule: { frequency: 'MONTHLY', byDayOfMonth: [14, 27] },
					amountTemplate: {
						type: 'fixed',
						amount: 168 * 2,
					}
				}],
				category_id: categoryByName("Employee Benefits").category_id,
				Category: categoryByName("Employee Benefits"),
			},


			// QUARTERLY INCOME AND BENEFITS

			{
				budget_id: '0013f6a7-8901-abcd-ef01-234567895001',
				budgetType: BudgetType.TRANSACTION,
				memo: "Clozd HSA Contribution",
				account_id: getAccountByName('Health Savings Account').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-01-01', frequency: 'MONTHLY', interval: 3, },
					projectionSchedule: { byDayOfMonth: [27] },
					amountTemplate: {
						type: 'fixed',
						amount: 600,
					}
				}],
				category_id: categoryByName("Employee Benefits").category_id,
				Category: categoryByName("Employee Benefits"),
			},

			{
				budget_id: '7c13f6a7-8901-abcd-ef01-234567895f3b',
				budgetType: BudgetType.TRANSACTION,
				memo: "Clozd Bonus",
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-01-01', frequency: 'MONTHLY', interval: 3, },
					projectionSchedule: { byDayOfMonth: [27] },
					amountTemplate: {
						type: 'fixed',
						amount: 800,
					}
				}],
				category_id: categoryByName("Bonus").category_id,
				Category: categoryByName("Bonus"),
			},


			{
				budget_id: '0043f6a7-8901-abcd-ef01-234567895004',
				budgetType: BudgetType.TRANSACTION,
				memo: "Clozd Equity Purchase",
				account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-01-01', frequency: 'MONTHLY', interval: 3, },
					projectionSchedule: { byDayOfMonth: [27] },
					amountTemplate: {
						type: 'fixed',
						amount: -223,
					}
				}],
				category_id: categoryByName("Buy").category_id,
				Category: categoryByName("Buy"),
			},

			{
				budget_id: 'c5d6e7f8-9012-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Tithing",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Church Donations").category_id,
				Category: categoryByName("Church Donations"),
				recurrence_type: RecurrenceType.TRIGGER,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					amountTemplate: {
						type: 'triggered',
						trigger: {
							type: 'immediateMatch',
							filter: {
								OR: [
									{
										property: 'category_id',
										operator: 'eq',
										operand: categoryByName("Paycheck").category_id,
									},
									{
										property: 'category_id',
										operator: 'eq',
										operand: categoryByName("Bonus").category_id,
									},
								]
							},
							computation: {
								operator: 'percent',
								operand: -10
							}
						},
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
					schedule: { start: '2022-05-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [7] },
					amountTemplate: {
						type: 'fixed',
						amount: -100,
					}
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
				scheduleVariants: [
					{
						schedule: { start: '2022-06-01', end: '2025-03-31', frequency: 'MONTHLY', },
						projectionSchedule: { byDayOfMonth: [20] },
						amountTemplate: {
							type: 'fixed',
							amount: -2219,
						}
					},
					{
						schedule: { start: '2025-04-01', end: '2025-05-31', frequency: 'MONTHLY', },
						projectionSchedule: { byDayOfMonth: [20] },
						amountTemplate: {
							type: 'fixed',
							amount: -2725,
						}
					},
					{
						schedule: { start: '2025-06-01', frequency: 'MONTHLY', },
						projectionSchedule: { byDayOfMonth: [2] },
						amountTemplate: {
							type: 'fixed',
							amount: -2725,
						}
					}
				],
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
					schedule: { start: '2022-06-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [3] },
					amountTemplate: {
						type: 'fixed',
						amount: -240,
					}
				}],
			},
			{
				budget_id: 'd9e0f1a2-3456-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Gas Bill",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Gas Bill").category_id,
				Category: categoryByName("Gas Bill"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [18] },
					amountTemplate: {
						type: 'seasonal',
						monthAmounts: {
							0: -45,
							1: -60,
							2: -45,
							3: -40,
							4: -20,
							5: -17,
							6: -19,
							7: -16,
							8: -17,
							9: -20,
							10: -20,
							11: -30,
						},
					}
				}],
			},
			{
				budget_id: 'a20e1f2-4567-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Power Bill",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Electric Bill").category_id,
				Category: categoryByName("Electric Bill"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [17] },
					amountTemplate: {
						type: 'seasonal',
						monthAmounts: {
							0: -56,
							1: -42,
							2: -40,
							3: -37,
							4: -45,
							5: -74,
							6: -100,
							7: -86,
							8: -107,
							9: -46,
							10: -49,
							11: -54,
						},
					}
				}],
			},
			{
				budget_id: 'b30e1f2-4567-abcd-ef01-234567890123',
				budgetType: BudgetType.TRANSACTION,
				memo: "Internet",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Internet").category_id,
				Category: categoryByName("Internet"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [17] },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
			},

			{
				budget_id: 'adeff2-4567-abcd-ef01-234567897935',
				budgetType: BudgetType.TRANSACTION,
				memo: "Phone Bill",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Phone Plan").category_id,
				Category: categoryByName("Phone Plan"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-06-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [17] },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
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
					schedule: { start: '2024-09-01', end: '2025-05-31', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [6] },
					amountTemplate: {
						type: 'fixed',
						amount: -170,
					}
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
					schedule: { start: ddate('2022-09-01').startOf('week').toString(), frequency: 'WEEKLY' },
					projectionSchedule: { byDayOfWeek: ['WE'] },
					amountTemplate: {
						type: 'fixed',
						amount: -15,
					}
				}],
			},


			// KIDS ACTIVITIES
			{
				budget_id: '001e1f2-4567-abcd-ef01-234567890001',
				budgetType: BudgetType.TRANSACTION,
				memo: "Nana Dance",
				account_id: getAccountByName('Checking').account_id,
				category_id: categoryByName("Sports and Activities").category_id,
				Category: categoryByName("Sports and Activities"),
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2025-10-01', end: '2026-05-30', frequency: 'MONTHLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -60,
					}
				}],
			},

			/**
			 * SAVINGS
			 */
			{
				budget_id: 'e12f34a5-67b8-90cd-ef12-345678901234',
				budgetType: BudgetType.TRANSFER,
				memo: "Car Savings",
				account_id: getAccountByName('Expense Savings').account_id,
				origin_account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [15] },
					amountTemplate: {
						type: 'fixed',
						amount: 1000,
					}
				}],
				category_id: categoryByName("Savings").category_id,
				Category: categoryByName("Transfer"),
			},
			{
				budget_id: 'f13a34a5-67b8-90cd-ef12-345678901335',
				budgetType: BudgetType.TRANSFER,
				memo: "Hannah-Claire Savings",
				account_id: getAccountByName('Checking').account_id,
				// account_id: getAccountByName('Expense Savings').account_id,
				// origin_account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [15] },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				category_id: categoryByName("Savings").category_id,
				Category: categoryByName("Transfer"),
			},
			{
				budget_id: 'a14f34a5-67b8-90cd-ef12-34567890a144',
				budgetType: BudgetType.TRANSFER,
				memo: "August Savings",
				account_id: getAccountByName('Checking').account_id,
				// account_id: getAccountByName('Expense Savings').account_id,
				// origin_account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [15] },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				category_id: categoryByName("Savings").category_id,
				Category: categoryByName("Transfer"),
			},
			{
				budget_id: '42f56a78-90b1-2c3d-e4f5-678901234567',
				budgetType: BudgetType.TRANSFER,
				memo: "Emergency Savings",
				account_id: getAccountByName('Checking').account_id,
				// account_id: getAccountByName('Expense Savings').account_id,
				// origin_account_id: getAccountByName('Checking').account_id,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', },
					projectionSchedule: { byDayOfMonth: [15] },
					amountTemplate: {
						type: 'fixed',
						amount: -250,
					}
				}],
				category_id: categoryByName("Savings").category_id,
				Category: categoryByName("Transfer"),
			},





			// BROUGHT IN FROM OLD "BUDGETS"
			{
				budget_id: 'f9e8d7c6-5b4a-3210-9876-543210fedcba',
				memo: 'Groceries',
				schedule: { start: '2022-09-01', frequency: 'MONTHLY', },
				category_id: categoryByName("Groceries").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2022-09-01', frequency: 'MONTHLY', },
					projectionSchedule: { frequency: 'WEEKLY', interval: 2 },
					amountTemplate: {
						type: 'fixed',
						amount: -350,
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
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					projectionSchedule: { interval: 2, frequency: 'WEEKLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: '001765432-1fed-cba9-8765-432109876001',
				memo: "Ministering",
				category_id: categoryByName("Service").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			// Fun Money
			{
				budget_id: '1a2b3c4d-5e6f-7890-abcd-ef0123456789',
				memo: "Arthur $",
				category_id: null,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: '2b3c4d5e-6f78-90ab-cdef-0123456789ab',
				memo: "Rachel $",
				category_id: null,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: '3c4a4d5e-6f78-90ab-cdef-01234567a73f',
				memo: "Date Night",
				category_id: null,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: '3c4d5e6f-7890-abcd-ef01-23456789abcd',
				memo: "Family Fun",
				category_id: null,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			// // Baby Care
			// {
			// 	budget_id: '8f9a0b1c-2d3e-4f56-7890-123456789abc',
			// 	memo: "Baby Care",
			// 	category_id: categoryByName("Baby Supplies").category_id,
			// 	budgetType: BudgetType.TRANSACTION,
			// 	recurrence_type: RecurrenceType.SCHEDULE,
			// 	scheduleVariants: [{
			// 		schedule: { start: '2021-04-01', frequency: 'MONTHLY', },
			// 		amount: -50,
			// 	}],
			// 	account_id: getAccountByName('Checking').account_id,
			// },



			// ANNUAL BUDGETS
			{
				budget_id: 'd21e1f2-4567-abcd-ef01-23456789d213',
				memo: "Thanksgiving Point Membership",
				category_id: categoryByName("Parks & Attractions").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-05-01', frequency: 'YEARLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -269,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: 'c30e1f2-4567-abcd-ef01-234567890123',
				memo: "Costco Membership",
				category_id: categoryByName("Shopping").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-01-01', frequency: 'YEARLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -69,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: 'df151f2-4567-abcd-ef01-234567892856',
				memo: "Back2School",
				category_id: categoryByName("Books & Supplies").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-08-01', frequency: 'YEARLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -100,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: '01251f2-4567-abcd-ef01-234567890901',
				memo: "Hyundai Registration",
				category_id: categoryByName("Vehicle Registration").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-08-01', frequency: 'YEARLY' },
					projectionSchedule: { byMonthOfYear: [8] },
					amountTemplate: {
						type: 'fixed',
						amount: -200,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},


			{
				budget_id: 'fe251f2-4567-abcd-ef01-234567890962',
				memo: "Hannah-Claire Party",
				category_id: categoryByName("Parties").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-02-01', frequency: 'YEARLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -100,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: 'fe241f2-4567-abcd-ef01-234567882962',
				memo: "Hannah-Claire Gift",
				category_id: categoryByName("Gifts").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-02-01', frequency: 'YEARLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},


			{
				budget_id: 'df251f2-4567-abcd-ef01-234567890973',
				memo: "August Party",
				category_id: categoryByName("Parties").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-08-01', frequency: 'YEARLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -100,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},
			{
				budget_id: 'df361f2-4567-abcd-ef01-234567451973',
				memo: "August Gift",
				category_id: categoryByName("Gifts").category_id,
				budgetType: BudgetType.TRANSACTION,
				recurrence_type: RecurrenceType.SCHEDULE,
				scheduleVariants: [{
					schedule: { start: '2021-08-01', frequency: 'YEARLY' },
					amountTemplate: {
						type: 'fixed',
						amount: -50,
					}
				}],
				account_id: getAccountByName('Checking').account_id,
			},


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
					amountTemplate: {
						type: 'fixed',
						amount: -2000,
					},
					projectionSchedule: {
						frequency: 'MONTHLY',
						interval: 3,
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
						date: ddate('2025-06-15'), // June 15, 2025
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
						date: ddate('2025-06-16'), // June 16, 2025
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
						date: ddate('2025-06-18'), // June 18, 2025
						budgetType: BudgetType.TRANSACTION,
						account_id: getAccountByName('Expense Savings').account_id,
						target_account_partition_id: null,
					},
				]
			},
		];
	}

	static get transactionRules(): Array<TransactionRule> {
		return [
			{
				transaction_rule_id: 'rule-1',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: 'AMAZON MKTPL' } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: '9fd5faaa-c305-4df8-98e5-2af0f6bdb3a6' } }
				]
			},
			{
				transaction_rule_id: 'rule-3',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "WINCO FOODS" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: '7d811758-d002-4108-89cc-62b4b8516db5' } }
				]
			},
			{
				transaction_rule_id: 'rule-4',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "STATE FARM" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: '3af7197b-95bc-41ac-b900-6edd277f744e' } }
				]
			},
			{
				transaction_rule_id: 'rule-5',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "OLIVE GARDEN" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: '0e98e918-9fb7-4e76-b8d4-2be328938bce' } }
				]
			},
			{
				transaction_rule_id: 'rule-6',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "COSTCO" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: '211815cf-6651-4b6e-af94-9821afd1a672' } }
				]
			},
			{
				transaction_rule_id: 'rule-7',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "CHEVRON" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: 'dc463616-53ef-4b58-8a32-43e86c148ff4' } }
				]
			},
			{
				transaction_rule_id: 'rule-8',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "MAVERIK" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: 'f01f8a23-85d1-43ba-a6e9-30208d1a48dd' } }
				]
			},
			{
				transaction_rule_id: 'rule-9',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "HOME DEPOT" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: '5cfa3fb0-16bd-4140-a0ee-a1029e53e44a' } }
				]
			},

			// MERCHANT and CATEGORY pair, for workspace-only rules (they assign merchants directly to their categories)
			{
				transaction_rule_id: 'rule-10',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "RIDLEY'S" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: 'dec45eae-1d76-405e-be2f-710e55bc2215' } }
				]
			},
			{
				transaction_rule_id: 'rule-11',
				workspace_id: TestDataService.workspaceId,
				filter: { AND: [ { property: 'Transaction.merchant_id', operator: 'eq', operand: "dec45eae-1d76-405e-be2f-710e55bc2215" } ], },
				actions: [
					{ action: 'category_id', value: { category_id: categoryByName("Groceries").category_id } }
				]
			},

			// MERCHANT CATEGORY ASSOCIATION, for global associations that lookup a relevant workspace category
			// This rule applies the merchant, and the merchant record ties it to the Fast Food detection_key.
			// The workspace will need to have a category with the same detection_key.
			{
				transaction_rule_id: 'rule-12',
				filter: { AND: [ { property: 'Transaction.original_description', operator: 'inc', operand: "WENDY'S" } ], },
				actions: [
					{ action: 'merchant_id', value: { merchant_id: 'd1a7ff54-1234-450b-b7c8-cb02828a7efe' } }
				]
			},
		]
	}

}
