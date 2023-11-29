import { v4 as uuid } from "uuid"
import type { TransactionEvent, TransactionSchedule } from "../transactions"


export interface Trigger {
	type: string,
}

type MatchingRule = {
	property: 'amount' | 'memo' | 'type'
	operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'inc'
	operand: number | string | string[]
}

type Computation = {
	operator: 'exactly' | 'add' | 'sub' | 'mult' | 'div' | 'percent'
	operand: number
}

type Props = {
	rules: MatchingRule[];
	computation: Computation;
}

export class ImmediateMatchTrigger implements Trigger {
	type = 'immediateMatch';
	rules!: MatchingRule[];
	computation!: Computation;
	
	constructor(props: Props) {
		Object.assign(this, props);
	}

	public matchesSchedule (schedule: TransactionSchedule) {
		for (let rule of this.rules) {
			const { property, operator, operand } = rule;
			const value = schedule[property];
			if (!value) continue;
			switch (operator) {
				case 'eq':
					if (value === operand) return true;
					break;
				case 'neq':
					if (value !== operand) return true;
					break;
				case 'gt':
					if (value > operand) return true;
					break;
				case 'gte':
					if (value >= operand) return true;
					break;
				case 'lt':
					if (value < operand) return true;
					break;
				case 'lte':
					if (value <= operand) return true;
					break;
				case 'inc':
					if (Array.isArray(value) && value.includes(operand)) return true;
					break;
				default:
					break;
			}
		}
		return true;
	}

	private computeAmount(triggerAmount: number): number {
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

	public createEventFromTrigger (selfSchedule: TransactionSchedule, triggerEvent: TransactionEvent): TransactionEvent {
		return {
			id: uuid(),
			transactionScheduleId: selfSchedule.id,
			type: selfSchedule.type,
			memo: selfSchedule.memo,
			originAccount: selfSchedule.originAccount,
			targetAccount: selfSchedule.targetAccount,
			categoryId: selfSchedule.categoryId,
			tagIds: selfSchedule.tagIds,
			date: triggerEvent.date,
			amount: this.computeAmount(triggerEvent.amount),
		};
	}
}

export type PeriodTotalTrigger = Trigger & {
	type: 'periodTotal',
	period: 'day' | 'week' | 'month' | 'year',
	interval: number,
	createEventFromPeriod: (periodEvents: TransactionEvent[]) => TransactionEvent
}