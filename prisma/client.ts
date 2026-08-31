import { PrismaClient } from "@prisma/client";


function spreadDeletedQuery({ args, query }) {
	args.where = { deleted_at: null, ...(args.where ?? {}) };
	return query(args);
}

const basePrisma = new PrismaClient();

export const prisma = new PrismaClient().$extends({
	// query: {
	// 	transaction: {
	// 		findFirst: spreadDeletedQuery,
	// 		findFirstOrThrow: spreadDeletedQuery,
	// 		findMany: spreadDeletedQuery,
	// 		findUnique: spreadDeletedQuery,
	// 		findUniqueOrThrow: spreadDeletedQuery,
	// 		count: spreadDeletedQuery,
			
	// 		delete({ args }) {
	// 			return basePrisma.transaction.update({
	// 				where: args.where,
	// 				data: { deleted_at: new Date() },
	// 			})
	// 		},
	// 		deleteMany({ args }) {
	// 			return basePrisma.transaction.updateMany({
	// 				where: args.where,
	// 				data: { deleted_at: new Date() },
	// 			})
	// 		}
	// 	}
	// },
});

export type Tx = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function useTransaction<T>(fn: (tx: Tx) => Promise<T>, options?: Parameters<typeof prisma.$transaction>[1]): Promise<T> {
	return await prisma.$transaction(fn, options);
}


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
