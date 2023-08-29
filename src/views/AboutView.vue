<script setup lang="ts">
import { useCounterStore } from '@/stores/counter';

const counterStore = useCounterStore();
</script>


<template>
	<div class="about">
		<h1>This is an about page</h1>
		<div>{{ counterStore.count }}</div>
		<button @click="counterStore.increment">Increment</button>
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
