<script setup>
import { ref, onMounted } from 'vue'
import { FileText, Moon, Sun } from '@lucide/vue'
import { getDocument } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const document = ref({})
const loading = ref(false)
const error = ref(null)
const documentId = ref('105')
const dark = ref(false)

async function loadDocument() {
  loading.value = true
  error.value = null

  try {
    document.value = await getDocument(documentId.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function toggleTheme() {
  dark.value = !dark.value
  window.document.documentElement.classList.toggle('dark', dark.value)
}

onMounted(loadDocument)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen p-6">
    <div class="mx-auto flex max-w-3xl flex-col gap-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">shadcn-vue test</h1>
        <Button variant="outline" size="icon" @click="toggleTheme">
          <Sun v-if="dark" />
          <Moon v-else />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileText class="size-4" />
            {{ document.name ?? 'Document' }}
          </CardTitle>
          <CardDescription>Loaded from /api/v1/document/{{ documentId }}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div class="flex gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
          </div>
          <p v-if="loading" class="text-muted-foreground text-sm">Loading…</p>
          <p v-else-if="error" class="text-destructive text-sm">{{ error }}</p>
          <pre v-else class="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">{{ document }}</pre>
        </CardContent>
        <CardFooter class="flex gap-2">
          <Input v-model="documentId" class="w-32" placeholder="Document id" />
          <Button :disabled="loading" @click="loadDocument">Load</Button>

          <Dialog>
            <DialogTrigger as-child>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test dialog</DialogTitle>
                <DialogDescription>Escape, the close button and clicking outside should all close it.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose as-child>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
