import type {
  ElectronicSignatureAntecedent,
  ErpAntecedent,
  ErpPlatformId,
  SignatureProviderId,
  SiiAntecedent,
  SiiInvoiceMode,
  TenantIntegrations,
} from "./types";

export const SIGNATURE_PROVIDER_OPTIONS: { value: SignatureProviderId; label: string }[] = [
  { value: "", label: "Sin proveedor aún" },
  { value: "ecert", label: "e-Cert Chile" },
  { value: "acepta", label: "Acepta" },
  { value: "toc", label: "TOC / Trust" },
  { value: "firmagob", label: "FirmaGob / IGEF" },
  { value: "other", label: "Otro proveedor FEA" },
];

export const ERP_PLATFORM_OPTIONS: { value: ErpPlatformId; label: string }[] = [
  { value: "", label: "Sin plataforma" },
  { value: "softland", label: "Softland" },
  { value: "defontana", label: "Defontana" },
  { value: "nubox", label: "Nubox" },
  { value: "manager", label: "Manager" },
  { value: "sap", label: "SAP / Business One" },
  { value: "bsale", label: "Bsale" },
  { value: "other", label: "Otro ERP o software" },
];

export const SII_INVOICE_OPTIONS: { value: SiiInvoiceMode; label: string }[] = [
  { value: "", label: "Aún no definido" },
  { value: "honorarios", label: "Boletas de honorarios" },
  { value: "factura_electronica", label: "Factura electrónica" },
  { value: "ambos", label: "Honorarios y factura electrónica" },
];

export function emptySignatureAntecedent(): ElectronicSignatureAntecedent {
  return {
    hasCertificate: false,
    provider: "",
    providerOther: "",
    holder: "",
    expiresOn: "",
    usedFor: "",
  };
}

export function emptySiiAntecedent(): SiiAntecedent {
  return {
    hasSiiAccess: false,
    invoiceMode: "",
    office: "",
    notes: "",
  };
}

export function emptyErpAntecedent(): ErpAntecedent {
  return {
    hasErp: false,
    platform: "",
    platformOther: "",
    postsToSii: false,
    modules: "",
  };
}

export function emptyTenantIntegrations(): TenantIntegrations {
  return {
    signature: emptySignatureAntecedent(),
    sii: emptySiiAntecedent(),
    erp: emptyErpAntecedent(),
    updatedAt: null,
  };
}

export function normalizeTenantIntegrations(raw?: Partial<TenantIntegrations> | null): TenantIntegrations {
  const base = emptyTenantIntegrations();
  if (!raw) return base;
  return {
    signature: { ...base.signature, ...raw.signature },
    sii: { ...base.sii, ...raw.sii },
    erp: { ...base.erp, ...raw.erp },
    updatedAt: raw.updatedAt ?? null,
  };
}

export function signatureProviderLabel(id: SignatureProviderId, other = "") {
  if (id === "other" && other.trim()) return other.trim();
  return SIGNATURE_PROVIDER_OPTIONS.find((item) => item.value === id)?.label ?? "Sin proveedor";
}

export function erpPlatformLabel(id: ErpPlatformId, other = "") {
  if (id === "other" && other.trim()) return other.trim();
  return ERP_PLATFORM_OPTIONS.find((item) => item.value === id)?.label ?? "Sin plataforma";
}

export function siiInvoiceLabel(mode: SiiInvoiceMode) {
  return SII_INVOICE_OPTIONS.find((item) => item.value === mode)?.label ?? "Aún no definido";
}

export function integrationPreview(integrations: TenantIntegrations) {
  const signatureReady = integrations.signature.hasCertificate;
  const siiReady = integrations.sii.hasSiiAccess;
  const erpReady = integrations.erp.hasErp;
  const recorded = Boolean(signatureReady || siiReady || erpReady || integrations.updatedAt);
  return {
    recorded,
    signatureReady,
    siiReady,
    erpReady,
    siiPath: integrations.erp.hasErp && integrations.erp.postsToSii ? "erp" : siiReady ? "directo" : "pendiente",
  };
}
