import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Merchant } from 'delfi-core/models/Transaction';

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

	function getMerchantById (id?: string) {
		return merchants.value.find(a => a.merchant_id === id);
	}

	loadMerchants().catch((error) => {
		console.error("Error loading merchants:", error);
	});

	return {
		merchants,
		isLoadingMerchants,
		loadMerchants,
		getMerchantById,
	};
})
