<script setup>
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProjectsTab from '@/components/projects/ProjectsTab.vue'
</script>

<template>
  <Tabs default-value="projects" class="flex min-h-screen flex-col gap-0 bg-background">
    <header class="sticky top-0 z-10 border-b border-border bg-deep-navy">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
        <h1 class="text-lg font-semibold text-lavender-light">Document Service UI</h1>
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
      </div>
    </header>
    <main class="mx-auto w-full max-w-7xl flex-1 p-6">
      <TabsContent value="projects">
        <ProjectsTab />
      </TabsContent>
    </main>
  </Tabs>
</template>
