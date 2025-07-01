<!-- Opens menus and overlays attached with navigation state such that they can be properly dismissed when navigating away -->

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
	triggerKey: string; // Used to differentiate multiple triggers
}>();

const router = useRouter();

const keyInRoute = computed(() => router.currentRoute.value.query.v === props.triggerKey);
const show = ref(false);

function open() {
	router.push({ query: { ...router.currentRoute.value.query, v: props.triggerKey } });
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
