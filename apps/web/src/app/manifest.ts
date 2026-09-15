import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenEVM",
    short_name: "OpenEVM",
    description: "Control diario de avance, presupuesto y evidencias en terreno.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b4a44",
    theme_color: "#0b4a44",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
