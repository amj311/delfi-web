<script setup lang="ts">
import { computed, onMounted, ref, useSlots } from 'vue';

const props = defineProps<{
	onLeft?: () => void;
	onRight?: () => void;
	leftBackground?: string;
	rightBackground?: string;
}>();

const swipeDistance = 100;
const threshold = 90;
// const leftSlidePercent = computed(() => (swipeDelta.value > 0 ? (swipeDelta.value / swipeDistance) * 100 : 0));
const isLeftFull = computed(() => swipeDelta.value >= threshold);
// const rightSlidePercent = computed(() => (swipeDelta.value < 0 ? (-swipeDelta.value / swipeDistance) * 100 : 0));
const isRightFull = computed(() => swipeDelta.value <= -threshold);

const hasBackground = computed(() => Boolean(useSlots().left) || Boolean(useSlots().right));

const swipeDelta = ref(0);
let touchStartX = 0;
let touchStartY = 0;
const sliderRef = ref<HTMLElement | null>(null);

function updateSwipeDelta(val) {
	swipeDelta.value = Math.min(props.onLeft ? swipeDistance : 0, Math.max(props.onRight ? -swipeDistance : 0, val));
}

const discardSwipe = ref(false);

onMounted(() => {
	if (sliderRef.value) {
		sliderRef.value.addEventListener('touchstart', (e) => {
			e.stopPropagation();
			const touch = e.touches[0];
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
			sliderRef.value?.classList.add('no-transition');
			discardSwipe.value = false;
		}, { passive: true });

		sliderRef.value.addEventListener('touchmove', (e) => {
			if (discardSwipe.value || (!props.onLeft && !props.onRight)) return;
			e.stopPropagation();
			const touch = e.touches[0];
			const deltaX = touch.clientX - touchStartX as number;
			const deltaY = touch.clientY - touchStartY as number;
			if (deltaX > deltaY && deltaX > 5) {
				document.body.classList.add('prevent-scroll');
				updateSwipeDelta(deltaX);
			} else {
				document.body.classList.remove('prevent-scroll');
				updateSwipeDelta(0);
				discardSwipe.value = true;
			}
		}, { passive: true });

		document.addEventListener('touchend', (e) => {
			e.stopPropagation();
			sliderRef.value?.classList.remove('no-transition');
			document.body.classList.remove('prevent-scroll');
			attemptTriggers();
			updateSwipeDelta(0);
		}, { passive: true });
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
<div class="slide-action" ref="sliderRef">
    <!-- <div ref="slider" class="slider"> -->
        <!-- <div class="buffer" v-if="onLeft"></div> -->
        <div class="content" :class="{ 'shadow-1 bg': hasBackground }" :style="{ translate: swipeDelta + 'px 0' }">
			<slot name="content"></slot>
		</div>
        <!-- <div class="buffer" v-if="onRight"></div> -->
    <!-- </div> -->
	<div class="action left" :style="{ opacity: isLeftFull ? 1 : .5, background: leftBackground }">
		<div class="action-content" :class="{ full: isLeftFull, activated: isLeftFull }">
			<slot name="left"></slot>
		</div>
	</div>
	<div class="action right" :style="{ opacity: isRightFull ? 1 : .5, background: rightBackground }">
		<div class="action-content" :class="{ full: isRightFull, activated: isRightFull }">
			<slot name="right"></slot>
		</div>
	</div>
</div>
</template>

<style scoped lang="scss">
.slide-action {
    position: relative;
    width: 100%;
	overflow: hidden;

	.content {
		width: 100%;
		display: inline-block;
		position: relative;
		z-index: 2;
		box-sizing: border-box;
		scroll-snap-align: center;
		flex: 1 0 100%;
	}

	&:not(.no-transition) .content {
		transition: translate 300ms;
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
				transform: scale(1.25);
			}
		}
		
	}
}


</style>
