# For Four Chocolate — colonna sonora e segnali di allerta
**22 ottobre 2026 · richiesta dell'utente · implementazione delegata al collaboratore `ilconsulentelogistico-hue`.**

## Asset musicale già caricato — obbligatorio usarlo
- **Brano:** [assets/audio/for-four-chocolate.mp3](./assets/audio/for-four-chocolate.mp3)
- È la canzone originale **«For Four Chocolate» fornita dall'utente** il 22/10/2026, durata circa **3 min 19,6 s**.
- **Versione pubblicata ottimizzata per web:** MP3 stereo 80 kbps, 44,1 kHz, **1.996.322 byte**, derivata dal file MP3 192 kbps fornito in chat (4.790.637 byte). La versione fornita è stata ricodificata per consentire l'upload e un caricamento mobile più leggero: **non è una copia bit-per-bit del master**. Non cambiare brano, non sostituirlo con musica generica. Conservare titolo e attribuzione all'utente.
- **Nessun asset binario dell'audio va rigenerato/trascritto dal collaboratore**: il file esiste già su `main`. La sua integrazione in runtime invece è **DA FARE**.

## 1. Soundtrack nel gameplay e durante i finali
1. La canzone parte **dopo un'interazione esplicita con PRESS START** (vincolo di autoplay web/mobile), mai automaticamente prima del primo tap. Deve ripetersi con un **loop continuo** nella fase giocabile senza creare nuove istanze audio per ogni evento e senza sovrapporsi a se stessa.
2. **Gameplay:** musica di sottofondo **molto bassa** (es. gain di partenza `0.10–0.16` su scala 0–1; tarare all'ascolto su smartphone), abbastanza da percepirla senza coprire gameplay e allarmi. Non alzare la traccia ogni volta che si prende una cioccolata.
3. **Vittoria / uscita volontaria:** quando la partita passa al finale positivo, alzare **progressivamente** il volume della *stessa traccia* (es. in 1,5–2,5 secondi fino a circa `0.55`, tarabile): la canzone diventa colonna sonora del momento di festa e risultato.
4. **Sconfitta / cattura:** stessa crescita progressiva della musica durante il game over/cutscene, con **ducking automatico** della colonna sonora quando il poliziotto pronuncia la battuta in ceco (o durante i relativi sottotitoli/dialogo), e rialzo subito dopo per la scala mobile, multa/cameo e schermata risultato. Anche durante la sconfitta la canzone **deve alzarsi**, non tacere.
5. Transizioni senza scatti/click, fade in/out quando si riavvia o si ritorna a Start. Se l'utente salta la cutscene, il risultato deve conservare un livello musicale coerente. Non far ripartire la canzone dal secondo zero a ogni cambio scena, a meno che la regia lo richieda esplicitamente.
6. **Audio mobile UX:** pulsante sempre accessibile `🔊/🔇 Musica` o regolazione essenziale (musica ed effetti almeno disattivabili), preferenza ricordata in `localStorage`. Il mute non deve essere ignorato dalle cutscene; pausa e visibilità pagina devono evitare audio non richiesto. Il motore del gioco deve restare giocabile anche se il caricamento del MP3 fallisce.
7. Prestazioni e memoria: precaricamento ragionevole (no 3 copie della traccia), promesse `audio.play()` gestite, fallback in caso di browser senza audio. Niente invio del file a servizi esterni.

## 2. Due effetti di allerta in stile stealth PS1 / Metal Gear — ORIGINALI
L'utente chiede **due rumori distinti di allerta, evocativi di Metal Gear**, e l'**icona `!` sopra la testa** degli agenti quando vengono allertati. Non importare o copiare campioni audio originali di *Metal Gear Solid* senza licenza: **sintetizzare due brevi effetti propri**, riconoscibili in-game, per esempio con Web Audio API / oscillator + envelope, oppure asset creati ex novo:
- **SFX A — `!` avvistamento / furto visto:** segnale secco e alto, corto e incisivo, su evento `witnessed_theft` / guardia che intercetta Ipno durante il prelievo o CCTV che lo vede. Deve attivare immediatamente una **`!` evidente sopra la testa del primo agente che riceve l'allarme**, e aggiornare HUD/minimappa. Se la fonte è una CCTV, la guardia chiamata mostra la `!` quando riceve l'allerta.
- **SFX B — allarme rinforzi / inseguimento:** secondo rumore diverso, più urgente o più grave/doppio impulso, emesso quando si passa all'effettivo stato di `pursuit` o arrivano le guardie di rinforzo. Evitare di farlo partire ogni frame o a ogni ripianificazione dei path. In modalità `searching` può apparire una `?` facoltativa con cue tenue, ma **i due suoni chiesti sono obbligatori**.
- Un evento deve generare **al massimo una riproduzione di ciascun SFX per transizione**, con `cooldown`/deduplicazione per non creare sirene continue durante un inseguimento. SFX udibili sopra la musica bassa, ma limitati in volume in modo da non risultare fastidiosi.
- La `!` **esiste già nella progressione della PR #106**: verificare e **migliorare quella**, non inserirne una seconda sovrapposta. L'icona deve comparire **sopra la testa** di guardie in alert/chase, temporizzata e leggibile rispetto all'orientamento della camera e alla scala sprite anche in landscape Android.
- Non far apparire `!` o suonare un allarme per la semplice presenza visibile di Ipno tra gli scaffali: **camminare in vista è lecito**. La reazione nasce dal **furto visto durante `PRENDI`**, non dal normale passaggio.

## 3. Integrazione e collaudi richiesti
- [ ] Parte lo stesso MP3 approvato dal **PRESS START** ufficiale ([issue #109](https://github.com/CzekUns/Effettokarmagra/issues/109)), con loop a basso volume durante il gioco.
- [ ] **Vittoria** → fade up udibile e fluido; **cattura** → fade up analogo, ma attenuazione durante battuta e rialzo successivo.
- [ ] Due SFX originali distinti, uno per avvistamento e uno per inseguimento/rinforzi. `!` sincronizzata sopra gli agenti; zero effetti ripetuti continuamente.
- [ ] Mute funziona anche su mobile/cutscene; tasti touch sufficientemente grandi; blocco autoplay gestito senza errori console.
- [ ] Test JS/Node della state machine audio (routing eventi e cooldown) e browser reale Chromium desktop + viewport touch landscape, screenshot e annotazioni delle fasi; test su Android fisico se disponibile, altrimenti dichiararlo.
- [ ] **Nessuna regressione** della start screen, dei due finali animati a Praga e del pulsante WhatsApp su entrambi gli esiti.
- [ ] Aprire **PR dedicata**, aggiornare `WORK_LOG.md`, e segnalare l'esito senza fare merge autonomo.

**Regola grafica:** la canzone non modifica l'unico stile ufficiale del gameplay. Le icone `!` sono UI/feedback e non richiedono una nuova art direction.
