<script setup>
import { computed, ref } from 'vue'
import { ChevronDown, ChevronRight } from '@lucide/vue'
import { isCollapsible, isTextOnlyElement } from '@/lib/xml'

/** One node of the XML tree. Elements with element children can be collapsed. */
const props = defineProps({
  node: { type: Object, required: true },
})

const open = ref(true)

const collapsible = computed(() => isCollapsible(props.node))
const textOnly = computed(() => isTextOnlyElement(props.node))
</script>

<template>
  <div v-if="node.kind === 'element'">
    <div class="flex items-start gap-1">
      <button
        v-if="collapsible"
        type="button"
        class="mt-0.5 shrink-0 cursor-pointer rounded text-muted-foreground hover:text-foreground"
        :aria-expanded="open"
        :aria-label="`${open ? 'Collapse' : 'Expand'} ${node.name}`"
        @click="open = !open"
      >
        <ChevronDown v-if="open" class="size-4" />
        <ChevronRight v-else class="size-4" />
      </button>
      <span v-else class="size-4 shrink-0" aria-hidden="true" />

      <span class="break-all">
        <span class="hljs-punctuation">&lt;</span><span class="hljs-name">{{ node.name }}</span
        ><template v-for="attribute in node.attributes" :key="attribute.name">
          <span class="hljs-attr">{{ ` ${attribute.name}` }}</span
          ><span class="hljs-punctuation">=</span><span class="hljs-string">"{{ attribute.value }}"</span></template
        ><template v-if="!node.children.length"><span class="hljs-punctuation">/&gt;</span></template>
        <template v-else
          ><span class="hljs-punctuation">&gt;</span
          ><template v-if="textOnly">{{ node.children[0].value }}</template
          ><button
            v-else-if="!open"
            type="button"
            class="mx-1 cursor-pointer rounded bg-foreground/10 px-1.5 text-muted-foreground hover:text-foreground"
            :aria-label="`Expand ${node.name}`"
            @click="open = true"
          >
            …
          </button>
          <template v-if="textOnly || !open"
            ><span class="hljs-punctuation">&lt;/</span><span class="hljs-name">{{ node.name }}</span
            ><span class="hljs-punctuation">&gt;</span></template
          ></template
        >
      </span>
    </div>

    <template v-if="collapsible && open">
      <div class="ml-5 border-l border-foreground/10 pl-3">
        <XmlNode v-for="(child, index) in node.children" :key="index" :node="child" />
      </div>
      <div class="ml-5">
        <span class="hljs-punctuation">&lt;/</span><span class="hljs-name">{{ node.name }}</span
        ><span class="hljs-punctuation">&gt;</span>
      </div>
    </template>
  </div>

  <div v-else-if="node.kind === 'text'" class="ml-5 break-words whitespace-pre-wrap">{{ node.value }}</div>
  <div v-else-if="node.kind === 'comment'" class="hljs-comment ml-5 break-words whitespace-pre-wrap">&lt;!--{{ node.value }}--&gt;</div>
  <div v-else-if="node.kind === 'cdata'" class="ml-5 break-words whitespace-pre-wrap">
    <span class="hljs-meta">&lt;![CDATA[</span>{{ node.value }}<span class="hljs-meta">]]&gt;</span>
  </div>
  <div v-else-if="node.kind === 'instruction'" class="hljs-meta ml-5 break-all">&lt;?{{ node.name }} {{ node.value }}?&gt;</div>
  <div v-else-if="node.kind === 'doctype'" class="hljs-meta ml-5 break-all">&lt;!DOCTYPE {{ node.name }}&gt;</div>
</template>
