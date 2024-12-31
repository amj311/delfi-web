import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type User } from "@prisma/client";
import request from '@/services/request';
import { AuthService } from '@/services/authService';

export const useUserStore = defineStore('user', () => {
	let isLoadingSessionData = ref(true);
	const hasLoadedSessionData = ref(false);
	const loginError = ref<String>('');
	const isLoggedIn = ref(false);
	const currentUser = ref<any>();
	const newUserData = ref<any>(null);
	const session = ref<any>();
	const isLoading = ref(false);

	const loadSessionData = async () => {
		const authUser = AuthService.authUser;
		if (!authUser) {
			isLoggedIn.value = false;
			currentUser.value = null;
			hasLoadedSessionData.value = true;
			isLoading.value = false;
			return;
		}
		try {
			isLoading.value = true;
			isLoggedIn.value = Boolean(authUser);
			if (!isLoggedIn.value) {
				currentUser.value = null;
				return;
			}
			if (newUserData.value) {
				await request.put('user/self', newUserData.value);
				newUserData.value = null;
			}
			const { data } = await request.get('user/session');
			// Push new user details after creating account with email
			currentUser.value = data.data;
			session.value = data;
			loginError.value = '';
		}
		catch (e) {
			console.log('ERROR LOADING AUTH USER')
			console.log(e);
			loginError.value = 'Failed to load user';
		}
		finally {
			hasLoadedSessionData.value = true;
			isLoading.value = false;
		}
	};

	AuthService.onLogInOrOut = () => {
		loadSessionData();
	};

	const setNewUserData = (data) => {
		newUserData.value = data;
	};
	
	const createUser = async (newUser) => {
		if (!isLoggedIn.value) {
			throw Error("There is no active session");
		}
		if (currentUser.value) {
			throw Error("There is already a user for this session");
		}
		const { data } = await request.post('user/create-account', {
			...newUser,
			auth_id: AuthService.authUser?.uid,
			email: AuthService.authUser?.email
		});
		currentUser.value = data.data;
	};


	return {
		isLoadingSessionData,
		hasLoadedSessionData,
		isLoggedIn,
		loginError,
		currentUser,
		session,
		setNewUserData,
		createUser,
		loadSessionData,
		isLoading,
	};
});
