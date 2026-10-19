<script setup>
import { cn } from "cn";

const props = defineProps({
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
});
</script>

<template>
  <div
    data-slot="skeleton"
    aria-hidden="true"
    :class="
      cn(
        'animate-shimmer rounded-md bg-foreground/[0.06] bg-[linear-gradient(90deg,transparent_35%,color-mix(in_oklab,var(--foreground)_9%,transparent)_50%,transparent_65%)] bg-[length:200%_100%] motion-reduce:animate-none',
        props.class,
      )
    "
  />
</template>
