export const PUBLIC_GAME_URL='https://czekuns.github.io/Effettokarmagra/games/for-four-chocolate/reference-play.html';

export function buildWhatsAppShareText(result, gameUrl=PUBLIC_GAME_URL) {
  if(!['escaped','caught'].includes(result.outcome))throw new Error('Esito sconosciuto');
  const chocolates=Math.max(0,Math.floor(result.chocolates));
  if(result.outcome==='escaped'){
    return `🍫 For Four Chocolate! Sono uscito dal supermercato di Praga con ${chocolates} cioccolate (${result.crowns} Kč)! 🥳 Il mio record è ${result.best} Kč. Riesci a fare meglio? ${gameUrl}`;
  }
  return `🚨 For Four Chocolate! Mi hanno beccato a Praga con ${chocolates} cioccolate. Multa: ${result.fine} Kč; saldo: ${result.crowns} Kč. 😅 Il record resta ${result.best} Kč. Tu riesci a farla franca? ${gameUrl}`;
}

export function buildWhatsAppShareUrl(result, gameUrl=PUBLIC_GAME_URL) {
  return `https://wa.me/?text=${encodeURIComponent(buildWhatsAppShareText(result,gameUrl))}`;
}
