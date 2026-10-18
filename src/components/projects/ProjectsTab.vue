<script setup>
import { useTemplateRef } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { getProjectsInfo } from '@/api'
import { usePagedList } from '@/composables/usePagedList'
import { Button } from '@/components/ui/button'
import ProjectCard from './ProjectCard.vue'

const root = useTemplateRef('root')

const { items: projects, loading, error, hasMore, loadMore } = usePagedList(getProjectsInfo, {
  size: 50,
  sort: 'projectKey,asc',
})

useInfiniteScroll(window, loadMore, {
  distance: 200,
  canLoadMore: () => hasMore.value && !error.value && root.value?.offsetParent != null,
})
</script>

<template>
  <div ref="root" class="flex flex-col gap-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ProjectCard v-for="project in projects" :key="project.projectKey" :project="project" />
    </div>

    <p v-if="loading" class="text-center text-sm text-steel-gray">Loading projects…</p>
    <div v-else-if="error" class="flex items-center justify-center gap-3 text-sm">
      <span class="text-destructive">{{ error.message }}</span>
      <Button variant="outline" size="sm" @click="loadMore">Retry</Button>
    </div>
    <p v-else-if="!projects.length && !hasMore" class="text-center text-sm text-steel-gray">No projects yet.</p>
  </div>
</template>
