<script setup>
import { useVModel } from '@vueuse/core'
import { cn } from 'cn'

/** A row of mutually exclusive options, rendered as a radio group that looks like one control. */
const props = defineProps({
  modelValue: { type: null, required: false },
  options: { type: Array, required: true },
  name: { type: String, required: true },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
})

const emit = defineEmits(['update:modelValue'])

const modelValue = useVModel(props, 'modelValue', emit, { passive: true })
</script>

<template>
  <div
    role="radiogroup"
    :class="cn('inline-flex overflow-hidden rounded-none border border-border', props.class)"
  >
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[13px] not-first:border-l not-first:border-border has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-2 has-[input:focus-visible]:outline-primary not-has-[input:checked]:hover:bg-foreground/7"
    >
      <input
        v-model="modelValue"
        type="radio"
        :name="name"
        :value="option.value"
        class="pointer-events-none absolute size-0 opacity-0"
      />
      <span>{{ option.label }}</span>
    </label>
  </div>
</template>
