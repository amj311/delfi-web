<script setup lang="ts">
import { computed, ref } from 'vue';
import Button from 'primevue/button';
import type { ScheduleVariant } from 'delfi-core/models/Budget';
import BudgetUtils from 'delfi-core/models/Budget';
import NavTriggerDrawer from '../utils/NavTrigger/NavTriggerDrawer.vue';
import EditVariantForm from './EditVariantForm.vue';
import { ddate } from 'delfi-core/utils/dateUtils.js';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Badge from 'primevue/badge';
import { jsonCopy, peek } from 'delfi-core/utils/miscUtils.js';
import { v4 as uuid } from 'uuid';

const variants = defineModel<Array<ScheduleVariant>>();
const navTrigger = ref<InstanceType<typeof NavTriggerDrawer>>();

defineExpose({
	open: () => {
		navTrigger.value?.trigger()?.open();
	},
});

const mainVariant = computed(() => BudgetUtils.getMostCurrentVariant(variants.value || []))
const openAccordions = ref<Set<string>>(new Set([...(mainVariant.value ? [mainVariant.value.schedule_variant_id!] : [])]));

function isCurrent(variant: ScheduleVariant) {
	if (!variant.schedule.start && !variant.schedule.end) {
		return true;
	}
	if (!variant.schedule.start && ddate().isBefore(variant.schedule.end!)) {
		return true;
	}
	if (variant.schedule.start && ddate().isAfter(variant.schedule.start!) && !variant.schedule.end) {
		return true;
	}
	if (variant.schedule.start && ddate().isAfter(variant.schedule.start!) && ddate().isBefore(variant.schedule.end!)) {
		return true;
	}
	return false;
}

/**
 * Copies the previous variant, adjusts dates as needed
 */
function createNewVariant() {
	const latestVariant = peek(variants.value || []);
	if (!variants.value || !latestVariant) {
		return;
	}

	const newVariant = jsonCopy(latestVariant);
	if (!latestVariant.schedule.end) {
		// make it end yesterday so the new variant is active today
		latestVariant.schedule.end = ddate().subtract(1, 'day');
	}

	newVariant.schedule_variant_id = uuid();
	newVariant.schedule.start = ddate(latestVariant.schedule.end).add(1, 'day');
	newVariant.schedule.end = undefined;

	variants.value.push(newVariant);
}
</script>

<template>
	<NavTriggerDrawer
		ref="navTrigger"
		triggerKey="variantsDrawer"
		v-if="variants && variants.length > 0"
	>
		<template #header>
			<h2>Budget versions</h2>
		</template>

		<div class="flex-column gap-4">
			<div class="flex-column gap-2">
				<p>Budgets are living, breathing things and they need space to evolve.</p>
				<p>Use this space to adjust to changes in your budget without changing past plans or making an entirely new budget.</p>
			</div>
			<Accordion
				multiple
				@update:value="(value) => (openAccordions = new Set(value))"
				:value="Array.from(openAccordions)"
			>
				<AccordionPanel v-for="(variant, i) in variants" :value="variant.schedule_variant_id" :key="variant.schedule_variant_id">
					<AccordionHeader class="flex align-items-center gap-2 py-3 font-bold">
						<div class="flex-row-center gap-3">
							{{ variant.schedule.start ? ddate(variant.schedule.start).format('full') : 'Forever' }}
							<i class="pi pi-arrow-right"></i>
							{{ variant.schedule.end ? ddate(variant.schedule.end).format('full') : 'Forever' }}
						</div>
						<Badge v-if="isCurrent(variant)" />
						<div class="flex-1" />
					</AccordionHeader>
					<AccordionContent>
						<EditVariantForm v-model="variants[i]" withNotes />
					</AccordionContent>
				</AccordionPanel>
			</Accordion>

			<Button text icon="pi pi-plus" label="New version" @click="createNewVariant" />

		</div>

		<!-- Footer actions -->
		<template #footer>
			<div class="flex justify-content-between w-full">
				<Button label="Back" severity="secondary" outlined @click="() => navTrigger?.trigger()?.close()" />
				<div class="flex-grow-1" />
				<!-- <Button label="Save" :loading="isSaving" @click="save" /> -->
			</div>
		</template>
		
	</NavTriggerDrawer>
</template>

<style scoped lang="scss">
/* PrimeVue Drawer overrides if needed */
</style>
