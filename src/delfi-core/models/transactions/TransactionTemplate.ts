import { TransactionType } from "./TransactionType";


export class TransactionTemplate {
    constructor(public type: TransactionType, public memo: string, public amount: number, public targetAccount: string, public originAccount?: string, public categoryId?: string) {
    }
}
