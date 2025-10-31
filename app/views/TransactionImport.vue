<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import Currency from '@/components/Currency.vue';
import { ddate } from 'delfi-core/utils/dateUtils';
import FileUpload from 'primevue/fileupload';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { FilterMatchMode } from '@primevue/core/api';
import Select from 'primevue/select';
import Button from 'primevue/button';
import DrawerModal from '@/components/utils/DrawerModal.vue';
import CategoryButton from '@/components/CategoryButton.vue';
import { useCategoryStore } from '@/stores/category.store';
import { norm, similarityScore } from 'delfi-core/utils/textSimilarity';
import AttributionAvatar from '@/components/AttributionAvatar.vue';
import type { SyncedTransactionDetails } from 'server/services/SyncService';
import request from '@/services/request';
import type { Account } from 'delfi-core/models/Account';
import type { Transaction } from 'delfi-core/models/Transaction';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import { parseNumber } from 'delfi-core/utils/miscUtils';


const { account } = defineProps<{
	account: Account,
}>();

const view = ref<'file' | 'map' | 'import'>('file');

declare var Papa; // included in html
let csvFile: File | null = null;
const readingFile = ref(false);

type TargetField = {
	field: string,
	label?: string,
	entity: 'transaction' | 'attribution',
	type: 'date' | 'string' | 'number' | 'boolean',
	required?: boolean,
	hasConfig?: boolean,
}

const TargetFields: Array<TargetField> = [
	{ field: 'date', entity: 'transaction', type: 'date', required: true },
	{ field: 'date_order', entity: 'transaction', type: 'number', required: true },
	{ field: 'original_description', label: 'Description', entity: 'transaction', type: 'string', required: true },
	{ field: 'amount', entity: 'transaction', type: 'number', required: true },
	{ field: 'category_id', label: 'Category', entity: 'attribution', type: 'string', hasConfig: true },
	{ field: 'memo', entity: 'attribution', type: 'string' },
	{ field: 'notes', entity: 'attribution', type: 'string' },
];

type ColConfig = {
	index: number,
	header?: string,
	targetField?: TargetField,
	categoryMapping?: Record<string, string>,
	dateFormat?: string,
}

const columns = ref<Array<ColConfig>>([]);
const rows = ref<Array<Array<any>>>([]);

const missingRequiredFields = computed(() => {
	return TargetFields.filter(f => f.required && !columns.value.some(c => c.targetField?.field === f.field));
})

async function parseFile(file: File, config: any = {}) {
	return new Promise<Array<Array<any>>>((res, rej) => {
		Papa.parse(file, {
			dynamicTyping: true,
			...config,
			error(e) {
				console.error(e);
				rej(e)
			},
			complete(e) {
				res(e.data as Array<Array<any>>);
			}
		});
	})
}

async function beginWithFile(file: File) {
	csvFile = file;
	readingFile.value = true;
	const parsed = await parseFile(csvFile);
	readingFile.value = false;

	if (!Array.isArray(parsed) || !parsed.length || !parsed[0].length) {
		throw new Error("Got no data from file");
	}

	const headers = detectHeaders(parsed);
	columns.value = headers?.map((header, index) => ({
		index,
		header,
		targetField: TargetFields.find(t => [norm(t.field), norm(t.label || '')].includes(norm(header))),
	})) || Array(parsed[0].length).fill({});
	if (headers) {
		parsed.shift();
	}
	rows.value = parsed;
	view.value = 'map';
}

function detectHeaders(rows: Array<Array<any>>): Array<string> | null {
	const first = rows[0];
	const second = rows[1];
	if (!Array.isArray(first) || !Array.isArray(second) || first.length !== second.length) {
		return null;
	}
	// all headers must be strings
	if (first.some(i => (typeof i) !== 'string')) {
		return null;
	}
	// look for any on second which is not a string
	return second.some(i => (typeof i) !== 'string') ? [...first] : null;
}

const editingCol = ref<ColConfig>();
const configDrawerModal = ref<InstanceType<typeof DrawerModal>>();
function doColConfig(col: ColConfig) {
	editingCol.value = col;
	configDrawerModal.value?.open();
}

function getValueSet(index: number) {
	return new Set(rows.value.map(r => r[index]));
}

function setDefaultCategories(col: ColConfig) {
	if (col.categoryMapping) {
		return;
	}
	col.categoryMapping = {};
	const rowVals = getValueSet(col.index);
	const categories = useCategoryStore().allCategories;
	rowVals.forEach(rowVal => {
		if (!rowVal || (typeof rowVal) !== 'string') return;
		const categoryMatch = categories.map(c => ({ id: c.category_id, score: similarityScore(rowVal, c.name)})).filter(c => c.score > 70).sort((a, b) => a.score - b.score).pop();
		if (categoryMatch) {
			col.categoryMapping![rowVal] = categoryMatch.id;
		}
	})
}

type ImportRow = {
	row: any,
	transaction?: SyncedTransactionDetails,
	success?: boolean,
	error?: string,
}

const importProgress = reactive({
	attemptedRows: [] as Array<ImportRow>,
	error: '',
	done: false as boolean,
})

const importPercent = computed(() => Math.floor((importProgress.attemptedRows.filter(r => r.success).length / rows.value.length) * 100));

async function startImport() {
	console.groupCollapsed('Import')
	const batchSize = 100;
	importProgress.attemptedRows = [];
	importProgress.error = '';
	importProgress.done = false;
	view.value = 'import';

	// Try for overall loop
	try {
		if (missingRequiredFields.value.length) {
			throw new Error("Missing required fields");
		}

		while (importProgress.attemptedRows.length < rows.value.length) {
			const batch = rows.value.slice(importProgress.attemptedRows.length, importProgress.attemptedRows.length + batchSize);
			const toUpload: Array<ImportRow> = [];

			// Translate rows
			for (const row of batch) {
				const importRow: ImportRow = { row };
				try {
					importRow.transaction = rowToTransaction(row);
					toUpload.push(importRow);
				}
				catch (e: any) {
					console.error("Error importing row.", e)
					importRow.error = e.message;
				}
				finally {
					importProgress.attemptedRows.push(importRow);
				}
			}

			// Push to server
			try {
				const { data } = await request.post('/transactions/import/csv', {
					transactions: toUpload.map(t => t.transaction),
					account_id: account.account_id,
				})

				if (data?.data?.upsertSuccess) {
					toUpload.forEach(r => r.success = true);
				}
				else {
					toUpload.forEach(r => r.error = 'Failed pushing to server');
					console.error("Errors while upserting", data?.data?.errors);
				}
			}
			catch (e: any) {
				console.error("Error while pushing transactions");
				console.log(e);
				toUpload.forEach(t => t.error = e.message)
			}
		}
		console.log("Import finished!", importProgress)
	}
	catch (e: any) {
		console.error("Error during import")
		console.error(e);
		importProgress.error = e.message;
	}
	finally {
		console.groupEnd();
		importProgress.done = true;
	}
}

function rowToTransaction(row: Array<any>): SyncedTransactionDetails {
	const transaction: Partial<SyncedTransactionDetails> = {
		account_id: account.account_id,
		source: 'csv',
		source_data: {
			row,
			column_config: columns.value,
			filename: csvFile?.name,
		}
	};
	const attribution: Partial<NonNullable<SyncedTransactionDetails['Attributions']>[number]> = {};

	for (const col of columns.value) {
		if (col.targetField) {
			let rowVal = row[col.index];
			const entity = col.targetField.entity === 'transaction' ? transaction : attribution;
			if (col.targetField.type === 'number') {
				const newVal = parseNumber(rowVal);
				if (isNaN(newVal)) {
					throw Error("Could not parse number: " + rowVal)
				}
				rowVal = newVal;
			} 
			if (col.targetField.field === 'category_id') {
				entity.category_id = col.categoryMapping?.[rowVal];
			}
			else if (col.targetField.field === 'date') {
				const date = ddate(rowVal);
				if (date.toString() === 'Invalid Date') {
					throw new Error('Invalid date: ' + rowVal);
				}
				(entity as Transaction).date = date;
			}
			else {
				entity[col.targetField.field] = rowVal;
			}
		}
	}

	attribution.amount = transaction.amount;
	transaction.Attributions = [attribution as NonNullable<SyncedTransactionDetails['Attributions']>[number]];
	return transaction as SyncedTransactionDetails;
}

</script>

<template>
	<div class="transaction-import-view">
		<template v-if="view === 'file'">
			<h3>Select a CSV file</h3>
			<FileUpload class="my-3" mode="basic" accept="text/csv" :multiple="false" @select="(e) => beginWithFile(e.files[0])" :disabled="readingFile" />
		</template>

		<template v-if="view === 'map'">
			<h3>Configure columns</h3>
			<DataTable :value="rows" scrollable scrollHeight="70vh" :virtualScrollerOptions="{ itemSize: 44 }" :filters="{ global: { value: null, matchMode: FilterMatchMode.CONTAINS } }">
				<Column v-for="col, i of columns" :key="i" :field="String(i)">
					
					<template #header>
						<div :class="{ 'opacity-70': !col.targetField}">
							<h4 style="white-space: nowrap;" class="mb-2">{{ col.header }}</h4>
							<div class="flex align-items-center">
								<Select v-model="col.targetField" :options="[null, ...TargetFields.slice()]">
									<template #value="{ value }">
										{{ value?.label || value?.field || 'Skip' }}
									</template>
									<template #option="{ option }">
										{{ option?.label || option?.field || 'Skip' }}
									</template>
								</Select>
								<Button v-if="col.targetField?.hasConfig" text severity="secondary" icon="pi pi-cog" @click="doColConfig(col)" />
							</div>
						</div>
					</template>

					<template #body="{ data }">
						<div :class="{ 'opacity-70': !col.targetField}" class="text-ellipsis flex align-items-center gap-2">
							{{ data[i] }}
							<template v-if="col.targetField?.field === 'date'">
								<small><i class="pi pi-arrow-right" /></small>
								<div class="font-medium">{{ ddate(data[i]).format('full') }}</div>
							</template>
							<template v-if="col.targetField?.field === 'amount'">
								<small><i class="pi pi-arrow-right" /></small>
								<Currency :amount="data[i]" mode="transaction" class="font-medium" />
							</template>
							<template v-if="col.targetField?.field === 'category_id'">
								<div class="hidden">{{ setDefaultCategories(col) }}</div>
								<div v-if="!data[i]">&lt;empty&gt;</div>
								<small><i class="pi pi-arrow-right" /></small>
								<div class="flex align-items-center gap-1">
									<AttributionAvatar :categoryId="col.categoryMapping?.[data[i]]" :size="1.5" />
									{{ useCategoryStore().getCategoryById(col.categoryMapping?.[data[i]])?.name || 'none' }}
								</div>
							</template>
						</div>
					</template>
				</Column>
			</DataTable>
			<br />
			<Message v-if="missingRequiredFields.length" severity="error" class="my-3">
				Missing required fields: {{ missingRequiredFields.map(f => f.label || f.field) }}
			</Message>
			<div class="flex align-items-center">
				{{ rows.length.toLocaleString() }} records
				<div class="flex-grow-1"></div>
				<Button text severity="secondary" label="Cancel" @click="view = 'file'" />
				<Button label="Start Import" @click="startImport" :disabled="Boolean(missingRequiredFields.length)" />
			</div>
		</template>

		<template v-if="view === 'import'">
			<div>
				<div class="flex align-items-center gap-2" v-if="!importProgress.done">
					<i class="pi pi-spin pi-spinner" />
					Importing...
				</div>
				<h3 v-else-if="importProgress.attemptedRows.filter(r => r.error).length">Partial Fail</h3>
				<h3 v-else>Success!</h3>
				<ProgressBar :value="importPercent" v-if="!importProgress.done || importProgress.attemptedRows.filter(r => r.error).length" />
			</div>
			<br />
			<Message v-if="importProgress.error" severity="error" class="mb-3">
				<h5>Import Failed</h5>
				{{ importProgress.error }}
				<div @click="startImport()">Try Again</div>
			</Message>
			<div style="display: grid; grid-template-columns: 8rem 3rem;">
				<span>Records:</span><span class="text-right">{{ rows.length.toLocaleString() }}</span>
				<span>Successful:</span><span class="text-right">{{ importProgress.attemptedRows.filter(r => r.success).length.toLocaleString() }}</span>
				<span>Failed:</span><span class="text-right">{{ importProgress.attemptedRows.filter(r => r.error).length.toLocaleString() }}</span>
			</div>
		</template>
	</div>

	<DrawerModal ref="configDrawerModal" title="Configure Import Column">
		<template v-if="editingCol">
			<template v-if="editingCol.targetField?.field === 'category_id'">
				<div class="hidden">{{ setDefaultCategories(editingCol) }}</div>
				<h3>Map Categories</h3>
				<div style="display: grid; grid-template-columns: auto 2em minmax(3rem, 12rem); row-gap: 2px; align-items: center;">
					<template v-for="rowVal in getValueSet(editingCol.index)">
						<div class="text-ellipsis">{{ String(rowVal || '<empty>') }} </div>
						<small><i class="pi pi-arrow-right"></i></small>
						<CategoryButton v-model="editingCol.categoryMapping![rowVal]" />
					</template>
				</div>
			</template>
		</template>
	</DrawerModal>
</template>

<style scoped>

</style>
