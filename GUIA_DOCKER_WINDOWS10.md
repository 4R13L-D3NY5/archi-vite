# 🐳 Guía Oficial de Despliegue con Docker en Windows 10
## Sistema de Gestión Documental Híbrido: Archi-vite DMS (UNITEPC)

Esta guía detalla paso a paso cómo trasladar y ejecutar el proyecto **Archi-vite DMS** en cualquier otra computadora con **Windows 10**, utilizando **Docker Desktop** y **Docker Compose**.

---

## 📋 1. Requisitos Previos en la Máquina Destino (Windows 10)

Antes de iniciar, asegúrate de que la computadora con Windows 10 cuente con:

1. **Virtualización Habilitada en BIOS/UEFI:**
   * Abre el *Administrador de Tareas* (`Ctrl + Shift + Esc`) $\rightarrow$ Pestaña **Rendimiento** $\rightarrow$ **CPU**.
   * Verifica que indique: `Virtualización: Habilitada`. (Si está deshabilitada, actívala en la BIOS/UEFI de la computadora).
2. **Instalar WSL 2 (Windows Subsystem for Linux):**
   * Abre PowerShell como **Administrador** y ejecuta:
     ```powershell
     wsl --install
     ```
   * Reinicia la computadora si el sistema lo solicita.
3. **Instalar Docker Desktop para Windows:**
   * Descarga el instalador oficial desde: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   * Durante la instalación, marca la casilla recomendada: *Use WSL 2 instead of Hyper-V*.
   * Abre Docker Desktop y espera a que el icono en la barra de tareas se ponga en color verde (*Engine running*).

---

## 📦 2. Transferencia del Proyecto a la Otra Computadora

1. Copia toda la carpeta del proyecto `archi-vite` a la máquina destino (mediante pendrive USB, archivo ZIP o repositorio Git).
2. Ubica la carpeta en una ruta accesible, por ejemplo:
   ```text
   C:\Proyectos\archi-vite
   ```
   *(Estructura requerida dentro de la carpeta:)*
   ```text
   archi-vite/
   ├── backend/
   │   ├── Dockerfile
   │   ├── requirements.txt
   │   ├── main.py
   │   ├── seed.py
   │   └── ...
   ├── frontend/
   │   ├── Dockerfile
   │   ├── package.json
   │   ├── src/
   │   └── ...
   ├── docker-compose.yml
   └── README.md
   ```

---

## 🚀 3. Puesta en Marcha con Docker Compose

Abre una terminal (**PowerShell** o **CMD**) en la carpeta raíz del proyecto (`C:\Proyectos\archi-vite`) y sigue estos 3 pasos:

### Paso 1: Construir y Levantar los 3 Contenedores
Ejecuta el siguiente comando para compilar las imágenes de Frontend, Backend y descargar PostgreSQL 15:

```powershell
docker compose up --build -d
```
*(O `docker-compose up --build -d` en versiones anteriores de Docker).*

> ⏳ *La primera vez tardará entre 2 y 4 minutos mientras descarga las capas y dependencias.*

---

### Paso 2: Sembrar la Base de Datos Inicial (42 Nodos y 41 PDFs con Datos Reales)
Una vez que los contenedores estén activos, ejecuta el script de siembra oficial dentro del contenedor del Backend:

```powershell
docker exec -it archivite_backend python seed.py
```

Deberás ver una salida confirmando:
```text
Iniciando reconstrucción de la Base de Datos para el Ecosistema Archi-vite (UNITEPC)...
1. Inyectando Catálogo de Roles de Organización...
2. Inyectando Catálogo de Personas de la Universidad...
3. Inyectando Usuarios de Sistema RBAC...
4. Inyectando Estados y Transiciones de Flujo FSM...
5. Inyectando Jerarquía Física Universitaria Real...
6. Inyectando Jerarquía Lógica Académica e Institucional Oficial...
7. Generando documentos PDF físicos con título y sembrando en la base de datos...
✅ Base de datos reconstruida y poblada con éxito.
```

---

### Paso 3: ¡Listo! Acceder a la Aplicación

Abre tu navegador web (Google Chrome, Edge, Firefox) e ingresa a las siguientes direcciones:

| Servicio | URL Local | Descripción |
| :--- | :--- | :--- |
| 💻 **Frontend (SPA)** | [http://localhost:5173](http://localhost:5173) | Interfaz gráfica interactiva React 19 + D3.js |
| ⚙️ **Backend (API)** | [http://localhost:8000](http://localhost:8000) | Servidor FastAPI REST |
| 📖 **Swagger API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Documentación interactiva de endpoints |

---

## 🔑 4. Credenciales de Acceso al Sistema

Puedes iniciar sesión con cualquiera de estos 3 usuarios de prueba precargados:

1. **Administrador General (Acceso Total y Seguridad):**
   * **Usuario:** `admin`
   * **Contraseña:** `admin123`

2. **Operador de Archivo / Tesista (Ing. de Sistemas):**
   * **Usuario:** `dino.rosas`
   * **Contraseña:** `dino123`

3. **Docente Tutor / Revisor P.A.T.:**
   * **Usuario:** `james.claure`
   * **Contraseña:** `claure123`

---

## 🛠️ 5. Comandos Útiles de Administración y Mantenimiento

Todos estos comandos se ejecutan en PowerShell dentro de la carpeta `archi-vite`:

* **Ver el estado de los contenedores:**
  ```powershell
  docker compose ps
  ```
* **Ver los logs en tiempo real (para depuración):**
  ```powershell
  docker compose logs -f
  ```
  *(O solo del backend: `docker compose logs -f backend`)*
* **Detener el sistema (sin borrar datos):**
  ```powershell
  docker compose stop
  ```
* **Reanudar el sistema:**
  ```powershell
  docker compose start
  ```
* **Apagar y desmontar los contenedores:**
  ```powershell
  docker compose down
  ```
* **Resetear completamente la base de datos desde cero:**
  ```powershell
  docker compose down -v
  docker compose up -d
  docker exec -it archivite_backend python seed.py
  ```

---

## ⚠️ 6. Solución a Problemas Frecuentes en Windows 10

### A. "Docker Desktop no arranca o dice 'WSL 2 kernel update needed'"
* **Solución:** Descarga e instala el paquete oficial de actualización de kernel de Linux para WSL 2 desde Microsoft:
  👉 [https://aka.ms/wsl2kernel](https://aka.ms/wsl2kernel)

### B. "Error: Port 5173 or 8000 is already in use"
* **Causa:** Hay otra aplicación ocupando los puertos.
* **Solución:** Cierra programas que ocupen el puerto 8000 o 5173, o cambia el mapeo de puertos en `docker-compose.yml` (por ejemplo `- "8080:8000"`).

### C. "Cannot connect to the Docker daemon at unix:///var/run/docker.sock"
* **Solución:** Asegúrate de que Docker Desktop esté abierto y completamente iniciado antes de ejecutar comandos en la terminal.
