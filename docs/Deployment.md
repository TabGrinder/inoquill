# Local and static deployment

> InoQuill v1.0.0 by TabGrinder

Serve the browser app without a conversion backend.

## Local server

```sh
npm start
# 127.0.0.1:3000
# Optional: PORT=8080 npm start
```

The default bind address is loopback. On PowerShell set $env:PORT=8080 before npm start. Set HOST only when intentionally exposing a development server to other hosts. The server permits GET and HEAD, serves supported public assets, rejects hidden files, and checks resolved paths against the public root.

## Static hosting

Deploy dist/ only. index.html uses relative URLs, so it works from a repository subpath. No conversion API, database, server secrets or account connection is required. Browser modules, the worker and text assets must have correct MIME types.

## Security headers

The HTML includes a restrictive CSP for fetch destinations. dist/_headers supplies a header template for compatible static hosts. The local Node server also applies header protections. GitHub Pages does not apply arbitrary _headers files: configure headers through a capable host or proxy if response-level frame protection is required. Verify headers on the actual host instead of assuming a template is enforced.

## Publishing to GitHub Pages

- Push the prepared repository to your chosen TabGrinder repository.
- If the included Pages workflow is desired, enable GitHub Pages with GitHub Actions as its source.
- Push updates to main, or run the Pages workflow manually. Its checks must pass before deployment.
- Confirm modules, worker, relative links and downloads work at the repository subpath.

The Pages workflow deploys pushes to main after validation; manual runs are also available. Hosting access and logs are provider behavior; InoQuill itself does not store or transmit sketches.

> The included Node server is for local development. It restricts Host names to loopback names and the bound address, rejects cross-site browser requests, and serves regular files up to 5 MiB. Keep dist trusted and free of secrets. Custom hostnames or reverse proxies require a separate production hosting configuration; this server does not provide authentication.

