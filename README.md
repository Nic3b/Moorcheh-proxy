<div align="center">

# ☁️ moorcheh-proxy

**Chat with Moorcheh Free AI Models inside any OpenAI-compatible app.**


[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Nic3b/Moorcheh-proxy)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

</div>

---

#### 🤔 What is Moorcheh?

Moorcheh is a semantic search + RAG platform. Store your data, search it, and generate answers from it.


#### 🔱 What is [Moorcheh-Proxy](https://github.com/Nic3b/Moorcheh-proxy/edit/main/README.md)

Moorcheh isn't an LLM provider. 
But it has a **Direct AI Mode** that lets you chat with **Claude, Llama, DeepSeek, Qwen**.
Its API just doesn't look like OpenAI's, so most apps refuse to talk to it.
**This Cloudflare Worker sits in the middle and translates both ways**.
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  📱 Your App │ ───► │ ⚡  Worker   │ ───► │  🧠 Moorcheh API │
│              │ ◄─── │              │ ◄─── │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

Your API key never touches the Worker. It flows from your app → Worker → Moorcheh as a header.

---


🌐 [moorcheh.ai](https://moorcheh.ai) · 🖥️ [console.moorcheh.ai](https://console.moorcheh.ai) · 📖 [docs.moorcheh.ai](https://docs.moorcheh.ai)

---

### 🎁 Free tier

You get **500 free credits** on a 3-month trial. No credit card. 

👉 Grab a key at [console.moorcheh.ai](https://console.moorcheh.ai)

---

### 🚀 Setup

**1. Deploy the Worker**

Click the Deploy button above, or do it manually: Cloudflare → Workers & Pages → Create Worker → paste `worker.js` → Deploy.

**2. Point your local app at it**

Add a custom OpenAI provider:

| Field | Value |
|---|---|
| Base URL | `https://your-worker.workers.dev` |
| API Key | your Moorcheh key (`mk_...`) |
| Model | any of the 9 — your app auto-fetches the list |

No Cloudflare secrets. No env vars.

**3. Start a new chat with a model**

Yeah that's it

---

### 📦 Models

All fetched automatically from `/v1/models`:
```

anthropic.claude-sonnet-4-6
anthropic.claude-opus-4-6-v1
meta.llama4-maverick-17b-instruct-v1:0
amazon.nova-pro-v1:0
deepseek.r1-v1:0
deepseek.v3.2
openai.gpt-oss-120b-1:0
qwen.qwen3-32b-v1:0
qwen.qwen3-next-80b-a3b

```

---

### 🧪 Tested with 

- ✅**Oriveo** — Android / iOS
- ✅**kai9000** — Android / Windows / Mac / Linux / Web

Using it in another app? Open an issue.

---

### 📄 License

MIT.

---

<div align="center">
<sub>⭐ if it helped.</sub>
</div>
