<script setup lang="ts">
import { useAccountStore } from "@/stores/account.store";
import { ref, onMounted } from "vue";
import PlaidLink from "@/components/plaid/PlaidLink.vue";
import UpsertAccountForm from "@/components/UpsertAccountForm.vue";
import type { Account } from "delfi-core/models/Account";
import Currency from "@/components/Currency.vue";
import Button from "primevue/button";
import DropdownMenu from "@/components/utils/DropdownMenu.vue";

const accountStore = useAccountStore();
const showAddAccountModal = ref(false);
const selectedAccount = ref<Partial<Account> | null>(null);

const plaidLinkRef = ref<any>(null);

onMounted(() => {
  // Ensure accounts are loaded
  if (!accountStore.accounts.length) {
    accountStore.loadAccounts();
  }
});

function openAddAccountModal() {
  selectedAccount.value = {};
  showAddAccountModal.value = true;
}

function closeModal() {
  showAddAccountModal.value = false;
  selectedAccount.value = null;
}

function editAccount(account) {
  selectedAccount.value = account;
  showAddAccountModal.value = true;
}

function handleAccountSaved({ account, isNew }) {
  // You could add any additional handling here
  showAddAccountModal.value = false;
  selectedAccount.value = null;
}

const syncing = ref(false);

async function syncAccounts() {
  try {
    syncing.value = true;
    await accountStore.syncAccounts();
    // Optionally show a success message or handle post-sync logic
  } catch (error) {
    console.error("Error syncing accounts:", error);
    // Optionally show an error message
  } finally {
    syncing.value = false;
  }
}

const connectAccountsMenu = [
	{
		label: 'Connect with Plaid',
		icon: 'pi pi-link',
		command: () => {
			plaidLinkRef.value?.beginLink();
		}
	}
]

</script>

<template>
  <div class="accounts-view">
    <h1>Your Accounts</h1>

    <div v-if="accountStore.isLoadingAccounts" class="loading">
      Loading accounts...
    </div>

    <div v-else class="accounts-container">
      <div class="header-actions">
        <h2>Account List</h2>
        <div class="actions">
           <button v-if="!syncing" @click="syncAccounts" class="btn primary">Sync Accounts</button>
			<div v-else>Syncing accounts...</div>
			<DropdownMenu
				:model="connectAccountsMenu"
			>
				<Button label="Add Account" icon="pi pi-plus" />
			</DropdownMenu>
        </div>
      </div>

      <table class="accounts-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Balance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="account in accountStore.accounts"
            :key="account.account_id"
            @click="$router.push(`/accounts/${account.account_id}`)"
            class="account-row"
          >
            <td>{{ account.display_name || account.external_name }}</td>
            <td>
              {{ account.type }}
              {{ account.subtype ? `(${account.subtype})` : "" }}
            </td>
            <td>
              <Currency
                :amount="account.current_balance"
                :currency="account.iso_currency_code"
                :mode="'balance'"
              />
            </td>
            <td>
              <router-link
                :to="`/accounts/${account.account_id}`"
                class="btn small"
                >View</router-link
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal for adding/editing accounts -->
    <dialog
      v-if="showAddAccountModal && selectedAccount"
      open
      class="account-modal"
    >
      <UpsertAccountForm
        :account="selectedAccount"
        :close="closeModal"
        :onSave="handleAccountSaved"
      />
    </dialog>
  </div>

  <PlaidLink ref="plaidLinkRef" />

</template>

<style scoped>
.loading,
.no-accounts {
  text-align: center;
  margin: 40px 0;
}

.accounts-container {
  margin-top: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.accounts-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.accounts-table th,
.accounts-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.accounts-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.account-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.account-row:hover {
  background-color: #f9f9f9;
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

.btn.small {
  padding: 4px 8px;
  font-size: 0.9em;
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
</style>
