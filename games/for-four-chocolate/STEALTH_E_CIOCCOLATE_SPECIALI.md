# Stealth e Ciokospira — revisione del 22 ottobre 2026

Questa revisione riguarda la demo giocabile `reference-play.html`. Si gioca in orizzontale sul telefono; la grafica della scena e dei personaggi continua a seguire soltanto `references/gameplay-mgs-vr-artboard.webp`.

## Comandi

| Azione | Tastiera | Touch |
|---|---|---|
| Movimento | WASD o frecce | Levetta sinistra |
| Accovacciata, con un tocco per stato | C | Pulsante ACCOVACCIATI / IN PIEDI |
| Scatto | Shift tenuto | Pulsante SCATTO tenuto |
| Prelievo | E tenuto | PRENDI tenuto |
| Telecamera | Levetta in alto a destra | La stessa levetta |
| Zoom | + e − | + e − |

La levetta della telecamera ruota e inclina la vista. I testi dell'interfaccia non si selezionano con un trascinamento.

## Regole

- Ipno accovacciato cammina più piano; uno scaffale basso o la cassa lo nasconde alla guardia se si trova davvero dietro al mobile. Il bordo esterno della visuale POLICIE si estende del 20% ai lati e riconosce soltanto Ipno in piedi. Nella parte centrale, la prima metà è vista ravvicinata e la seconda metà è vista lontana. Le CCTV conservano la propria visuale.
- Dopo 15 cioccolate Ipno si allarga gradualmente; una guardia che lo vede nella metà vicina riconosce il bottino e lo insegue. Uno scatto è udibile da una guardia a meno di 2,7 m anche senza contatto visivo. La sola camminata vista resta consentita.
- Le pattuglie scelgono mete variabili, cercano l'ultima posizione per circa 14,5 secondi e la sicurezza sale a soglie più ravvicinate. Cioccolate normali e speciali compaiono solo su ripiani liberi; il rifornimento continua senza limite e l'uscita rimane disponibile in ogni momento.
- La Ciokospira appare occasionalmente. Al ritrovamento il gioco si ferma e mostra la confezione: il giocatore può soltanto premere **MANGIALA**. L'esito è nascosto fino a quel momento. Vale una cioccolata, poi può aggiungere o togliere cinque pezzi.

| Bonus possibili | Malus possibili |
|---|---|
| Passo più veloce per 16 s | Passo più lento per 16 s |
| Invisibilità per 16 s | Prelievo più lento per 16 s |
| Prelievo più veloce per 16 s | Sospetto +2 livelli |
| Sospetto −1 livello | −5 cioccolate, con minimo zero |
| +5 cioccolate | Macchie per 14 s: le guardie che le vedono le seguono |

Il livello di sospetto modifica la sorveglianza delle zone e l'allerta corrente. Una variazione del punteggio non rimuove telecamere e guardie già entrate in servizio.

Il disegno della Ciokospira è un asset nuovo derivato dalla stessa tavola approvata: viola, oro e arancio delle confezioni sugli scaffali. È una proposta grafica da giudicare nella PR insieme agli screenshot reali; non modifica i personaggi o la scenografia approvati.
