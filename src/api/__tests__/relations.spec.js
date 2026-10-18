import { afterEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { http } from '../http'
import { createDocumentRelation, removeDocumentRelation } from '../relations'
import { DOCUMENT_ID, RELATED_DOCUMENT_ID, buildRelationCreateRequest } from './apiTestData'

const mock = new MockAdapter(http)

afterEach(() => mock.reset())

describe('createDocumentRelation', () => {
  it('posts the relation', async () => {
    const request = buildRelationCreateRequest()
    mock.onPost('/document/relation').reply(201)

    await expect(createDocumentRelation(request)).resolves.toBeUndefined()
    expect(JSON.parse(mock.history.post[0].data)).toEqual(request)
  })
})

describe('removeDocumentRelation', () => {
  it('deletes the relation by both document ids', async () => {
    mock.onDelete(`/document/relation/${DOCUMENT_ID}/${RELATED_DOCUMENT_ID}`).reply(200)

    await expect(removeDocumentRelation(DOCUMENT_ID, RELATED_DOCUMENT_ID)).resolves.toBeUndefined()
    expect(mock.history.delete).toHaveLength(1)
  })
})
