---
name: nest-hexagonal-generator
description: Instrucciones estrictas para que la IA genere nuevos módulos en NestJS siguiendo el patrón de Arquitectura Limpia/Hexagonal de Wawa Transport.
---

# Skill: Generador de Módulos (Arquitectura Limpia WAWA)

Esta skill debe activarse cada vez que el usuario te pida crear una nueva Entidad, Módulo, o Flujo en el backend de Wawa Transport.

## 1. Reglas de Directorios (Hexagonal Light)
Nunca generes código usando el CLI de Nest (`nest g res`) porque ensucia la arquitectura. Debes crear los archivos manualmente respetando esta estructura:

1. **Infraestructura (Datos):** Los esquemas de Mongoose van en `src/infrastructure/database/mongoose/schemas/`.
2. **Aplicación (Lógica):** Los módulos, controladores y servicios van en `src/core/application/[entidad]/`.

## 2. Flujo de Trabajo Obligatorio
Si se solicita crear el dominio "Invoice", DEBES seguir este orden exacto:

### Paso 1: Schema de Mongoose
- Crea `invoice.schema.ts` en `infrastructure/database/mongoose/schemas/`.
- Usa `@Prop()` de `@nestjs/mongoose`.
- Si hay relaciones, usa `type: String, ref: 'OtraColeccion'` en lugar de ObjectIds crudos.
- Incluye siempre la configuración `transformConfig` para ocultar `_id` y `__v` y exponer `id`.

### Paso 2: Servicio (Core Business)
- Crea `invoices.service.ts` en `core/application/invoices/`.
- Inyecta el modelo usando `@InjectModel(Invoice.name)`.
- **Regla Estricta:** Si el método implica validación de concurrencia, TIENES que inyectar `RedlockService` y envolver la operación crítica en un `lock()`.

### Paso 3: Controlador (Transporte HTTP)
- Crea `invoices.controller.ts`.
- Mantén el controlador ultra-delgado. Solo inyecta el servicio, llama a los métodos y devuelve la respuesta.
- Atrapa los errores y lanza explícitamente `HttpException` (NUNCA retornes un error 500 crudo de Mongoose a la API).

### Paso 4: Zod DTOs
- Para validación de Body en POST/PUT, no uses `class-validator`. Define un esquema de **Zod** y valídalo en el controlador antes de pasar los datos al servicio.

## Ejemplo de Éxito
Tu objetivo final es que el módulo sea "Plug & Play", listo para ser inyectado en `app.module.ts` sin necesidad de refactorización humana.
