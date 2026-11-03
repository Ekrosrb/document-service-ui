<script setup>
import { useVModel } from "@vueuse/core";
import { cn } from "cn";

const props = defineProps({
  defaultValue: { type: [String, Number], required: false },
  modelValue: { type: [String, Number], required: false },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
});

const emits = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <textarea
    v-model="modelValue"
    data-slot="textarea"
    :class="
      cn(
        'bg-input border-border hover:border-foreground/45 focus-visible:border-primary aria-invalid:border-destructive min-h-24 resize-y rounded-none border px-2.5 py-1.5 text-sm caret-primary transition-colors w-full min-w-0 outline-none focus-visible:outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
