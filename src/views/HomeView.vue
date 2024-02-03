<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref } from 'vue';
import { useTransactionScheduleStore } from '@/stores/transactionSchedule.store';
import dayjs, { Dayjs } from 'dayjs';
import VueApexCharts from "vue3-apexcharts";
import Forecast from '../../delfi-core/models/Forecast';
import Accumulator from '../../delfi-core/models/Accumulator';
import { date } from '../../delfi-core/utils/dateUtils';
import type { TransactionTrigger } from 'delfi-core/services/transactionService';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionScheduleStore();

</script>

<template>
	<router-view></router-view>
</template>
