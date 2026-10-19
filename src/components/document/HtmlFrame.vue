<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

const HEIGHT_MESSAGE = 'document-service-ui:html-height'

const SIZE_SCRIPT = `<script>
(function () {
  document.documentElement.style.overflow = 'hidden'
  function send() {
    var body = document.body
    if (!body) return
    var margin = parseFloat(getComputedStyle(body).marginBottom) || 0
    var height = body.getBoundingClientRect().bottom + margin
    parent.postMessage({ type: '${HEIGHT_MESSAGE}', height: Math.ceil(height) + 2 }, '*')
  }
  if (window.ResizeObserver) new ResizeObserver(send).observe(document.body)
  window.addEventListener('load', send)
  send()
})()
<\/script>`

/**
 * Renders an HTML document in a sandboxed iframe, so its own CSS and scripts run without
 * reaching this page. The frame reports its content height and grows to fit it.
 */
const props = defineProps({
  html: { type: String, default: '' },
})

const frame = useTemplateRef('frame')
const height = ref(0)

const srcdoc = computed(() => props.html + SIZE_SCRIPT)

function receiveHeight(event) {
  if (event.source !== frame.value?.contentWindow || event.data?.type !== HEIGHT_MESSAGE) return
  const value = Number(event.data.height)
  if (Number.isFinite(value) && value > 0) height.value = Math.ceil(value)
}

watch(srcdoc, () => (height.value = 0))

onMounted(() => window.addEventListener('message', receiveHeight))
onBeforeUnmount(() => window.removeEventListener('message', receiveHeight))
</script>

<template>
  <iframe
    ref="frame"
    :srcdoc="srcdoc"
    :style="height ? { height: `${height}px` } : null"
    :class="height ? null : 'h-96'"
    sandbox="allow-scripts"
    title="Rendered HTML document"
    class="w-full rounded-xl bg-white"
  />
</template>
