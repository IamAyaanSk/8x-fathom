# Agent capture verification (8x assignment)

## 1. Tool and model

|                  |                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tool**         | [Cursor](https://cursor.com) (Agent / Composer chat)                                                                                               |
| **Model**        | Composer (Cursor-trained agent model). Same model plans and executes in this session unless a subagent is spawned with an explicit model override. |
| **Docs checked** | [Cursor Hooks](https://cursor.com/docs/hooks) — lifecycle hooks with JSON on stdin; project config at `.cursor/hooks.json`.                        |

Project rules (`.cursor/rules/*.mdc`) inject context only; they do **not** run commands on prompt/response. Capture uses **hooks**, not rules alone.

## 2. Mechanism and config

| File                             | Role                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `.cursor/hooks.json`             | Registers `sessionStart`, `beforeSubmitPrompt`, `afterAgentResponse`, and `stop`     |
| `.cursor/hooks/agent-capture.sh` | Wrapper that runs the Python logger                                                  |
| `.cursor/hooks/agent-capture.py` | Appends PROMPT/RESPONSE entries to `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md` |

Behavior:

- **PROMPT** on `beforeSubmitPrompt` (verbatim user text).
- **RESPONSE** on `stop` using the last `afterAgentResponse` text for that turn (so intermediate assistant chunks during tool loops are not logged).
- **sessionStart** creates the log file early in a new Composer session.

## 3. Log files (two sessions)

Session 1 (canary text exactly as specified):

`.agent-logs/2026-09-15_07-37-04_canary-test-3d054621-5290-4867-ac79-0368ded343a1.md`

Session 2 (second Composer session / conversation id):

`.agent-logs/2026-09-15_07-37-11_canary-test-81c96ff3-424e-4f45-8e14-514ea9378101.md`

## 4. Canary entries (raw)

### Session 1

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

### Session 2

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

Sessions 1 and 2 were verified by driving the hook script with the same JSON Cursor sends on stdin (see [hooks reference](https://cursor.com/docs/hooks)). That proves multi-session file creation and append logic. **Live IDE capture** applies from hook install onward: open a **new** Composer chat, send `CAPTURE TEST — 8x assignment, Ayaan` again, and confirm a new `.agent-logs/*.md` file appears without running any manual command.

Note: The assignment setup message in the chat where hooks were first added was submitted **before** `.cursor/hooks.json` existed, so that turn’s PROMPT was not hook-captured. Subsequent turns in any session with these project hooks loaded are automatic.

## 5. What did not work / was not used

- **Rules-only logging** — `.mdc` rules cannot append files on each turn; no automatic capture.
- **Agent transcript JSONL** (`~/.cursor/projects/.../agent-transcripts/*.jsonl`) — includes tool calls and intermediate steps; does not match the required PROMPT/RESPONSE-only format.
- **`afterAgentResponse` alone** — fires after each assistant message in a tool loop; final text is taken on `stop` instead.
