<script setup lang="ts">
import { useAccountStore } from '@/stores/account.store';
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import UpsertAccountForm from '@/components/UpsertAccountForm.vue';
import Currency from '@/components/Currency.vue';
import { TransactionService } from '@/services/transaction.service';
import { TransactionUtils, type Transaction } from 'delfi-core/models/Transaction';
import { instantiateDates } from 'delfi-core/utils/dateUtils';
import CommonEventRow from '@/components/CommonEventRow.vue';
import Divider from 'primevue/divider';
import TransactionDetailsDrawer from '@/components/TransactionDetailsDrawer.vue';

const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const accountId = computed(() => route.params.accountId as string);
const showEditModal = ref(false);
const isLoading = ref(true);
const isLoadingTransactions = ref(false);
const transactions = ref<any[]>([]);
const transactionError = ref<string | null>(null);

// Account being displayed
const account = computed(() => {
	return accountStore.getAccountById(accountId.value);
});

onMounted(async () => {
	isLoading.value = true;
	try {
		// If accounts aren't loaded yet, load them
		if (!accountStore.accounts.length) {
			await accountStore.loadAccounts();
		}

		// If after loading, we still don't have the account, go back to accounts list
		if (!account.value) {
			router.push('/accounts');
		} else {
			// Load transactions
			await loadTransactions();
		}
	} catch (error) {
		console.error('Error loading account details:', error);
	} finally {
		isLoading.value = false;
	}
});

async function loadTransactions() {
	if (!account.value) return;

	isLoadingTransactions.value = true;
	transactionError.value = null;

	try {
		const response = await TransactionService.getAccountTransactions(accountId.value);
		transactions.value = instantiateDates(response.data) as Transaction[];

		// If no transactions found, set error message
		if (transactions.value.length === 0) {
			transactionError.value = 'No transactions found for this account.';
		}
	} catch (error) {
		console.error('Error loading transactions:', error);
		transactionError.value = 'Failed to load transactions. Please try again later.';
	} finally {
		isLoadingTransactions.value = false;
	}
}

// Format date helper
function formatDate(dateString) {
	return new Date(dateString).toLocaleDateString();
}

function openEditModal() {
	showEditModal.value = true;
}

function closeModal() {
	showEditModal.value = false;
}

function handleAccountSaved({ account, isNew }) {
	closeModal();

	// If the account was deleted, go back to accounts page
	if (!account) {
		router.push('/accounts');
	}
}

async function syncAccount() {
	if (!account.value) return;

	try {
		await accountStore.syncAccount(accountId.value);
		// Optionally, reload transactions after sync
		await loadTransactions();
	} catch (error) {
		console.error('Error syncing account:', error);
		alert('Failed to sync account. Please try again later.');
	}
}

const attributedEvents = computed(() => {
	return TransactionUtils.processAttributionEvents(transactions.value);
});


const transactionDetailsDrawer = ref<InstanceType<typeof TransactionDetailsDrawer> | null>(null);
function viewTransaction(transaction: Transaction) {
	console.log('Viewing transaction:', transaction);
	console.log('Drawer ref:', transactionDetailsDrawer.value);
	transactionDetailsDrawer.value?.open(transaction);
}

const lastSync = computed(() => {
	if (!account.value) return null;
	const lastSuccess = account.value.last_successful_sync ? new Date(account.value.last_successful_sync) : null;
	const lastFailed = account.value.last_failed_sync ? new Date(account.value.last_failed_sync) : null;

	if (lastFailed && (!lastSuccess || lastFailed > lastSuccess)) {
		return {
			date: lastFailed,
			success: false,
			error: account.value.sync_error || 'Unknown error',
		};
	}

	if (lastSuccess) {
		return {
			date: lastSuccess,
			success: true,
		};
	}
});

</script>

<template>
	<div class="account-details-view">
		<div v-if="isLoading" class="loading">
			<div class="loading-spinner"></div>
			<p>Loading account information...</p>
		</div>

		<div v-else-if="!account" class="not-found">
			<p>Account not found. You will be redirected to the accounts page.</p>
		</div>

		<div v-else class="account-container">
			<!-- Header with back button -->
			<div class="header">
				<router-link to="/accounts" class="back-link">
					&larr; Back to Accounts
				</router-link>
				<button @click="syncAccount" class="btn">Sync</button>
				<button @click="openEditModal" class="btn primary">Edit Account</button>
			</div>

			<!-- Account summary card -->
			<div class="account-card">
				<div class="account-header flex gap-5">
					<div v-if="account.Institution.logo">
						<img
							:src="account.Institution.logo"
							alt="Institution Logo"
							class="institution-logo"
							width="70"
						/>
					</div>
					<div>
						<h1>{{ account.display_name || account.external_name }}</h1>
						<div class="account-type">
							{{ account.type }}
							{{ account.subtype ? `(${account.subtype})` : '' }}
						</div>
					</div>
				</div>

				<div class="account-balance">
					<div class="balance-label">Current Balance</div>
					<div class="balance-amount">
						<Currency
							:amount="account.current_balance"
							:currency="account.iso_currency_code"
							:mode="'balance'"
						/>
					</div>
				</div>

				<div class="account-details">
					<div class="detail-row" v-if="account.mask">
						<div class="detail-label">Account Number</div>
						<div class="detail-value">•••• {{ account.mask }}</div>
					</div>

					<div class="detail-row" v-if="account.external_name">
						<div class="detail-label">Bank Name</div>
						<div class="detail-value">{{ account.external_name }}</div>
					</div>

					<div class="detail-row" v-if="account.iso_currency_code">
						<div class="detail-label">Currency</div>
						<div class="detail-value">{{ account.iso_currency_code }}</div>
					</div>

					<div class="detail-row">
						<div class="detail-label">Status</div>
						<div class="detail-value">
							<div v-if="lastSync?.success">
								<i class="pi pi-check-circle" style="color: green;"></i>
								Synced successfully on {{ lastSync.date.toLocaleString() }}
							</div>
							<div v-else-if="lastSync?.error">
								<i class="pi pi-times-circle" style="color: red;"></i>
								Sync failed on {{ lastSync.date.toLocaleString() }}: {{ lastSync.error }}
							</div>
							<div v-else>No sync attempts yet</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Account partitions section (if any) -->
			<div
				v-if="account.partitions && account.partitions.length > 0"
				class="partitions-section"
			>
				<h2>Account Partitions</h2>
				<div class="partition-cards">
					<div
						v-for="partition in account.partitions"
						:key="partition.account_partition_id"
						class="partition-card"
					>
						<div class="partition-name">{{ partition.name }}</div>
						<div class="partition-balance">
							<Currency
								:amount="partition.current_balance"
								:currency="account.iso_currency_code"
							/>
						</div>
						<div v-if="partition.savings_goal" class="partition-goal">
							<div class="goal-label">Savings Goal</div>
							<div class="goal-amount">
								Target:
								<Currency
									:amount="partition.savings_goal.target_balance"
									:currency="account.iso_currency_code"
								/>
							</div>
							<div v-if="partition.savings_goal.target_date" class="goal-date">
								By:
								{{
									new Date(
										partition.savings_goal.target_date
									).toLocaleDateString()
								}}
							</div>

							<!-- Progress bar -->
							<div class="goal-progress-container">
								<div
									class="goal-progress-bar"
									:style="{
										width: `${Math.min(
											100,
											(partition.current_balance /
												partition.savings_goal.target_balance) *
												100
										)}%`,
									}"
								></div>
								<div class="goal-progress-text">
									{{
										Math.round(
											(partition.current_balance /
												partition.savings_goal.target_balance) *
												100
										)
									}}%
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Transaction history section -->
			<div class="transactions-section">
				<h2>Transaction History</h2>

				<div v-if="isLoadingTransactions" class="transactions-loading">
					<div class="loading-spinner"></div>
					<p>Loading transactions...</p>
				</div>

				<div v-else-if="transactionError" class="transactions-error">
					<p>{{ transactionError }}</p>
					<button @click="loadTransactions" class="btn secondary">Retry</button>
				</div>

				<div v-else-if="transactions.length === 0" class="no-transactions">
					<p>No transactions found for this account.</p>
				</div>

				<div v-else class="transactions-list">
					<!-- <table>
						<thead>
							<tr>
								<th></th>
								<th>Date</th>
								<th>Description</th>
								<th>Category</th>
								<th class="amount-column">Amount</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(event, index) in attributedEvents" :key="index">
								<td>
									<AttributionAvatar :event="event" class="transaction-avatar" />
								</td>
								<td>{{ formatDate(event.date) }}</td>
								<td>
									{{ event.displayName }}
								</td>
								<td>
									{{
										event.Category?.name || 'Uncategorized'
									}}
								</td>
								<td class="amount-column">
									<Currency
										:amount="event.amount"
										:currency="account.iso_currency_code"
										:mode="'transaction'"
									/>
								</td>
							</tr>
						</tbody>
					</table> -->
					<CommonEventRow v-for="event in attributedEvents" :event="event" showTransferCopy :size="2.3" hideAccount @click="() => viewTransaction(event.attributionDetails.sourceTransaction)" />
				</div>
			</div>
		</div>

		<!-- Edit account modal -->
		<dialog v-if="account && showEditModal" open class="account-modal">
			<UpsertAccountForm
				:account="account"
				:close="closeModal"
				:onSave="handleAccountSaved"
			/>
		</dialog>

		<TransactionDetailsDrawer ref="transactionDetailsDrawer" />
	</div>
</template>

<style scoped>
.loading,
.not-found {
	text-align: center;
	margin: 40px 0;
}

.loading-spinner {
	display: inline-block;
	width: 40px;
	height: 40px;
	border: 3px solid rgba(0, 0, 0, 0.1);
	border-radius: 50%;
	border-top-color: #4caf50;
	animation: spin 1s ease-in-out infinite;
	margin-bottom: 10px;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.back-link {
	text-decoration: none;
	color: #2c6ecb;
	font-weight: 500;
}

.account-card {
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	padding: 24px;
	margin-bottom: 30px;
}

.account-header {
	margin-bottom: 16px;
	border-bottom: 1px solid #eaeaea;
	padding-bottom: 16px;
}

.account-header h1 {
	margin: 0 0 4px 0;
	font-size: 1.5rem;
}

.account-type {
	color: #666;
	font-size: 0.9rem;
}

.account-balance {
	background-color: #f5f9ff;
	border-radius: 6px;
	padding: 16px;
	margin-bottom: 20px;
}

.balance-label {
	font-size: 0.9rem;
	color: #666;
	margin-bottom: 4px;
}

.balance-amount {
	font-size: 1.8rem;
	font-weight: 600;
	color: #2c6ecb;
}

.account-details {
	margin-top: 20px;
}

.detail-row {
	display: flex;
	margin-bottom: 12px;
	padding-bottom: 12px;
	border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
	border-bottom: none;
}

.detail-label {
	flex: 1;
	color: #666;
}

.detail-value {
	flex: 2;
	font-weight: 500;
}

.partitions-section,
.transactions-section {
	background-color: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	padding: 24px;
	margin-bottom: 30px;
}

.partitions-section h2,
.transactions-section h2 {
	margin-top: 0;
	margin-bottom: 16px;
	font-size: 1.2rem;
}

.partition-cards {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 16px;
}

.partition-card {
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 16px;
	background-color: #fafafa;
}

.partition-name {
	font-weight: 600;
	margin-bottom: 8px;
}

.partition-balance {
	font-size: 1.2rem;
	color: #2c6ecb;
	margin-bottom: 16px;
}

.partition-goal {
	border-top: 1px solid #e0e0e0;
	padding-top: 12px;
}

.goal-label {
	font-size: 0.9rem;
	text-transform: uppercase;
	color: #666;
	margin-bottom: 4px;
}

.goal-amount {
	font-weight: 500;
}

.goal-date {
	font-size: 0.9rem;
	color: #666;
	margin-top: 4px;
}

.transactions-loading,
.transactions-error,
.no-transactions {
	text-align: center;
	padding: 30px 0;
	color: #888;
}

.transactions-error {
	color: #d32f2f;
}

.transactions-list {
	width: 100%;
}

table {
	width: 100%;
	border-collapse: collapse;
}

th,
td {
	text-align: left;
	padding: 8px;
	border-bottom: 1px solid #eaeaea;
}

th {
	font-weight: 500;
	color: #666;
	background-color: #f5f5f5;
}

tr:hover {
	background-color: #f9f9f9;
}

.amount-column {
	text-align: right;
}

.btn {
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-weight: 500;
}

.btn.primary {
	background-color: #4caf50;
	color: white;
}

.btn.secondary {
	background-color: #f1f1f1;
	color: #333;
	border: 1px solid #ddd;
}

.account-modal {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	background-color: white;
	border: none;
	min-width: 350px;
}

.transaction-avatar {
    width: 2.5rem;
	font-size: 1.2rem;
}
</style>
