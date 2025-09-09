<script setup lang="ts">
import { useUserStore } from './stores/user.store';
import { AuthService } from './services/authService';
import Registration from './views/Registration.vue';
import { onBeforeMount, onBeforeUnmount, ref } from 'vue';
import LoggedIn from './views/LoggedIn.vue';
import PromptModal from './components/utils/PromptModal.vue';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import { useAppStore } from './stores/app.store';

const userStore = useUserStore();
const sessionInterval = setInterval(userStore.loadSessionData, 60000);

const waitingForAuth = ref(true);
setTimeout(() => {
	waitingForAuth.value = false;
}, 1000); // wait for 1 second before showing the app

onBeforeUnmount(() => {
	clearInterval(sessionInterval);
});
</script>

<template>
	<div class="app" :class="{ touch: useAppStore().isTouch || true }">
		<LoggedIn v-if="!waitingForAuth && userStore.hasAuth && userStore.currentUser" />
		<div v-else class="flex flex-column align-items-center" style="padding-top: calc(33vh - 5rem)">
			<div class="flex align-items-center gap-3" style="font-size: 1.5em;">
				<img src="./assets/gemini_logo_2_cropped.png" alt="Delfi Logo" class="mb-4" style="width: 3em" />
				<div
					class="mb-4 font-semibold"
					style="font-size: 3em; background: linear-gradient(45deg, rgb(108 41 122), rgb(48, 207, 208)) text; -webkit-text-fill-color: transparent"
				>
					Delfi
				</div>
			</div>
			<div v-if="waitingForAuth || userStore.isLoading" class="flex align-items-center">
				<i class="pi pi-spin pi-spinner mr-2"></i>
				Loading...
			</div>
			<div v-else-if="userStore.hasAuth && !userStore.currentUser">Delfi is not available at this time.</div>
			<div v-else>
				<Button @click="AuthService.signInWithGoogle()">Sign in with Google</Button>
			</div>
		</div>
	</div>

	<!-- Global Prompt Modal -->
	<PromptModal />
	<Toast></Toast>
</template>

<style scoped></style>
