# GisseleGeo

Web app móvil de edición de imágenes con Seedream 5 Pro y generación de video con Seedance 2.5 mediante WaveSpeedAI.

## Qué incluye

- Acceso con Google y email mediante Supabase Auth.
- Administrador fijo: `geovanniv47@gmail.com` (validado en la función del servidor).
- Panel admin con usuarios recientes cuando se configura la service role.
- API key de WaveSpeed guardada únicamente en `sessionStorage`.
- Carga directa de imágenes a WaveSpeed con ticket temporal.
- Función Netlify que envía tareas y consulta su estado sin guardar ni registrar la key.
- Historial de resultados únicamente durante la sesión del navegador.

## Configuración pendiente antes de publicar

1. Crea un proyecto gratuito en Supabase.
2. En Authentication activa Email y Google.
3. En URL Configuration añade la URL local y la futura URL de Netlify como Redirect URLs.
4. En Netlify configura `SUPABASE_URL`, `SUPABASE_ANON_KEY` y, para listar usuarios en el panel, `SUPABASE_SERVICE_ROLE_KEY`.
5. No configures ninguna variable `WAVESPEED_API_KEY`: la escribe cada usuario dentro de la app.

Cuando llegue el momento de publicar, conecta el repositorio con Netlify. La configuración ya apunta a `dist` y `netlify/functions`.

## Desarrollo local

Usa Netlify Dev para ejecutar también las funciones:

```bash
npx netlify dev
```

La función de configuración necesita las variables de `.env` en local. No confirmes ese archivo en Git.

## Seguridad

- El puente solo admite los modelos definidos en código; no acepta URLs arbitrarias.
- Cada llamada valida primero el JWT de Supabase.
- La service role se usa únicamente dentro de la función de administración.
- Ninguna función imprime request bodies, API keys o tickets de carga.
