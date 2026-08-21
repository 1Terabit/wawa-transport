# Bitácora de Decisiones Arquitectónicas (ADR)

Este documento registra mi criterio durante el desarrollo del MVP de Wawa Transport, destacando dónde rechacé las propuestas de la IA y qué decisiones tomé por cuenta propia.

## 1. Patrón Arquitectónico (Decisión Propia)
- **Propuesta inicial de la IA:** Una arquitectura estándar de NestJS (Controladores invocando Servicios que hablan directo con Mongoose).
- **Mi decisión:** La rechacé. Impuse una **Arquitectura Hexagonal (Puertos y Adaptadores)**.
- **Por qué:** La IA suele optar por el camino más rápido, acoplando la lógica de negocio al framework y a la base de datos. Wawa Transport maneja logística crítica (vehículos, rutas, colisiones horarias); esa lógica no puede depender de si uso MongoDB hoy o PostgreSQL mañana. Forcé la división estricta en `core` (Dominio y Aplicación) e `infrastructure` (Mongo, Redis). Generé las skills en `.agents` para obligar a la IA a seguir esta regla.

## 2. Prevención de Race Conditions (Decisión Propia)
- **Mi decisión:** Implementé `redlock` (Redis) en el endpoint de asignación de Duties.
- **Por qué:** Cuando sugerí evitar que dos usuarios asignen el mismo vehículo en el mismo horario, la IA propuso hacer un `find()` y luego un `save()`. Lo rechacé. En un sistema logístico real bajo carga, eso genera una condición de carrera (Race Condition) masiva. Decidí e implementé un bloqueo distribuido en Redis basado en el ID del vehículo. Si el mutex está tomado, el segundo requerimiento es rechazado inmediatamente (Status 409 Conflict), garantizando integridad absoluta en el parque automotor.

## 3. Integración del Modelo de IA (Corrección de Enfoque)
- **Propuesta de la IA:** Usar "Vector RAG" (Bases de datos vectoriales) para analizar las capacidades del vehículo y responder la idoneidad.
- **Mi decisión:** Lo descarté por ser innecesariamente complejo (over-engineering) para este MVP.
- **Por qué:** Opté por un enfoque de **Structured Context Ingestion**. La base de datos relacional/documental ya tiene la información de los viajes actuales. Decidí que el backend (TypeScript) cruce la información, detecte solapamientos, y envíe el contexto estructurado en el prompt al LLM (`gemini-3.6-flash`). Además, forcé el uso de `zod` y `gemini.generateContent` para tipar estrictamente el output del LLM, ya que la IA tendía a escupir Markdown en lugar de JSON parseable.

## 4. Stack del Frontend (Decisión Propia)
- **Propuesta de la IA:** Componentes básicos de React escritos "a mano" o usar Bootstrap para acelerar.
- **Mi decisión:** Exigí el uso de **TailwindCSS + Shadcn/ui** en **Vite**.
- **Por qué:** La IA proponía código muy feo y genérico. Como líder del proyecto, determiné que el MVP debía transmitir profesionalismo (look and feel premium) desde el minuto cero, sin sacrificar velocidad. Rechacé los componentes base e impuse el estándar moderno que permitió interfaces limpias de inmediato.

## 5. Manejo de Secretos y Entornos Docker (Corrección Técnica)
- **Error de la IA:** Sugirió crear un `.env` masivo en la raíz y pasarlo directamente al contenedor de producción, o inyectar las credenciales en los Dockerfiles.
- **Mi corrección:** Lo frené. Forcé que las configuraciones de puertos y URIs dependientes del orquestador se manejaran nativamente en el `docker-compose.yml`, aislando la `GEMINI_API_KEY` en un archivo `backend/.env` inyectado mediante `env_file`. De esta forma protegí el contexto local de desarrollo versus el entorno de producción en Docker.

## 6. Monorepo y Persistencia de Memoria AI (Decisión Propia)
- **Mi decisión:** Inicializar el repositorio Git en la raíz manteniendo trackeada la carpeta `.agents`.
- **Por qué:** Todo el esfuerzo de alinear a la IA a los estándares (Hexagonal, naming conventions) debía ser portable. Decidí que la configuración `.agents` forme parte del código fuente, convirtiéndola en "Arquitectura como Código". Si un dev nuevo levanta el repo con un asistente IA, el asistente ya sabrá las reglas sin tener que explicarle nada.
