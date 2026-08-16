# Licencia académica — checklist (etapa MVP)

> **Objetivo:** cerrar el tema legal de forma mínima y clara para concentrarse en el MVP.  
> **Licencia vigente:** [`LICENSE`](../LICENSE) (académica; no es licencia OSI todavía).

No sustituye asesoría legal ni normas de propiedad intelectual de la UNAB.  
Sirve como **lista de control del equipo** para no reabrir el debate en cada sprint.

---

## Estado actual (marcar y olvidar hasta post-MVP)

- [x] Copyright de ambos autores en `LICENSE`
- [x] Uso permitido: educativo / investigación / demo
- [x] Uso comercial y redistribución: requieren permiso escrito
- [x] Sin garantía (“tal cual”)
- [x] Contribuciones vía PR a `Dev` bajo los mismos términos
- [x] Nota de posible licencia OSI **después** (no ahora)
- [x] Aviso breve alineado en README ES/EN (hacer al publicar este doc)
- [ ] Confirmación verbal/mail con coautor (Alejandro) de que está de acuerdo
- [ ] (Opcional) Mencionar al profesor guía si la UNAB exige aviso de PI

---

## Qué NO hacer mientras el MVP esté vacío / en scaffold

| Evitar | Por qué |
|--------|---------|
| Cambiar a MIT/Apache “por si acaso” | Abre usos comerciales sin acuerdo de coautores |
| Decir “100% opensource” en la web/Netlify | Contradice el `LICENSE` académico |
| Perder semanas en CLA/abogados | El valor ahora es el MVP, no el packaging legal |
| Copiar código de terceros sin mirar su licencia | Contamina el repo académico |

---

## Checklist al aceptar un aporte externo

- [ ] El PR apunta a `Dev` (no a `main`)
- [ ] El aportante no exige otra licencia en el PR
- [ ] No se suben secretos ni datos de clientes reales
- [ ] Merge solo tras revisión del mantenedor
- [ ] Si el aporte es grande: recordarle en el Issue que rige `LICENSE` académico

---

## Checklist “más adelante” (post–Seminario 2 o `v1.0`) — no ahora

- [ ] Acuerdo escrito CL + AS sobre licencia OSI (MIT / Apache-2.0 / otra)
- [ ] Reemplazar `LICENSE` y actualizar badges README
- [ ] Anuncio en un release/tag (`v1.0.0` o similar)
- [ ] Revisar textos del sitio OpenEVM (Netlify) para que coincidan
- [ ] (Si aplica) política open-core vs. módulos premium

---

## Decisión de foco

**Hasta tener MVP usable:** no reabrir licencia salvo error factual en el texto.  
Cualquier Issue sobre “cambiar a MIT” → etiquetar `diferido-post-mvp` y seguir desarrollando.
