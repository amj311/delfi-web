import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
export async function useTransaction(...args: Parameters<typeof prisma.$transaction>) {
	return await prisma.$transaction(...args);
}

export type Tx = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;


export class TxUser<TransactionType = Tx> {
	constructor(
		protected readonly transaction?: TransactionType,
	) {}

	public tx(transaction?: TransactionType) {
		// This cloning method maintains class methods
		const newDao: any = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
		Object.assign(newDao, this);
		newDao.transaction = transaction;

		// Replace daos with tx daos
		for (const key of Object.keys(this)) {
			if (this[key] && ('tx' in this[key]) && typeof this[key].tx === 'function') {
				newDao[key] = this[key].tx(transaction);
			}
		}

		return newDao as typeof this;
	}
}

export abstract class PrismaDao extends TxUser<Tx> {
	get db() {
		return this.transaction || prisma;
	}
}
