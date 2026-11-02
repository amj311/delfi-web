import type { Account } from "delfi-core/models/Account";
import webpush from 'web-push';
import { prisma } from "../../prisma/client";

export const NotificationService = {

	async registerPushSubscription(userId, subscription) {
		await prisma.user.update({
			where: { user_id: userId },
			data: {
				push_sub: subscription || null,
			}
		})
	},

	async pushToUser(userId: string, notification) {
		const user = await prisma.user.findFirst({
			where: {
				user_id: userId,
			}
		})
		if (!user?.push_sub) {
			return;
		}
		webpush.setVapidDetails(
			process.env.VAPID_SUBJECT!,
			process.env.VITE_VAPID_PUBLIC_KEY!,
			process.env.VAPID_PRIVATE_KEY!
		)
		const res = await webpush.sendNotification(user.push_sub, JSON.stringify({
			...notification
		}));
		console.log("PUSHED!!!!", res)
	},

	async pushToWorkspace(workspace_id: string, notification) {
		const users = await prisma.user.findMany({
			where: {
				Workspaces: {
					some: {
						workspace_id,
					}
				}
			}
		})

		await Promise.all(users.map(u => this.pushToUser(u.user_id, notification)));
	}
};
