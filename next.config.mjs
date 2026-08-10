import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    {
      url: "/~offline",
      revision: process.env.VERCEL_GIT_COMMIT_SHA ?? "offline-v1",
    },
  ],
  disable: process.env.NODE_ENV === "development",
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Autoriza o host LAN usado para validar a aplicação em dispositivos reais.
  // Sem isso, o Next.js bloqueia HMR e outros recursos internos no modo dev.
  allowedDevOrigins: ["127.0.0.1", "192.168.18.111"],
};

export default withSerwist(nextConfig);
