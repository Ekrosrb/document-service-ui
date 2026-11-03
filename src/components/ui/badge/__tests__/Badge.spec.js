import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from 'cn'
import { Badge, badgeVariants } from '..'
import { VARIANTS } from './badgeTestData'



describe('Badge', () => {
  it('carries its label', () => {
    const wrapper = mount(Badge, { slots: { default: 'Decision' } })

    expect(wrapper.text()).toBe('Decision')
  })

  it.each(VARIANTS)('marks the %s variant for styling and for tests', (variant) => {
    const wrapper = mount(Badge, { props: { variant } })

    expect(wrapper.attributes('data-variant')).toBe(variant)
    expect(wrapper.classes().join(' ')).toBe(cn(badgeVariants({ variant })))
  })

  it('tells memories from documents by colour', () => {
    expect(badgeVariants({ variant: 'accent' })).toContain('bg-accent-100')
    expect(badgeVariants({ variant: 'neutral' })).toContain('bg-neutral-100')
  })

  it('has square corners, as the design system asks', () => {
    expect(mount(Badge).classes()).toContain('rounded-none')
  })

  it('can be rendered as another element', () => {
    const wrapper = mount(Badge, { props: { as: 'button' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
  })
})
