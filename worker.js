/**
 * Moorcheh.ai API to OpenAI API Proxy
 * Translates OpenAI-style chat requests into Moorcheh API calls.
 * Original Repo: https://github.com/Nic3b/Moorcheh-proxy/
 */

const MOORCHEH = 'https://api.moorcheh.ai/v1';

const MODELS = [
  'anthropic.claude-sonnet-4-6',
  'anthropic.claude-opus-4-6-v1',
  'meta.llama4-maverick-17b-instruct-v1:0',
  'amazon.nova-pro-v1:0',
  'deepseek.r1-v1:0',
  'deepseek.v3.2',
  'openai.gpt-oss-120b-1:0',
  'qwen.qwen3-32b-v1:0',
  'qwen.qwen3-next-80b-a3b',
];

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '');

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    const key = (req.headers.get('Authorization') || '')
      .replace(/^Bearer\s+/i, '')
      .trim();

    if (!key) {
      return err(401, 'No API key. Set it in your app.');
    }

    if (path === '/v1/models' || path === '/models') {
      return handleModels();
    }

    if (path === '/v1/chat/completions' || path === '/chat/completions') {
      return handleChat(req, key, url);
    }

    return proxyDirect(req, key, url);
  },
};

function handleModels() {
  const now = Math.floor(Date.now() / 1000);
  return json({
    object: 'list',
    data: MODELS.map(function (id) {
      return { id: id, object: 'model', created: now, owned_by: 'moorcheh' };
    }),
  });
}

async function handleChat(req, key, url) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return err(400, 'Bad JSON');
  }

  const msgs = body.messages || [];
  const lastUserIdx = msgs.map(function (m) { return m.role; }).lastIndexOf('user');
  const query = lastUserIdx >= 0 ? extractText(msgs[lastUserIdx].content) : '';

  const systemParts = msgs
    .filter(function (m) { return m.role === 'system'; })
    .map(function (m) { return extractText(m.content); });

  const history = [];
  for (let i = 0; i < msgs.length; i++) {
    if (i === lastUserIdx || msgs[i].role === 'system') continue;
    history.push({ role: msgs[i].role, content: extractText(msgs[i].content) });
  }

  const namespace = url.searchParams.get('namespace') || '';

  const payload = {
    namespace: namespace,
    query: query,
    ai_model: body.model || MODELS[0],
    temperature: body.temperature != null ? body.temperature : 0.7,
  };

  if (history.length) payload.chat_history = history;
  if (systemParts.length) payload.header_prompt = systemParts.join('\n');

  const r = await fetch(MOORCHEH + '/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  if (!r.ok) return err(r.status, 'Moorcheh: ' + txt);

  let data;
  try {
    data = JSON.parse(txt);
  } catch (e) {
    return err(500, 'Bad Moorcheh JSON');
  }

  const content = data.answer || '';
  return chatResponse(content, body.model, body.stream);
}

function extractText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(function (p) {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object') return p.text || '';
        return '';
      })
      .join('');
  }
  if (content && typeof content === 'object') return content.text || '';
  return '';
}

function chatResponse(content, model, stream) {
  const id = 'chatcmpl-' + crypto.randomUUID();
  const created = Math.floor(Date.now() / 1000);

  if (stream) {
    const enc = new TextEncoder();
    const s = new ReadableStream({
      start: function (c) {
        c.enqueue(enc.encode('data: ' + JSON.stringify({
          id: id,
          object: 'chat.completion.chunk',
          created: created,
          model: model,
          choices: [{ index: 0, delta: { role: 'assistant', content: content }, finish_reason: null }],
        }) + '\n\n'));

        c.enqueue(enc.encode('data: ' + JSON.stringify({
          id: id,
          object: 'chat.completion.chunk',
          created: created,
          model: model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        }) + '\n\n'));

        c.enqueue(enc.encode('data: [DONE]\n\n'));
        c.close();
      },
    });
    return new Response(s, {
      headers: { 'Content-Type': 'text/event-stream', ...cors() },
    });
  }

  return json({
    id: id,
    object: 'chat.completion',
    created: created,
    model: model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: content },
      finish_reason: 'stop',
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  });
}

async function proxyDirect(req, key, url) {
  const target = MOORCHEH + url.pathname.replace(/^\/v1/, '') + url.search;
  const h = new Headers(req.headers);
  h.delete('Authorization');
  h.delete('Host');
  h.set('x-api-key', key);

  const r = await fetch(target, {
    method: req.method,
    headers: h,
    body: ['GET', 'HEAD'].indexOf(req.method) >= 0 ? null : req.body,
  });

  const out = new Response(r.body, r);
  const c = cors();
  Object.keys(c).forEach(function (k) { out.headers.set(k, c[k]); });
  return out;
}

function json(o, s) {
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}

function err(s, m) {
  return json({ error: { message: m, type: 'proxy_error' } }, s);
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}
