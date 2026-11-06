# Owltime Local

Owltime Local is a static, browser-only version of the school scheduling app. It can be hosted on GitHub Pages and does not require PHP, a database, an account, or a server API. Catalogs, notes, and schedules are saved in the current browser's `localStorage`.

## Run and publish

For local testing, run `python -m http.server 8000` from this directory and open `http://localhost:8000`. The repository-level GitHub Actions workflow publishes only the static files required by the app from `owltime/`. In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The app's Bootstrap styles and icons are loaded from jsDelivr.

Legacy PHP source, Composer dependencies, SQL dumps, test data, and migration backups have been removed. The deployment workflow publishes only the static files required by the app. Use **Exportar backup** in the app to create new backups of data entered in this browser.

## Data limits

Local data belongs to one browser profile on one device. It is not encrypted, synchronized, or recoverable by the site if browser storage is cleared. Use **Exportar backup** regularly and store the downloaded file somewhere safe. The site does not provide secure authentication because all application logic runs on the client.
