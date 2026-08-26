import { prisma } from "../../prisma/client";

export type User = {
	auth_id: string;
	user_id: string;
	given_name: string;
	family_name: string;
	email: string;
}

export const UserService = {
	async getUserByAuthId(authId: string) {
		return await prisma.user.findFirst({ where: { auth_id: authId } });
	},

	async createUser(userData: Omit<User, 'user_id'>) {
        return await prisma.user.create({
            data: userData,
        })
    },

    async getAllUsers() {
        return await prisma.user.findMany();
    },

    async getUserById(userId: string) {
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
