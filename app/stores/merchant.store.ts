import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Merchant, MerchantDraft } from 'delfi-core/models/Transaction';

export const useMerchantStore = defineStore('merchant', () => {
	let merchants = ref([] as Merchant[]);
	let isLoadingMerchants = ref(false);

	async function loadMerchants() {
		try {
			isLoadingMerchants.value = true;
			const { data } = await request.get('/merchant');
			merchants.value = data.data;
		}
		catch (e) {
			console.error("Could not load merchants!")
		}
		finally {
			isLoadingMerchants.value = false;
		}
	}
	loadMerchants().catch((error) => {
		console.error("Error loading merchants:", error);
	});

	function getMerchantById (id?: string) {
		return merchants.value.find(a => a.merchant_id === id);
	}

	async function createMerchant(merchantData: MerchantDraft) {
		const { data } = await request.post('/merchant', {
			...merchantData
		});
		merchants.value.push(data.data);
		merchants.value.sort((a, b) => a.name.localeCompare(b.name));
		return data.data as Merchant;
	}

	async function updateMerchant(merchantData: Merchant) {
		const { data } = await request.post(`/merchant/${merchantData.merchant_id}`, {
			...merchantData
		});
		const index = merchants.value.findIndex(m => m.merchant_id === merchantData.merchant_id);
		if (index !== -1) {
			merchants.value[index] = data.data;
		}
		return data.data as Merchant;
	}

	return {
		merchants,
		isLoadingMerchants,
		loadMerchants,
		getMerchantById,
		createMerchant,
		updateMerchant,
	};
})
