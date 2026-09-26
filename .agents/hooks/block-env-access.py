#!/usr/bin/env python3
"""Block agent access to secret .env files (allow .env.example). Antigravity IDE hook."""

from __future__ import annotations

import json
import os
import re
import sys
from typing import Any

ALLOW = {"decision": "allow"}
DENY_REASON_USER = (
    "Blocked: .env files may contain secrets. "
    "Use .env.example for structure; do not read or edit live env files."
)
DENY_REASON_AGENT = (
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


def _paths_from_tool_call(tool_call: dict[str, Any]) -> list[str]:
    """Extract file paths from an AGY toolCall payload."""
    paths: list[str] = []
    args = tool_call.get("args", {})
    if not isinstance(args, dict):
        return paths

    # File-access tools: view_file, replace_file_content, write_to_file, etc.
    for key in ("AbsolutePath", "TargetFile", "SearchPath"):
        value = args.get(key)
        if isinstance(value, str):
            paths.append(value)

    # run_command: scan the CommandLine for .env references
    command = args.get("CommandLine")
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


def _deny() -> dict[str, str]:
    return {
        "decision": "deny",
        "reason": DENY_REASON_AGENT,
    }


def main() -> None:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        print(json.dumps(_deny()))
        sys.exit(0)

    if not isinstance(payload, dict):
        print(json.dumps(ALLOW))
        sys.exit(0)

    tool_call = payload.get("toolCall", {})
    if not isinstance(tool_call, dict):
        print(json.dumps(ALLOW))
        sys.exit(0)

    for path in _paths_from_tool_call(tool_call):
        if _is_secret_env_path(path):
            print(json.dumps(_deny()))
            sys.exit(0)

    print(json.dumps(ALLOW))
    sys.exit(0)


if __name__ == "__main__":
    main()
