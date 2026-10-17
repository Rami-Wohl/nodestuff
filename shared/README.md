# shared/

Tiny helpers reused by more than one lesson.

Rules for this folder:

- Nothing here may hide a mechanism a lesson is trying to teach. If a helper
  wraps the thing under study, inline it in the lesson instead.
- Keep each helper small enough to read in one screen.
- No dependencies.

| File | Purpose |
| --- | --- |
| `run-node.js` | Run a script in a fresh Node process and print its stdout/stderr/exit code. Used by lessons that compare several small programs side by side. |
