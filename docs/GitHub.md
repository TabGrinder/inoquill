# Publish under TabGrinder

> InoQuill v1.0.0 by TabGrinder

Prepare the repository, wiki and release without inventing a live URL.

> The first public release is v1.0 (SemVer 1.0.0). Development improvements stay within this version until TabGrinder approves the release. GitHub tags are separate from the hosting platform’s deployment history.

The suggested repository name is inoquill, owned by TabGrinder. The supplied ZIP is ready to import. This project has not been pushed to a GitHub repository on your behalf.

## Create the repository

- For the planned free GitHub Pages publication, create a public repository named inoquill. Public source can be downloaded, cloned and forked; removing download buttons does not prevent this. Import all prepared source files, including .github; exclude .openai hosting metadata.
- Set the description to: Browser-local Arduino keyboard sketch to DuckyScript 1.0, 2.0, and 3.0 converter with device presets and source tracing.
- Suggested topics: arduino, duckyscript, digikeyboard, keyboard-automation, security-awareness, ethical-hacking, static-analysis.
- Enable private vulnerability reporting and review issue, Actions and branch permissions.
- Run CI and inspect the release checklist before creating v1.0.0.

## Publish the GitHub wiki

The wiki is a separate Git repository. Create its first page through GitHub so that the wiki remote exists, then copy the generated wiki/ Markdown files into a clone of that wiki and commit them. The same canonical content powers the web wiki; npm run docs regenerates both.

```sh
git clone https://github.com/TabGrinder/inoquill.wiki.git
# Copy the contents of wiki/ into the cloned directory.
# Review the diff, then commit and push.
```

> The URLs above are publication instructions for the proposed repository, not a claim that the repository or wiki is already live.

## Release assets

- A release ZIP is optional. A public GitHub repository already allows source downloads; the app itself offers only script and review-report downloads.
- Use CHANGELOG.md and docs/Release-Review.md for release notes.
- Keep the MIT license and educational-use disclaimer visible.
- Do not add unverified “first ever”, security certification or “zero vulnerabilities” claims.

