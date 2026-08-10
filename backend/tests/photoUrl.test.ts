import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePhotoPublicUrl } from '../src/utils/photoUrl.js'

test('resolves a plain filename to a public uploads URL', () => {
  assert.equal(resolvePhotoPublicUrl('portrait.jpg', 'https://admin.example.com'), 'https://admin.example.com/uploads/portrait.jpg')
})

test('keeps an existing absolute URL unchanged', () => {
  const url = 'https://cdn.example.com/photo.jpg'
  assert.equal(resolvePhotoPublicUrl(url, 'https://admin.example.com'), url)
})

test('normalizes an existing uploads path', () => {
  assert.equal(resolvePhotoPublicUrl('/uploads/photo.jpg', 'https://admin.example.com'), 'https://admin.example.com/uploads/photo.jpg')
})

test('encodes filenames that contain spaces', () => {
  assert.equal(resolvePhotoPublicUrl('uploads/photo de profil.jpg', 'https://api.example.com'), 'https://api.example.com/uploads/photo%20de%20profil.jpg')
})
