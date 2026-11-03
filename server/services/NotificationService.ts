import type { Account } from "delfi-core/models/Account";
import webpush from 'web-push';
import { prisma } from "../../prisma/client";
import { EmailService } from "./EmailService";

export const NotificationService = {

	async registerPushSubscription(userId, subscription) {
		await prisma.user.update({
			where: { user_id: userId },
			data: {
				push_sub: subscription || null,
			}
		})
	},

	async notifyUser(userId: string, notification) {
		const user = await prisma.user.findFirst({
			where: {
				user_id: userId,
			}
		})
		if (user?.email_notifs) {
			await EmailService.sendEmail({
				to: [{
					name: user.given_name,
					email: user.email,
				}],
				subject: notification.title,
				text: notification.text || notification.title,
			})
		}
		if (user?.push_notifs && user?.push_sub) {
			await pushNotification(user?.push_sub, notification);
		}
	},

	async notifyWorkspace(workspace_id: string, notification) {
		const users = await prisma.user.findMany({
			where: {
				Workspaces: {
					some: {
						workspace_id,
					}
				}
			}
		})

		await Promise.all(users.map(u => this.notifyUser(u.user_id, notification)));
	}
};

async function pushNotification(subscription, notification) {
		webpush.setVapidDetails(
			process.env.VAPID_SUBJECT!,
			process.env.VITE_VAPID_PUBLIC_KEY!,
			process.env.VAPID_PRIVATE_KEY!
		)
		const res = await webpush.sendNotification(subscription, JSON.stringify({
			...notification
		}));
		console.log(res);
}