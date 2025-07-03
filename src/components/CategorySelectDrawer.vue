<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import Drawer from 'primevue/drawer';
import { useRouter } from 'vue-router';
import TransactionAvatar from './TransactionAvatar.vue';
import type { Transaction } from 'delfi-core/models/Transaction';
import Currency from './Currency.vue';
import { useAccountStore } from '@/stores/account.store';
import NavTrigger from './utils/NavTrigger.vue';
import Button from 'primevue/button';
import Icon from './Icon.vue';
import { useCategoryStore } from '@/stores/category.store';
import CategoryAvatar from './CategoryAvatar.vue';
import CategorySelector from './CategorySelector.vue';

const drawerTrigger = ref<InstanceType<typeof NavTrigger> | null>(null);

const currentCategoryId = ref<string | null>(null);

const promiseResolver = ref<((value: string | null) => void) | null>(null);
const promiseRejector = ref<((reason?: any) => void) | null>(null);

function closeDrawer() {
	if (drawerTrigger.value) {
		drawerTrigger.value.close();
	}
	if (promiseResolver.value) {
		promiseResolver.value(currentCategoryId.value);
	}
}

function selectCategory(categoryId: string | null) {
	currentCategoryId.value = categoryId;
	closeDrawer();
}

defineExpose({
	waitForSelection(_currentCategoryId: string | null = null) {
		drawerTrigger.value?.open();
		currentCategoryId.value = _currentCategoryId;

		return new Promise<string | null>((resolve, reject) => {
			promiseResolver.value = resolve;
			promiseRejector.value = reject;
		});
	},
	close: drawerTrigger.value?.close,
});

const groups = useCategoryStore().categoriesByGroup;

</script>

<template>
	<NavTrigger
		ref="drawerTrigger"
		:triggerKey="'category-select'"
	>
		<template #default="{ show }">
			<Drawer
				:visible="show"
				v-if="show"
				position="right"
				header="Select a Category"
				class="w-full sm:w-25rem"
			>
				<template #closebutton>
					<Button
						icon="pi pi-times"
						size="small"
						text
						@click="closeDrawer"
						severity="secondary"
					/>
				</template>
				
				<CategorySelector :currentCategoryId="currentCategoryId" @select="selectCategory" />

			</Drawer>
		</template>
	</NavTrigger>
</template>

<style scoped lang="scss">
</style>
