import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Segmented from '../Segmented.vue'
import { OPTIONS, SECOND, buildProps } from './segmentedTestData'

describe('Segmented', () => {
  it('renders one radio per option, grouped under one name', () => {
    const wrapper = mount(Segmented, { props: buildProps() })
    const radios = wrapper.findAll('input[type="radio"]')

    expect(radios).toHaveLength(OPTIONS.length)
    expect(radios.every((radio) => radio.attributes('name') === buildProps().name)).toBe(true)
    expect(wrapper.text()).toContain(OPTIONS[0].label)
  })

  it('is a radio group for assistive technology', () => {
    const wrapper = mount(Segmented, { props: buildProps() })

    expect(wrapper.attributes('role')).toBe('radiogroup')
  })

  it('checks the option that matches the model value', () => {
    const wrapper = mount(Segmented, { props: buildProps({ modelValue: SECOND.value }) })
    const radios = wrapper.findAll('input[type="radio"]')

    expect(radios[0].element.checked).toBe(false)
    expect(radios[1].element.checked).toBe(true)
  })

  it('reports the value of the option that was picked', async () => {
    const wrapper = mount(Segmented, { props: buildProps() })

    await wrapper.findAll('input[type="radio"]')[1].setValue()

    expect(wrapper.emitted('update:modelValue')).toEqual([[SECOND.value]])
  })

  it('carries non-string option values unchanged', async () => {
    const options = [
      { value: false, label: 'Not allowed' },
      { value: true, label: 'Allowed' },
    ]
    const wrapper = mount(Segmented, { props: { modelValue: false, options, name: 'mcp' } })

    await wrapper.findAll('input[type="radio"]')[1].setValue()

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('checks nothing when the model value matches no option', () => {
    const wrapper = mount(Segmented, { props: buildProps({ modelValue: '' }) })

    expect(wrapper.findAll('input[type="radio"]').some((radio) => radio.element.checked)).toBe(false)
  })
})
