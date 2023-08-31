import * as currencyUtils from "../utils/currencyUtils";
import { v4 as uuid } from 'uuid'


export class Account {
	public account_id;
    constructor(public name, public balance) {
		this.account_id = uuid
    }
    toString() {
        return this.name + ": " + currencyUtils.prettyMoney(this.balance);
    }
}
