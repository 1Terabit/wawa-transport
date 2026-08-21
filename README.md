# Wawa Transport MVP

Un MVP construido para orquestar la asignación inteligente de servicios de transporte de personal ("duties") a vehículos, garantizando disponibilidad en tiempo real mediante bloqueos distribuidos e Inteligencia Artificial.

## ¿Qué construí?
Desarrollé una plataforma "Full Stack" en un monorepo que incluye:
- **Backend (NestJS + TypeScript):** Arquitectura Hexagonal estricta. Maneja la lógica core de negocio, validación y concurrencia.
- **Frontend (React + Vite + Tailwind + Shadcn/ui):** Interfaz limpia y reactiva. Incluye renderizado de mapas con Mapbox y una experiencia de usuario altamente responsiva.
- **Base de Datos (MongoDB):** Seleccionada por velocidad de iteración para el MVP.
- **Gestor de Concurrencia (Redis):** Implementación de bloqueos distribuidos (Redlock) para evitar la doble asignación (race conditions) del mismo vehículo en el mismo horario.
- **Motor de Inteligencia Artificial (Gemini 3.6 Flash):** Un módulo integrado que analiza las franjas horarias y el historial del vehículo para sugerir si está apto para un nuevo duty, devolviendo una respuesta validada (estructurada) al cliente.
- **Infraestructura (Docker + Compose):** Totalmente dockerizado. Frontend servido a través de Nginx y Backend compilado eficientemente mediante Multi-Stage builds.

## ¿Qué dejé fuera conscientemente y por qué?
- **Autenticación / Autorización (JWT, OAuth):** Para este MVP, el foco era resolver el problema de *operaciones* (rutas, vehículos, colisiones horarias). El login aportaba fricción innecesaria al momento de probar la lógica principal de negocio.
- **PostgreSQL / Bases de Datos Relacionales:** Elegí conscientemente usar MongoDB porque es el stack principal y cotidiano de la empresa. Aunque la naturaleza transaccional de una plataforma logística tiene casos de uso excelentes en bases relacionales, MongoDB cumple sobradamente con los requerimientos de este MVP, ofrece alta escalabilidad y evita introducir fricción o una nueva tecnología al ecosistema del equipo.
- **Pruebas E2E Completas:** Dejé configurada la base (archivos `.spec`), pero prioricé entregar la integración end-to-end completa de toda la plataforma en tiempo récord por sobre el Test Coverage exhaustivo.

## ¿Qué haría distinto con más tiempo?
1. **Arquitectura de Datos Políglota (PostgreSQL):** A pesar de que MongoDB funciona a la perfección para nuestro caso actual, en un escenario de altísima escala consideraría separar responsabilidades: mantener MongoDB para operaciones ágiles y telemetría, y sumar PostgreSQL exclusivamente para facturación y auditoría rígida (ACID).
2. **CI/CD Pipeline (GitHub Actions):** Automatizaría el linteo, tests y el build de las imágenes Docker, integrando el deploy automático a un Cloud Run o ECS.
3. **WebSockets (Socket.io):** Agregaría comunicación en tiempo real para que los dispatchers vean en vivo en el mapa la ubicación del vehículo (simulada) sin necesidad de recargar la información de la ruta.
4. **Agentes AI con RAG:** El módulo actual le pasa la disponibilidad del vehículo in-prompt. Con más tiempo, integraría Vector Search para que la IA decida analizando normativas legales de descanso de los conductores y mantenimiento mecánico.

## Instrucciones para levantar el MVP localmente

> **Requisitos Previos:** Tener instalado Docker y Docker Compose (o Podman).

1. Clonar el repositorio.
2. Copiar los archivos de entorno de ejemplo a los reales:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
3. En el archivo `backend/.env`, agregar tu clave de API válida para Gemini:
   `GEMINI_API_KEY="TU_API_KEY"`
4. Levantar la infraestructura completa con Docker Compose desde la raíz:
   ```bash
   docker compose up -d --build
   ```
5. El sistema ejecutará automáticamente un script `wawa-seed` que poblará la base de datos con rutas y vehículos de prueba.
6. Abrir el navegador en: **http://localhost**
