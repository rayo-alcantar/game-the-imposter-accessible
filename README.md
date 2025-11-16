# Impostor – Juego web en tiempo real

Aplicación completa en Next.js + Socket.IO para organizar partidas del clásico juego social “El Impostor”. Todo el estado vive en memoria del servidor con una capa de dominio separada para que sea sencillo migrar a Redis o a cualquier otra base en el futuro.

## Características principales

- Creación de partidas con contraseña opcional y enlace/código compartible.
- Hasta **20 personas** por sala, con roles y palabras asignadas automáticamente.
- Votación final solo para civiles y conjetura simultánea del impostor (con comparación normalizada para ignorar mayúsculas o acentos).
- Resultados claros que revelan al impostor y muestran si ganó, perdió o empató.
- Reinicio controlado: solo se permite cuando hay al menos 3 personas conectadas.
- Limpieza automática de partidas inactivas para mantener el consumo de memoria al mínimo.
- Interfaz accesible con regiones `aria-live`, botones reales y navegación por teclado.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Next.js App Router (React + TypeScript)
- **Tiempo real:** Socket.IO
- **Estado del dominio:** módulos puros en `src/domain`
- **Estilos:** CSS personalizado en `src/app/globals.css`

## Scripts

```bash
npm install        # instala dependencias
npm run dev        # Next + Socket.IO con recarga en caliente
npm run build      # compila la app para producción
npm start          # ejecuta la app compilada (requiere build previo)
```

El servidor HTTP personalizado vive en `server.ts`, donde se monta Next.js y se inicializa Socket.IO (con limpieza periódica de partidas antiguas).

## Estructura relevante

- `server.ts`: arranque del servidor HTTP + Socket.IO.
- `src/domain/`: tipos, almacenamiento en memoria (`gameStore`) y lógica (`gameLogic`, `wordList`).
- `src/server/socketServer.ts`: eventos en tiempo real, serialización por jugador y limpieza de juegos.
- `src/app/page.tsx`: pantalla de inicio para crear o unirse.
- `src/app/game/[gameId]/page.tsx`: experiencia completa de juego.
- `src/components/`: formularios reutilizables.
- `phrases.txt`: lista adicional solicitada.

## Flujo básico

1. El host crea la sala indicando su nombre, número de jugadores y contraseña opcional.
2. Las demás personas ingresan el código o enlace, escriben su nombre y esperan en el lobby.
3. Al llenarse el cupo, el host inicia: se asignan roles/palabras y se activan 3 rondas de pista verbal.
4. Tras las rondas, los civiles votan y el impostor escribe su conjetura.
5. El servidor resuelve automáticamente al ganador y muestra quién era el impostor.
6. Si aún hay al menos 3 personas conectadas, el host puede reiniciar inmediatamente con nuevas palabras.

## Accesibilidad

- HTML semántico (`<main>`, `<header>`, `<section>`, `<form>`, `<ul>`).
- Regiones con `aria-live` para cambios de fase y resultados.
- Botones y campos reales, navegables por teclado sin trampas de foco.
- Mensajería clara para roles, turnos, pendientes de voto y resultados.

Listo para jugar, extender o llevar a producción. ¡Diviértete descubriendo al impostor!

