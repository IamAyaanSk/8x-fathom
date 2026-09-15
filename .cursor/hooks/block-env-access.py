#!/usr/bin/env python3
"""Block agent access to secret .env files (allow .env.example)."""

from __future__ import annotations

import json
import os
import re
import sys
from typing import Any

ALLOW = {"permission": "allow"}
DENY_USER = (
    "Blocked: .env files may contain secrets. "
    "Use .env.example for structure; do not read or edit live env files."
)
DENY_AGENT = (
    "Do not read, write, or shell-access .env files (secrets). "
    "Use .env.example or ask the user to paste non-secret config."
)


def _is_secret_env_path(path: str) -> bool:
    if not path:
        return False
    name = os.path.basename(path.rstrip("/"))
    if name == ".env":
        return True
    if name.startswith(".env.") and name != ".env.example":
        return True
    return False


def _paths_from_payload(payload: dict[str, Any]) -> list[str]:
    paths: list[str] = []

    file_path = payload.get("file_path")
    if isinstance(file_path, str):
        paths.append(file_path)

    for attachment in payload.get("attachments") or []:
        if not isinstance(attachment, dict):
            continue
        ap = attachment.get("file_path")
        if isinstance(ap, str):
            paths.append(ap)

    tool_name = payload.get("tool_name")
    tool_input = payload.get("tool_input")
    if isinstance(tool_name, str) and isinstance(tool_input, dict):
        for key in ("path", "file_path"):
            value = tool_input.get(key)
            if isinstance(value, str):
                paths.append(value)

    command = payload.get("command")
    if isinstance(command, str):
        paths.extend(_env_paths_in_shell_command(command))

    return paths


# Rough extraction of .env paths from shell commands (not .env.example).
_SHELL_ENV = re.compile(
    r"(?:^|[\s'\"`=])(?P<p>(?:[^\s'\"`]+/)*\.env(?:\.[^/\s'\"`]+)?)(?=[\s'\"`]|$)"
)


def _env_paths_in_shell_command(command: str) -> list[str]:
    found: list[str] = []
    for match in _SHELL_ENV.finditer(command):
        segment = match.group("p")
        if segment.endswith(".env.example") or "/.env.example" in segment:
            continue
        base = os.path.basename(segment)
        if base == ".env" or (base.startswith(".env.") and base != ".env.example"):
            found.append(segment)
    if re.search(r"(?:^|[\s'\"'/=])\.env(?:[\s'\"./]|$)", command):
        if ".env.example" not in command and not found:
            found.append(".env")
    return found


def _deny(extra_agent: str | None = None) -> dict[str, str]:
    out: dict[str, str] = {
        "permission": "deny",
        "user_message": DENY_USER,
    }
    if extra_agent:
        out["agent_message"] = extra_agent
    else:
        out["agent_message"] = DENY_AGENT
    return out


def main() -> None:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        print(json.dumps(_deny("Hook received invalid JSON; blocking by policy.")))
        sys.exit(0)

    if not isinstance(payload, dict):
        print(json.dumps(ALLOW))
        sys.exit(0)

    for path in _paths_from_payload(payload):
        if _is_secret_env_path(path):
            print(json.dumps(_deny()))
            sys.exit(0)

    print(json.dumps(ALLOW))
    sys.exit(0)


if __name__ == "__main__":
    main()
