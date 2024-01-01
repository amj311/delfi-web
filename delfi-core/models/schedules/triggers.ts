import type { TransactionFilter } from "../../services/FilterService"


export interface Trigger {
	type: string,
}

type Computation = {
	operator: 'exactly' | 'add' | 'sub' | 'mult' | 'div' | 'percent'
	operand: number
}

type Props = {
	filter: TransactionFilter;
	computation: Computation;
}

export class ImmediateMatchTrigger implements Trigger {
	type = 'immediateMatch';
	filter!: TransactionFilter;
	computation!: Computation;
	
	constructor(props: Props) {
		Object.assign(this, props);
	}

	public computeAmount(triggerAmount: number): number {
		switch (this.computation.operator) {
			case 'exactly':
				return this.computation.operand;
			case 'add':
				return triggerAmount + this.computation.operand;
			case 'sub':
				return triggerAmount - this.computation.operand;
			case 'mult':
				return triggerAmount * this.computation.operand;
			case 'div':
				return triggerAmount / this.computation.operand;
			case 'percent':
				return triggerAmount * (this.computation.operand / 100);
			default:
				throw Error('Unknown operator: ' + this.computation.operator);
		};
	}
}

// export type PeriodTotalTrigger = Trigger & {
// 	type: 'periodTotal',
// 	period: 'day' | 'week' | 'month' | 'year',
// 	interval: number,
// 	createEventFromPeriod: (periodEvents: TransactionEvent[]) => TransactionEvent
// }