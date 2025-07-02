# Quotify - Setup Completo para Funcionalidad Total

## Estado Actual
✅ **App completamente construida y compilando**  
⚠️ **Requiere configuración de API keys para funcionalidad completa**

## Lo que funciona SIN API keys:
- Interfaz completa (three-column layout)
- Añadir URLs de YouTube
- Metadata scraping (título, canal, views, thumbnail)
- UI interactions, temas, navegación
- Sistema básico de quotes (crear/editar manualmente)

## Lo que REQUIERE API keys:

### 1. OpenAI API Key (ESENCIAL para transcripción)
**Costo:** ~$0.006 per minuto de audio

**Setup:**
1. Ir a https://platform.openai.com/api-keys
2. Crear cuenta (requiere tarjeta de crédito)
3. Crear nueva API key
4. Copiar key que empieza con `sk-...`

**En la app:**
1. `Cmd/Ctrl + K` → Settings
2. Pegar API key
3. Save

### 2. Google OAuth (OPCIONAL para export)
**Para exportar a Google Docs:**
1. Ir a https://console.cloud.google.com/
2. Crear proyecto
3. Habilitar Google Docs API
4. Crear credenciales OAuth 2.0
5. Configurar en `src/lib/googleDocs.ts`

## Instalación Completa:

```bash
# 1. Instalar yt-dlp (OBLIGATORIO)
brew install yt-dlp  # macOS
# o pip install yt-dlp

# 2. Clonar y setup
git clone https://github.com/tu-repo/quotify.git
cd quotify
npm install

# 3. Ejecutar
npm run tauri dev

# 4. Primera vez:
# - Abrir app
# - Cmd/Ctrl + K → Settings
# - Añadir OpenAI API key
# - Test con video corto
```

## Flujo de prueba completa:

1. **Añadir video:** Pegar URL de YouTube
2. **Ver metadata:** Título, canal, thumbnail aparecen
3. **Esperar transcripción:** ~30-60 segundos para video de 5 min
4. **Transcript aparece:** Con words sincronizados
5. **Seleccionar texto:** En transcript → "Extract Quote"
6. **Quote generado:** Con citation y deep-link
7. **Export:** Copy o Google Docs

## Costos estimados:
- **Video 5 min:** ~$0.03 USD
- **Video 30 min:** ~$0.18 USD  
- **Video 1 hora:** ~$0.36 USD

## Sin API key puedes:
- Probar toda la UI
- Ver como funciona el metadata scraping
- Crear quotes manualmente
- Testear todas las interactions

## Demo Mode:
Para testing sin API key, podrías añadir data mock en el código temporal.

**CONCLUSIÓN:** App está 100% lista, solo necesita API keys para la feature principal (transcripción).