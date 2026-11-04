<script setup lang="ts">
import { nextTick, ref } from 'vue';
import DrawerModal from './utils/DrawerModal.vue';
// import { useSettingsStore } from '@/stores/settings.store';
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import { useUserStore } from '@/stores/user.store.js';
import { useToast } from './utils/Toast.vue';
import request from '@/services/request.js';
import InputText from 'primevue/inputtext';
import { AuthService } from '@/services/authService.js';

const drawerModal = ref<InstanceType<typeof DrawerModal> | null>(null);
const emailModal = ref<InstanceType<typeof DrawerModal> | null>(null);
// const settingsStore = useSettingsStore();

const userDraft = ref(useUserStore().currentUser || {});

async function handleSave() {
	await save();
	drawerModal.value?.close();
}

function handleCancel() {
	drawerModal.value?.close();
}

async function open() {
	userDraft.value = { ...useUserStore().currentUser };
	await drawerModal.value?.open();
}

defineExpose({ open });

async function save() {
	await nextTick();
	const { email_notifs, push_notifs, given_name, family_name } = userDraft.value;
	try {
		await request.put('/user', { email_notifs,push_notifs });
		useToast().add({
			severity:'success',
			title: 'Saved settings'
		})
		useUserStore().currentUser = {
			...useUserStore().currentUser,
			...userDraft.value,
		}
	}
	catch (e) {
		console.error(e);
		useToast().add({
			severity:'error',
			title: 'Failed to save settings'
		})
	}
}

const newEmail = ref('');
const password = ref('');

async function changeEmail() {
	try {
		await AuthService.changeUserEmail(newEmail.value, password.value);
		changingEmail.value = false;
		userDraft.value.email = newEmail.value;
		useUserStore().currentUser.email = newEmail.value;
		useToast().add({
			severity:'success',
			title: 'Changed email'
		})
	}
	catch (e) {
		console.error(e);
		useToast().add({
			severity:'error',
			title: 'Failed to change email'
		})
	}
}

const changingEmail = ref(false);
</script>

<template>
	<DrawerModal ref="drawerModal" title="Settings" width="28rem">
		<div class="settings-container flex flex-column gap-4">
			<div class="profile-section">
				<h3 class="settings-section-title">Profile</h3>
				<div class="flex flex-column gap-3">
					<div class="flex align-items-center gap-2">
						<label>First name</label>
						<InputText
							v-model="userDraft.given_name"
						/>
					</div>
					<div class="flex align-items-center gap-2">
						<label>Last name</label>
						<InputText
							v-model="userDraft.family_name"
						/>
					</div>
					<div class="flex align-items-center gap-2">
						<label>Email</label>
						<InputText
							:value="userDraft.email"
							disabled
						/>
						<Button text label="Change" @click="() => emailModal?.open()" />
					</div>
				</div>
			</div>

			<div class="notifs-section">
				<h3 class="settings-section-title">Notifications</h3>
				<div class="flex flex-column gap-3 ">
					<div class="flex align-items-center gap-2">
						<ToggleSwitch
							input-id="email-notifs"
							v-model="userDraft.email_notifs"
						/>
						<label for="email-notifs" class="">Email</label>
					</div>
					<div class="flex align-items-center gap-2">
						<ToggleSwitch
							input-id="push-notifs"
							v-model="userDraft.push_notifs"
						/>
						<label for="push-notifs" class="">Mobile</label>
					</div>
				</div>
			</div>

			<div class="flex gap-2 justify-content-end">
				<Button
					label="Cancel"
					severity="secondary"
					@click="handleCancel"
				/>
				<Button
					label="Save"
					@click="handleSave"
				/>
			</div>
		</div>
	</DrawerModal>

	<DrawerModal ref="emailModal" title="Change email" width="28rem">
		<div class="flex flex-column gap-3 mb-4">
			<div class="flex align-items-center gap-2">
				<label>New email</label>
				<InputText
					v-model="newEmail"
				/>
			</div>
			<div class="flex align-items-center gap-2">
				<label>Confirm your password</label>
				<InputText
					v-model="password"
					type="password"
				/>
			</div>
		</div>

		<div class="flex gap-2 justify-content-end">
			<Button
				label="Cancel"
				severity="secondary"
				@click="() => emailModal?.close()"
			/>
			<Button
				label="Confirm new email"
				@click="changeEmail"
			/>
		</div>
	</DrawerModal>
</template>

<style scoped>
.settings-container {
	padding: 1rem 0;
}

.settings-section-title {
	margin: 0;
	font-size: 0.95rem;
	font-weight: 600;
	color: #333;
}
</style>
