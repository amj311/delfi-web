<script setup lang="ts">
import { useUserStore } from './stores/user.store';
import { AuthService } from './services/authService';
import Registration from './views/Registration.vue';
import { onBeforeMount, onBeforeUnmount, ref } from 'vue';
import LoggedIn from './views/LoggedIn.vue';
import PromptModal from './components/utils/PromptModal.vue';
import Toast from 'primevue/toast';
import Button from 'primevue/button';

const userStore = useUserStore();
const sessionInterval = setInterval(userStore.loadSessionData, 60000);

const waitingForAuth = ref(true);
setTimeout(() => {
	waitingForAuth.value = false;
}, 1000); // wait for 1 second before showing the app

onBeforeMount(() => {
	// the page has reloaded - remove any lingering drawer queries
	// const query = new URLSearchParams(window.location.search);
	// if (query.has('v')) {
	// 	query.delete('v');
	// 	window.history.replaceState({}, '', `${window.location.pathname}`);
	// }
});

onBeforeUnmount(() => {
	clearInterval(sessionInterval);
});
</script>

<template>
	<div v-if="!userStore.hasLoadedSessionData">Loading...</div>
	<LoggedIn v-else-if="userStore.hasAuth && userStore.currentUser" />
	<div v-else class="flex flex-column align-items-center" style="padding-top: calc(33vh - 5rem)">
		<h1 class="text-5xl mb-4">Delfi</h1>
		<div v-if="userStore.hasAuth && !userStore.currentUser" class="mt-4">Delfi is not available at this time.</div>
		<div v-else>
			<Button @click="AuthService.signInWithGoogle()">Sign in with Google</Button>
		</div>
	</div>

	<!-- Global Prompt Modal -->
	<PromptModal />
	<Toast></Toast>
</template>

<style scoped></style>
