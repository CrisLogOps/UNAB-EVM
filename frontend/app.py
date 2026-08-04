"""Dashboard provisional Streamlit (scaffold Seminario 1)."""

import streamlit as st

st.set_page_config(page_title="UNAB EVM — Curva S", layout="wide")
st.title("Plataforma SaaS EVM / Curva S — PYMEs Chile")
st.info(
    "Scaffold inicial. Conectar a la API (`API_BASE_URL`) cuando el motor EVM esté disponible."
)
st.markdown(
    """
    **Próximos módulos**
    - KPIs: PV, EV, AC, CPI, SPI, EAC, VAC
    - Curva S
    - Carga de avance y evidencia
    - Admin RBAC (Owner/CEO)
    """
)
