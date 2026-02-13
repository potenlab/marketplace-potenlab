---
name: potenlab:hello
description: Confirm potenlab-workflow is installed and active
allowed-tools:
  - Read
---

Read the VERSION file at `{{POTENLAB_HOME}}/VERSION` to get the current version. Then respond with exactly:

> Potenlab Workflow is active. **potenlab-workflow** v{version} loaded successfully.

Do not add anything else.
