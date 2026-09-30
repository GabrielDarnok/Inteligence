# Contributing to Shadow Intelligence

Thanks for your interest in contributing! Here's how you can help.

## How to Contribute

1. **Fork** this repository.
2. **Clone** your fork locally.
3. Create a new **branch** for your feature or fix: `git checkout -b feat/my-feature`.
4. Make your changes, commit with clear messages.
5. **Push** to your fork and open a **Pull Request** against `main`.

## Development Setup

### Ingestion Engine (Python)

```bash
cd ingestion
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

You'll need a `.env` file with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`. See the README for details.

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

You'll need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY` in your environment.

## Adding a New Connector

1. Create a new file in `ingestion/connectors/` (e.g. `my_source.py`).
2. Subclass `BaseConnector` from `base_connector.py`.
3. Implement the `fetch()` method to return a list of normalized evidence records.
4. Register the connector in `ingestion/registry.py`.
5. Add the source metadata to the `sources` table in Supabase.
6. Add the connector slug to the GitHub Actions matrix in `.github/workflows/ingestion.yml`.

## Code Style

- **Python**: Follow PEP 8. Use `structlog` for logging.
- **TypeScript/React**: Use the existing design system variables (see `globals.css`). No Tailwind utility classes outside of what's already established.

## Reporting Bugs

Open an [Issue](https://github.com/GabrielDarnok/Shadow-Intelligence/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Logs or screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
