# Contributing to UNAB-EVM / OpenEVM

The project is in **active Phase 2 development** and welcomes community contributions **under code control**: every external change is reviewed before it can reach production (`main`).

> **Spanish (primary):** [CONTRIBUTING.md](./CONTRIBUTING.md)

There may be a single active maintainer; the workflow still ensures **no external change lands in production without review and validation**.

---

## Principles

1. **Protected production** — `main` only receives changes already validated on `staging`.
2. **Human review** — third-party work enters via **Pull Request** and must be approved by a maintainer.
3. **Small and clear** — prefer focused PRs with one goal.
4. **Traceability** — Issue (what/why) + PR (how) + weekly tags when applicable.

```text
Your fork / branch
      │
      ▼
PR → Dev          (integration; maintainer review)
      │
      ▼
PR → staging      (pre-production validation; maintainers only)
      │
      ▼
PR → main         (production; maintainers only)
```

External contributors **propose** into `Dev`.  
Maintainers **promote** `Dev` → `staging` → `main`.

---

## Before you code

1. Read [README.en.md](./README.en.md) / [README.md](./README.md).
2. Skim [`docs/`](./docs/) for domain rules.
3. Find or open an **Issue** first (avoid surprise PRs).
4. Comment that you want to take it; wait for maintainer OK on large changes.

---

## Contribution flow

```bash
git clone https://github.com/<your-user>/UNAB-EVM.git
cd UNAB-EVM
git remote add upstream https://github.com/CrisLogOps/UNAB-EVM.git
git fetch upstream
git checkout -b feat/my-change upstream/Dev
```

Open a Pull Request with **base = `Dev`**.  
Maintainers handle promotion to `staging` and `main` after validation.

Versioning: [`docs/versioning.md`](./docs/versioning.md).

---

## Maintainer review checklist

- Scope matches the Issue  
- Respects EV / labor locks, retainage, and RBAC  
- No secrets or permission bypass  
- Docs updated when rules/API change  

---

## License

By contributing, you agree your work is published under this repository’s [`LICENSE`](./LICENSE) (**academic terms** for this stage).  
The project is not under an OSI open-source license yet; authors may adopt one later by agreement.

Checklist: [`docs/license-academic.md`](./docs/license-academic.md).
