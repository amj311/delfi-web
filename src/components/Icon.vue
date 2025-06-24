<script setup lang="ts">
import { Icons, type IconName } from 'delfi-core/utils/constants';

const props = defineProps<{
	name: IconName;
}>();

const icon = Icons[props.name];
</script>

<template>
	<span class="icon-wrapper">
		<template v-if="icon.source === 'material-symbols'">
			<span class="icon material-symbols-rounded">{{ icon.source_id }}</span>
		</template>
	</span>
</template>

<style scoped>
.icon-wrapper {
	display: contents;
	font-size: inherit;
}
.icon {
	color: inherit;
}
.material-symbols-rounded {
	font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' -25, 'opsz' 12;
	font-size: 1.3em;
}
</style>
