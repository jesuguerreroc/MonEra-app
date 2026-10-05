# MonEra – cómo instalar este código en tu proyecto

Estos archivos están pensados para copiarse **sobre tu proyecto `fylo` ya creado** (el de la Fase anterior).

## 1. Copiar archivos
Dentro de tu carpeta `fylo`:
- Reemplaza la carpeta `src/` completa por la de este zip.
- Reemplaza la carpeta `public/` (contiene logo e iconos de la PWA).
- Reemplaza `index.html` y `vite.config.ts`.
- Copia `firestore.rules` a la raíz.
- Borra lo que sobra de la plantilla: `src/App.css` y `src/assets/react.svg`.
- Tu `.env.local` NO se toca (sigue igual).

## 2. Instalar la única dependencia nueva
```bash
npm install -D vite-plugin-pwa
```
(react, firebase, react-router-dom, recharts, lucide-react y tailwind ya los instalaste.)

## 3. Reglas de Firestore
Firebase Console → Firestore Database → Reglas → pega el contenido de `firestore.rules` → Publicar.

## 4. Probar
```bash
npm run dev
```
Crea una cuenta en la pantalla de registro. Luego: Cuentas → Nueva → botón + para registrar un gasto.

## 5. Instalar en iPhone (necesita HTTPS)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # carpeta pública: dist | app de una sola página: Sí | GitHub automático: No
npm run build
firebase deploy
```
Abre la URL `https://TU-PROYECTO.web.app` en Safari → Compartir → "Añadir a pantalla de inicio".
