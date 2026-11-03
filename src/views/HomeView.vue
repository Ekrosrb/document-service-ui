<script setup>
import { ref, shallowRef, useTemplateRef } from 'vue'
import { FilePlus2, Moon, Sun } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DocumentTab from '@/components/document/DocumentTab.vue'
import ProjectsTab from '@/components/projects/ProjectsTab.vue'
import SearchTab from '@/components/search/SearchTab.vue'

const { dark, toggle } = useTheme()

const searchTab = useTemplateRef('searchTab')
const tab = ref('projects')
const openedDocument = shallowRef(null)
const creating = ref(false)

/** Shows the document in the Document tab and switches to it. */
function openDocumentView(document) {
  creating.value = false
  openedDocument.value = document
  tab.value = 'document'
}

/** Opens the Document tab as an empty draft of a new document. */
function createDocumentView() {
  openedDocument.value = null
  creating.value = true
  tab.value = 'document'
}

/** Shows the document the draft was saved as, so later saves update it. */
function showCreatedDocument(document) {
  creating.value = false
  openedDocument.value = document
}

/** Leaves the Document tab once the last open document is gone. */
function closeDocumentView() {
  creating.value = false
  openedDocument.value = null
  tab.value = 'search'
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
          <TabsTrigger v-if="openedDocument || creating" value="document">Document</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" @click="createDocumentView">
          <FilePlus2 />
          New document
        </Button>
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
        <SearchTab ref="searchTab" @open-view="openDocumentView" />
      </TabsContent>
      <TabsContent value="document">
        <DocumentTab
          :document="openedDocument"
          :creating="creating"
          @created="showCreatedDocument"
          @deleted="searchTab?.dropDocument($event)"
          @updated="searchTab?.applyUpdate($event)"
          @exit="closeDocumentView"
        />
      </TabsContent>
    </main>
  </Tabs>
</template>
