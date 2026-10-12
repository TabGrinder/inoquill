# Repository and publishing

The source repository is [TabGrinder/inoquill](https://github.com/TabGrinder/inoquill). The app is hosted at [GitHub Pages](https://tabgrinder.github.io/inoquill/).

## Website

Pushes to `main` run the checks and deploy `dist/` through the Pages workflow. The workflow can also be run manually. Keep project archives, credentials and hosting metadata outside the public web root. See [Deployment](Deployment.md) for local and static hosting.

## Documentation

Edit `docs/wiki-data.json`, then run `npm run docs`. This generates both the embedded Wiki and the Markdown files in `wiki/`.

GitHub's separate Wiki is a different repository and is optional. To use it, initialize it in GitHub, clone `https://github.com/TabGrinder/inoquill.wiki.git`, copy the generated Markdown files into it, and commit and push them.

## Maintenance

- Keep the MIT license, attribution and use disclaimer with the source.
- Run `npm run check` and `npm run build` before publishing.
- Keep repository and Actions permissions limited to what the project needs.
- Enable private vulnerability reporting if available; otherwise provide a secure reporting channel.
- Public source can be downloaded, cloned and forked. The web app offers downloads of scripts and conversion reports.
