# Arquitectura del Sistema: Wawa Transport MVP

A continuación se detalla la arquitectura de alto nivel y el flujo de datos (entradas y salidas) del sistema, aplicando los principios de la **Arquitectura Hexagonal**.

## Diagrama de Componentes y Flujo de Datos

```mermaid
graph TD
    %% Usuarios y Clientes
    User((Dispatcher / Usuario))
    
    %% Frontend Container
    subgraph Frontend [Contenedor Frontend - React + Vite]
        UI[UI Components <br/> Shadcn/Tailwind]
        Map[Mapbox Integration]
        Nginx[Nginx Web Server <br/> Puerto 80]
        
        UI -->|Muestra| User
        User -->|Interactúa| UI
        UI --- Map
        Nginx -->|Sirve estáticos| UI
    end

    %% Red de Comunicación
    API_REST{API REST <br/> JSON}
    UI -->|HTTP GET/POST| API_REST

    %% Backend Container
    subgraph Backend [Contenedor Backend - NestJS Hexagonal]
        %% Presentation Layer (Primary Driving Adapters)
        subgraph Presentation [Capa de Presentación]
            RC[RoutesController]
            VC[VehiclesController]
            DC[DutiesController]
        end
        
        API_REST -->|Ruteo| RC
        API_REST -->|Ruteo| VC
        API_REST -->|Ruteo| DC

        %% Application Layer (Core)
        subgraph CoreApp [Capa de Aplicación / Dominio]
            RS[RoutesService]
            VS[VehiclesService]
            DS[DutiesService]
            AIS[AiService <br/> Structured Prompting]
            
            %% Flujos internos de aplicación
            DC --> DS
            RC --> RS
            VC --> VS
            DC -->|Solicita validación de disponibilidad| VS
            DC -->|Pide sugerencia de vehículo| AIS
            AIS -.->|Analiza historial y solapamientos| VS
        end

        %% Infrastructure Layer (Secondary Driven Adapters)
        subgraph Infrastructure [Capa de Infraestructura]
            MongoAdapter[Mongoose Repository <br/> Schemas]
            RedisAdapter[Redlock Service <br/> Mutex Locks]
            
            VS --> MongoAdapter
            RS --> MongoAdapter
            DS --> MongoAdapter
            DS -->|Solicita bloqueo de concurrencia| RedisAdapter
        end
    end

    %% Contenedores de Persistencia (Bases de datos)
    subgraph Databases [Bases de Datos Locales]
        MongoDB[(MongoDB <br/> Puerto 27017)]
        Redis[(Redis Cache <br/> Puerto 6379)]
    end

    MongoAdapter -->|TCP| MongoDB
    RedisAdapter -->|TCP| Redis

    %% Servicios Externos
    subgraph External [Servicios Cloud de Terceros]
        Gemini[Google Gemini 3.6 Flash <br/> LLM API]
        MapboxAPI[Mapbox Directions API]
    end

    AIS -->|Prompt + Contexto Estructurado| Gemini
    Gemini -->|Respuesta JSON| AIS
    Map -->|Solicita Rutas GeoJSON| MapboxAPI
```

## Descripción de Componentes Clave

1. **El Usuario (Dispatcher):** Interactúa a través de su navegador cargando el frontend servido por Nginx. Ve un mapa renderizado por Mapbox.
2. **Asignación Inteligente (El Flujo Principal):**
   - El Dispatcher solicita sugerencias para un viaje a través de la UI.
   - La petición llega al `DutiesController` en el backend.
   - El `AiService` recopila el contexto: Vehículos de la flota y sus *Duties* actuales (obtenidos a través del `VehiclesService` desde MongoDB).
   - El `AiService` inyecta este contexto estructurado en el modelo `Gemini 3.6 Flash` pidiéndole que razone las superposiciones horarias.
   - Gemini devuelve un ID validado.
3. **El Mecanismo de Seguridad (Redlock):**
   - Una vez confirmada la asignación, el request pasa por el `RedlockService`.
   - Se solicita un "candado" en **Redis** para ese Vehículo en particular.
   - Si otro usuario intentó asignar el mismo vehículo en la misma fracción de segundo, el bloqueo distribuido en Redis arroja una excepción (Conflict 409), garantizando la protección de los datos antes de hacer el `save()` en **MongoDB**.

Esta separación por capas (Presentación -> Aplicación -> Infraestructura -> Bases de Datos) garantiza que el núcleo logístico de la aplicación no se ensucie con la sintaxis de Mongoose o las integraciones externas de IA, facilitando testing y evolución futura.
