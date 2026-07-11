# Archi-vite: Especificación Técnica de Proyecto de Grado [Ecosistema XF]

Archi-vite es una solución premium de gestión jerárquica N-aria con control de ubicaciones físicas y Sistema de Gestión Documental (DMS) integrado, desarrollado bajo los lineamientos del ecosistema global **XpertiFlow (XF)**.

---

## 1. Arquitectura de Base de Datos (Diccionario de Datos)

El sistema utiliza cuatro tablas principales en PostgreSQL para modelar la jerarquía de categorías, activos, control de usuarios y auditoría:

### Tabla: `usuarios`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Identificador único del usuario |
| `username` | String(50) | Unique, Index, Not Null | Nombre de usuario para inicio de sesión |
| `password_hash` | String(255) | Not Null | Hash SHA-256 de la contraseña |
| `rol` | String(20) | Not Null (Default: "user") | Rol del usuario ("admin" o "user") |
| `creado_en` | DateTime | Server Default: NOW | Fecha de creación del registro |

### Tabla: `nodos`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Identificador único del nodo |
| `nombre` | String(255) | Not Null | Nombre de la categoría o ubicación |
| `abreviacion` | String(10) | Not Null | Abreviación de nivel de nodo |
| `codigo_inteligente` | String(100) | Unique, Index, Not Null | Código inteligente único autogenerado |
| `parent_id` | Integer | FK -> `nodos.id` (ON DELETE CASCADE) | Enlace al nodo padre en la jerarquía |
| `es_ubicacion_fisica`| Boolean | Default: False | Indica si representa un espacio geográfico |
| `detalles_ubicacion` | JSON | Nullable | JSON con coordenadas, estante, etc. |
| `creado_en` | DateTime | Server Default: NOW | Fecha de registro |

### Tabla: `documentos`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Identificador único del documento |
| `nombre_archivo` | String(255) | Not Null | Nombre original del archivo |
| `ruta_archivo` | String(500) | Not Null | Ruta de descarga pública del archivo |
| `nodo_id` | Integer | FK -> `nodos.id` (ON DELETE CASCADE) | Nodo al que pertenece el archivo |
| `version` | Integer | Not Null (Default: 1) | Versión del archivo subido |
| `identificador_dms` | String(100) | Index | Clave única de agrupación de versiones |
| `creado_en` | DateTime | Server Default: NOW | Fecha de subida |

### Tabla: `actividades_log` (Logs de Auditoría)
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | Integer | PK, Auto-increment | Identificador único del log |
| `usuario` | String(100) | Not Null | Nombre del usuario que ejecutó la acción |
| `accion` | String(255) | Not Null | Descripción textual de la actividad |
| `codigo_nodo` | String(100) | Nullable | Código inteligente del nodo afectado |
| `creado_en` | DateTime | Server Default: NOW | Fecha del evento |

---

## 2. Flujo de Autenticación y Autorización (RBAC)

El sistema implementa un modelo de control de accesos basado en roles (RBAC) con tokens JWT:

```
[Cliente Frontend React]
       │
       ├─► (Credenciales) ──► [POST /token] ──► (Valida DB)
       │                                            │
       ◄─ (Token JWT + Rol) ◄───────────────────────┘
       │
[Operaciones Sensibles] (Crear, Borrar, Subir)
       │
       ├─► (Header: Authorization Bearer Token) ──► [FastAPI API]
                                                        │
                                            (Valida Rol == "admin")
                                                        │
                                            [Ejecuta en PostgreSQL]
```

---

## 3. Algoritmo de Códigos Inteligentes

La codificación de nodos se calcula automáticamente en el backend consultando el histórico de base de datos de forma recursiva:
- **Nodos Raíz**: `[ABREVIACION]-[CORRELATIVO]` (Ej: `UM-001`)
- **Nodos Hijos**: `[CODIGO_PADRE]-[ABREVIACION]-[CORRELATIVO]` (Ej: `UM-001-SN-001`)
- El correlativo numérico se calcula sumando la cantidad de nodos hermanos existentes en ese mismo subnivel para garantizar códigos contiguos de costo cero de colisiones.
