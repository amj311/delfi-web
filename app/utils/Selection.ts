export class Selection<T> {
	selected: Map<string, T> = new Map();
	
	constructor(
		readonly key: string | ((arg: T) => string),
	) {}

	get size() {
		return this.selected.size;
	}

	get values() {
		return Array.from(this.selected.values());
	}

	getKey(t: T) {
		return typeof this.key === 'string' ? t[this.key] : this.key(t);
	}

	isSelected(itemOrKey: T | string) {
		if (this.getKey(itemOrKey as T)) {
			return this.selected.has(this.getKey(itemOrKey as T));
		}
		return this.selected.has(itemOrKey as string);
	}

	select(t: T) {
		this.selected.set(this.getKey(t), t);
	}

	deselect(t: T) {
		this.selected.delete(this.getKey(t));
	}

	toggle(t: T) {
		if (this.isSelected(t)) {
			this.deselect(t);
		} 
		else {
			this.select(t);
		}
	}

	clear() {
		this.selected.clear();
	}

}