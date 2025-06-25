<script setup lang="ts">
import { useCategoryStore } from "@/stores/category.store";
import { ref, onMounted } from "vue";
import type { Category } from "delfi-core/models/Category";
import CategoryAvatar from "@/components/CategoryAvatar.vue";

const categoryStore = useCategoryStore();

onMounted(() => {
  // Ensure categories are loaded
  if (!categoryStore.workspaceCategories.length) {
    categoryStore.loadCategories();
  }
});
</script>

<template>
  <div class="categories-view">
    <h1>Categories</h1>

    <div v-if="categoryStore.isLoadingCategories" class="loading">
      Loading categories...
    </div>

    <div v-else class="categories-container">
      <div class="header-actions">
        <h2>Category List</h2>
        <div class="actions">
          <button class="btn primary">Add Category</button>
        </div>
      </div>

      <table class="categories-table" v-if="categoryStore.workspaceCategories.length > 0">
        <thead>
          <tr>
			<th></th>
            <th>Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categoryStore.workspaceCategories" :key="category.category_id">
            <td><CategoryAvatar :category="category" /></td>
            <td>{{ category.name }}</td>
            <td>{{ category.type }}</td>
            <td>
              <button class="btn icon">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="btn icon danger">
                <i class="pi pi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="no-categories">
        <p>No categories found. Add your first category to get started.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.categories-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.categories-table th,
.categories-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.categories-table th {
  background-color: #f8f8f8;
  font-weight: 500;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.btn.primary {
  background-color: #4CAF50;
  color: white;
}

.btn.icon {
  padding: 0.5rem;
  margin: 0 0.25rem;
  background-color: transparent;
  color: #666;
}

.btn.danger {
  color: #f44336;
}

.no-categories {
  text-align: center;
  padding: 2rem;
  background-color: #f8f8f8;
  border-radius: 4px;
}
</style>
