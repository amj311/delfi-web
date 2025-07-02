import type { PlaidCategory } from "server/services/PlaidService";
import type { IconName, TagColor } from "delfi-core/utils/constants";
import type { Replace } from "delfi-core/utils/typeUtils";

type CategoryType = 'INCOME' | 'TRANSFER' | 'EXPENSE';

export type Category = {
	category_id: string,
	name: string,
	type: CategoryType,
	color?: TagColor,
	icon?: IconName,
	detection_keys?: [PlaidCategory],
	Children?: Category[] // only present if included from DB
	parent_category_id?: string,
	ParentCategory?: Category, // only present if included from DB
}

export type ParentCategory = Replace<Category, {
	ParentCategory: undefined,
	parent_category_id: undefined,
	Children: Category[],
	color: TagColor,
	icon: IconName,
}>;

export type ChildCategory = Replace<Category, {
	Children: undefined,
	color: undefined,
	ParentCategory: Category,
	parent_category_id: string,
}>;