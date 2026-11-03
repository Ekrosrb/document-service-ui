<script setup>
import { ChevronDownIcon } from "@lucide/vue";
import { reactiveOmit, useVModel } from "@vueuse/core";
import { cn } from "cn";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  modelValue: { type: null, required: false },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
  size: { type: String, required: false },
});

const emit = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emit, {
  passive: true,
  defaultValue: "",
});

const delegatedProps = reactiveOmit(props, "class", "size");
</script>

<template>
  <div
    :class="
      cn(
        'group/native-select relative w-fit has-[select:disabled]:opacity-50',
        props.class,
      )
    "
    data-slot="native-select-wrapper"
    :data-size="props.size ?? 'default'"
  >
    <select
      v-bind="{ ...$attrs, ...delegatedProps }"
      v-model="modelValue"
      data-slot="native-select"
      class="bg-input border-border hover:border-foreground/45 focus-visible:border-primary aria-invalid:border-destructive h-9 w-full min-w-0 appearance-none rounded-none border py-1.5 pr-8 pl-2.5 text-sm transition-colors select-none data-[size=sm]:h-8 outline-none focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
      :data-size="props.size ?? 'default'"
    >
      <slot />
    </select>
    <ChevronDownIcon
      class="text-muted-foreground top-1/2 right-2.5 size-4 -translate-y-1/2 pointer-events-none absolute select-none"
      aria-hidden="true"
      data-slot="native-select-icon"
    />
  </div>
</template>
