import { afterEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { DocumentKind } from '../enums'
import { http } from '../http'
import { getTypeCounts } from '../metrics'
import { buildTypeCounts } from './apiTestData'

const mock = new MockAdapter(http)

afterEach(() => mock.reset())

describe('getTypeCounts', () => {
  it('fetches the count of every type', async () => {
    const counts = buildTypeCounts()
    mock.onGet('/metric/count/type').reply(200, counts)

    await expect(getTypeCounts()).resolves.toEqual(counts)
    expect(mock.history.get[0].params).toEqual({ kind: undefined })
  })

  it('narrows the count to one kind', async () => {
    const counts = buildTypeCounts()
    mock.onGet('/metric/count/type').reply(200, counts)

    await expect(getTypeCounts({ kind: DocumentKind.MEMORY })).resolves.toEqual(counts)
    expect(mock.history.get[0].params).toEqual({ kind: DocumentKind.MEMORY })
  })
})
