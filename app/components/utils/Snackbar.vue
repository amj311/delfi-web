<script setup lang="ts">
import Button from 'primevue/button';


defineProps<{
	visible: boolean,
	closeable?: boolean
	onClose?: () => void
}>();

</script>


<template>
	<Transition
		name="snackbar"
		tag="div"
		enter-active-class="fadeinup"
		leave-active-class="fadeoutdown"
	>
		<div v-if="visible" class="snackbar p-dialog">
			<slot></slot>
			<div v-if="closeable" class="close-button" @click="onClose">
				<slot name="closer"><Button icon="pi pi-times" text @click="onClose" /></slot>
			</div>
		</div>
	</Transition>
</template>

<style scoped lang="scss">
.snackbar {
	position: fixed;
	z-index: 3;
	bottom: 10px;
	left: 50%;
	translate: -50%;
	min-width: 300px;
	width: auto;
	display: flex;
	align-items: center;
	padding: .5em 1em;
}
</style>