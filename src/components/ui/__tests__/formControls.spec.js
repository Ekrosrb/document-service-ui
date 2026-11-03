import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Checkbox } from '../checkbox'
import { Input } from '../input'
import { NativeSelect, NativeSelectOption } from '../native-select'
import { Skeleton } from '../skeleton'
import { Textarea } from '../textarea'
import { OPTION_VALUES, TYPED_TEXT } from './formControlsTestData'

describe('Input', () => {
  it('shows what it is given and reports what is typed', async () => {
    const wrapper = mount(Input, { props: { modelValue: 'before' } })

    expect(wrapper.element.value).toBe('before')
    await wrapper.setValue(TYPED_TEXT)

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([TYPED_TEXT])
  })

  it('is square and sits on the surface colour', () => {
    expect(mount(Input).classes()).toEqual(expect.arrayContaining(['rounded-none', 'bg-input']))
  })
})

describe('Textarea', () => {
  it('reports what is typed', async () => {
    const wrapper = mount(Textarea, { props: { modelValue: '' } })

    await wrapper.setValue(TYPED_TEXT)

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([TYPED_TEXT])
  })

  it('can be dragged taller', () => {
    expect(mount(Textarea).classes()).toContain('resize-y')
  })
})

describe('NativeSelect', () => {
  it('offers its options and reports the one picked', async () => {
    const wrapper = mount(NativeSelect, {
      props: { modelValue: OPTION_VALUES[0] },
      slots: {
        default: OPTION_VALUES.map((value) => `<option value="${value}">${value}</option>`).join(''),
      },
    })

    await wrapper.find('select').setValue(OPTION_VALUES[1])

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([OPTION_VALUES[1]])
  })

  it('renders an option through its own component', () => {
    const wrapper = mount(NativeSelectOption, { props: { value: 'TEXT' }, slots: { default: 'Text' } })

    expect(wrapper.element.tagName).toBe('OPTION')
    expect(wrapper.text()).toBe('Text')
  })
})

describe('Checkbox', () => {
  it('reports being ticked', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })

    await wrapper.find('[role="checkbox"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })

  it('shows its state to assistive technology', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })

    expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe('true')
  })
})

describe('Skeleton', () => {
  it('shimmers while it stands in for content, and is ignored when read aloud', () => {
    const wrapper = mount(Skeleton)

    expect(wrapper.classes()).toContain('animate-shimmer')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })
})
