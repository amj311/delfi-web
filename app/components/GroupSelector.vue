<script setup lang="ts">
import { useGroupStore } from '@/stores/group.store';
import Icon from './Icon.vue';
import DrawerModal from './utils/DrawerModal.vue';
import { computed, reactive, ref } from 'vue';
import type { BudgetGroupPartial } from 'delfi-core/models/Transaction';
import { useToast } from './utils/Toast.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { colors, TagColor } from 'delfi-core/utils/constants';
import Drawer from 'primevue/drawer';
import ColorSelectionButton from './ColorSelectionButton.vue';
import InputGroup from 'primevue/inputgroup';

const props = defineProps<{
	currentGroupId: string | null;
	allowedGroups?: Array<{ group_id: string; }>;
}>();

defineEmits<{
	'select': [groupId: string | null];
}>();

const groups = computed(() => useGroupStore().groups.filter(group => {
	if (props.allowedGroups) {
		return props.allowedGroups.some(g => g.group_id === group.group_id);
	}
	return true;
}));

const editingGroupModal = ref<InstanceType<typeof DrawerModal>>();
const editingGroup = ref<BudgetGroupPartial | null>(null);
const isNewGroup = computed(() => !Boolean(editingGroup.value?.group_id));
const isSavingGroup = ref(false);

function draftNewGroup() {
	editingGroup.value = {
		name: "",
		color: undefined,
	}
	editingGroupModal.value?.open();
}

function cancelEdit() {
	editingGroupModal.value?.close();
}

async function saveGroup() {
	if (!editingGroup.value) {
		return;
	}

	try {
		isSavingGroup.value = true;
		await useGroupStore().upsertGroup(editingGroup.value);
		useToast().add({
			title: "Saved group",
			severity: 'success',
		});
		editingGroupModal.value?.close();
	}
	catch (e) {
		console.error("Error saving group.")
		console.error(e);
		useToast().add({
			title: "Could not save group",
			severity: 'error',
		});
	}
	finally {
		isSavingGroup.value = false;
	}
}

</script>

<template>
	<div class="flex flex-column">
		<div
			v-if="!allowedGroups"
			class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
			@click="() => $emit('select', null)"
		>
			<Icon name="tag" fill color="#aaa" />
			<div class="flex-grow-1">No Group</div>
			<i class="pi pi-check" v-if="currentGroupId === null" />
		</div>

		<div>
			<Button
				severity="secondary"
				class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
				@click="draftNewGroup"
			>
				<Icon name="material-symbols::new_label" fill color="#aaa" />
				<div class="flex-grow-1">New Group</div>
			</Button>
		</div>
		

		<div v-for="group in groups" :key="group.name" class="flex flex-column gap-2">
			<div
				class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
				@click="() => $emit('select', group.group_id)"
			>
				<Icon name="tag" fill :color="group.color" />
				<div class="flex-grow-1">{{  group.name }}</div>
				<i class="pi pi-check" v-if="currentGroupId === group.group_id" />
			</div>
		</div>
	</div>

	<DrawerModal ref="editingGroupModal" :title="isNewGroup ? 'New Group' : 'Edit Group'">
		<template #default v-if="editingGroup">
			<InputGroup>
				<ColorSelectionButton v-model="editingGroup.color" />
				<InputText v-model="editingGroup.name" placeholder="Group Name" />
			</InputGroup>

			<br />
			<div class="flex align-items-center gap-2">
				<div class="flex-grow-1" />
				<Button class="p-button-text" label="Cancel" @click="cancelEdit" />
				<Button label="Save" :loading="isSavingGroup" :disabled="isSavingGroup" @click="saveGroup" />
			</div>
		</template>
	</DrawerModal>
</template>

<style scoped lang="scss">
</style>
