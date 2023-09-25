import { Category } from "@prisma/client";
import { prisma } from "../../prisma/client";

export const CategoryService = {
    async createCategory(categoryData: Omit<Category, 'category_id'>) {
        return await prisma.category.create({
            data: categoryData,
        });
    },

    async getAllCategories() {
        return await prisma.category.findMany();
    },

    async getCategoryById(category_id: string) {
        return await prisma.category.findUnique({
            where: {
                category_id,
            },
        });
    },

    async updateCategory(category_id: string, categoryData: Partial<Category>) {
        return await prisma.category.update({
            where: {
                category_id,
            },
            data: categoryData,
        });
    },

    async deleteCategory(category_id: string) {
        await prisma.category.delete({
            where: {
                category_id,
            },
        });
    },
};