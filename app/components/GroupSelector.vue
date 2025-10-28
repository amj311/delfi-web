<script setup lang="ts">
import { useGroupStore } from '@/stores/group.store';
import Icon from './Icon.vue';
import DrawerModal from './utils/DrawerModal.vue';
import { computed, reactive, ref } from 'vue';
import type { BudgetGroup, BudgetGroupPartial } from 'delfi-core/models/Transaction';
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


const filter = ref<string>('');
const groups = computed(() =>
	useGroupStore().groups
		.filter(group => {
		if (props.allowedGroups) {
			return props.allowedGroups.some(g => g.group_id === group.group_id);
		}
		return true;
	})
	.filter((m) => {
		return !filter.value.trim() || m.name.toLowerCase().includes(filter.value.trim().toLowerCase());
	})
);

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

function editGroup(group: BudgetGroup) {
	editingGroup.value = group;
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
	<div class="flex flex-column h-full overflow-hidden">
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
				icon="pi pi-plus"
				label="Create group"
			/>
		</div>
		

		<div class="searchbar">
			<InputText v-model="filter" placeholder="Search..." class="w-full" />
			<i class="pi pi-search"></i>
		</div>

		<div class="flex flex-column overflow-y-auto">
			<div v-for="group in groups" :key="group.name" class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round hover-show-trigger"
				@click="() => $emit('select', group.group_id)"
			>
				<Icon name="tag" fill :color="group.color" />
				<div class="flex-grow-1">{{  group.name }}</div>
				<i class="pi pi-check" v-if="currentGroupId === group.group_id" />
				<div class="hover-show">
					<div class="flex align-items-center" @click.stop>
						<Button text severity="secondary" icon="pi pi-pencil" @click="editGroup(group)" style="margin: -.5rem" />
					</div>
				</div>
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
.searchbar {
	position: relative;
	padding: 0.5rem 0;
	background: var(--color-background);

	> i.pi {
		position: absolute;
		right: 0.7rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--p-text-color);
	}
}
</style>
