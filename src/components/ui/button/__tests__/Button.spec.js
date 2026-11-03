import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from 'cn'
import { Button, buttonVariants } from '..'
import { DESTRUCTIVE_VARIANTS, SIZES, VARIANTS } from './buttonTestData'



describe('Button', () => {
  it('is a button carrying its label', () => {
    const wrapper = mount(Button, { slots: { default: 'Move to trash' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.text()).toBe('Move to trash')
  })

  it('is the accent-filled one by default', () => {
    const wrapper = mount(Button)

    expect(wrapper.attributes('data-variant')).toBeUndefined()
    expect(wrapper.classes()).toContain('bg-primary')
  })

  it.each(VARIANTS)('marks the %s variant for styling and for tests', (variant) => {
    const wrapper = mount(Button, { props: { variant } })

    expect(wrapper.attributes('data-variant')).toBe(variant)
    expect(wrapper.classes().join(' ')).toBe(cn(buttonVariants({ variant })))
  })

  it.each(DESTRUCTIVE_VARIANTS)('colours %s with the deleting red', (variant) => {
    const wrapper = mount(Button, { props: { variant } })

    expect(wrapper.classes().join(' ')).toContain('destructive')
  })

  it.each(SIZES)('sizes %s', (size) => {
    const wrapper = mount(Button, { props: { size } })

    expect(wrapper.attributes('data-size')).toBe(size)
  })

  it('has square corners, as the design system asks', () => {
    expect(mount(Button).classes()).toContain('rounded-none')
  })

  it('keeps the classes the caller adds', () => {
    const wrapper = mount(Button, { props: { class: 'whitespace-nowrap' } })

    expect(wrapper.classes()).toContain('whitespace-nowrap')
  })

  it('can be rendered as another element', () => {
    const wrapper = mount(Button, { props: { as: 'a' } })

    expect(wrapper.element.tagName).toBe('A')
  })
})
