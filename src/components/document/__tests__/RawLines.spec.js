import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RawLines from '../RawLines.vue'
import { PLAIN_TEXT } from './contentTestData'

const rowsOf = (wrapper) => wrapper.findAll('div.grid')

describe('RawLines', () => {
  it('numbers every line from one', () => {
    const wrapper = mount(RawLines, { props: { content: PLAIN_TEXT } })
    const numbers = rowsOf(wrapper).map((row) => row.findAll('span')[0].text())

    expect(numbers).toEqual(['1', '2', '3', '4'])
  })

  it('shows each line next to its number', () => {
    const wrapper = mount(RawLines, { props: { content: PLAIN_TEXT } })
    const lines = rowsOf(wrapper).map((row) => row.findAll('span')[1].text())

    expect(lines[0]).toBe('First line')
    expect(lines[1]).toBe('Second line')
    expect(lines[3]).toBe('Fourth line')
  })

  it('keeps an empty line as a row of its own', () => {
    const wrapper = mount(RawLines, { props: { content: PLAIN_TEXT } })

    expect(rowsOf(wrapper)).toHaveLength(4)
  })

  it('shows one empty row for no content at all', () => {
    const wrapper = mount(RawLines, { props: { content: '' } })

    expect(rowsOf(wrapper)).toHaveLength(1)
  })
})
