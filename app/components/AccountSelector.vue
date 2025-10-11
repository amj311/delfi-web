<script setup lang="ts">
import { useAccountStore } from '@/stores/account.store';
import { computed, onMounted } from 'vue';
import { AccountLabels, type Account } from 'delfi-core/models/Account';
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import AttributionAvatar from './AttributionAvatar.vue';

const props = defineProps<{
	currentAccountId: string | null;
	allowedAccounts?: Account[];
}>();
const selectedAccount = computed(() => useAccountStore().getAccountById(props.currentAccountId || undefined));

defineEmits<{
	select: [accountId: string | null];
}>();

onMounted(() => {
	if (props.currentAccountId && selectedAccount.value) {
		setTimeout(() => {
			const institutionElement = document.getElementById(`institution_${selectedAccount.value?.Institution?.name}`);
			if (institutionElement) {
				institutionElement.scrollIntoView();
			}
		}, 50);
	}
});

const search = ref<string>('');

const institutions = computed(() =>
	useAccountStore()
		.accountsByInstitution.map((institution) => ({
			...institution,
			accounts: institution.accounts
				.filter((acc) => !props.allowedAccounts || props.allowedAccounts.some((a) => a.account_id === acc.account_id))
				.filter(
					(a) =>
						!search.value.trim() ||
						(a.display_name || a.external_name).toLowerCase().includes(search.value.trim().toLowerCase()) ||
						institution.name.toLowerCase().includes(search.value.trim().toLowerCase()) ||
						a.type.toLowerCase().includes(search.value.trim().toLowerCase())
				),
		}))
		.filter((institution) => institution.accounts.length > 0)
);
</script>

<template>
	<div class="flex flex-column h-full">
		<div class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round" @click="() => $emit('select', null)">
			<AttributionAvatar square :icon="'bank'" style="width: 2rem; height: 2rem" />
			<div class="flex-grow-1">No account selected</div>
			<i class="pi pi-check" v-if="!currentAccountId" />
		</div>
		<div
			v-if="currentAccountId && selectedAccount"
			class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
			@click="() => $emit('select', selectedAccount?.account_id || null)"
		>
			<AttributionAvatar square :image="selectedAccount?.Institution?.logo" :icon="'bank'" style="width: 2rem; height: 2rem" />
			<div class="flex-grow-1">{{ selectedAccount?.display_name || selectedAccount?.external_name }}</div>
			<i class="pi pi-check" v-if="currentAccountId === selectedAccount?.account_id" />
		</div>

		<div class="searchbar">
			<InputText v-model="search" placeholder="Search..." class="w-full" />
			<i class="pi pi-search"></i>
		</div>
		<div class="flex flex-column gap-3 overflow-y-auto">
			<div v-for="institution in institutions" :key="institution.name" class="flex flex-column gap-2">
				<div :id="`institution_${institution.name}`" class="flex align-items-center gap-2 institution-header">
					<AttributionAvatar square :image="institution.institution?.logo" :icon="'bank'" style="width: 2rem; height: 2rem" />
					<h4 class="institution">{{ institution.name }}</h4>
				</div>
				<div class="flex flex-column">
					<div
						v-for="account in institution.accounts"
						:key="account.account_id"
						class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
						@click="() => $emit('select', account.account_id)"
					>
						<div class="flex-grow-1">
							<div>{{ account.display_name || account.external_name }}</div>
							<div class="text-sm text-gray-500">{{ AccountLabels[account.subtype] }} {{ account.mask ? `****${account.mask}` : '' }}</div>
						</div>
						<i class="pi pi-check" v-if="currentAccountId === account.account_id" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.searchbar {
	position: relative;
	padding: 0.5rem 0;
	background: var(--color-background);
	z-index: 2;

	> i.pi {
		position: absolute;
		right: 0.7rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--p-text-color);
	}
}

.institution-header {
	padding: 0.5rem 0.5rem 0.25rem;
}

.institution {
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--p-text-muted-color);
	margin: 0;
}

</style>