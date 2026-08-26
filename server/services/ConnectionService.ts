import { prisma } from "../../prisma/client";
import type { ConnectionStatus as ConnectionStatusEnum } from "@prisma/client";

export type ConnectionPayload = {
	institution_id: string;
	status?: ConnectionStatusEnum;
	otp_waiting?: boolean;
	otp_expires_at?: Date | null;
};

export class ConnectionService {
	/**
	 * Get the connection status for an institution within a workspace.
	 */
	public static async getConnectionStatus(workspace_id: string, institution_id: string) {
		const connection = await prisma.connection.findFirst({
			where: {
				workspace_id,
				institution_id,
			},
			select: {
				status: true,
				otp_waiting: true,
				otp_expires_at: true,
				updated_at: true,
			},
		});

		if (!connection) {
			// No connection record exists — create one with DISCONNECTED status
			const created = await prisma.connection.create({
				data: {
					workspace_id,
					institution_id,
					status: 'DISCONNECTED',
				},
				select: {
					status: true,
					otp_waiting: true,
					otp_expires_at: true,
					updated_at: true,
				},
			});
			return created;
		}

		return connection;
	}

	/**
	 * Initialize OTP waiting state for a connection.
	 */
	public static async initOtpWaiting(
		workspace_id: string,
		institution_id: string,
		otpExpiresAt?: Date
	) {
		return await prisma.connection.updateMany({
			where: {
				workspace_id,
				institution_id,
			},
			data: {
				otp_waiting: true,
				otp_expires_at: otpExpiresAt || null,
			},
		});
	}

	/**
	 * Clear OTP waiting state.
	 */
	public static async clearOtpWaiting(
		workspace_id: string,
		institution_id: string
	) {
		return await prisma.connection.updateMany({
			where: {
				workspace_id,
				institution_id,
			},
			data: {
				otp_waiting: false,
				otp_expires_at: null,
			},
		});
	}

	/**
	 * Get all connections for a workspace.
	 */
	public static async getWorkspaceConnections(workspace_id: string) {
		return await prisma.connection.findMany({
			where: { workspace_id },
			include: {
				Institution: true,
			},
			orderBy: { Institution: { name: 'asc' } },
		});
	}

}
