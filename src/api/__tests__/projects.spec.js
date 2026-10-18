import { afterEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { http } from '../http'
import { getProjectsInfo } from '../projects'
import { PAGEABLE, buildPage, buildProjectsInfo } from './apiTestData'

const mock = new MockAdapter(http)

afterEach(() => mock.reset())

describe('getProjectsInfo', () => {
  it('fetches a page of project keys with document counts', async () => {
    const page = buildPage([buildProjectsInfo()])
    mock.onGet('/project/info').reply(200, page)

    await expect(getProjectsInfo(PAGEABLE)).resolves.toEqual(page)
    expect(mock.history.get[0].params).toEqual(PAGEABLE)
  })
})
