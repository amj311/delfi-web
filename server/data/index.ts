import { TxUser } from "../../prisma/client";
import { TransactionDao } from "./TransactionDao";

export class DaoUser<TransactionType = any> extends TxUser<TransactionType> {
	protected TransactionDao: typeof TransactionDao = TransactionDao;
}