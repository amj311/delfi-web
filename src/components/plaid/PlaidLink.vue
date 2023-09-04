<script setup lang="ts">
import request from '@/services/request';
import { useCounterStore } from '@/stores/counter';
import { ref } from 'vue';

const loading = ref(true);

const beginLink = async () => {
	const { data } = await request.get('/plaid/link-token');
	console.log(data.data);

	const handler = Plaid.create({
		token: data.data.link_token,
		onSuccess: onLinkSuccess,
		onEvent: console.log
	});

	handler.open();
}

const onLinkSuccess = async (public_token:string, metadata) => {
	console.log(metadata)
	const { data } = await request.post('/plaid/new-connection', { public_token });
}


</script>


<template>
	<div>
		<button @click="beginLink">Connect Account</button>
	</div>
</template>

<style>
@media (min-width: 1024px) {
	.about {
		min-height: 100vh;
		align-items: center;
	}
}
</style>
