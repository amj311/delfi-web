export const SpecialEntityTypes = ['merchant_id', 'category_id', 'budget_id'] as const;
type SpecialEntityType = typeof SpecialEntityTypes[number];

export type DescriptorEntityNode = {
	type: SpecialEntityType;
	id: string;
}

export type DescriptorNode = string | DescriptorEntityNode;

export default class Descriptor {
	private readonly nodes: Array<DescriptorNode> = [];

	public push(...nodes: DescriptorNode[]) {
		this.nodes.push(...nodes);
	}

	public toString(getter: (node: DescriptorEntityNode) => string | null | undefined): string {
		return this.nodes.map((node) => {
			if (typeof node === 'string') {
				return node;
			}
			return getter(node) || 'node.id';
		}).join('');
	}

	public async toStringAsync(getter: (node: DescriptorEntityNode) => Promise<string | null | undefined>): Promise<string> {
		const parts = await Promise.all(this.nodes.map(async (node) => {
			if (typeof node === 'string') {
				return node;
			}
			return await getter(node) || 'node.id';
		}));
		return parts.join('');
	}
}
