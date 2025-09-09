<script setup lang="ts">
import { Icons, type IconName, colors, type Icon, type IconIdentifier } from 'delfi-core/utils/constants';
import { computed } from 'vue';

const props = defineProps<{
	name?: IconIdentifier;
	source?: string;
	source_id?: string;
	fill?: boolean;
	color?: string;
}>();

const icon = computed<Icon>(() => {
	if (Icons[props.name || '']) {
		return Icons[props.name || ''];
	}
	if (props.name?.includes('::')) {
		const [source, source_id] = props.name.split('::');
		return {
			source: source || 'material-symbols',
			source_id: source_id || '',
		};
	}
	return {
		source: props.source || 'material-symbols',
		source_id: props.source_id || '',
	};
});
const color = computed(() => colors[props.color || ''] || props.color || 'inherit');
</script>

<template>
	<span class="icon-wrapper" :style="{ color: color }">
		<template v-if="icon.source === 'material-symbols'">
			<span class="icon material-symbols-rounded" :class="{ fill }" :style="icon.style">{{ icon.source_id }}</span>
		</template>
	</span>
</template>

<style scoped>
.icon-wrapper {
	display: contents;
	font-size: inherit;
	user-select: none;;
}
.icon {
	color: inherit;
	vertical-align: middle;
}
.material-symbols-rounded {
	padding-top: 0.07em;
	font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' -25, 'opsz' 12;
	font-size: 1.3em;

	&.fill {
		font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' -25, 'opsz' 12;
	}
}
</style>
