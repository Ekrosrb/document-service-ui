import { afterEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { http } from '../http'
import { ApiError } from '../ApiError'
import {
  createDocument,
  getDeletedDocument,
  getDeletedDocuments,
  getDocument,
  removeDocument,
  removeDocumentPermanently,
  restoreDocument,
  searchDocuments,
  updateDocument,
} from '../documents'
import {
  DOCUMENT_ID,
  INCLUDE_CONTENT,
  PAGEABLE,
  buildDeletedDocumentResponse,
  buildDocumentCreateRequest,
  buildDocumentCreateResponse,
  buildDocumentResponse,
  buildDocumentSearchRequest,
  buildDocumentUpdateRequest,
  buildNotFoundError,
  buildPage,
  buildValidationError,
} from './apiTestData'

const mock = new MockAdapter(http)

afterEach(() => mock.reset())

function lastRequest(method) {
  return mock.history[method].at(-1)
}

describe('getDocument', () => {
  it('fetches a document by id', async () => {
    const document = buildDocumentResponse()
    mock.onGet(`/document/${DOCUMENT_ID}`).reply(200, document)

    await expect(getDocument(DOCUMENT_ID)).resolves.toEqual(document)
    expect(lastRequest('get').params).toEqual({ includeContent: undefined })
  })

  it('passes includeContent as a query param', async () => {
    mock.onGet(`/document/${DOCUMENT_ID}`).reply(200, buildDocumentResponse())

    await getDocument(DOCUMENT_ID, INCLUDE_CONTENT)

    expect(lastRequest('get').params).toEqual(INCLUDE_CONTENT)
  })

  it('rejects with an ApiError when the document does not exist', async () => {
    mock.onGet(`/document/${DOCUMENT_ID}`).reply(404, buildNotFoundError())

    await expect(getDocument(DOCUMENT_ID)).rejects.toBeInstanceOf(ApiError)
  })
})

describe('createDocument', () => {
  it('posts the request body and resolves to the new id', async () => {
    const request = buildDocumentCreateRequest()
    mock.onPost('/document').reply(200, buildDocumentCreateResponse())

    await expect(createDocument(request)).resolves.toEqual(buildDocumentCreateResponse())
    expect(JSON.parse(lastRequest('post').data)).toEqual(request)
  })

  it('exposes validation messages in the error metadata', async () => {
    const body = buildValidationError()
    mock.onPost('/document').reply(400, body)

    await expect(createDocument(buildDocumentCreateRequest())).rejects.toMatchObject({
      status: 400,
      metadata: body.metadata,
    })
  })
})

describe('updateDocument', () => {
  it('puts the request body to the document', async () => {
    const request = buildDocumentUpdateRequest()
    mock.onPut(`/document/${DOCUMENT_ID}`).reply(200)

    await expect(updateDocument(DOCUMENT_ID, request)).resolves.toBeUndefined()
    expect(JSON.parse(lastRequest('put').data)).toEqual(request)
  })
})

describe('removeDocument', () => {
  it('deletes the document', async () => {
    mock.onDelete(`/document/${DOCUMENT_ID}`).reply(200)

    await expect(removeDocument(DOCUMENT_ID)).resolves.toBeUndefined()
    expect(mock.history.delete).toHaveLength(1)
  })
})

describe('removeDocumentPermanently', () => {
  it('deletes the document through the permanent endpoint', async () => {
    mock.onDelete(`/document/${DOCUMENT_ID}/permanent`).reply(200)

    await expect(removeDocumentPermanently(DOCUMENT_ID)).resolves.toBeUndefined()
    expect(mock.history.delete).toHaveLength(1)
  })
})

describe('restoreDocument', () => {
  it('posts to the restore endpoint without a body', async () => {
    mock.onPost(`/document/${DOCUMENT_ID}/restore`).reply(200)

    await expect(restoreDocument(DOCUMENT_ID)).resolves.toBeUndefined()
    expect(lastRequest('post').data).toBeUndefined()
  })
})

describe('searchDocuments', () => {
  it('posts the filters and sends pageable as query params', async () => {
    const request = buildDocumentSearchRequest()
    const page = buildPage([buildDocumentResponse()])
    mock.onPost('/document/search').reply(200, page)

    await expect(searchDocuments(request, PAGEABLE)).resolves.toEqual(page)
    expect(JSON.parse(lastRequest('post').data)).toEqual(request)
    expect(lastRequest('post').params).toEqual(PAGEABLE)
  })

  it('sends empty filters and no paging by default', async () => {
    mock.onPost('/document/search').reply(200, buildPage([]))

    await searchDocuments()

    expect(JSON.parse(lastRequest('post').data)).toEqual({})
    expect(lastRequest('post').params).toEqual({})
  })
})

describe('getDeletedDocuments', () => {
  it('fetches a page of deleted documents', async () => {
    const page = buildPage([buildDeletedDocumentResponse()])
    mock.onGet('/document/deleted').reply(200, page)

    await expect(getDeletedDocuments(PAGEABLE)).resolves.toEqual(page)
    expect(lastRequest('get').params).toEqual(PAGEABLE)
  })
})

describe('getDeletedDocument', () => {
  it('fetches a deleted document by id with includeContent', async () => {
    const document = buildDeletedDocumentResponse()
    mock.onGet(`/document/deleted/${DOCUMENT_ID}`).reply(200, document)

    await expect(getDeletedDocument(DOCUMENT_ID, INCLUDE_CONTENT)).resolves.toEqual(document)
    expect(lastRequest('get').params).toEqual(INCLUDE_CONTENT)
  })
})
