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

const drawerTrigger = ref<InstanceType<typeof NavTrigger> | null>(null);

const currentCategoryId = ref<string | null>(null);
const selectedCategory = computed(() => useCategoryStore().getCategoryById(currentCategoryId.value));

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

		if (currentCategoryId.value && selectedCategory) {
			setTimeout(() => {
				const groupElement = document.getElementById(`group_${selectedCategory.value.ParentCategory?.name}`);
				if (groupElement) {
					groupElement.scrollIntoView();
				}
			}, 50)
		}

		return new Promise<string | null>((resolve) => {
			promiseResolver.value = resolve;
			promiseRejector.value = () => {
				resolve(null);
			};
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
				
				<div class="flex flex-column gap-3">
					<div v-for="group in groups" :key="group.name" class="flex flex-column gap-2">
						<h4 :id="`group_${group.name}`" class="group">{{ group.name }}</h4>
						<div class="flex flex-column">
							<div
								v-for="category in group.categories"
								:key="category.category_id"
								class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
								@click="selectCategory(category.category_id)"
							>
								<CategoryAvatar
									:category="category"
									:groupColor="group.color"
									style="width: 2rem; height: 2rem;"
								/>
								<div class="flex-grow-1">{{  category.name }}</div>
								<i class="pi pi-check" v-if="currentCategoryId === category.category_id" />
							</div>
						</div>
					</div>
				</div>

			</Drawer>
		</template>
	</NavTrigger>
</template>

<style scoped lang="scss">
</style>
