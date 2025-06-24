import { prisma } from "../../prisma/client";
import { TestDataService } from "./TestDataService";

export type User = {
	auth_id: string;
	user_id: string;
	given_name: string;
	family_name: string;
	email: string;
}

export const UserService = {
	async setupTestData() {
		for (const user of TestDataService.users) {
			const existingUser = await prisma.user.findFirst({
				where: { auth_id: user.auth_id },
			});
			if (!existingUser) {
				await prisma.user.create({
					data: {
						auth_id: user.auth_id,
						user_id: user.user_id,
						given_name: user.given_name,
						family_name: user.family_name,
						email: user.email,
					},
				});
			}
		}
	},

	async getUserByAuthId(authId: string) {
		await this.setupTestData();
		return await prisma.user.findFirst({ where: { auth_id: authId } });
	},

	async createUser(userData: Omit<User, 'user_id'>) {
        return await prisma.user.create({
            data: userData,
        })
    },

    async getAllUsers() {
		await this.setupTestData();
        return await prisma.user.findMany();
    },

    async getUserById(userId: string) {
		await this.setupTestData();
        return await prisma.user.findUnique({
            where: {
                user_id: userId,
            },
        });
    },

    async updateUser(userId: string, userData: Partial<User>) {
        return await prisma.user.update({
            where: {
                user_id: userId,
            },
            data: userData,
        });
    },

    async deleteUser(userId: string) {
        await prisma.user.delete({
            where: {
                user_id: userId,
            },
        });
    },
};
