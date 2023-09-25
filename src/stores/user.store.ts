import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type User } from "@prisma/client";
import request from '@/services/request';
import { AuthService } from '@/services/authService';

export const useUserStore = defineStore('user', () => {
	let isLoadingSessionData = ref(true);
	let isLoggedIn = ref(false);
	let currentUser = ref<User | null>(null);

	AuthService.onLogInOrOut = async (authUser) => {
		console.log(authUser);
		try {
			isLoadingSessionData.value = true;
			isLoggedIn.value = Boolean(authUser);
			if (!isLoggedIn.value) {
				currentUser.value = null;
				return;
			}
			const { data } = await request.get('user/session');
			currentUser.value = data.data;
		}
		catch {

		}
		finally {
			isLoadingSessionData.value = false;
		}
	};
 
	const createUser = async (newUser) => {
		if (!isLoggedIn.value) {
			throw Error("There is no active session");
		}
		if (currentUser.value) {
			throw Error("There is already a user for this session");
		}
		const { data } = await request.post('user', {
			...newUser,
			auth_id: AuthService.currentUser?.uid,
			email: AuthService.currentUser?.email
		});
		currentUser.value = data.data;
	};

	return {
		isLoadingSessionData,
		isLoggedIn,
		currentUser,
		createUser,
	};
});
