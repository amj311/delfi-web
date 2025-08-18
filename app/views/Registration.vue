<script setup lang="ts">
import { useUserStore } from '@/stores/user.store';
import type { User } from '@prisma/client';
import { reactive } from 'vue';

const userStore = useUserStore();

const newUserData = reactive({
	given_name: '',
	family_name: '',
});

const onSubmit = async () => {
	userStore.createUser(newUserData);
	console.log(newUserData);
}

</script>


<template>
	<div class="about">
		<h1>Welcome to Defli</h1>
		<p>Tell us about yourself!</p>
		<br />
		<br />
		<input placeholder="First Name" v-model="newUserData.given_name" />
		<br />
		<input placeholder="Last Name" v-model="newUserData.family_name" />
		<br />
		<br />
		<button @click="onSubmit">Continue</button>
	</div>
</template>

<style>
@media (min-width: 1024px) {
	.about {
		min-height: 100vh;
		align-items: center;
	}
}
</style>