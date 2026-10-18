import { afterEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { http } from '../http'
import { ApiError } from '../ApiError'
import { getDocument } from '../documents'
import { DOCUMENT_ID, NETWORK_ERROR_MESSAGE, PAGEABLE, buildNotFoundError } from './apiTestData'

const mock = new MockAdapter(http)

afterEach(() => mock.reset())

describe('http', () => {
  it('uses /api/v1 as the base URL', () => {
    expect(http.defaults.baseURL).toBe('/api/v1')
  })

  it('repeats array params without brackets, as Spring expects for sort', () => {
    const uri = http.getUri({ url: '/document/deleted', params: PAGEABLE })

    expect(decodeURIComponent(uri)).toBe('/api/v1/document/deleted?page=1&size=20&sort=name,asc&sort=id,desc')
  })

  it('rejects with an ApiError holding the server message, status and metadata', async () => {
    const body = buildNotFoundError()
    mock.onGet(`/document/${DOCUMENT_ID}`).reply(404, body)

    const error = await getDocument(DOCUMENT_ID).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.message).toBe(body.message)
    expect(error.metadata).toEqual(body.metadata)
  })

  it('rejects with an ApiError without status when no response arrives', async () => {
    mock.onGet(`/document/${DOCUMENT_ID}`).networkError()

    const error = await getDocument(DOCUMENT_ID).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBeNull()
    expect(error.message).toBe(NETWORK_ERROR_MESSAGE)
    expect(error.metadata).toEqual({})
  })

  it('passes cancelled requests through unchanged', async () => {
    const controller = new AbortController()
    controller.abort()

    const error = await http.get(`/document/${DOCUMENT_ID}`, { signal: controller.signal }).catch((e) => e)

    expect(error).not.toBeInstanceOf(ApiError)
  })
})
