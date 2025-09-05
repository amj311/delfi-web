import type { TransactionFilter } from "../Filters"

type Computation = {
	operator: 'exactly' | 'add' | 'sub' | 'mult' | 'div' | 'percent'
	operand: number
}

export function computeTriggeredAmount(
	triggerAmount: number,
	computation: Computation
): number {
	switch (computation.operator) {
		case 'exactly':
			return computation.operand;
		case 'add':
			return triggerAmount + computation.operand;
		case 'sub':
			return triggerAmount - computation.operand;
		case 'mult':
			return triggerAmount * computation.operand;
		case 'div':
			return triggerAmount / computation.operand;
		case 'percent':
			return triggerAmount * (computation.operand / 100);
		default:
			throw Error('Unknown operator: ' + computation.operator);
	};
}

export type ImmediateMatchTrigger = {
	type: 'immediateMatch';
	filter: TransactionFilter;
	computation: Computation;
}

export type PeriodTotalTrigger = {
	type: 'periodTotal',
	// interval: number;
	period: 'day' | 'week' | 'month' | 'year',
	filter: TransactionFilter;
	computation: Computation;
}

export type Trigger = ImmediateMatchTrigger | PeriodTotalTrigger;