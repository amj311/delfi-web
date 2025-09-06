<script setup lang="ts">
import Button from 'primevue/button';
import { ref } from 'vue';
import AttributionAvatar from './AttributionAvatar.vue';
import { useMerchantStore } from '@/stores/merchant.store';
import MerchantSelectionDrawer from './MerchantSelectionDrawer.vue';

const merchant_id = defineModel<string | null | undefined>();

const merchantSelectionDrawer = ref<InstanceType<typeof MerchantSelectionDrawer> | null>(null);
async function selectMerchant() {
	if (merchantSelectionDrawer.value) {
		const selection = await merchantSelectionDrawer.value.selectMerchant(merchant_id.value || null);
		merchant_id.value = selection?.merchant_id || undefined;
	}
}

</script>

<template>
	<Button class="input-button" severity="secondary" outlined @click="() => selectMerchant()">
		<template v-if="merchant_id">
			<AttributionAvatar :image="useMerchantStore().getMerchantById(merchant_id)?.logo" :size="1.4" />
			{{ useMerchantStore().getMerchantById(merchant_id)?.name }}
		</template>
		<div v-else>Select merchant...</div>
	</Button>
	<MerchantSelectionDrawer ref="merchantSelectionDrawer" />
</template>

<style scoped lang="scss">

.track-row {
	display: flex;
	align-items: stretch;

	> :not(.track) {
		padding: 5px 0;
	}

	.track {
		--width: 3.5rem;
		--left: calc((var(--width) / 2) - 5px);
		--color: var(--p-slate-300);
		--thickness: 2px;
		--middle: 24px;
		min-width: var(--width);
		max-width: var(--width);
		min-height: 100%;
		position: relative;

		&:not(.end)::before {
			content: '';
			position: absolute;
			left: var(--left);
			top: calc(var(--middle) - 10px);
			bottom: 0;
			border-left: var(--thickness) solid var(--color);
		}

		&:not(.start):after {
			content: '';
			position: absolute;
			left: var(--left);
			right: 0;
			top: 0;
			bottom: calc(100% - var(--middle));
			border-left: var(--thickness) solid var(--color);
			border-bottom: var(--thickness) solid var(--color);
			border-bottom-left-radius: 10px;
		}

		button {
			position: absolute;
			top: 5px;
			left: 0;
			right: 10px;
			z-index: 2;
			background-color: var(--color-background);
		}
	}

}
</style>
