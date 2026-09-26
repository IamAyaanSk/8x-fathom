#!/usr/bin/env python3
"""Append prompt/response pairs to .agent-logs/ for 8x assignment capture (Antigravity IDE)."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LOGS_DIR = REPO_ROOT / '.agent-logs'
STATE_DIR = LOGS_DIR / '.state'
AUTHOR = os.environ.get('AGENT_LOG_AUTHOR', 'IamAyaanSk')
TOOL = 'antigravity-ide'
PROJECT = '8x-fathom'


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso_z(dt: datetime) -> str:
    return dt.strftime('%Y-%m-%dT%H:%M:%S.') + f'{dt.microsecond // 1000:03d}Z'


def _short_id(session_id: str) -> str:
    return session_id.split('-')[0] if session_id else 'unknown'


def _state_path(conversation_id: str) -> Path:
    safe = conversation_id.replace('/', '_')
    return STATE_DIR / f'agy_{safe}.json'


def _read_state(path: Path) -> dict:
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, OSError):
        return {}


def _write_state(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding='utf-8')


def _log_filename(session_id: str, started_at: datetime) -> str:
    stamp = started_at.strftime('%Y-%m-%d_%H-%M-%S')
    return f'{stamp}_{session_id}.md'


def _ensure_log_header(state: dict, session_id: str, model: str) -> None:
    if state.get('log_path') and Path(state['log_path']).is_file():
        return

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    started_at = _utc_now()
    rel_name = _log_filename(session_id, started_at)
    log_path = LOGS_DIR / rel_name
    date_str = started_at.strftime('%Y-%m-%d')
    short = _short_id(session_id)

    header = f"""---
session_id: {session_id}
date: {date_str}
author: {AUTHOR}
model: {model}
tool: {TOOL}
project: {PROJECT}
total_exchanges: 0
first_prompt_time:
last_prompt_time:
---

# Session Log - {date_str}

Session: `{short}` | Project: `{PROJECT}` | Author: `{AUTHOR}`

---

"""
    log_path.write_text(header, encoding='utf-8')
    state['log_path'] = str(log_path)
    state['session_id'] = session_id
    state['started_at'] = _iso_z(started_at)
    state['date'] = date_str


def _update_frontmatter(log_path: Path, state: dict) -> None:
    text = log_path.read_text(encoding='utf-8')
    if not text.startswith('---\n'):
        return
    end = text.find('\n---\n', 4)
    if end == -1:
        return
    body = text[end + 5:]
    front = f"""---
session_id: {state.get('session_id', '')}
date: {state.get('date', '')}
author: {AUTHOR}
model: {state.get('last_model', 'unknown')}
tool: {TOOL}
project: {PROJECT}
total_exchanges: {state.get('exchange_count', 0)}
first_prompt_time: {state.get('first_prompt_time', '')}
last_prompt_time: {state.get('last_prompt_time', '')}
---"""
    log_path.write_text(front + '\n' + body, encoding='utf-8')


def _append_entry(
    log_path: Path,
    entry_type: str,
    num: int,
    session_id: str,
    timestamp: str,
    model: str,
    body: str,
) -> None:
    short = _short_id(session_id)
    block = (
        f'\n[LOG_ENTRY type={entry_type} num={num} session={short}]\n'
        f'timestamp: {timestamp}\n'
        f'model: {model}\n\n'
        f'{body.rstrip()}\n\n'
    )
    with log_path.open('a', encoding='utf-8') as fh:
        fh.write(block)


def _extract_user_prompt(transcript_path: str) -> tuple[str, str]:
    """Read the transcript and return (prompt_text, created_at) for the last USER_INPUT."""
    tp = Path(transcript_path.replace('transcript.jsonl', 'transcript_full.jsonl'))
    if not tp.is_file():
        tp = Path(transcript_path)
    if not tp.is_file():
        return ('', '')

    last_prompt = ''
    last_ts = ''
    for line in tp.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get('type') == 'USER_INPUT':
            content = entry.get('content', '')
            # Strip the <USER_REQUEST>...</USER_REQUEST> wrapper if present
            if '<USER_REQUEST>' in content:
                start = content.find('<USER_REQUEST>')
                end = content.find('</USER_REQUEST>')
                if start != -1 and end != -1:
                    content = content[start + len('<USER_REQUEST>'):end].strip()
            last_prompt = content
            last_ts = entry.get('created_at', '')
    return (last_prompt, last_ts)


def _extract_last_response(transcript_path: str) -> tuple[str, str]:
    """Read the transcript and return (response_text, created_at) for the last PLANNER_RESPONSE."""
    tp = Path(transcript_path.replace('transcript.jsonl', 'transcript_full.jsonl'))
    if not tp.is_file():
        tp = Path(transcript_path)
    if not tp.is_file():
        return ('', '')

    last_response = ''
    last_ts = ''
    for line in tp.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get('type') == 'PLANNER_RESPONSE' and entry.get('source') == 'MODEL':
            content = entry.get('content', '')
            if content:
                last_response = content
                last_ts = entry.get('created_at', '')
    return (last_response, last_ts)


def handle_pre_invocation(payload: dict) -> None:
    """Fires before the model is called. Log the user prompt."""
    conversation_id = payload.get('conversationId', '')
    if not conversation_id:
        print('{}')
        return

    model = payload.get('modelName', 'unknown')
    transcript_path = payload.get('transcriptPath', '')
    invocation_num = payload.get('invocationNum', 0)

    # Only log prompt on invocation 0 (the first model call for a user turn)
    if invocation_num != 0:
        print('{}')
        return

    prompt_text, prompt_ts = _extract_user_prompt(transcript_path)
    if not prompt_text:
        print('{}')
        return

    now = _utc_now()
    ts = prompt_ts if prompt_ts else _iso_z(now)

    sp = _state_path(conversation_id)
    state = _read_state(sp)
    _ensure_log_header(state, conversation_id, model)
    state['last_model'] = model
    if not state.get('date'):
        state['date'] = now.strftime('%Y-%m-%d')

    # Check if we already logged this prompt (by comparing text hash)
    prompt_hash = str(hash(prompt_text))
    if state.get('last_prompt_hash') == prompt_hash:
        _write_state(sp, state)
        print('{}')
        return

    state['exchange_count'] = int(state.get('exchange_count', 0)) + 1
    num = state['exchange_count']
    if not state.get('first_prompt_time'):
        state['first_prompt_time'] = ts
    state['last_prompt_time'] = ts
    state['last_prompt_hash'] = prompt_hash
    state['pending_prompt_num'] = num

    log_path = Path(state['log_path'])
    _append_entry(log_path, 'PROMPT', num, conversation_id, ts, model, prompt_text)
    _update_frontmatter(log_path, state)
    _write_state(sp, state)
    print('{}')


def handle_stop(payload: dict) -> None:
    """Fires when the execution loop terminates. Log the final response."""
    conversation_id = payload.get('conversationId', '')
    if not conversation_id:
        print('{}')
        return

    model = payload.get('modelName', 'unknown')
    transcript_path = payload.get('transcriptPath', '')

    response_text, response_ts = _extract_last_response(transcript_path)
    if not response_text:
        print('{}')
        return

    now = _utc_now()
    ts = response_ts if response_ts else _iso_z(now)

    sp = _state_path(conversation_id)
    state = _read_state(sp)

    if not state.get('log_path'):
        _ensure_log_header(state, conversation_id, model)

    pending_num = state.get('pending_prompt_num')
    if not pending_num:
        pending_num = state.get('exchange_count', 1)

    # Check if we already logged this response
    response_hash = str(hash(response_text))
    if state.get('last_response_hash') == response_hash:
        _write_state(sp, state)
        print('{}')
        return

    state['last_response_hash'] = response_hash
    state['last_model'] = model

    log_path = Path(state['log_path'])
    _append_entry(log_path, 'RESPONSE', pending_num, conversation_id, ts, model, response_text)
    _update_frontmatter(log_path, state)
    _write_state(sp, state)
    print('{}')


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        print('{}')
        return 1

    # Antigravity hooks pass event context in the payload structure.
    # We determine the event type from the calling context (set by hooks.json).
    event = os.environ.get('AGY_HOOK_EVENT', '')

    if event == 'pre_invocation':
        handle_pre_invocation(payload)
    elif event == 'stop':
        handle_stop(payload)
    else:
        # Fallback: try to infer from payload keys
        if 'invocationNum' in payload:
            handle_pre_invocation(payload)
        elif 'terminationReason' in payload:
            handle_stop(payload)
        else:
            print('{}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
