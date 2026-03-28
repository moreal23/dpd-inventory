# Legacy App Review Notes

Reviewed before the rewrite on 2026-03-28.

## Backend Findings

1. Passwords are stored in plaintext.
2. The Flask `secret_key` is hardcoded in source.
3. A default admin account is seeded in code.
4. App, database logic, auth, reporting, import/export, and HTML generation are all bundled into one file.
5. The production server path uses Flask's built-in development server on port 80.
6. Database schema changes are handled inline with `ALTER TABLE` calls rather than formal migrations.

## UI Findings

1. The original dashboard is feature-rich, but the template is monolithic and hard to maintain.
2. CSS and JavaScript live inline inside a single large template file.
3. There are visible character-encoding artifacts in labels and button text.
4. At least one function (`printSelectedLabels`) is duplicated.
5. The overall workflow is strong, but the interface gets crowded on smaller screens.

## Rewrite Decisions Taken Because Of This Review

- moved to a separate Cloudflare-native folder rather than patching the Flask app in place
- split backend logic into modules
- moved UI assets into dedicated static files
- removed default credentials entirely
- added password hashing and session storage
- redesigned the UI around clearer sections and responsive panels
