import { XPerMonthSchedule } from "../../delfi-core/models/schedules/XPerMonthSchedule";
import { type TransactionSchedule, TransactionScheduleType } from "../../delfi-core/services/transactionService";
import { MONTHS } from "../../delfi-core/utils/constants";
import { v4 as uuid } from "uuid";
import { ImmediateMatchTrigger } from "../../delfi-core/models/schedules/triggers";
import type { Budget } from "delfi-core/models/Budget";

const requiredStuff = {
	mask: "**** **** **** 0942",
	iso_currency_code: "USD",
	plaid_item_id: "afcu_checking",
	user_id: "myself",
}

export const my_accounts = {
	afcu_checking: {
		account_id: uuid(),
		external_account_id: uuid(),
		external_name: "asdfgtrf",
		custom_name: "AFCU Checking",
		type: "depository",
		subtype: "checking",
		current_balance: 200,
		partitions: <unknown[]>[],
	},
	afcu_savings: {
		account_id: uuid(),
		external_name: "asdfgtrf",
		custom_name: "AFCU Savings",
		current_balance: 5100,
		partitions: <unknown[]>[],
	},
	us_savings: {
		account_id: uuid(),
		external_name: "asdfgtrf",
		custom_name: "US Bank",
		current_balance: 3000,
		partitions: <unknown[]>[],
	},
};

my_accounts.afcu_savings.partitions = [
	{
		partition_id: 'test-partition-id',
		name: 'New Car',
		balance: 5100,
		target: 7000,
		target_date: new Date(2024, MONTHS.SEP, 1),
		transferSchedule: {
			id: uuid(),
			amount: 500,
			memo: "New Car Savings",
			type: TransactionScheduleType.transfer,
			originAccount: my_accounts.afcu_checking.account_id,
			targetAccount: my_accounts.afcu_savings.account_id,
			targetPartition: 'test-partition-id',
			schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25)),
		}
	}
];



export const nestedCategories = [
    {
        "name": "Auto & Transport",
		category_id: uuid(),
        "children": [
            {
                "name": "Registration",
				category_id: uuid(),
            },
            {
                "name": "Auto Insurance",
				category_id: uuid(),
            },
            {
                "name": "Auto Payment",
				category_id: uuid(),
            },
            {
                "name": "Fuel",
				category_id: uuid(),
            },
            {
                "name": "Parking",
				category_id: uuid(),
            },
            {
                "name": "Public Transportation",
				category_id: uuid(),
            },
            {
                "name": "Service & Parts",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Bills & Utilities",
		category_id: uuid(),
        "children": [
            {
                "name": "Home Phone",
				category_id: uuid(),
            },
            {
                "name": "Internet",
				category_id: uuid(),
            },
            {
                "name": "Mobile Phone",
				category_id: uuid(),
            },
            {
                "name": "Television",
				category_id: uuid(),
            },
            {
                "name": "Utilities",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Business Services",
		category_id: uuid(),
        "children": [
            {
                "name": "Software",
				category_id: uuid(),
            },
            {
                "name": "Advertising",
				category_id: uuid(),
            },
            {
                "name": "Legal",
				category_id: uuid(),
            },
            {
                "name": "Office Supplies",
				category_id: uuid(),
            },
            {
                "name": "Printing",
				category_id: uuid(),
            },
            {
                "name": "Shipping",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Education",
		category_id: uuid(),
        "children": [
            {
                "name": "Books & Supplies",
				category_id: uuid(),
            },
            {
                "name": "Student Loan",
				category_id: uuid(),
            },
            {
                "name": "Tuition",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Entertainment",
		category_id: uuid(),
        "children": [
            {
                "name": "Amusement",
				category_id: uuid(),
            },
            {
                "name": "Arts",
				category_id: uuid(),
            },
            {
                "name": "Movies & DVDs",
				category_id: uuid(),
            },
            {
                "name": "Music",
				category_id: uuid(),
            },
            {
                "name": "Newspapers & Magazines",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Fees & Charges",
		category_id: uuid(),
        "children": [
            {
                "name": "ATM Fee",
				category_id: uuid(),
            },
            {
                "name": "Banking Fee",
				category_id: uuid(),
            },
            {
                "name": "Finance Charge",
				category_id: uuid(),
            },
            {
                "name": "Late Fee",
				category_id: uuid(),
            },
            {
                "name": "Service Fee",
				category_id: uuid(),
            },
            {
                "name": "Trade Commissions",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Financial",
		category_id: uuid(),
        "children": [
            {
                "name": "Financial Advisor",
				category_id: uuid(),
            },
            {
                "name": "Life Insurance",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Food & Dining",
		category_id: uuid(),
        "children": [
            {
                "name": "Treats and Sweets",
				category_id: uuid(),
            },
            {
                "name": "Alcohol & Bars",
				category_id: uuid(),
            },
            {
                "name": "Coffee Shops",
				category_id: uuid(),
            },
            {
                "name": "Fast Food",
				category_id: uuid(),
            },
            {
                "name": "Restaurants",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Gifts & Donations",
		category_id: uuid(),
        "children": [
            {
                "name": "Christmas",
				category_id: uuid(),
            },
            {
                "name": "Birthday",
				category_id: uuid(),
            },
            {
                "name": "Charity",
				category_id: uuid(),
            },
            {
                "name": "Gift",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Health & Fitness",
		category_id: uuid(),
        "children": [
            {
                "name": "Dentist",
				category_id: uuid(),
            },
            {
                "name": "Doctor",
				category_id: uuid(),
            },
            {
                "name": "Eyecare",
				category_id: uuid(),
            },
            {
                "name": "Gym",
				category_id: uuid(),
            },
            {
                "name": "Health Insurance",
				category_id: uuid(),
            },
            {
                "name": "Pharmacy",
				category_id: uuid(),
            },
            {
                "name": "Sports",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Home",
		category_id: uuid(),
        "children": [
            {
                "name": "Furnishings",
				category_id: uuid(),
            },
            {
                "name": "Home Improvement",
				category_id: uuid(),
            },
            {
                "name": "Home Insurance",
				category_id: uuid(),
            },
            {
                "name": "Home Services",
				category_id: uuid(),
            },
            {
                "name": "Home Supplies",
				category_id: uuid(),
            },
            {
                "name": "Lawn & Garden",
				category_id: uuid(),
            },
            {
                "name": "Mortgage & Rent",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Income",
		category_id: uuid(),
        "children": [
            {
                "name": "Interest Income",
				category_id: uuid(),
            },
            {
                "name": "Paycheck",
				category_id: uuid(),
            },
            {
                "name": "Reimbursement",
				category_id: uuid(),
            },
            {
                "name": "Rental Income",
				category_id: uuid(),
            },
            {
                "name": "Returned Purchase",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Investments",
		category_id: uuid(),
        "children": [
            {
                "name": "Buy",
				category_id: uuid(),
            },
            {
                "name": "Deposit",
				category_id: uuid(),
            },
            {
                "name": "Dividend & Cap Gains",
				category_id: uuid(),
            },
            {
                "name": "Sell",
				category_id: uuid(),
            },
            {
                "name": "Withdrawal",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Kids",
		category_id: uuid(),
        "children": [
            {
                "name": "Allowance",
				category_id: uuid(),
            },
            {
                "name": "Baby Supplies",
				category_id: uuid(),
            },
            {
                "name": "Babysitter & Daycare",
				category_id: uuid(),
            },
            {
                "name": "Child Support",
				category_id: uuid(),
            },
            {
                "name": "Kids Activities",
				category_id: uuid(),
            },
            {
                "name": "Toys",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Personal Care",
		category_id: uuid(),
        "children": [
            {
                "name": "Hair",
				category_id: uuid(),
            },
            {
                "name": "Laundry",
				category_id: uuid(),
            },
            {
                "name": "Spa & Massage",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Pets",
		category_id: uuid(),
        "children": [
            {
                "name": "Pet Food & Supplies",
				category_id: uuid(),
            },
            {
                "name": "Pet Grooming",
				category_id: uuid(),
            },
            {
                "name": "Veterinary",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Shopping",
		category_id: uuid(),
        "children": [
            {
                "name": "Books",
				category_id: uuid(),
            },
            {
                "name": "Clothing",
				category_id: uuid(),
            },
            {
                "name": "Electronics & Software",
				category_id: uuid(),
            },
            {
                "name": "Hobbies",
				category_id: uuid(),
            },
            {
                "name": "Sporting Goods",
				category_id: uuid(),
            },
			{
				name: "Groceries",
				category_id: uuid(),
			}
        ]
    },
    {
        "name": "Taxes",
		category_id: uuid(),
        "children": [
            {
                "name": "Federal Tax",
				category_id: uuid(),
            },
            {
                "name": "Local Tax",
				category_id: uuid(),
            },
            {
                "name": "Property Tax",
				category_id: uuid(),
            },
            {
                "name": "Sales Tax",
				category_id: uuid(),
            },
            {
                "name": "State Tax",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Transfer",
		category_id: uuid(),
        "children": [
            {
                "name": "Refund",
				category_id: uuid(),
            },
            {
                "name": "Credit Card Payment",
				category_id: uuid(),
            },
            {
                "name": "Transfer for Cash Spending",
				category_id: uuid(),
            },
            {
                "name": "Mortgage Payment",
				category_id: uuid(),
            }
        ]
    },
    {
        "name": "Travel",
		category_id: uuid(),
        "children": [
            {
				"name": "Hotel & Lodging",
				category_id: uuid(),
			},
			{
				"name": "Flights",
				category_id: uuid(),
			},
			{
				"name": "Transportation",
				category_id: uuid(),
			},
			{
				"name": "Activities",
				category_id: uuid(),
			},
			{
				"name": "Food",
				category_id: uuid(),
			},
        ]
    },
    {
        "name": "Uncategorized",
		category_id: uuid(),
        "children": []
    }
];

export const flatCategoriesMap = Object.fromEntries(nestedCategories.flatMap(parent => ([
	[parent.name, parent],
	...parent.children.map(child => [child.name, {
		...child,
		parent: parent.name
	}])
])))



export const my_scheduledTransactions: any[] = [
	/**
	 * EVERY MONTH
	 */
	{ 
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Arthur Life Insurance",
		amount: 300,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 5)),
		categoryId: flatCategoriesMap["Life Insurance"].name
	},
	{ 
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Rachel Life Insurance",
		amount: 70,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 5)),
		categoryId: flatCategoriesMap["Life Insurance"].name
	},
	{ // Car Insurance
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Car Insurance",
		amount: 81,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 8)),
		categoryId: flatCategoriesMap["Auto Insurance"].name
	},

	{ // Clozd fulltime
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.income,
		memo: "Clozd Salary",
		amount: 2540,
		targetAccount:  my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(2, new Date(2022, MONTHS.MAY, 14)),
		categoryId: flatCategoriesMap["Paycheck"].name
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Tithing",
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Charity"].name,
		recurrenceType: 'trigger',
		trigger: new ImmediateMatchTrigger({
			filter: [{
				property: 'type',
				operator: 'eq',
				operand: TransactionScheduleType.income,
			}],
			computation: {
				operator: 'percent',
				operand: 10
			}
		}),
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Fast Offering",
		amount: 100,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Charity"].name,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 7))
	},

	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Mortgage",
		amount: 2240,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Mortgage & Rent"].name,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 17))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "HOA",
		amount: 215,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Home Services"].name,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 18))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Gas Bill",
		amount: 50,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Utilities"].name,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 18))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Power Bill",
		amount: 30,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Utilities"].name,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 17))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Internet",
		amount: 50,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Utilities"].name,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 17))
	},

	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Preschool",
		amount: 170,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Tuition"].name,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2024, MONTHS.SEP, 1), new Date(2025, MONTHS.MAY, 1))
	},


	/**
	 * SAVINGS
	 */
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.transfer,
		memo: "Emergency Savings Transfer",
		amount: 500,
		targetAccount: my_accounts.afcu_savings.account_id,
		originAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.SEP, 1)),
		categoryId: flatCategoriesMap["Transfer"].name,
	},
];





export const budgets: Budget[] = [
	{
		budget_id: uuid(),
		name: 'Groceries',
		amount: 300,
		recurrenceSchedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.SEP, 1)),
		numMonths: 1,
		categoryId: flatCategoriesMap.Groceries.name,
		systemEventAccountId: my_accounts.afcu_checking.account_id,
	},
	{
		budget_id: uuid(),
		name: "Fuel",
		amount: 50,
		categoryId: flatCategoriesMap.Fuel.name,
		systemEventAccountId: my_accounts.afcu_checking.account_id,
		recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
		numMonths: 1,
	},
	// Fun Money
	{
		budget_id: uuid(),
		name: "Fun Money",
		categoryId: flatCategoriesMap.Shopping.name,
		recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
		amount: 150,
		systemEventAccountId: my_accounts.afcu_checking.account_id,
		numMonths: 1,
	},
	// Baby Care
	{
		budget_id: uuid(),
		name: "Baby Care",
		categoryId: flatCategoriesMap.Shopping.name,
		recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
		amount: 50,
		systemEventAccountId: my_accounts.afcu_checking.account_id,
		numMonths: 1,
	},
];
