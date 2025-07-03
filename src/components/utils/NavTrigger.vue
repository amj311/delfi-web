<!-- Opens menus and overlays attached with navigation state such that they can be properly dismissed when navigating away -->

<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
	triggerKey: string; // Used to differentiate multiple triggers
}>();

const router = useRouter();

function getVArray() {
	const parsed = JSON.parse(router.currentRoute.value.query.v?.toString() || '[]');
	return Array.isArray(parsed) ? parsed : [];
}

const keyInRoute = computed(() => {
	return getVArray().includes(props.triggerKey);
});
const show = ref(false);

function open() {
	try {
		const array = getVArray();
		array.push(props.triggerKey);
		router.push({ query: { ...router.currentRoute.value.query, v: JSON.stringify(array) } });
	} catch (error) {
		console.error('Error opening NavTrigger:', error);
	}
}
function close() {
	router.back();
}


watch(
	() => router.currentRoute.value.query.v,
	() => show.value = keyInRoute.value,
	{ immediate: true }
);

defineExpose({ open, close });
</script>

<template>
	<slot :show="show"></slot>
</template>

<style scoped>
</style>
