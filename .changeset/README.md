# Changesets

This folder holds the pending changes for the next release. One file per
change, written by `bun run changeset` or by hand.

The app is private and is never published to npm, so only `changeset version`
is used here. It reads these files, bumps the version in `package.json` and
writes the entries into `CHANGELOG.md`. Nothing publishes.

The format of a changeset file is a small front matter block naming the bump,
then a line of prose:

```markdown
---
"mesh-gradient-generator": minor
---

Add a three-dot menu for choosing how a new colour is picked.
```

Use `patch` for a fix, `minor` for a feature, `major` for a breaking change.
Read more at https://github.com/changesets/changesets
