<script
	setup
	lang="ts"
>
import { useUserStore } from '../stores/user.store';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Message from 'primevue/message';
import { AuthService } from '@/services/authService';

const userStore = useUserStore();

const emit = defineEmits(['authenticated']);

const state = reactive({
	givenName: '',
	familyName: '',
	email: '',
	password: '',
	passwordConfirm: '',
	showPassword: false,
	showPasswordConfirm: false,
	mode: 'login',
	hasSentEmail: false,
	isLoading: false,
});

async function loginErrors(op: () => void) {
	try {
		state.isLoading = true;
		await op();
	}
	catch (error: any) {
		// weak password instructions
		if (error.message.includes('auth/weak-password')) {
			const message = error.message.split('Firebase: ')[1]?.split(' (auth/weak-password)')[0];
			userStore.loginError = message;
			return;
		}

		const errorGroups = [
			{
				message: 'Check your email/password',
				matches: [
					'auth/invalid-email',
					'auth/invalid-credential',
					'auth/missing-password',
				],
			},
			{
				message: 'That email already has an account.',
				matches: [
					'auth/email-already-in-use',
				],
			},
			{
				message: 'Network error',
				matches: [
					'auth/network-request-failed',
				],
			}
		]
		for (const errorGroup of errorGroups) {
			if (errorGroup.matches.some(m => error.message?.includes(m))) {
				userStore.loginError = errorGroup.message;
				return;
			}
		}

		userStore.loginError = "Unknown error";
	}
	finally {
		state.isLoading = false;
	}
}

async function loginWithEmail() {
	loginErrors(async () => {
		await AuthService.signInWithEmail(state.email, state.password);
		emit('authenticated');
	})
}
async function createEmailUser() {
	loginErrors(async () => {
		if (state.password !== state.passwordConfirm) {
			userStore.loginError = "Passwords do not match";
			return;
		}
		await AuthService.createEmailUser(state.email, state.password, state.givenName, state.familyName);
		emit('authenticated');
	})
}
async function loginWithGoogle() {
	loginErrors(async () => {
		await AuthService.signInWithGoogle();
		emit('authenticated');
	})
}

async function sendPasswordResetEmail() {
	loginErrors(async () => {
		await AuthService.sendPasswordResetEmail(state.email);
		state.hasSentEmail = true;
	})
}

function leaveRestPasswordMode() {
	state.mode = 'login';
	state.email = '';
	state.hasSentEmail = false;
}


function doFormSubmit() {
	switch (state.mode) {
		case 'login': {
			loginWithEmail();
			break;
		}
		case 'reset_password': {
			sendPasswordResetEmail();
			break;
		}
		case 'signup': {
			createEmailUser();
			break
		}
	}
}



</script>


<template>
	<div
		class="flex flex-column gap-2 align-items-center justify-content-center w-full mx-auto"
		style="max-width: 50rem"
	>
		<Message
			severity="error"
			v-if="userStore.loginError"
			class="mb-3"
		>
			{{ userStore.loginError }}
		</Message>

		<template v-if="['reset_password', 'signup', 'login'].includes(state.mode)">
			<div class="flex flex-column gap-1 w-full align-items-center" style="width: 20em">
				<p v-if="state.mode === 'reset_password'">
					<template v-if="!state.hasSentEmail">
						Enter your email to have a reset password link sent to you.
					</template>
					<template v-else>
						Thank you. If your email is in our system, you will receive your password reset link shortly.
					</template>
				</p>

				<form @submit.prevent="doFormSubmit" class="flex-column gap-1">
					<InputText
						transparent
						v-if="!(state.mode === 'reset_password' && state.hasSentEmail)"
						type="text"
						v-model="state.email"
						placeholder="Email"
						autocomplete="username"
						size="large"
						class="w-full"
					/>

					<!-- <template v-if="state.mode === 'signup'">
						<InputText
							transparent
							type="text"
							v-model="state.givenName"
							placeholder="First Name"
							size="large"
							class="w-full"
						/>
						<InputText
							transparent
							type="text"
							v-model="state.familyName"
							placeholder="Last Name"
							size="large"
							class="w-full"
						/>
					</template> -->


					<InputGroup>
						<template v-if="state.mode === 'signup' || state.mode === 'login'">
							<InputText
								transparent
								v-model="state.password"
								placeholder="Password"
								:type="state.showPassword ? 'text' : 'password'"
								:autocomplete="state.mode === 'signup' ? 'new-password' : 'current-password'"
								size="large"
								class="w-full"
							/>
							<InputGroupAddon
								transparent
								style="cursor: pointer"
								@click="state.showPassword = !state.showPassword"
								tabindex="0"
							>
								<i
									class="pi"
									:class="state.showPassword ? 'pi-eye-slash' : 'pi-eye'"
								/>
							</InputGroupAddon>
						</template>
					</InputGroup>

					<!-- confirm password -->
					<template v-if="state.mode === 'signup'">
						<InputGroup>
							<InputText
								transparent
								v-model="state.passwordConfirm"
								placeholder="Confirm Password"
								:type="state.showPasswordConfirm ? 'text' : 'password'"
								size="large"
								class="w-full"
							/>
							<InputGroupAddon
								transparent
								style="cursor: pointer"
								@click="state.showPasswordConfirm = !state.showPasswordConfirm"
								tabindex="0"
							>
								<i
									class="pi"
									:class="state.showPasswordConfirm ? 'pi-eye-slash' : 'pi-eye'"
								/>
							</InputGroupAddon>
						</InputGroup>
					</template>


					<div class="flex flex-column align-items-center mt-3 gap-4">
						<template v-if="state.mode === 'signup'">
							<Button
								size="large"
								severity="primary"
								:loading="state.isLoading"
								class="w-full my-3 justify-content-around"
								role="submit"
								@click="doFormSubmit"
							>
								Create Account
							</button>
							<span>
								Already have an account?
								<a
									class="link text-primary"
									@click="state.mode = 'login'"
								>
									Sign in
								</a>
							</span>
						</template>
						<template v-else-if="state.mode === 'login'">
							<div class="flex-column align-items-center gap-2 w-full">
								<Button
									size="large"
									severity="primary"
									:loading="state.isLoading"
									class="w-full justify-content-around"
									role="submit"
									@click="doFormSubmit"
								>
									Sign in
								</button>
							</div>
							<div class="flex-column align-items-center gap-2">
								<span>
									New here?
									<a
										class="link text-primary"
										@click="state.mode = 'signup'"
									>
										Create account
									</a>
								</span>
								<span>
									<a
										class="link text-primary"
										@click="state.mode = 'reset_password'"
									>
										Forgot password?
									</a>
								</span>
							</div>
						</template>
						<template v-else-if="state.mode === 'reset_password'">
							<Button
								size="large"
								v-if="!state.hasSentEmail"
								role="submit"
								class="w-full my-3 justify-content-around"
							>Send Email</button>
							<span>Back to <a
									class="link text-primary"
									@click="leaveRestPasswordMode"
								>Sign in</a></span>
						</template>
					</div>
					<input type="submit" hidden />
				</form>
			</div>
		</template>

		<!-- GOOGLE SIGN-IN DISABLED
		<div>or</div>

		<Button
			size="large" @click="loginWithGoogle" outlined class="w-full justify-content-between gap-2"><i class="pi pi-google" /><div class="flex-grow-1 text-align-center">Sign in with Google</div></button> -->
	</div>
</template>


<style scoped>
.login {
	text-align: center;
	padding-top: 5em;
}
</style>