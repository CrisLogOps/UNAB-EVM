# Versioning & weekly tags

> **Primary doc (Spanish):** [versioning.md](./versioning.md)

## Official pattern

```text
vMAJOR.MINOR.PATCH[-channel][+YYYY.Www][+CODE.scope]
```

| Part | Meaning |
|------|---------|
| `MAJOR.MINOR.PATCH` | SemVer: seminar/product generation · capability · weekly fix |
| `-channel` | `dev` (branch `Dev`) · `staging` · *(omit = `main` / production)* |
| `+YYYY.Www` | ISO week of the advance |
| `+CODE.scope` | Owner initials + kebab-case improvement id |

### Member codes

| Code | Member |
|------|--------|
| `CL` | Cristian Lorca |
| `AS` | Alejandro Suárez |

### Weekly flow

```text
Dev (-dev tags) → staging (-staging tags) → main (vX.Y.Z production tags)
```

See the Spanish document for full rules, anti-patterns, and the latest tag table.
