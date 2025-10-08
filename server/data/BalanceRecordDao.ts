import { prisma } from "../../prisma/client";

export interface BalanceRecordData {
	date: Date;
	balance: number;
	account_id: string;
}

export const BalanceRecordDao = {
	async createBalanceRecord(data: BalanceRecordData) {
		return await prisma.balanceRecord.create({
			data,
		});
	},

	async getBalanceRecordsByAccountId(account_id: string, orderBy: 'asc' | 'desc' = 'desc') {
		return await prisma.balanceRecord.findMany({
			where: {
				account_id,
			},
			orderBy: {
				date: orderBy,
			},
		});
	},

	async getLatestBalanceRecord(account_id: string) {
		return await prisma.balanceRecord.findFirst({
			where: {
				account_id,
			},
			orderBy: {
				date: 'desc',
			},
		});
	},

	async getBalanceRecordsInDateRange(account_id: string, startDate: Date, endDate: Date) {
		return await prisma.balanceRecord.findMany({
			where: {
				account_id,
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: {
				date: 'desc',
			},
		});
	},

	async updateBalanceRecord(balance_report_id: string, data: Partial<BalanceRecordData>) {
		return await prisma.balanceRecord.update({
			where: {
				balance_report_id,
			},
			data,
		});
	},

	async deleteBalanceRecord(balance_report_id: string) {
		await prisma.balanceRecord.delete({
			where: {
				balance_report_id,
			},
		});
	},

	async deleteBalanceRecordsByAccountId(account_id: string) {
		await prisma.balanceRecord.deleteMany({
			where: {
				account_id,
			},
		});
	},
};