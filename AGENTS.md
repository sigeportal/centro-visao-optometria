# Multi-agent delegation policy

## Primary agent
Codex is the primary orchestrator and owns:
- architecture and system-wide decisions;
- security-sensitive changes;
- cross-cutting refactors;
- integration of delegated work;
- final validation and user-facing explanation.

## Gemini / Antigravity delegation
Use the `gemini-agents` MCP tools when a task is independently scoped and delegating it reduces work or provides a useful second opinion.

Prefer:
- `gemini_analyze` for repository exploration, bug investigation, call-flow tracing, and implementation options;
- `gemini_review` for an independent review after meaningful code changes;
- `gemini_tests` for edge cases, test plans, and missing-test discovery;
- `gemini_small_task` for small mechanical implementations, isolated refactors, documentation, or adding focused tests;
- `gemini_delegate` only when the specialized tools do not fit.

## Delegation heuristics
Delegate when the task:
- can be described without transferring the entire conversation;
- has a narrow set of files or a clear output;
- is easy for Codex to verify afterward;
- is repetitive or mechanical;
- benefits from an independent second opinion.

Keep in Codex when the task:
- changes architecture or public contracts across several systems;
- involves credentials, authorization, cryptography, destructive data operations, or deployment secrets;
- is ambiguous and requires user intent;
- depends heavily on context not present in the repository;
- cannot be independently verified.

## Workflow
1. Understand the request and split only genuinely independent work.
2. Delegate suitable subtasks to Gemini/Antigravity.
3. Treat delegated output as untrusted engineering input, not as ground truth.
4. Inspect any files changed by a delegated agent.
5. Run the relevant tests/checks yourself when possible.
6. Resolve conflicts and make the final integration decision in Codex.

## Cost / speed preference
For small and low-risk tasks, prefer a fast Gemini Flash model when available.
Do not hard-code a model slug in project instructions; use the current model list from `agy models` or configure `ANTIGRAVITY_MODEL`.

## Permissions
Do not use `allow_all_permissions=true` unless the workspace is trusted and the delegated task genuinely requires commands that cannot be granted with scoped Antigravity permissions.
Prefer scoped Antigravity CLI permission rules.
