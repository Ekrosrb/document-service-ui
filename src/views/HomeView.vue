<script setup>
import { ref, shallowRef } from 'vue'
import { Moon, Sun } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DocumentTab from '@/components/document/DocumentTab.vue'
import ProjectsTab from '@/components/projects/ProjectsTab.vue'
import SearchTab from '@/components/search/SearchTab.vue'

const { dark, toggle } = useTheme()

const tab = ref('projects')
const openedDocument = shallowRef(null)

/** Shows the document in the Document tab and switches to it. */
function openDocumentView(document) {
  openedDocument.value = document
  tab.value = 'document'
}
</script>

<template>
  <Tabs v-model="tab" :unmount-on-hide="false" class="flex min-h-screen flex-col gap-0 bg-background">
    <header class="sticky top-0 z-10 border-b border-border/70 bg-background/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
        <h1 class="text-lg font-semibold">Document Service UI</h1>
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger v-if="openedDocument" value="document">Document</TabsTrigger>
        </TabsList>
        <Button
          variant="ghost"
          size="icon"
          class="ml-auto"
          :aria-label="dark ? 'Switch to light mode' : 'Switch to dark mode'"
          :aria-pressed="dark"
          @click="toggle"
        >
          <Sun v-if="dark" />
          <Moon v-else />
        </Button>
      </div>
    </header>
    <main class="mx-auto w-full max-w-7xl flex-1 p-6">
      <TabsContent value="projects">
        <ProjectsTab />
      </TabsContent>
      <TabsContent value="search">
        <SearchTab @open-view="openDocumentView" />
      </TabsContent>
      <TabsContent value="document">
        <DocumentTab :document="openedDocument" />
      </TabsContent>
    </main>
  </Tabs>
</template>
