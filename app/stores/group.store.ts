import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { BudgetGroup, BudgetGroupPartial } from 'delfi-core/models/Transaction';

export const useGroupStore = defineStore('group', () => {
	let groups = ref([] as BudgetGroup[]);
	let isLoadingGroups = ref(false);

	async function loadGroups() {
		try {
			isLoadingGroups.value = true;
			const { data } = await request.get('/group');
			groups.value = data.data;
		}
		catch (e) {
			console.error("Could not load groups!")
		}
		finally {
			isLoadingGroups.value = false;
		}

	}

	function getGroupById (id?: string) {
		return groups.value.find(a => a.group_id === id);
	}

	loadGroups().catch((error) => {
		console.error("Error loading groups:", error);
	});

	async function upsertGroup(group: BudgetGroupPartial) {
		if (group.group_id) {
			await request.put('/group/' + group.group_id, group);
		}
		else {
			await request.post('/group/', group);
		}
		await loadGroups();
	}

	return {
		groups,
		isLoadingGroups,
		loadGroups,
		getGroupById,
		upsertGroup,
	};
})
