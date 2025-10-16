<script setup lang="ts">
import { computed, onMounted, ref, useSlots } from 'vue';

const props = defineProps<{
	onLeft?: () => void;
	onRight?: () => void;
	leftBackground?: string;
	rightBackground?: string;
}>();

const slider = ref<HTMLElement | null>(null);

const swipeDistance = 100;
const threshold = 90;
const leftSlidePercent = ref(0);
const isLeftFull = computed(() => leftSlidePercent.value >= threshold);
const rightSlidePercent = ref(0);
const isRightFull = computed(() => rightSlidePercent.value >= threshold);

const hasBackground = computed(() => Boolean(useSlots().left) || Boolean(useSlots().right));

onMounted(() => {
	if (slider.value) {
		// initialize scroll position to center
		slider.value.scrollLeft = (slider.value.scrollWidth - slider.value.clientWidth) / 2;

		slider.value.addEventListener('scroll', () => {
			if (!slider.value) {
				return;
			}
			const maxScroll = slider.value.scrollWidth - slider.value.clientWidth;
			const scrollLeft = slider.value.scrollLeft;
			leftSlidePercent.value = (1 - Math.min(1, scrollLeft / swipeDistance)) * 100;
			rightSlidePercent.value = (1 - Math.min(1, (maxScroll - scrollLeft) / swipeDistance)) * 100;
		});
	
		slider.value.addEventListener('touchend', () => {
			attemptTriggers();
		});
	}
})

function attemptTriggers() {
	if (isLeftFull.value && props.onLeft) {
		props.onLeft();
	}
	else if (isRightFull.value && props.onRight) {
		props.onRight();
	}
}

</script>

<template>
<div class="slide-action">
    <div ref="slider" class="slider">
        <div class="buffer" v-if="onLeft"></div>
        <div class="content" :class="{ 'shadow-1 bg': hasBackground }">
			<slot name="content"></slot>
		</div>
        <div class="buffer" v-if="onRight"></div>
    </div>
	<div class="action left" :style="{ opacity: (50 + leftSlidePercent / 2) / 100, background: leftBackground }">
		<div class="action-content" :class="{ full: isLeftFull, activated: isLeftFull }">
			<slot name="left" :percent="leftSlidePercent"></slot>
		</div>
	</div>
	<div class="action right" :style="{ opacity: (50 + rightSlidePercent / 2) / 100, background: rightBackground }">
		<div class="action-content" :class="{ full: isRightFull, activated: isRightFull }">
			<slot name="right" :percent="rightSlidePercent"></slot>
		</div>
	</div>
</div>
</template>

<style scoped lang="scss">
.slide-action {
    position: relative;
    width: 100%;
}


.slider {
    width: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    display: flex;
    scrollbar-width: none;

	.content {
		width: 100%;
		display: inline-block;
		position: relative;
		z-index: 2;
		box-sizing: border-box;
		scroll-snap-align: center;
		flex: 1 0 100%;
	}
}

.buffer {
    display: inline-block;
    flex: 0 0 100px;
}

.action {
    position: absolute;
    top: 0;
    bottom: 0;
	width: 50%;
	padding: 0 20px;
	display: flex;
	align-items: center;
	pointer-events: none; // disable interaction
	user-select: none;

	&.right {
		right: 0;
		justify-content: flex-end;
	}


	.action-content {
		transition: 300ms;
		
		&.full {
			transform: scale(1.2);
		}
	}
	
}


</style>
