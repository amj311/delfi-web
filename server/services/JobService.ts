import type { Dayjs } from "dayjs";
import { ScheduleService, type Schedule } from "delfi-core/models/schedules/Schedule";

type JobType = string;

type JobInterface = {
	log: (...messages: Array<string>) => void;
	progress: (percentage: number, data: any) => void;
}
type JobResolution = {
	error: any;
	data: any;
}

type JobDefinition = {
	type: JobType;
	data?: any;
	priority?: boolean;
	delayUntil?: Dayjs;
	schedule?: Schedule;
	handler: (jobInterFace: JobInterface) => Promise<JobResolution | void>;
}

enum JobStatus { 'scheduled', 'queued', 'running', 'completed', 'failed' };
type JobId = string;
type Job = {
	id: JobId;
	type: JobType;
	definition: JobDefinition;
	status: JobStatus;
	error?: any;
	timeout?: NodeJS.Timeout;
	createdAt: Date;
	startedAt?: Date;
	endedAt?: Date;
	progressedAt?: Date;
	progress?: {
		percentage: number;
		data: any;
	},
	logs: Array<Array<string>>;
	result?: JobResolution;
}

const Jobs = new Map<JobId, Job>();

const PriorityQueue: Set<JobId> = new Set();
const MainQueue: Set<JobId> = new Set();

const MAX_ACTIVE_JOBS = 1;
const MAX_DONE_JOBS = 5; // Don't keep too many done jobs in memory
const JOB_INTERVAL = 1000;

export class JobService {
	public static addJob(job: JobDefinition): Job | undefined {
		let delayUntil = job.delayUntil;
		if (job.schedule) {
			const nextOccurrence = ScheduleService.getNextOccurrence(job.schedule);
			if (nextOccurrence) {
				delayUntil = nextOccurrence;
			}
			else {
				return;
			}
		}

		console.log(`Adding job: ${job.type} with delay until: ${delayUntil?.toISOString() || 'none'}`);

		const newJob: Job = {
			id: Math.random().toString(36).substring(2, 15),
			type: job.type,
			status: JobStatus.scheduled,
			definition: job,
			createdAt: new Date(),
			logs: [],
		};
		Jobs.set(newJob.id, newJob);


		if (delayUntil) {
			const delay = Math.max(0, delayUntil.diff(new Date(), 'milliseconds'));
			newJob.timeout = setTimeout(() => {
				this.enqueueJob(newJob);
			}, delay);
		}
		else {
			this.enqueueJob(newJob);
		}

		return newJob;
	}


	private static enqueueJob(job: Job)  {
		if (job.definition.priority) {
			PriorityQueue.add(job.id);
		}
		else {
			MainQueue.add(job.id);
		}

		job.status = JobStatus.queued;

		this.startNextJobs().catch((err) => {
			console.error("Error while starting next jobs:", err);
		});

	}

	public static getJob(jobId: JobId): Job | undefined {
		return Jobs.get(jobId);
	}

	public static getJobs(): Job[] {
		return Array.from(Jobs.values());
	}

	public static get futureJobs(): Job[] {
		return Array.from(Jobs.values()).filter(job => job.status === JobStatus.scheduled);
	}
	public static get activeJobs(): Job[] {
		return Array.from(Jobs.values()).filter(job => job.status === JobStatus.running);
	}
	public static get endedJobs(): Job[] {
		return Array.from(Jobs.values()).filter(job => job.status === JobStatus.completed || job.status === JobStatus.failed);
	}


	private static async startNextJobs() {
		if (this.activeJobs.length >= MAX_ACTIVE_JOBS) {
			return;
		}

		while (this.activeJobs.length < MAX_ACTIVE_JOBS && (PriorityQueue.size > 0 || MainQueue.size > 0)) {
			const queue = PriorityQueue.size > 0 ? PriorityQueue : MainQueue;
			const jobId = queue.values().next().value!;
			if (queue === MainQueue) {
				await new Promise((resolve) => setTimeout(resolve, JOB_INTERVAL));
			}
			queue.delete(jobId);
			this.doJob(Jobs.get(jobId)!).catch((err) => {
				console.error("Error while doing job:", err);
			});
		}
	}

	private static async doJob(job: Job) {
		job.status = JobStatus.running;
		job.startedAt = new Date();

		try {
			job.result = await job.definition.handler({
				log: (message) => {
					job.progressedAt = new Date();
					job.progress = {
						percentage: 0,
						data: message,
					};
				},
				progress: (percentage, data) => {
					job.progressedAt = new Date();
					job.progress = {
						percentage,
						data,
					};
				}
			}) || { error: undefined, data: undefined };

			if (job.result.error) {
				throw job.result.error;
			}
			job.status = JobStatus.completed;

			if (job.definition.schedule) {
				this.addJob(job.definition);
			}
		}
		catch (err) {
			console.error(`Job ${job.id} failed:`, err);
			job.status = JobStatus.failed;
			job.error = err;
		}
		finally {
			job.endedAt = new Date();
			if (this.endedJobs.length > MAX_DONE_JOBS) {
				Jobs.delete(job.id);
			}
			if (job.timeout) {
				clearTimeout(job.timeout);
				job.timeout = undefined;
			}
			this.startNextJobs();
		}
	}

	// TODO cancel jobs
}
