<script setup lang="ts">
import { useGroupStore } from '@/stores/group.store';
import Icon from './Icon.vue';

const props = defineProps<{
	currentGroupId: string | null;
	allowedGroups?: Array<{ group_id: string; }>;
}>();

defineEmits<{
	'select': [groupId: string | null];
}>();

const groups = useGroupStore().groups.filter(group => {
	if (props.allowedGroups) {
		return props.allowedGroups.some(g => g.group_id === group.group_id);
	}
	return true;
});

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
</template>

<style scoped lang="scss">
</style>
