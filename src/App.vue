<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useUserStore } from './stores/user.store';
import { AuthService } from './services/authService';
import AccountSetup from './views/AccountSetup.vue';
import { onBeforeUnmount, ref } from 'vue';

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
	<div v-if="!userStore.hasLoadedSessionData">Loading...</div>
	<RouterView v-else-if="userStore.isLoggedIn && userStore.currentUser" />
	<AccountSetup v-else-if="userStore.isLoggedIn && !userStore.currentUser" />
	<div v-else>
		<a @click="AuthService.signInWithGoogle()">Sign in with Google</a>
	</div>
</template>

<style scoped></style>
