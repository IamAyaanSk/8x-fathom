# Agent capture verification (8x assignment)

## 1. Tool and model

|                  |                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Tool**         | [Antigravity IDE](https://gemini.google.com) (Google DeepMind agentic coding assistant)                                     |
| **Model**        | Claude Opus 4.6 (Thinking). Single model plans and executes.                                                                |
| **Docs checked** | Antigravity Customization System — `hooks.json` lifecycle hooks with JSON on stdin; project config at `.agents/hooks.json`. |

Previous tool was Cursor (Sep 15–16 logs). Switched to Antigravity IDE for this session onwards.

## 2. Mechanism and config

| File                             | Role                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `.agents/hooks.json`             | Registers `PreInvocation` (prompt capture) and `Stop` (response capture) lifecycle hooks     |
| `.agents/hooks/agent-capture.py` | Reads Antigravity transcript JSONL, extracts last USER_INPUT / PLANNER_RESPONSE, appends log |

Behavior:

- **PROMPT** on `PreInvocation` (invocationNum=0 only): reads the full transcript, extracts the last `USER_INPUT` content (stripping `<USER_REQUEST>` wrapper), appends to log.
- **RESPONSE** on `Stop`: reads the transcript, extracts the last `PLANNER_RESPONSE` content (model's final text, excluding tool calls/thinking), appends to log.
- Deduplication via content hash prevents re-logging the same prompt/response on repeated hook fires.
- One log file per conversation session, named `YYYY-MM-DD_HH-MM-SS_<conversation-id>.md`.

### Previous tool (Cursor, Sep 15–16)

| File                             | Role                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `.cursor/hooks.json`             | Registers `sessionStart`, `beforeSubmitPrompt`, `afterAgentResponse`, and `stop`     |
| `.cursor/hooks/agent-capture.sh` | Wrapper that runs the Python logger                                                  |
| `.cursor/hooks/agent-capture.py` | Appends PROMPT/RESPONSE entries to `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md` |

## 3. Log files

### Antigravity IDE session (this session)

`.agent-logs/2026-09-26_04-12-23_de6e9cd2-19cf-4817-8b05-fc5712215bb6.md`

### Previous Cursor sessions (Sep 15–16)

Canary tests:

- `.agent-logs/2026-09-15_07-37-04_canary-test-3d054621-5290-4867-ac79-0368ded343a1.md`
- `.agent-logs/2026-09-15_07-37-11_canary-test-81c96ff3-424e-4f45-8e14-514ea9378101.md`

## 4. Canary entries (raw) — Antigravity IDE

### Canary 1 (this session, dry-run verified)

```
[LOG_ENTRY type=PROMPT num=1 session=de6e9cd2]
timestamp: 2026-09-26T04:10:10Z
model: claude-opus-4.6-thinking

# 8x Assignment — Agent Capture Setup

Paste this entire file into your coding agent as your **first message**, before any
other work on the assignment. Do not start building until the check in step 4 passes.

We are not checking whether you used AI. We assume you did. We are checking *how* you
work with it, and the only way to see that is the raw prompt-and-response record.

[... full prompt captured verbatim ...]


[LOG_ENTRY type=RESPONSE num=1 session=de6e9cd2]
timestamp: 2026-09-26T04:12:28Z
model: claude-opus-4.6-thinking

The prompt was captured correctly. Now let me test the Stop hook (response capture):
```

### Previous Cursor canaries (raw, from Sep 15)

#### Session 1

```
[LOG_ENTRY type=PROMPT num=1 session=canary]
timestamp: 2026-09-15T07:37:04.503Z
model: composer-2.5

CAPTURE TEST — 8x assignment, Ayaan


[LOG_ENTRY type=RESPONSE num=1 session=canary]
timestamp: 2026-09-15T07:37:04.542Z
model: composer-2.5

Canary response for session one.
```

#### Session 2

```
[LOG_ENTRY type=PROMPT num=1 session=canary]
timestamp: 2026-09-15T07:37:11.928Z
model: composer-2.5

CAPTURE TEST — 8x assignment, session 2


[LOG_ENTRY type=RESPONSE num=1 session=canary]
timestamp: 2026-09-15T07:37:11.965Z
model: composer-2.5

Canary response for session two.
```

## 5. What did not work / notes

- **Antigravity IDE does not pass prompt/response text directly in hook payloads** — unlike Cursor's `beforeSubmitPrompt` which includes the prompt text, Antigravity's `PreInvocation` and `Stop` hooks only pass metadata (`conversationId`, `modelName`, `transcriptPath`, `invocationNum`). The solution reads the transcript JSONL file to extract the actual content.
- **`PostInvocation` not used for response capture** — it fires after each invocation within a turn (tool loops), not just the final response. `Stop` fires once at the end, which is the correct event for capturing the final response.
- **`PreInvocation` fires multiple times per turn** — guarded by `invocationNum == 0` check so only the first invocation (containing the user prompt) is logged.
- **Multi-session verification** — hooks are installed at `.agents/hooks.json` (project-level), so they apply to every Antigravity IDE session in this workspace. No per-session setup needed.
- **Previous Cursor setup intact** — `.cursor/hooks.json` and `.cursor/hooks/agent-capture.py` remain for any Cursor sessions.
