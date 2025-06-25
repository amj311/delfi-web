import { PlaidCategory } from "server/services/PlaidService";
import type { CategoryDetails, CategoryGroup } from "./Category";
import { TagColor } from "delfi-core/utils/constants";

// Define the groups based on the old parent categories
export const categoryGroups: CategoryGroup[] = [
	{
		group_id: "7d2babb7-1065-4a7c-8552-67ba2f185f75",
		name: "Transportation",
		color: TagColor.sky2,
		icon: "commute",
	},
	{
		group_id: "ba16a566-cf88-4a3f-8b7c-877d3357d123",
		name: "Bills & Utilities",
		color: TagColor.yellow3,
		icon: "faucet",
	},
	{
		group_id: "e8ddbfdf-7b34-41dd-90cb-134ef3c737f5",
		name: "Business Services",
		icon: "briefcase",
		color: TagColor.yellow1,
	},
	{
		group_id: "f3c1b0d2-4a5e-4b8c-9f6d-7c8e1b2f3a4c",
		name: "Education",
		icon: "graduation-cap",
		color: TagColor.navy1,
	},
	{
		group_id: "c1b2a2ca-c82b-4efd-9bbe-31928173eb9b",
		name: "Entertainment",
		icon: "smiley",
		color: TagColor.orange1,
	},
	{
		group_id: "f549c254-cd52-4668-bd24-b3f131eb1559",
		name: "Banking",
		icon: "bank",
		color: TagColor.teal1,
	},
	{
		group_id: "a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a",
		name: "Financial",
		icon: "dollar-bills",
		color: TagColor.teal3,
	},
	{
		group_id: "b2c3d4e5-f6a7-4b6c-9d1e-8f9a0b1c2d3e",
		name: "Food & Dining",
		icon: "utensils",
		color: TagColor.cherry1,
	},
	{
		group_id: "c3d4e5f6-a7b8-4c7d-ae2f-9a0b1c2d3e4f",
		name: "Gifts & Donations",
		icon: "give-heart",
		color: TagColor.blush2,
	},
	{
		group_id: "d4e5f6a7-b8c9-4d8e-bf3a-0b1c2d3e4f5a",
		name: "Health & Fitness",
		icon: "heartbeat",
		color: TagColor.apple1,
	},
	{
		group_id: "e5f6a7b8-c9d0-4e9f-ca4b-1c2d3e4f5a6b",
		name: "Home",
		icon: "home",
		color: TagColor.forest1,
	},
	{
		group_id: "f6a7b8c9-d0e1-4f0a-db5c-2d3e4f5a6b7c",
		name: "Income",
		icon: "money-bag",
		color: TagColor.lime2,
	},
	{
		group_id: "a7b8c9d0-e1f2-4a1b-ec6d-3e4f5a6b7c8d",
		name: "Investments",
		icon: "chart-line",
		color: TagColor.teal1,
	},
	{
		group_id: "b8c9d0e1-f2a3-4b2c-fd7e-4f5a6b7c8d9e",
		name: "Kids",
		icon: "child",
		color: TagColor.peach2,
	},
	{
		group_id: "c9d0e1f2-a3b4-4c3d-ae8f-5a6b7c8d9e0f",
		name: "Personal Care",
		icon: "tooth",
		color: TagColor.purple1,
	},
	{
		group_id: "d0e1f2a3-b4c5-4d4e-bf9a-6b7c8d9e0f1a",
		name: "Pets",
		icon: "paw",
		color: TagColor.chocolate1,
	},
	{
		group_id: "e1f2a3b4-c5d6-4e5f-ca0b-7c8d9e0f1a2b",
		name: "Shopping",
		icon: "shopping-cart",
		color: TagColor.magenta2,
	},
	{
		group_id: "f2a3b4c5-d6e7-4f6a-db1c-8d9e0f1a2b3c",
		name: "Taxes",
		icon: "gavel",
		color: TagColor.navy3,
	},
	{
		group_id: "a3b4c5d6-e7f8-4a7b-ec2d-9e0f1a2b3c4d",
		name: "Transfer",
		icon: "transfer",
	},
	{
		group_id: "b4c5d6e7-f8a9-4b8c-fd3e-0f1a2b3c4d5e",
		name: "Travel",
		icon: "compass",
		color: TagColor.orange3,
	},
];

// Also create a lookup map for groups by ID
export const categoryGroupsMap = Object.fromEntries(
	categoryGroups.map(group => [group.group_id, group])
);
export const categoryGroupNamesMap = Object.fromEntries(
	categoryGroups.map(group => [group.name, group])
);

const categories = {
	// Transportation
	"Vehicle Registration": {
		name: "Vehicle Registration",
		category_id: "62ce18c1-8dc2-44a4-9ec7-cc355f59018b",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Transportation"].group_id
	},
	"Vehicle Purchase": {
		name: "Vehicle Purchase",
		category_id: "53ce18c1-8dc2-44a4-9ec7-cc355f59019a",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Transportation"].group_id
	},
	"Auto Insurance": { // consider moving to financial?
		name: "Auto Insurance",
		category_id: "a9701bf6-4ad9-4ef2-8b3f-acddd562e6e6",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Transportation"].group_id
	},
	"Auto Payment": { // consider moving to debt payoff
		name: "Auto Payment",
		category_id: "8adb79fa-2857-41a5-af14-73e6a3b471aa",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Transportation"].group_id
	},
	"Fuel": {
		name: "Fuel",
		category_id: "ab0bb7ab-0367-4d7a-adbb-30846f5ec897",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Transportation"].group_id
	},
	"Parking": {
		name: "Parking",
		category_id: "92d6b0df-8fcc-40a2-9591-cf03af9dc723",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Transportation"].group_id
	},
	"Public Transportation": {
		name: "Public Transportation",
		category_id: "4acd8f6c-a108-41f7-bb74-44f342008f5e",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Transportation"].group_id
	},
	"Service & Parts": {
		name: "Service & Parts",
		category_id: "68a5922f-88cb-4f93-abac-194ab7c5193a",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Transportation"].group_id
	},


	// Bills & Utilities
	"Phone Plan": {
		name: "Phone Plan",
		category_id: "8ce8b6b3-3308-4b84-9d12-ce386b829d75",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Bills & Utilities"].group_id
	},
	"Internet": {
		name: "Internet",
		category_id: "f1ac1ce7-b6b2-4fd1-abbc-0f624c7f7223",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Bills & Utilities"].group_id
	},
	"Television": {
		name: "Television",
		category_id: "2734e341-e0c9-40c7-bad7-98db8e1e32f0",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Bills & Utilities"].group_id
	},
	"Utilities": {
		name: "Utilities",
		category_id: "c1b2a2ca-c82b-4efd-9bbe-31928173eb9a",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Bills & Utilities"].group_id
	},


	// Business Services
	"Software": {
		name: "Software",
		category_id: "42e60fe3-a98c-4270-86ad-4803ae25de24",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Business Services"].group_id
	},
	"Advertising": {
		name: "Advertising",
		category_id: "50c047e5-d08a-424f-b65b-b6cd66093584",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Business Services"].group_id
	},
	"Legal": {
		name: "Legal",
		category_id: "9e1724be-d700-4296-a918-f578860c2f0e",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Business Services"].group_id
	},
	"Office Supplies": {
		name: "Office Supplies",
		category_id: "e5cbbf97-6ef6-46d6-be78-ecfe196fdd9c",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Business Services"].group_id
	},
	"Printing": {
		name: "Printing",
		category_id: "57c39298-5057-4aed-b4ef-f6b6e0341a06",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Business Services"].group_id
	},
	"Shipping": {
		name: "Shipping",
		category_id: "04a4d5e0-b664-463a-adf9-4c5cb23089b9",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Business Services"].group_id
	},


	// Education
	"Books & Supplies": {
		name: "Books & Supplies",
		category_id: "8c04591a-1ab8-4e08-9f01-83ae9d413ca0",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Education"].group_id
	},
	"Student Loan": { // consider moving to debt payoff?
		name: "Student Loan",
		category_id: "b2d285a2-59a7-469d-9bbc-7d3e1095c193",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Education"].group_id
	},
	"Tuition": {
		name: "Tuition",
		category_id: "fd4e361a-23b0-4492-9768-2e8235a7c5f6",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Education"].group_id
	},


	// Entertainment
	"Amusement": {
		name: "Amusement",
		category_id: "312482e9-9aa0-4710-a312-4a5dd308dedb",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Entertainment"].group_id
	},
	"Arts": {
		name: "Arts",
		category_id: "ee167832-1262-4caf-bb78-4a6e987cd172",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Entertainment"].group_id
	},
	"Movies & DVDs": {
		name: "Movies & DVDs",
		category_id: "15510c92-62d3-49bc-8bdf-0891c1097dcf",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Entertainment"].group_id
	},
	"Music": {
		name: "Music",
		category_id: "58198b08-ae3b-4a87-bc73-1504647e578e",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Entertainment"].group_id
	},
	"Books": {
		name: "Books",
		category_id: "bd4c5e34-27ca-4652-a422-ec7673d90cc7",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Entertainment"].group_id
	},
	"Newspapers & Magazines": {
		name: "Newspapers & Magazines",
		category_id: "bd4c5e34-27ca-4652-a422-ec7673d90cc7",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Entertainment"].group_id
	},


	// Banking
	"ATM Fee": {
		name: "ATM Fee",
		category_id: "5d0b38c6-cd30-446b-824a-a5e1c137663a",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Banking"].group_id
	},
	"Banking Fee": {
		name: "Banking Fee",
		category_id: "6e20d2ed-f8f0-4562-ae37-7881e6560a62",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Banking"].group_id
	},
	"Finance Charge": {
		name: "Finance Charge",
		category_id: "40676754-e08b-4928-826f-a23961a2a042",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Banking"].group_id
	},
	"Late Fee": {
		name: "Late Fee",
		category_id: "5461213e-ffd5-464b-b3c4-bc2f6fc957cb",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Banking"].group_id
	},
	"Service Fee": {
		name: "Service Fee",
		category_id: "b4e435b8-d774-407f-afeb-5d79e4288f5f",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Banking"].group_id
	},
	"Trade Commissions": {
		name: "Trade Commissions",
		category_id: "b6b62d72-1cbc-4087-b928-6163abcff64a",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Banking"].group_id
	},


	// Financial
	"Financial Advisor": {
		name: "Financial Advisor",
		category_id: "69c87283-4a58-4aac-8cb3-c67d26e121a0",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Financial"].group_id
	},
	"Life Insurance": {
		name: "Life Insurance",
		category_id: "7f989aae-f1b3-408e-95fb-d7b90b88be5f",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Financial"].group_id
	},


	// Food & Dining
	"Treats and Sweets": {
		name: "Treats and Sweets",
		category_id: "3d8d6a00-d0d4-4908-a8c1-ff3d830d3ad3",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Food & Dining"].group_id,
		icon: "ice-cream",
	},
	"Alcohol & Bars": {
		name: "Alcohol & Bars",
		category_id: "4cc55ded-9014-4863-a0d6-4d084fea3ea6",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Food & Dining"].group_id
	},
	"Coffee Shops": {
		name: "Coffee Shops",
		category_id: "ef5e7110-72f7-4fb8-a650-7e3db4f406f6",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Food & Dining"].group_id
	},
	"Fast Food": {
		name: "Fast Food",
		category_id: "4bca50a9-190f-44eb-94d2-e02df52ca312",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Food & Dining"].group_id,
		icon: "fast-food",
	},
	"Restaurants": {
		name: "Restaurants",
		category_id: "6f58cb2e-f20e-47c1-8584-078d419c4e30",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Food & Dining"].group_id
	},


	// Gifts & Donations
	"Christmas": {
		name: "Christmas",
		category_id: "c9188777-62fb-4411-b4a1-9ed1e5447212",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Gifts & Donations"].group_id,
		icon: 'gift',
	},
	"Birthday": {
		name: "Birthday",
		category_id: "22fa90b8-f3f3-4a8c-922b-6b8835e977f8",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Gifts & Donations"].group_id,
		icon: 'cake',
	},
	"Charity": {
		name: "Charity",
		category_id: "e642de71-002a-4afc-a660-d155de11b627",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Gifts & Donations"].group_id
	},
	"Gift": {
		name: "Gift",
		category_id: "594b69f1-cef7-4f49-b275-174d00ecece0",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Gifts & Donations"].group_id,
		icon: 'gift',
	},
	"Tithing": {
		name: "Tithing",
		category_id: 'd8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4a',
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Gifts & Donations"].group_id,
	},
	"Fast Offering": {
		name: "Fast Offering",
		category_id: 'd8f0b1c2-3e4a-4f5c-9b6e-7d8f0b1c2e4b',
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Gifts & Donations"].group_id,
	},


	// Health & Fitness
	"Dentist": {
		name: "Dentist",
		category_id: "c795f728-f94e-48d1-9cd2-77221bb50a1b",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Health & Fitness"].group_id
	},
	"Doctor": {
		name: "Doctor",
		category_id: "a4524662-e6f5-4bfe-9e4e-4fbec5814628",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Health & Fitness"].group_id
	},
	"Eyecare": {
		name: "Eyecare",
		category_id: "b19e46a3-ce8f-4a96-b1d3-28cdd313fb85",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Health & Fitness"].group_id
	},
	"Gym": {
		name: "Gym",
		category_id: "bdc8aade-ea65-4e20-bb4a-7c40ebadc0a1",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Health & Fitness"].group_id
	},
	"Health Insurance": {
		name: "Health Insurance",
		category_id: "36deecac-e079-48ff-9b0d-b2ff3f252303",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Health & Fitness"].group_id
	},
	"Pharmacy": {
		name: "Pharmacy",
		category_id: "33736d95-667c-4f8d-8434-487cb9caff3d",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Health & Fitness"].group_id
	},
	"Sports": {
		name: "Sports",
		category_id: "05c69d5a-4472-4dad-bbe7-35fa673afc17",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Health & Fitness"].group_id
	},


	// Home
	"Furnishings": {
		name: "Furnishings",
		category_id: "db218c86-5d58-40c9-9695-f179a3d44f2d",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Home"].group_id
	},
	"Home Improvement": {
		name: "Home Improvement",
		category_id: "48aa9eed-143a-44aa-9352-8dff4b3c2d68",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Home"].group_id
	},
	"Home Insurance": {
		name: "Home Insurance",
		category_id: "1233f9f8-b986-4934-a58c-edaf9a062a35",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Home"].group_id
	},
	"Home Services": {
		name: "Home Services",
		category_id: "b7ce7783-9da9-4698-95f9-7d615174216b",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Home"].group_id
	},
	"Home Supplies": {
		name: "Home Supplies",
		category_id: "50dbd848-3862-4a58-a18b-cd366db603f0",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Home"].group_id
	},
	"Lawn & Garden": {
		name: "Lawn & Garden",
		category_id: "b812dac6-6a37-429e-a1c1-ede2c7f99b63",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Home"].group_id
	},
	"Mortgage & Rent": {
		name: "Mortgage & Rent",
		category_id: "98bd1be3-fcde-4fbe-af1b-7178315a25da",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Home"].group_id
	},


	// Income
	"Interest Income": {
		name: "Interest Income",
		category_id: "f26d6a29-64e9-443f-b2c3-81d2b9921142",
		type: "INCOME",
		group_id: categoryGroupNamesMap["Income"].group_id
	},
	"Paycheck": {
		name: "Paycheck",
		category_id: "881890d0-64d9-436b-a8d4-982b11276e68",
		type: "INCOME",
		group_id: categoryGroupNamesMap["Income"].group_id
	},
	"Reimbursement": {
		name: "Reimbursement",
		category_id: "257d286a-6593-41ae-a5a5-55e961a47998",
		type: "INCOME",
		group_id: categoryGroupNamesMap["Income"].group_id
	},
	"Rental Income": {
		name: "Rental Income",
		category_id: "2114648b-d34e-42c6-9d62-41b4eaf73571",
		type: "INCOME",
		group_id: categoryGroupNamesMap["Income"].group_id
	},
	"Returned Purchase": {
		name: "Returned Purchase",
		category_id: "ceb21839-7cc0-4534-986d-4ecaac759a46",
		type: "INCOME",
		group_id: categoryGroupNamesMap["Income"].group_id
	},


	// Investments
	"Buy": {
		name: "Buy",
		category_id: "53b6de9b-0761-42e0-b724-e5badf1a11fd",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Investments"].group_id
	},
	"Deposit": {
		name: "Deposit",
		category_id: "05c3c8b1-002f-424b-9ca0-556f5ddbb21b",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Investments"].group_id
	},
	"Dividend & Cap Gains": {
		name: "Dividend & Cap Gains",
		category_id: "a06575b1-b94f-4f08-91c7-27b58a1ef6ab",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Investments"].group_id
	},
	"Sell": {
		name: "Sell",
		category_id: "11bda97c-7de0-4004-89fc-56191b2e1b3a",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Investments"].group_id
	},
	"Withdrawal": {
		name: "Withdrawal",
		category_id: "b0ef4648-5801-4745-8fd6-9c23c0d8c23a",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Investments"].group_id
	},


	// Kids
	"Allowance": {
		name: "Allowance",
		category_id: "aea68813-cb83-472e-9ecd-387e2182ad37",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Kids"].group_id
	},
	"Baby Supplies": {
		name: "Baby Supplies",
		category_id: "ee69d893-35b3-4a66-9d54-a4176797e5dc",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Kids"].group_id
	},
	"Babysitter & Daycare": {
		name: "Babysitter & Daycare",
		category_id: "7d9334c5-7942-4adc-844b-dc17c6352aac",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Kids"].group_id
	},
	"Child Support": {
		name: "Child Support",
		category_id: "887e74ee-b201-47da-9f3c-378ade64559c",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Kids"].group_id
	},
	"Kids Activities": {
		name: "Kids Activities",
		category_id: "030d6853-7ef8-4aa2-b574-4f48a83a1e84",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Kids"].group_id
	},
	"Toys": {
		name: "Toys",
		category_id: "7ca8b829-b60d-4a99-8f7e-28f9760afc14",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Kids"].group_id
	},


	// Personal Care
	"Hair": {
		name: "Hair",
		category_id: "aad5343d-75b9-481b-bbeb-4d45e445f120",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Personal Care"].group_id
	},
	"Laundry": {
		name: "Laundry",
		category_id: "f0ed5497-ce37-41ad-91a3-4fd9675ac609",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Personal Care"].group_id
	},
	"Spa & Massage": {
		name: "Spa & Massage",
		category_id: "253feafa-5ae0-4f9e-9b60-336e9949c580",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Personal Care"].group_id
	},


	// Pets
	"Pet Food & Supplies": {
		name: "Pet Food & Supplies",
		category_id: "fae9177b-c986-4db7-b98f-feb71e266a9d",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Pets"].group_id
	},
	"Pet Grooming": {
		name: "Pet Grooming",
		category_id: "b83703ff-3f6d-4565-bfbe-5c76ebf442d6",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Pets"].group_id
	},
	"Veterinary": {
		name: "Veterinary",
		category_id: "ddee763e-dc14-4f77-ba75-105adadcba4b",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Pets"].group_id
	},


	// Shopping
	"Clothing": {
		name: "Clothing",
		category_id: "b83f3fad-f06b-4052-b35b-01d261009c50",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Shopping"].group_id
	},
	"Electronics & Software": {
		name: "Electronics & Software",
		category_id: "ddd1f2b7-f087-49fe-86dc-318fb574dd9f",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Shopping"].group_id
	},
	"Hobbies": {
		name: "Hobbies",
		category_id: "3a5d255c-4210-430c-9522-528edaf60c57",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Shopping"].group_id
	},
	"Sporting Goods": {
		name: "Sporting Goods",
		category_id: "c28290c3-5900-46e8-8e79-10ca31cd0e42",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Shopping"].group_id
	},
	"Groceries": {
		name: "Groceries",
		category_id: "93d35092-b4a7-424e-a86b-c3d4ff99e4e5",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Shopping"].group_id
	},



	// Taxes
	"Federal Tax": {
		name: "Federal Tax",
		category_id: "cbae3766-7d64-49f6-92de-19ad1c576ba5",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Taxes"].group_id
	},
	"Local Tax": {
		name: "Local Tax",
		category_id: "e3970bf9-efae-496b-bd53-4f98a8c8163b",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Taxes"].group_id
	},
	"Property Tax": {
		name: "Property Tax",
		category_id: "22090305-6510-4acd-8b2c-440a200ba311",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Taxes"].group_id
	},
	"Sales Tax": {
		name: "Sales Tax",
		category_id: "2c65aa58-cba0-49c8-a813-56b8c5f8df50",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Taxes"].group_id
	},
	"State Tax": {
		name: "State Tax",
		category_id: "4d4b349f-f31c-4d81-b1cf-39476126fd0f",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Taxes"].group_id
	},


	
	// Transfer
	"Transfer": {
		name: "Transfer",
		category_id: "cbae4766-7d64-49f6-92de-19ad1c576ba6",
		type: "TRANSFER",
		group_id: categoryGroupNamesMap["Transfer"].group_id
	},
	"Refund": {
		name: "Refund",
		category_id: "9a52efe9-b3e7-4fe1-8547-2ef477d4e34d",
		type: "TRANSFER",
		group_id: categoryGroupNamesMap["Transfer"].group_id
	},
	"Credit Card Payment": {
		name: "Credit Card Payment",
		category_id: "4b45bab9-fe7e-4224-a9d5-8738dd0f56a7",
		type: "TRANSFER",
		group_id: categoryGroupNamesMap["Transfer"].group_id
	},
	"Transfer for Cash Spending": {
		name: "Transfer for Cash Spending",
		category_id: "58685d03-42d9-416e-ad98-ebd0d0072e40",
		type: "TRANSFER",
		group_id: categoryGroupNamesMap["Transfer"].group_id
	},
	"Mortgage Payment": {
		name: "Mortgage Payment",
		category_id: "5826e87d-17e4-4ade-84bc-8e2a2309792d",
		type: "TRANSFER",
		group_id: categoryGroupNamesMap["Transfer"].group_id
	},


	// Travel
	"Lodging": {
		name: "Hotel & Lodging",
		category_id: "c199d55c-6e60-4e6a-8b15-675d6909db7b",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Travel"].group_id
	},
	"Flights": {
		name: "Flights",
		category_id: "0fffae2e-9c68-432f-9ac2-c2dccbe1d13c",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Travel"].group_id
	},
	"Transportation": {
		name: "Transportation",
		category_id: "8c72592c-d453-46ac-9a2f-a9ea1570c1b9",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Travel"].group_id
	},
	"Activities": {
		name: "Activities",
		category_id: "241b4aaa-4669-44f0-857f-a05a35540d34",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Travel"].group_id
	},
	"Travel Food": {
		name: "Travel Food",
		category_id: "9dcfd6a1-1633-4fea-9479-2ed46a5504ae",
		type: "EXPENSE",
		group_id: categoryGroupNamesMap["Travel"].group_id
	},
} as const;

export type SystemCategoryName = keyof typeof categories;


export const flatCategoriesMap: Record<SystemCategoryName, CategoryDetails> = Object.fromEntries(
	Object.keys(categories).map(category => [category, categories[category]])
) as any;

export const categoriesArray: CategoryDetails[] = Object.values(categories);

export function categoryByName(name: SystemCategoryName): CategoryDetails {
	return flatCategoriesMap[name];
}

// Maps Plaid categories to our system categories
// The Typescript here helps alert us if we're missing any
export const plaidCategoryToSystemCategoryMap: Record<PlaidCategory, SystemCategoryName> = {
  // Income categories
  "INCOME_DIVIDENDS": "Dividend & Cap Gains",
  "INCOME_INTEREST_EARNED": "Interest Income",
  "INCOME_RETIREMENT_PENSION": "Paycheck",
  "INCOME_TAX_REFUND": "Refund",
  "INCOME_UNEMPLOYMENT": "Paycheck",
  "INCOME_WAGES": "Paycheck",
  "INCOME_OTHER_INCOME": "Paycheck",

  // Transfer categories
  "TRANSFER_IN_CASH_ADVANCES_AND_LOANS": "Transfer",
  "TRANSFER_IN_DEPOSIT": "Transfer",
  "TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS": "Transfer",
  "TRANSFER_IN_SAVINGS": "Transfer",
  "TRANSFER_IN_ACCOUNT_TRANSFER": "Transfer",
  "TRANSFER_IN_OTHER_TRANSFER_IN": "Transfer",
  "TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS": "Transfer",
  "TRANSFER_OUT_SAVINGS": "Transfer",
  "TRANSFER_OUT_WITHDRAWAL": "Transfer",
  "TRANSFER_OUT_ACCOUNT_TRANSFER": "Transfer",
  "TRANSFER_OUT_OTHER_TRANSFER_OUT": "Transfer",

  // Loan payments
  "LOAN_PAYMENTS_CAR_PAYMENT": "Auto Payment",
  "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT": "Credit Card Payment",
  "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT": "Credit Card Payment",
  "LOAN_PAYMENTS_MORTGAGE_PAYMENT": "Mortgage Payment",
  "LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT": "Student Loan",
  "LOAN_PAYMENTS_OTHER_PAYMENT": "Credit Card Payment",

  // Bank fees
  "BANK_FEES_ATM_FEES": "ATM Fee",
  "BANK_FEES_FOREIGN_TRANSACTION_FEES": "Service Fee",
  "BANK_FEES_INSUFFICIENT_FUNDS": "Banking Fee",
  "BANK_FEES_INTEREST_CHARGE": "Finance Charge",
  "BANK_FEES_OVERDRAFT_FEES": "Banking Fee",
  "BANK_FEES_OTHER_BANK_FEES": "Banking Fee",

  // Entertainment
  "ENTERTAINMENT_CASINOS_AND_GAMBLING": "Amusement",
  "ENTERTAINMENT_MUSIC_AND_AUDIO": "Music",
  "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS": "Amusement",
  "ENTERTAINMENT_TV_AND_MOVIES": "Movies & DVDs",
  "ENTERTAINMENT_VIDEO_GAMES": "Electronics & Software",
  "ENTERTAINMENT_OTHER_ENTERTAINMENT": "Amusement",

  // Food and drink
  "FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR": "Alcohol & Bars",
  "FOOD_AND_DRINK_COFFEE": "Coffee Shops",
  "FOOD_AND_DRINK_FAST_FOOD": "Fast Food",
  "FOOD_AND_DRINK_GROCERIES": "Groceries",
  "FOOD_AND_DRINK_RESTAURANT": "Restaurants",
  "FOOD_AND_DRINK_VENDING_MACHINES": "Treats and Sweets",
  "FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK": "Fast Food",

  // General merchandise
  "GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS": "Books",
  "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES": "Clothing",
  "GENERAL_MERCHANDISE_CONVENIENCE_STORES": "Groceries",
  "GENERAL_MERCHANDISE_DEPARTMENT_STORES": "Clothing",
  "GENERAL_MERCHANDISE_DISCOUNT_STORES": "Groceries",
  "GENERAL_MERCHANDISE_ELECTRONICS": "Electronics & Software",
  "GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES": "Gift",
  "GENERAL_MERCHANDISE_OFFICE_SUPPLIES": "Office Supplies",
  "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES": "Electronics & Software",
  "GENERAL_MERCHANDISE_PET_SUPPLIES": "Pet Food & Supplies",
  "GENERAL_MERCHANDISE_SPORTING_GOODS": "Sporting Goods",
  "GENERAL_MERCHANDISE_SUPERSTORES": "Groceries",
  "GENERAL_MERCHANDISE_TOBACCO_AND_VAPE": "Alcohol & Bars",
  "GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE": "Electronics & Software",

  // Home improvement
  "HOME_IMPROVEMENT_FURNITURE": "Furnishings",
  "HOME_IMPROVEMENT_HARDWARE": "Home Improvement",
  "HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE": "Home Services",
  "HOME_IMPROVEMENT_SECURITY": "Home Services",
  "HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT": "Home Improvement",

  // Medical
  "MEDICAL_DENTAL_CARE": "Dentist",
  "MEDICAL_EYE_CARE": "Eyecare",
  "MEDICAL_NURSING_CARE": "Doctor",
  "MEDICAL_PHARMACIES_AND_SUPPLEMENTS": "Pharmacy",
  "MEDICAL_PRIMARY_CARE": "Doctor",
  "MEDICAL_VETERINARY_SERVICES": "Veterinary",
  "MEDICAL_OTHER_MEDICAL": "Doctor",

  // Personal care
  "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS": "Gym",
  "PERSONAL_CARE_HAIR_AND_BEAUTY": "Hair",
  "PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING": "Laundry",
  "PERSONAL_CARE_OTHER_PERSONAL_CARE": "Spa & Massage",

  // General services
  "GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING": "Financial Advisor",
  "GENERAL_SERVICES_AUTOMOTIVE": "Service & Parts",
  "GENERAL_SERVICES_CHILDCARE": "Babysitter & Daycare",
  "GENERAL_SERVICES_CONSULTING_AND_LEGAL": "Legal",
  "GENERAL_SERVICES_EDUCATION": "Tuition",
  "GENERAL_SERVICES_INSURANCE": "Health Insurance",
  "GENERAL_SERVICES_POSTAGE_AND_SHIPPING": "Shipping",
  "GENERAL_SERVICES_STORAGE": "Home Services",
  "GENERAL_SERVICES_OTHER_GENERAL_SERVICES": "Home Services",

  // Government and non-profit
  "GOVERNMENT_AND_NON_PROFIT_DONATIONS": "Charity",
  "GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES": "Vehicle Registration",
  "GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT": "Federal Tax",
  "GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT": "Charity",

  // Transportation
  "TRANSPORTATION_BIKES_AND_SCOOTERS": "Public Transportation",
  "TRANSPORTATION_GAS": "Fuel",
  "TRANSPORTATION_PARKING": "Parking",
  "TRANSPORTATION_PUBLIC_TRANSIT": "Public Transportation",
  "TRANSPORTATION_TAXIS_AND_RIDE_SHARES": "Public Transportation",
  "TRANSPORTATION_TOLLS": "Parking",
  "TRANSPORTATION_OTHER_TRANSPORTATION": "Public Transportation",

  // Travel
  "TRAVEL_FLIGHTS": "Flights",
  "TRAVEL_LODGING": "Lodging",
  "TRAVEL_RENTAL_CARS": "Transportation",
  "TRAVEL_OTHER_TRAVEL": "Activities",

  // Rent and utilities
  "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY": "Utilities",
  "RENT_AND_UTILITIES_INTERNET_AND_CABLE": "Internet",
  "RENT_AND_UTILITIES_RENT": "Mortgage & Rent",
  "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT": "Utilities",
  "RENT_AND_UTILITIES_TELEPHONE": "Phone Plan",
  "RENT_AND_UTILITIES_WATER": "Utilities",
  "RENT_AND_UTILITIES_OTHER_UTILITIES": "Utilities",
};