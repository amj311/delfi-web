<script setup lang="ts">
import { accounts, scheduledTransactions } from '../delfi-core/dummyData';
</script>

<template>
	<main>
		<div v-for="account of accounts">
			{{ account.name }}
		</div>


		<div v-for="transaction of scheduledTransactions">
			{{ transaction.id }}
		</div>
	</main>
</template>
