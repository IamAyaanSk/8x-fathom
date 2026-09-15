#!/usr/bin/env python3
"""Append prompt/response pairs to .agent-logs/ for 8x assignment capture."""

from __future__ import annotations

import fcntl
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LOGS_DIR = REPO_ROOT / '.agent-logs'
STATE_DIR = LOGS_DIR / '.state'
AUTHOR = os.environ.get('AGENT_LOG_AUTHOR', 'IamAyaanSk')
TOOL = 'cursor'
PROJECT = '8x-fathom'


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso_z(dt: datetime) -> str:
    return dt.strftime('%Y-%m-%dT%H:%M:%S.') + f'{dt.microsecond // 1000:03d}Z'


def _short_session_id(session_id: str) -> str:
    return session_id.split('-')[0] if session_id else 'unknown'


def _model_name(payload: dict) -> str:
    model_id = payload.get('model_id')
    if isinstance(model_id, str) and model_id.strip():
        return model_id.strip()
    model = payload.get('model')
    if isinstance(model, str) and model.strip():
        return model.strip()
    return 'unknown'


def _state_path(conversation_id: str) -> Path:
    safe = conversation_id.replace('/', '_')
    return STATE_DIR / f'{safe}.json'


def _lock_state(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    fh = path.open('a+', encoding='utf-8')
    fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
    return fh


def _read_state(fh) -> dict:
    fh.seek(0)
    raw = fh.read().strip()
    if not raw:
        return {}
    return json.loads(raw)


def _write_state(fh, state: dict) -> None:
    fh.seek(0)
    fh.truncate()
    json.dump(state, fh, indent=2)
    fh.flush()


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
    short = _short_session_id(session_id)

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


def _update_frontmatter(log_path: Path, state: dict) -> None:
    text = log_path.read_text(encoding='utf-8')
    if not text.startswith('---\n'):
        return

    end = text.find('\n---\n', 4)
    if end == -1:
        return

    body = text[end + 5 :]
    exchanges = state.get('exchange_count', 0)
    model = state.get('last_model') or 'unknown'
    first_pt = state.get('first_prompt_time') or ''
    last_pt = state.get('last_prompt_time') or ''

    front = f"""---
session_id: {state.get('session_id', '')}
date: {state.get('date', '')}
author: {AUTHOR}
model: {model}
tool: {TOOL}
project: {PROJECT}
total_exchanges: {exchanges}
first_prompt_time: {first_pt}
last_prompt_time: {last_pt}
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
    short = _short_session_id(session_id)
    block = (
        f'\n[LOG_ENTRY type={entry_type} num={num} session={short}]\n'
        f'timestamp: {timestamp}\n'
        f'model: {model}\n\n'
        f'{body.rstrip()}\n\n'
    )
    with log_path.open('a', encoding='utf-8') as fh:
        fh.write(block)


def _flush_pending_response(state: dict) -> None:
    pending_num = state.get('pending_prompt_num')
    pending_text = state.get('pending_response_text')
    if not pending_num or pending_text is None:
        return
    if state.get('last_logged_response_num') == pending_num:
        return

    log_path = Path(state['log_path'])
    session_id = state['session_id']
    ts = state.get('pending_response_time') or _iso_z(_utc_now())
    model = state.get('pending_response_model') or state.get('last_model') or 'unknown'
    _append_entry(log_path, 'RESPONSE', pending_num, session_id, ts, model, pending_text)
    state['last_logged_response_num'] = pending_num
    state['pending_response_text'] = None
    state['pending_prompt_num'] = None
    _update_frontmatter(log_path, state)


def handle_session_start(payload: dict) -> None:
    session_id = payload.get('session_id') or payload.get('conversation_id')
    if not isinstance(session_id, str) or not session_id:
        return

    path = _state_path(session_id)
    fh = _lock_state(path)
    try:
        state = _read_state(fh)
        if not state.get('log_path'):
            _ensure_log_header(state, session_id, 'unknown')
            started = _utc_now()
            state['date'] = started.strftime('%Y-%m-%d')
            _write_state(fh, state)
    finally:
        fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
        fh.close()

    print('{}')


def handle_before_submit_prompt(payload: dict) -> None:
    conversation_id = payload.get('conversation_id')
    if not isinstance(conversation_id, str) or not conversation_id:
        print(json.dumps({'continue': True}))
        return

    prompt = payload.get('prompt')
    if not isinstance(prompt, str):
        prompt = ''

    model = _model_name(payload)
    now = _utc_now()
    ts = _iso_z(now)

    path = _state_path(conversation_id)
    fh = _lock_state(path)
    try:
        state = _read_state(fh)
        _ensure_log_header(state, conversation_id, model)
        state['last_model'] = model
        if not state.get('date'):
            state['date'] = now.strftime('%Y-%m-%d')

        _flush_pending_response(state)

        state['exchange_count'] = int(state.get('exchange_count', 0)) + 1
        num = state['exchange_count']
        if not state.get('first_prompt_time'):
            state['first_prompt_time'] = ts
        state['last_prompt_time'] = ts

        log_path = Path(state['log_path'])
        _append_entry(log_path, 'PROMPT', num, conversation_id, ts, model, prompt)
        state['pending_prompt_num'] = num
        state['pending_response_text'] = None
        _update_frontmatter(log_path, state)
        _write_state(fh, state)
    finally:
        fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
        fh.close()

    print(json.dumps({'continue': True}))


def handle_after_agent_response(payload: dict) -> None:
    conversation_id = payload.get('conversation_id')
    if not isinstance(conversation_id, str) or not conversation_id:
        return

    text = payload.get('text')
    if not isinstance(text, str):
        text = ''

    model = _model_name(payload)
    ts = _iso_z(_utc_now())

    path = _state_path(conversation_id)
    fh = _lock_state(path)
    try:
        state = _read_state(fh)
        if not state.get('log_path'):
            _ensure_log_header(state, conversation_id, model)
        state['pending_response_text'] = text
        state['pending_response_model'] = model
        state['pending_response_time'] = ts
        if state.get('pending_prompt_num') is None:
            state['pending_prompt_num'] = state.get('exchange_count')
        _write_state(fh, state)
    finally:
        fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
        fh.close()


def handle_stop(payload: dict) -> None:
    conversation_id = payload.get('conversation_id')
    if not isinstance(conversation_id, str) or not conversation_id:
        print('{}')
        return

    path = _state_path(conversation_id)
    fh = _lock_state(path)
    try:
        state = _read_state(fh)
        if state.get('log_path'):
            _flush_pending_response(state)
            log_path = Path(state['log_path'])
            _update_frontmatter(log_path, state)
        _write_state(fh, state)
    finally:
        fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
        fh.close()

    print('{}')


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 1

    event = payload.get('hook_event_name', '')
    if event == 'sessionStart':
        handle_session_start(payload)
    elif event == 'beforeSubmitPrompt':
        handle_before_submit_prompt(payload)
    elif event == 'afterAgentResponse':
        handle_after_agent_response(payload)
    elif event == 'stop':
        handle_stop(payload)
    else:
        print('{}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
