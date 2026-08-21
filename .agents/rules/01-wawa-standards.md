# Reglas Globales de WAWA Transport

Estas reglas definen el comportamiento de cualquier agente de IA o IDE asistido (como SDD, Antigravity, Cursor, etc.) operando sobre este repositorio. 

**DEBES LEER Y OBEDECER ESTAS REGLAS ANTES DE ESCRIBIR CÓDIGO.**

## 1. Stack Tecnológico Estricto
- **Gestor de paquetes:** ÚNICAMENTE `pnpm`. Prohibido usar `npm` o `yarn`.
- **Backend:** NestJS con TypeScript estricto.
- **Frontend:** React + Vite.
- **Base de Datos:** Mongoose (MongoDB). **PROHIBIDO** el uso de Prisma, PostgreSQL o TypeORM.
- **Concurrencia:** Para bloqueos distribuidos (locks) se usa `ioredis` + `redlock`.

## 2. Arquitectura y Código Limpio (Clean Code)
- **Cero 'any':** Está estrictamente prohibido usar `any`. Usa tipado fuerte e interfaces que correspondan exactamente con los esquemas de Mongoose.
- **Desestructuración ES6:** Al retornar datos de servicios, usa siempre desestructuración (ej. `const { _id, __v, ...rest } = obj.toObject()`) para evitar exponer campos internos de MongoDB.
- **Responsabilidad Única:** Los controladores solo manejan HTTP. La lógica de negocio vive en los Servicios (`*.service.ts`).
- **Manejo de Errores:** Nunca tragues errores silenciosamente (`catch(e) {}`). Siempre arroja `HttpException` en los controladores con el código de estado correcto (400, 404, 409).

## 3. Integraciones Externas
- **Inteligencia Artificial:** Usar el SDK oficial `@google/genai`. La validación de las respuestas de los LLMs debe hacerse estrictamente mediante esquemas de **Zod** para evitar alucinaciones.
- **Mapas:** Usar `Mapbox GL JS` y la Directions API. Prohibido usar Leaflet.

## 4. Contenerización
- Todos los componentes deben ser nativamente compatibles con `docker-compose`. Las imágenes deben construirse en modo `multi-stage` basado en Alpine para mantener la eficiencia.
