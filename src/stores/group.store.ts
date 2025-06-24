import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Group } from 'delfi-core/models/Transaction';

export const useGroupStore = defineStore('group', () => {
	let groups = ref([] as Group[]);
	let isLoadingGroups = ref(false);
	let isUpsertingGroup = ref(false);
	let isDeletingGroup = ref(false);

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

	async function syncGroups() {
		try {
			const { data } = await request.post('/group/sync');
			groups.value = data.data;
		}
		catch (e) {
			console.error("Could not sync groups!")
		}
	}

	async function syncGroup(groupId: string) {
		try {
			const { data } = await request.post(`/group/${groupId}/sync`);
			const group = data.data;
			// Update the group in the store
			groups.value = groups.value.map(a => a.group_id === groupId ? group : a);
			// Also update the delfi store
			// delfiStore.updateGroup(group);
		}
		catch (e) {
			console.error("Could not sync group!")
		}
	}

	const upsertGroup = async (groupData: Partial<Group>): Promise<Group> => {
		let groupRes: Group;
		try {
			isUpsertingGroup.value = true;
			let { data } = groupData.group_id
				? await request.put(`/group/${groupData.group_id}`, groupData)
				: await request.post('/group', groupData);
			groupRes = data.data;
			groupData.group_id ?
				groups.value = groups.value.map(a => a.group_id === groupData.group_id ? groupRes : a)
				: groups.value.push(groupRes);
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert group');
		}
		finally {
			isUpsertingGroup.value = false;
		} 
		return groupRes;
	}

	const deleteGroup = async (groupId: string) => {
		try {
			isDeletingGroup.value = true;
			await request.delete(`/group/${groupId}`);
			groups.value = groups.value.filter(a => a.group_id !== groupId)
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert group');
		}
		finally {
			isDeletingGroup.value = false;
		} 
	}

	loadGroups().catch((error) => {
		console.error("Error loading groups:", error);
	});

	return {
		groups,
		isLoadingGroups,
		loadGroups,
		syncGroups,
		syncGroup,
		getGroupById,
		upsertGroup,
		deleteGroup
	};
})
