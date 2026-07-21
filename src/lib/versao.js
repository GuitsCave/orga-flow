/**
 * Versão do APLICATIVO (a release) e momento do build.
 * Injetadas pelo Vite a partir do package.json — ver vite.config.js.
 *
 * ⚠️ Não confundir com CURRENT_VERSION em modelo.js, que é a versão do FORMATO
 * DOS DADOS salvos. Publicar uma versão nova do app (1.5.1 → 1.6) não mexe nos
 * dados de ninguém; só uma mudança no formato exige migração.
 */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : null

/** Data do build em pt-BR (dd/mm/aaaa hh:mm), ou null se indisponível */
export function dataBuildFormatada() {
  if (!BUILD_DATE) return null
  try {
    return new Date(BUILD_DATE).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}
