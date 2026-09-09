<script setup lang="ts">
import { Icons, type IconName, colors, type Icon, type IconIdentifier, type IconSource } from 'delfi-core/utils/constants';
import { computed } from 'vue';

const props = defineProps<{
	name?: IconIdentifier;
	source?: IconSource;
	source_id?: string;
	fill?: boolean;
	color?: string;
	size?: number;
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
	<span class="icon-wrapper square flex-center-all" :style="{ color, height: `${size || 1}em`, fontSize: `${size || 1}em` }">
		<template v-if="icon.source === 'material-symbols'">
			<span class="icon material-symbols-rounded" :class="{ fill }" :style="icon.style">{{ icon.source_id }}</span>
		</template>
		<template v-if="icon.source === 'pi'">
			<i :class="`icon pi pi-${icon.source_id}`" :style="icon.style" />
		</template>
	</span>
</template>

<style scoped>
.icon-wrapper {
	flex-shrink: 0;
	overflow: hidden;
}
.icon {
	flex-shrink: 0;
	color: inherit;
	vertical-align: middle;
}
.material-symbols-rounded {
	font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' -25, 'opsz' 12;
	font-size: 1.2em;

	&.fill {
		font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' -25, 'opsz' 12;
	}
}
</style>
