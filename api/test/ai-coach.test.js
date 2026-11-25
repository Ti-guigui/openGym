// Ti Guigui FIT: the AI coach request and answer (functions/lib/ai-coach.js).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanMessages, requestBody, readReply, dailyCap, upstreamCode, MAX_MESSAGE, MAX_TURNS, DEFAULT_MODEL } from '../../functions/lib/ai-coach.js'

test('cleanMessages keeps alternating user and assistant turns ending on the user', () => {
  assert.equal(cleanMessages(null), null)
  assert.equal(cleanMessages([{ role: 'assistant', content: 'hi' }]), null)
  assert.deepEqual(cleanMessages([
    { role: 'assistant', content: 'Salut' }, { role: 'system', content: 'x' },
    { role: 'user', content: 'a' }, { role: 'user', content: 'b' }, { role: 'assistant', content: ' ' }
  ]), [{ role: 'user', content: 'a\n\nb' }])
  assert.deepEqual(cleanMessages([{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }]), [{ role: 'user', content: 'a\n\nb' }])
  const long = cleanMessages([{ role: 'user', content: 'x'.repeat(5000) }])
  assert.equal(long[0].content.length, MAX_MESSAGE)
  const many = Array.from({ length: 41 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i }))
  assert.ok(cleanMessages(many).length <= MAX_TURNS)
  assert.equal(cleanMessages(many)[0].role, 'user')
})

test('requestBody caches the rules and adds the data after them', () => {
  const b = requestBody({ messages: [{ role: 'user', content: 'q' }], context: 'Poids 80 kg' })
  assert.equal(b.model, DEFAULT_MODEL)
  assert.equal(b.system.length, 2)
  assert.deepEqual(b.system[0].cache_control, { type: 'ephemeral' })
  assert.match(b.system[1].text, /Poids 80 kg/)
  assert.equal(b.output_config.effort, 'low')
  assert.equal(requestBody({ messages: [], context: '' }).system.length, 1)
})

test('readReply joins the text and names refusals', () => {
  assert.deepEqual(readReply({ stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'Bonjour ' }, { type: 'text', text: 'toi' }] }), { text: 'Bonjour toi', truncated: false })
  assert.deepEqual(readReply({ stop_reason: 'refusal', content: [] }), { error: 'refused' })
  assert.deepEqual(readReply({ content: [] }), { error: 'bad-reply' })
})

test('dailyCap', () => {
  assert.equal(dailyCap(undefined), 20)
  assert.equal(dailyCap('5'), 5)
  assert.equal(dailyCap(9999), 20)
})

test('upstreamCode tells an empty credit balance from a bad key or a busy API', () => {
  const credit = { error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } }
  assert.equal(upstreamCode(400, credit), 'credit')
  assert.equal(upstreamCode(400, { error: { message: 'max_tokens too large' } }), 'unreachable')
  assert.equal(upstreamCode(401, null), 'no-key')
  assert.equal(upstreamCode(529, null), 'busy')
  assert.equal(upstreamCode(500, null), 'unreachable')
})
