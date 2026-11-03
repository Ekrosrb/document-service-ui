<script setup>
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Asks the user to confirm an action; `confirm` is emitted only when they accept. */
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  confirmVariant: { type: String, default: 'destructive' },
  pending: { type: Boolean, default: false },
  error: { type: Object, default: null },
})

const emit = defineEmits(['update:open', 'confirm'])
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription v-if="description">{{ description }}</DialogDescription>
      </DialogHeader>

      <p v-if="error" class="text-sm text-destructive">{{ error.message }}</p>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" :disabled="pending">Cancel</Button>
        </DialogClose>
        <Button :variant="confirmVariant" :disabled="pending" @click="emit('confirm')">
          {{ pending ? 'Working…' : confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
