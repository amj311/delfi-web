<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useUserStore } from './stores/user.store';
import { AuthService } from './services/authService';
import AccountSetup from './views/AccountSetup.vue';

const userStore = useUserStore();
</script>

<template>
	<div v-if="userStore.isLoadingSessionData">Loading...</div>
	<RouterView v-else-if="userStore.isLoggedIn && userStore.currentUser" />
	<AccountSetup v-else-if="userStore.isLoggedIn && !userStore.currentUser" />
	<div v-else>
		<a @click="AuthService.signInWithGoogle()">Sign in with Google</a>
	</div>
</template>

<style scoped></style>
