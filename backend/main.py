import os
import io
import shutil
import qrcode
import jwt
import datetime
import hashlib
import re
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.sql import func
from sqlalchemy import String
from typing import List, Optional
from pydantic import BaseModel

from database import Base, engine, get_db
import models

# Configuración de Seguridad JWT
SECRET_KEY = "ARCHIVITE_SECRET_SUPER_KEY_123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Asegurar directorios físicos de carga
MEDIA_DIR = "media"
DMS_DIR = os.path.join(MEDIA_DIR, "dms")
os.makedirs(DMS_DIR, exist_ok=True)

# Crear tablas en la base de datos de forma automática al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Archi-vite API",
    description="API enriquecida para el Ecosistema Archi-vite con Buscador Universal Unificado.",
    version="2.5.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory="media"), name="media")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ============================================================================
# Esquemas Pydantic
# ============================================================================

class NodoCreate(BaseModel):
    nombre: str
    abreviacion: str
    parent_id: Optional[int] = None
    es_ubicacion_fisica: bool = False
    detalles_ubicacion: Optional[dict] = None
    etiquetas: Optional[List[str]] = None
    codigo_inteligente: Optional[str] = None
    meses_retencion_limite: Optional[int] = None
    nodo_destino_transferencia_id: Optional[int] = None

class ConfiguracionCodificacionResponse(BaseModel):
    id: int
    separador: str
    digitos_correlativo: int
    usar_abreviacion_padre: bool
    prefijo_global: str

    class Config:
        from_attributes = True

class ConfiguracionCodificacionUpdate(BaseModel):
    separador: str
    digitos_correlativo: int
    usar_abreviacion_padre: bool
    prefijo_global: str

    class Config:
        from_attributes = True

class EstadoWorkflowResponse(BaseModel):
    id: int
    nombre: str
    color: str
    secuencia: int
    aplica_a: str  # "categoria", "archivo", "ambos"

    class Config:
        from_attributes = True

class EstadoWorkflowCreate(BaseModel):
    nombre: str
    color: str
    secuencia: int
    aplica_a: str  # "categoria", "archivo", "ambos"

class TransicionResponse(BaseModel):
    id: int
    from_estado_id: int
    to_estado_id: int

    class Config:
        from_attributes = True

class TransicionCreate(BaseModel):
    from_estado_id: int
    to_estado_id: int

class NodoResponse(BaseModel):
    id: int
    nombre: str
    abreviacion: str
    codigo_inteligente: str
    parent_id: Optional[int]
    es_ubicacion_fisica: bool
    detalles_ubicacion: Optional[dict]
    etiquetas: Optional[List[str]] = []
    estado_id: Optional[int] = None
    estado: Optional[EstadoWorkflowResponse] = None
    meses_retencion_limite: Optional[int] = None
    nodo_destino_transferencia_id: Optional[int] = None

    class Config:
        from_attributes = True

class DocumentoResponse(BaseModel):
    id: int
    nombre_archivo: str
    ruta_archivo: str
    nodo_id: Optional[int] = None
    ubicacion_fisica_id: Optional[int] = None
    version: int
    identificador_dms: Optional[str]
    creado_en: datetime.datetime
    estado_id: Optional[int] = None
    estado: Optional[EstadoWorkflowResponse] = None
    nodo: Optional[NodoResponse] = None
    ubicacion_fisica: Optional[NodoResponse] = None
    fecha_limite_retencion: Optional[datetime.datetime] = None
    transferido_en: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    rol: str
    username: str
    debe_cambiar_password: bool

class LogResponse(BaseModel):
    id: int
    usuario: str

    accion: str
    codigo_nodo: Optional[str]
    creado_en: datetime.datetime

    class Config:
        from_attributes = True

class UsuarioResponse(BaseModel):
    id: int
    username: str
    rol: str
    creado_en: datetime.datetime

    class Config:
        from_attributes = True

class RolOrganizacionCreate(BaseModel):
    nombre: str
    codigo: str
    color: str

class RolOrganizacionResponse(BaseModel):
    id: int
    nombre: str
    codigo: str
    color: str
    creado_en: datetime.datetime

    class Config:
        from_attributes = True

class PersonaCreate(BaseModel):
    identificacion: str
    nombre_completo: str
    rol_actual_id: int
    carrera_departamento: Optional[str] = None
    crear_usuario: Optional[bool] = False
    username: Optional[str] = None

class PersonaResponse(BaseModel):
    id: int
    identificacion: str
    nombre_completo: str
    rol_actual_id: Optional[int]
    rol_actual: Optional[RolOrganizacionResponse] = None
    carrera_departamento: Optional[str]
    creado_en: datetime.datetime

    class Config:
        from_attributes = True

class PersonaVinculoCreate(BaseModel):
    persona_id: int
    nodo_id: Optional[int] = None
    documento_id: Optional[int] = None
    rol_momento_id: Optional[int] = None
    tipo_relacion: str
    peso: int

class PersonaVinculoResponse(BaseModel):
    id: int
    persona_id: int
    nodo_id: Optional[int]
    documento_id: Optional[int]
    rol_momento_id: Optional[int]
    rol_momento: Optional[RolOrganizacionResponse] = None
    tipo_relacion: str
    peso: int
    persona: PersonaResponse

    class Config:
        from_attributes = True

class PermisoNodoCreate(BaseModel):
    usuario_id: Optional[int] = None
    rol_organizacion_id: Optional[int] = None
    tipo_permiso: str  # "lectura" o "escritura"

class CambiarPasswordRequest(BaseModel):
    new_password: str

class PermisoNodoResponse(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    rol_organizacion_id: Optional[int] = None
    nodo_id: int
    tipo_permiso: str
    creado_en: datetime.datetime
    usuario: Optional[UsuarioResponse] = None
    rol_organizacion: Optional[RolOrganizacionResponse] = None

    class Config:
        from_attributes = True

class VistaGuardadaCreate(BaseModel):
    nombre: str
    tipo_arbol: str
    nodos_expandidos: List[int]

class VistaGuardadaResponse(BaseModel):
    id: int
    usuario_id: int
    nombre: str
    tipo_arbol: str
    nodos_expandidos: List[int]
    creado_en: datetime.datetime

    class Config:
        from_attributes = True

class EnlaceCruzadoCreate(BaseModel):
    nodo_origen_id: Optional[int] = None
    documento_origen_id: Optional[int] = None
    nodo_destino_id: int

class EnlaceCruzadoResponse(BaseModel):
    id: int
    nodo_origen_id: Optional[int]
    documento_origen_id: Optional[int]
    nodo_destino_id: int

    class Config:
        from_attributes = True

class LocalFileImport(BaseModel):
    filepath: str

# ============================================================================
# Funciones Auxiliares de Seguridad y Cifrado
# ============================================================================

def generar_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def crear_token_acceso(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales de seguridad.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    usuario = db.query(models.Usuario).filter(models.Usuario.username == username).first()
    if usuario is None:
        raise credentials_exception
    return usuario

def require_admin(usuario: models.Usuario = Depends(get_current_user)):
    if usuario.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación denegada. Se requieren privilegios de Administrador de Infraestructura."
        )
    return usuario

def registrar_log(db: Session, usuario: str, accion: str, codigo_nodo: Optional[str] = None):
    try:
        nuevo_log = models.ActividadLog(
            usuario=usuario,
            accion=accion,
            codigo_nodo=codigo_nodo
        )
        db.add(nuevo_log)
        db.commit()
    except Exception as e:
        print(f"Error al registrar log de auditoría: {e}")

# ============================================================================
# Lógica de Código Inteligente
# ============================================================================

def calcular_codigo_inteligente(db: Session, abreviacion: str, parent_id: Optional[int]) -> str:
    abbr_clean = abreviacion.strip().upper()
    
    # Consultar configuración activa
    config = db.query(models.ConfiguracionCodificacion).first()
    separador = config.separador if config is not None else "-"
    digitos = config.digitos_correlativo if config is not None else 3
    usar_padre = config.usar_abreviacion_padre if config is not None else True
    prefijo_global = config.prefijo_global if config is not None else ""

    fmt = f"0{digitos}d"

    if parent_id is None:
        prefix = f"{prefijo_global}{abbr_clean}"
        query = db.query(models.Nodo).filter(
            models.Nodo.parent_id == None,
            models.Nodo.codigo_inteligente.like(f"{prefix}{separador}%")
        )
        count = query.count()
        correlativo = format(count + 1, fmt)
        return f"{prefix}{separador}{correlativo}"
        
    parent_node = db.query(models.Nodo).filter(models.Nodo.id == parent_id).first()
    if not parent_node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Nodo padre no encontrado.")
        
    if usar_padre:
        parent_code = parent_node.codigo_inteligente
        prefix = f"{parent_code}{separador}{abbr_clean}"
    else:
        prefix = f"{prefijo_global}{abbr_clean}"
    
    query = db.query(models.Nodo).filter(
        models.Nodo.parent_id == parent_id,
        models.Nodo.codigo_inteligente.like(f"{prefix}{separador}%")
    )
    count = query.count()
    correlativo = format(count + 1, fmt)
    return f"{prefix}{separador}{correlativo}"

# ============================================================================
# TRADUCCIÓN INTELIGENTE DE RUTAS DE WINDOWS A DOCKER (WSL)
# ============================================================================

def traducir_ruta_host_a_container(path: str) -> str:
    if not path:
        return os.getcwd()
        
    match = re.match(r'^([a-zA-Z]):[\\/](.*)', path)
    if match:
        unidad = match.group(1).lower()
        resto = match.group(2).replace('\\', '/')
        ruta_wsl = f"/mnt/{unidad}/{resto}"
        
        if os.path.exists(ruta_wsl):
            return ruta_wsl
            
    return path.replace('\\', '/')

def traducir_ruta_container_a_host(path: str) -> str:
    if path.startswith("/mnt/"):
        parts = path.split("/")
        if len(parts) > 2:
            unidad = parts[2].upper()
            resto = "\\".join(parts[3:])
            return f"{unidad}:\\{resto}"
    return path

# ============================================================================
# Endpoints de API REST
# ============================================================================

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Bienvenido a la API de Archi-vite. Visita /docs para la documentación interactiva."
    }

# Endpoint para Autenticación (OAuth2 Token)
@app.post("/token", response_model=TokenResponse)
def login_para_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    hash_pass = generar_hash(form_data.password)
    usuario = db.query(models.Usuario).filter(
        models.Usuario.username == form_data.username,
        models.Usuario.password_hash == hash_pass
    ).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario o contraseña incorrectos."
        )
        
    access_token = crear_token_acceso(data={"sub": usuario.username, "rol": usuario.rol})
    registrar_log(db, usuario.username, "Inicio de sesión exitoso en Archi-vite")
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "rol": usuario.rol,
        "username": usuario.username,
        "debe_cambiar_password": usuario.debe_cambiar_password
    }

def verificar_permiso_escritura(usuario: models.Usuario, nodo_id: int, db: Session):
    if usuario.rol == "admin":
        return True
    
    rol_org_id = None
    if usuario.persona:
        rol_org_id = usuario.persona.rol_actual_id

    current_id = nodo_id
    while current_id is not None:
        # Permiso individual
        permiso = db.query(models.PermisoNodo).filter(
            models.PermisoNodo.usuario_id == usuario.id,
            models.PermisoNodo.nodo_id == current_id,
            models.PermisoNodo.tipo_permiso == "escritura"
        ).first()
        if permiso:
            return True
            
        # Permiso por rol organizativo
        if rol_org_id is not None:
            permiso_rol = db.query(models.PermisoNodo).filter(
                models.PermisoNodo.rol_organizacion_id == rol_org_id,
                models.PermisoNodo.nodo_id == current_id,
                models.PermisoNodo.tipo_permiso == "escritura"
            ).first()
            if permiso_rol:
                return True
        
        nodo = db.query(models.Nodo).filter(models.Nodo.id == current_id).first()
        current_id = nodo.parent_id if nodo else None
        
    return False

def verificar_permiso_lectura(usuario: models.Usuario, nodo_id: int, db: Session):
    if usuario.rol == "admin":
        return True
    
    rol_org_id = None
    if usuario.persona:
        rol_org_id = usuario.persona.rol_actual_id

    current_id = nodo_id
    while current_id is not None:
        # Permiso individual
        permiso = db.query(models.PermisoNodo).filter(
            models.PermisoNodo.usuario_id == usuario.id,
            models.PermisoNodo.nodo_id == current_id,
            models.PermisoNodo.tipo_permiso.in_(["lectura", "escritura"])
        ).first()
        if permiso:
            return True
            
        # Permiso por rol organizativo
        if rol_org_id is not None:
            permiso_rol = db.query(models.PermisoNodo).filter(
                models.PermisoNodo.rol_organizacion_id == rol_org_id,
                models.PermisoNodo.nodo_id == current_id,
                models.PermisoNodo.tipo_permiso.in_(["lectura", "escritura"])
            ).first()
            if permiso_rol:
                return True
            
        nodo = db.query(models.Nodo).filter(models.Nodo.id == current_id).first()
        current_id = nodo.parent_id if nodo else None
        
    return False

# Crear un nuevo Nodo (Requiere Admin o permisos de Escritura en el nodo padre)
@app.post("/nodos/", response_model=NodoResponse, status_code=status.HTTP_201_CREATED)
def crear_nodo(nodo: NodoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    # Validar permisos de escritura sobre el padre
    if nodo.parent_id is not None:
        if not verificar_permiso_escritura(current_user, nodo.parent_id, db):
            raise HTTPException(status_code=403, detail="No tienes permisos de escritura en la categoría contenedora para crear subcategorías.")
    else:
        if current_user.rol != "admin":
            raise HTTPException(status_code=403, detail="Solo los administradores globales pueden crear categorías raíz.")

    abbr = nodo.abreviacion.strip()
    if not abbr or len(abbr) > 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La abreviación debe tener máximo 10 caracteres.")
    
    if nodo.codigo_inteligente and nodo.codigo_inteligente.strip():
        codigo = nodo.codigo_inteligente.strip().upper()
        existente = db.query(models.Nodo).filter(models.Nodo.codigo_inteligente == codigo).first()
        if existente:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"El código inteligente '{codigo}' ya está registrado.")
    else:
        codigo = calcular_codigo_inteligente(db, abbr, nodo.parent_id)
    
    db_nodo = models.Nodo(
        nombre=nodo.nombre.strip(),
        abreviacion=abbr.upper(),
        codigo_inteligente=codigo,
        parent_id=nodo.parent_id,
        es_ubicacion_fisica=nodo.es_ubicacion_fisica,
        detalles_ubicacion=nodo.detalles_ubicacion,
        etiquetas=nodo.etiquetas or [],
        meses_retencion_limite=nodo.meses_retencion_limite,
        nodo_destino_transferencia_id=nodo.nodo_destino_transferencia_id
    )
    db.add(db_nodo)
    db.commit()
    db.refresh(db_nodo)
    
    registrar_log(db, current_user.username, f"Creó nodo '{db_nodo.nombre}' con etiquetas {nodo.etiquetas}", db_nodo.codigo_inteligente)
    return db_nodo


class EtiquetasUpdate(BaseModel):
    etiquetas: List[str]

@app.put("/nodos/{nodo_id}/etiquetas")
def actualizar_etiquetas(nodo_id: int, payload: EtiquetasUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
    if not verificar_permiso_escritura(current_user, nodo_id, db):
        raise HTTPException(status_code=403, detail="No tienes permisos de escritura en esta categoría.")

    nodo.etiquetas = payload.etiquetas
    flag_modified(nodo, "etiquetas")
    db.commit()
    db.refresh(nodo)
    registrar_log(db, current_user.username, f"Actualizó etiquetas del nodo {nodo.codigo_inteligente}: {payload.etiquetas}", nodo.codigo_inteligente)
    return {"status": "success", "etiquetas": nodo.etiquetas}


@app.post("/nodos/{nodo_id}/imagen", response_model=NodoResponse)
async def subir_imagen_nodo(
    nodo_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=404, detail="Nodo no encontrado.")
        
    if not nodo.es_ubicacion_fisica:
        raise HTTPException(status_code=400, detail="Solo se pueden subir imágenes a ubicaciones físicas realistas.")
        
    filename_original = file.filename
    filename_clean = filename_original.replace(" ", "_")
    identificador = f"nodo_{nodo_id}_{filename_clean}"
    
    nodos_media_dir = os.path.join(MEDIA_DIR, "nodos")
    os.makedirs(nodos_media_dir, exist_ok=True)
    
    file_path = os.path.join(nodos_media_dir, identificador)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al escribir imagen en disco: {e}")
        
    ruta_publica = f"/media/nodos/{identificador}"
    
    detalles = nodo.detalles_ubicacion or {}
    detalles["imagen_url"] = ruta_publica
    nodo.detalles_ubicacion = detalles
    flag_modified(nodo, "detalles_ubicacion")
    
    db.commit()
    db.refresh(nodo)
    
    registrar_log(db, current_user.username, f"Cargó imagen de ubicación física '{nodo.nombre}'", nodo.codigo_inteligente)
    return nodo


# Listar todos los Nodos
@app.get("/nodos/", response_model=List[NodoResponse])
def listar_nodos(db: Session = Depends(get_db)):
    return db.query(models.Nodo).all()

# Buscador Universal Unificado
@app.get("/nodos/buscar")
def buscar_nodos_y_archivos(q: str, db: Session = Depends(get_db)):
    if not q or len(q.strip()) < 1:
        return []
        
    query_str = f"%{q.strip().lower()}%"
    
    # 1. Buscar Nodos (Categorías y Ubicaciones Físicas)
    nodos = db.query(models.Nodo).filter(
        (func.lower(models.Nodo.nombre).like(query_str)) |
        (func.lower(models.Nodo.codigo_inteligente).like(query_str)) |
        (models.Nodo.etiquetas.cast(String).ilike(query_str))
    ).limit(10).all()
    
    # 2. Buscar Documentos/Archivos en DMS
    docs = db.query(models.Documento).filter(
        func.lower(models.Documento.nombre_archivo).like(query_str)
    ).limit(5).all()
    
    resultados = []
    
    for n in nodos:
        resultados.append({
            "id": n.id,
            "nombre": n.nombre,
            "codigo": n.codigo_inteligente,
            "tipo": "Ubicación Física" if n.es_ubicacion_fisica else "Categoría Lógica",
            "es_archivo": False
        })
        
    for d in docs:
        resultados.append({
            "id": d.id,
            "nombre": d.nombre_archivo,
            "codigo": f"v{d.version} · DMS",
            "tipo": "Archivo DMS",
            "es_archivo": True,
            "ruta": d.ruta_archivo
        })
        
    return resultados

# Obtener la estructura jerárquica del Árbol (Inyectando los archivos como ramas finales)
def obtener_descendientes_ids(nodo_id: int, db: Session):
    ids = [nodo_id]
    hijos = db.query(models.Nodo.id).filter(models.Nodo.parent_id == nodo_id).all()
    for h in hijos:
        ids.extend(obtener_descendientes_ids(h[0], db))
    return ids

def obtener_ancestros_ids(nodo_id: int, db: Session):
    ids = []
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if nodo and nodo.parent_id is not None:
        ids.append(nodo.parent_id)
        ids.extend(obtener_ancestros_ids(nodo.parent_id, db))
    return ids

@app.get("/nodos/arbol")
def obtener_arbol(
    tipo: str = "logico", 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(get_current_user)
):
    es_admin = (current_user.rol == "admin")
    
    nodos_visibles_set = set()
    nodos_lectura_set = set()
    nodos_escritura_set = set()
    
    if not es_admin:
        rol_org_id = None
        if current_user.persona:
            rol_org_id = current_user.persona.rol_actual_id
            
        query_perm = db.query(models.PermisoNodo)
        if rol_org_id is not None:
            query_perm = query_perm.filter(
                (models.PermisoNodo.usuario_id == current_user.id) | 
                (models.PermisoNodo.rol_organizacion_id == rol_org_id)
            )
        else:
            query_perm = query_perm.filter(models.PermisoNodo.usuario_id == current_user.id)
            
        permisos = query_perm.all()
        for p in permisos:
            desc_ids = obtener_descendientes_ids(p.nodo_id, db)
            nodos_lectura_set.update(desc_ids)
            nodos_visibles_set.update(desc_ids)
            if p.tipo_permiso == "escritura":
                nodos_escritura_set.update(desc_ids)
                
            anc_ids = obtener_ancestros_ids(p.nodo_id, db)
            nodos_visibles_set.update(anc_ids)

    if tipo == "fisico":
        # Raíces físicas: nodos físicos sin padre, o cuyo padre es lógico
        raices_query = db.query(models.Nodo).filter(models.Nodo.es_ubicacion_fisica == True)
        raices = []
        for n in raices_query.all():
            if not es_admin and n.id not in nodos_visibles_set:
                continue
            if n.parent_id is None:
                raices.append(n)
            else:
                parent = db.query(models.Nodo).filter(models.Nodo.id == n.parent_id).first()
                if parent and not parent.es_ubicacion_fisica:
                    raices.append(n)
    else:
        # Raíces lógicas: nodos lógicos sin padre, o cuyo padre es físico
        raices_query = db.query(models.Nodo).filter(models.Nodo.es_ubicacion_fisica == False)
        raices = []
        for n in raices_query.all():
            if not es_admin and n.id not in nodos_visibles_set:
                continue
            if n.parent_id is None:
                raices.append(n)
            else:
                parent = db.query(models.Nodo).filter(models.Nodo.id == n.parent_id).first()
                if parent and parent.es_ubicacion_fisica:
                    raices.append(n)
    
    def construir_rama(nodo):
        tiene_lectura = es_admin or (nodo.id in nodos_lectura_set)
        tiene_escritura = es_admin or (nodo.id in nodos_escritura_set)

        personas_list = []
        if tiene_lectura:
            # 1. Obtener personas vinculadas a este nodo/categoría
            vinculos_db = db.query(models.PersonaVinculo).options(
                joinedload(models.PersonaVinculo.rol_momento),
                joinedload(models.PersonaVinculo.persona).joinedload(models.Persona.rol_actual)
            ).filter(models.PersonaVinculo.nodo_id == nodo.id).all()
            for v in vinculos_db:
                rol_nombre = v.rol_momento.nombre if v.rol_momento else v.persona.rol_actual.nombre if v.persona.rol_actual else "Sin Rol"
                rol_color = v.rol_momento.color if v.rol_momento else v.persona.rol_actual.color if v.persona.rol_actual else "#cbd5e1"
                personas_list.append({
                    "vinculo_id": v.id,
                    "persona_id": v.persona_id,
                    "nombre_completo": v.persona.nombre_completo,
                    "identificacion": v.persona.identificacion,
                    "rol": rol_nombre,
                    "rol_color": rol_color,
                    "tipo_relacion": v.tipo_relacion,
                    "peso": v.peso
                })
            personas_list.sort(key=lambda x: x["peso"])

        rama = {
            "name": nodo.nombre,
            "attributes": {
                "id": nodo.id,
                "codigo": nodo.codigo_inteligente,
                "tipo": "Ubicación Física" if nodo.es_ubicacion_fisica else "Categoría Lógica",
                "es_ubicacion_fisica": nodo.es_ubicacion_fisica,
                "abreviacion": nodo.abreviacion,
                "estado_nombre": nodo.estado.nombre if nodo.estado else None,
                "estado_color": nodo.estado.color if nodo.estado else None,
                "detalles_ubicacion": nodo.detalles_ubicacion,
                "etiquetas": nodo.etiquetas or [],
                "personas_vinculadas": personas_list,
                "puede_leer": tiene_lectura,
                "puede_escribir": tiene_escritura
            }
        }
        
        # 2. Hijos directos
        hijos_directos = [h for h in nodo.children if h.es_ubicacion_fisica == (tipo == "fisico")]
        if not es_admin:
            hijos_directos = [h for h in hijos_directos if h.id in nodos_visibles_set]
        
        # 3. Hijos enlazados de forma cruzada (shortcuts a subcategorías)
        enlaces_subcat = db.query(models.EnlaceCruzado).filter(
            models.EnlaceCruzado.nodo_destino_id == nodo.id,
            models.EnlaceCruzado.nodo_origen_id != None
        ).all()
        
        hijos_cruzados = []
        for esc in enlaces_subcat:
            if not es_admin and esc.nodo_origen_id not in nodos_visibles_set:
                continue
            sc = db.query(models.Nodo).filter(models.Nodo.id == esc.nodo_origen_id).first()
            if sc:
                hijos_cruzados.append((sc, esc.id))
        
        hijos_combinados = []
        
        # Añadir subcategorías directas
        if hijos_directos:
            hijos_combinados.extend([construir_rama(child) for child in hijos_directos])
            
        # Añadir subcategorías cruzadas (shortcuts)
        for sc, eid in hijos_cruzados:
            rama_sc = construir_rama(sc)
            rama_sc["attributes"]["es_enlace_cruzado"] = True
            rama_sc["attributes"]["enlace_cruzado_id"] = eid
            rama_sc["name"] = f"🔗 {rama_sc['name']}" # Distintivo visual
            hijos_combinados.append(rama_sc)

        if tiene_lectura:
            # 4. Documentos directos
            docs_directos = nodo.documentos_fisicos if tipo == "fisico" else nodo.documentos_logicos
            
            # 5. Documentos enlazados de forma cruzada (shortcuts a archivos)
            enlaces_docs = db.query(models.EnlaceCruzado).filter(
                models.EnlaceCruzado.nodo_destino_id == nodo.id,
                models.EnlaceCruzado.documento_origen_id != None
            ).all()
            
            docs_cruzados = []
            for edc in enlaces_docs:
                d = db.query(models.Documento).filter(models.Documento.id == edc.documento_origen_id).first()
                if d:
                    docs_cruzados.append((d, edc.id))
                
            # Añadir documentos directos
            if docs_directos:
                for doc in docs_directos:
                    hijos_combinados.append({
                        "name": doc.nombre_archivo,
                        "attributes": {
                            "id_documento": doc.id,
                            "codigo": f"{nodo.codigo_inteligente}-DOC-{doc.id}",
                            "tipo": "Archivo DMS",
                            "es_archivo": True,
                            "ruta": doc.ruta_archivo,
                            "version": doc.version,
                            "estado_nombre": doc.estado.nombre if doc.estado else None,
                            "estado_color": doc.estado.color if doc.estado else None,
                            "personas_vinculadas_ids": [pv.persona_id for pv in doc.personas_vinculadas]
                        }
                    })
                    
            # Añadir documentos cruzados (shortcuts)
            for doc, eid in docs_cruzados:
                hijos_combinados.append({
                    "name": f"🔗 {doc.nombre_archivo}",
                    "attributes": {
                        "id_documento": doc.id,
                        "codigo": f"{nodo.codigo_inteligente}-DOC-{doc.id}",
                        "tipo": "Archivo DMS",
                        "es_archivo": True,
                        "es_enlace_cruzado": True,
                        "enlace_cruzado_id": eid,
                        "ruta": doc.ruta_archivo,
                        "version": doc.version,
                        "estado_nombre": doc.estado.nombre if doc.estado else None,
                        "estado_color": doc.estado.color if doc.estado else None,
                        "personas_vinculadas_ids": [pv.persona_id for pv in doc.personas_vinculadas]
                    }
                })
            
        if hijos_combinados:
            rama["children"] = hijos_combinados
            
        return rama

    if not raices:
        return {}
    if len(raices) == 1:
        return construir_rama(raices[0])
    return {
        "name": "Estructura Lógica" if tipo == "logico" else "Estructura Física",
        "attributes": {
            "codigo": "SYS",
            "tipo": "Sistema",
            "puede_leer": True,
            "puede_escribir": es_admin
        },
        "children": [construir_rama(r) for r in raices]
    }

# Eliminar un Nodo
@app.delete("/nodos/{nodo_id}", status_code=status.HTTP_200_OK)
def eliminar_nodo(nodo_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    db_nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not db_nodo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nodo no encontrado.")
    nombre = db_nodo.nombre
    codigo = db_nodo.codigo_inteligente
    
    db.delete(db_nodo)
    db.commit()
    
    registrar_log(db, current_user.username, f"Eliminó nodo '{nombre}' y subramas", codigo)
    return {"message": f"Nodo y descendientes eliminados con éxito."}

# Listar los documentos asociados a un Nodo (incluyendo relaciones y enlaces cruzados)
@app.get("/nodos/{nodo_id}/documentos")
def listar_documentos_nodo(nodo_id: int, db: Session = Depends(get_db)):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nodo no encontrado.")
    
    # 1. Obtener documentos directos
    if nodo.es_ubicacion_fisica:
        docs_directos = db.query(models.Documento).filter(models.Documento.ubicacion_fisica_id == nodo_id).all()
    else:
        docs_directos = db.query(models.Documento).filter(models.Documento.nodo_id == nodo_id).all()
        
    # 2. Obtener documentos enlazados de forma cruzada hacia este nodo
    enlaces = db.query(models.EnlaceCruzado).filter(
        models.EnlaceCruzado.nodo_destino_id == nodo_id,
        models.EnlaceCruzado.documento_origen_id != None
    ).all()
    
    docs_cruzados = []
    for e in enlaces:
        d = db.query(models.Documento).filter(models.Documento.id == e.documento_origen_id).first()
        if d:
            docs_cruzados.append((d, e.id)) # (documento, enlace_id)
            
    # Helper para formatear un documento con sus personas
    def formatear_doc(doc, es_cruzado=False, enlace_id=None):
        vinculos_db = db.query(models.PersonaVinculo).options(
            joinedload(models.PersonaVinculo.rol_momento),
            joinedload(models.PersonaVinculo.persona).joinedload(models.Persona.rol_actual)
        ).filter(models.PersonaVinculo.documento_id == doc.id).all()
        personas_list = []
        for v in vinculos_db:
            rol_nombre = v.rol_momento.nombre if v.rol_momento else v.persona.rol_actual.nombre if v.persona.rol_actual else "Sin Rol"
            rol_color = v.rol_momento.color if v.rol_momento else v.persona.rol_actual.color if v.persona.rol_actual else "#cbd5e1"
            personas_list.append({
                "vinculo_id": v.id,
                "persona_id": v.persona_id,
                "nombre_completo": v.persona.nombre_completo,
                "identificacion": v.persona.identificacion,
                "rol": rol_nombre,
                "rol_color": rol_color,
                "carrera_departamento": v.persona.carrera_departamento,
                "tipo_relacion": v.tipo_relacion,
                "peso": v.peso
            })
        # Ordenar personas vinculadas por peso
        personas_list.sort(key=lambda x: x["peso"])
        
        return {
            "id": doc.id,
            "nombre_archivo": doc.nombre_archivo,
            "ruta_archivo": doc.ruta_archivo,
            "version": doc.version,
            "identificador_dms": doc.identificador_dms,
            "creado_en": doc.creado_en,
            "estado_id": doc.estado_id,
            "estado": {
                "id": doc.estado.id,
                "nombre": doc.estado.nombre,
                "color": doc.estado.color,
                "secuencia": doc.estado.secuencia
            } if doc.estado else None,
            "nodo": {
                "id": doc.nodo.id,
                "nombre": doc.nodo.nombre,
                "codigo_inteligente": doc.nodo.codigo_inteligente,
                "es_ubicacion_fisica": doc.nodo.es_ubicacion_fisica
            } if doc.nodo else None,
            "ubicacion_fisica": {
                "id": doc.ubicacion_fisica.id,
                "nombre": doc.ubicacion_fisica.nombre,
                "codigo_inteligente": doc.ubicacion_fisica.codigo_inteligente,
                "es_ubicacion_fisica": doc.ubicacion_fisica.es_ubicacion_fisica
            } if doc.ubicacion_fisica else None,
            "es_enlace_cruzado": es_cruzado,
            "enlace_cruzado_id": enlace_id,
            "personas_vinculadas": personas_list
        }
        
    resultado = []
    for doc in docs_directos:
        resultado.append(formatear_doc(doc, es_cruzado=False))
    for doc, eid in docs_cruzados:
        resultado.append(formatear_doc(doc, es_cruzado=True, enlace_id=eid))
        
    return resultado

# Generar Código QR
@app.get("/nodos/{nodo_id}/qr")
def generar_qr_nodo(nodo_id: int, db: Session = Depends(get_db)):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nodo no encontrado.")
    
    url_ficha = f"http://localhost:5173/?node_code={nodo.codigo_inteligente}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url_ficha)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    registrar_log(db, "consulta_publica", f"Generó/Consultó Código QR", nodo.codigo_inteligente)
    return StreamingResponse(img_byte_arr, media_type="image/png")

# Subir un archivo físico al DMS con Versionamiento y Logs
@app.post("/nodos/{nodo_id}/documentos/subir", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
async def subir_documento_dms(
    nodo_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(get_current_user)
):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nodo no encontrado.")
        
    if not verificar_permiso_escritura(current_user, nodo_id, db):
        raise HTTPException(status_code=403, detail="No tienes permisos de escritura en esta categoría.")
    
    filename_original = file.filename
    filename_clean = filename_original.replace(" ", "_")
    identificador_base = os.path.splitext(filename_clean)[0].lower()
    
    if nodo.es_ubicacion_fisica:
        documentos_existentes = db.query(models.Documento).filter(
            models.Documento.ubicacion_fisica_id == nodo_id,
            models.Documento.identificador_dms == identificador_base
        ).order_by(models.Documento.version.desc()).all()
    else:
        documentos_existentes = db.query(models.Documento).filter(
            models.Documento.nodo_id == nodo_id,
            models.Documento.identificador_dms == identificador_base
        ).order_by(models.Documento.version.desc()).all()
    
    if documentos_existentes:
        nueva_version = documentos_existentes[0].version + 1
    else:
        nueva_version = 1
        
    ext = os.path.splitext(filename_clean)[1]
    name_with_version = f"{nodo_id}_{identificador_base}_v{nueva_version}{ext}"
    file_path = os.path.join(DMS_DIR, name_with_version)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al escribir en disco: {e}")
        
    ruta_publica = f"/media/dms/{name_with_version}"
    
    fecha_limite = None
    if nodo.es_ubicacion_fisica and nodo.meses_retencion_limite:
        fecha_limite = datetime.datetime.now() + datetime.timedelta(days=nodo.meses_retencion_limite * 30)

    if nodo.es_ubicacion_fisica:
        db_doc = models.Documento(
            nombre_archivo=filename_original,
            ruta_archivo=ruta_publica,
            ubicacion_fisica_id=nodo_id,
            nodo_id=None,
            version=nueva_version,
            identificador_dms=identificador_base,
            fecha_limite_retencion=fecha_limite
        )
    else:
        db_doc = models.Documento(
            nombre_archivo=filename_original,
            ruta_archivo=ruta_publica,
            nodo_id=nodo_id,
            ubicacion_fisica_id=None,
            version=nueva_version,
            identificador_dms=identificador_base
        )
        
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    registrar_log(db, current_user.username, f"Subió archivo DMS '{filename_original}' (v{nueva_version})", nodo.codigo_inteligente)
    return db_doc

# Eliminar un archivo DMS por ID (Requiere Admin)
@app.delete("/documentos/{doc_id}", status_code=status.HTTP_200_OK)
def eliminar_documento_dms(doc_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    doc = db.query(models.Documento).filter(models.Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
        
    nombre_archivo = doc.nombre_archivo
    nodo_codigo = doc.nodo.codigo_inteligente if doc.nodo else None
    
    # Intentar borrar el archivo del sistema
    ruta_relativa = doc.ruta_archivo.lstrip('/')
    if os.path.exists(ruta_relativa):
        try:
            os.remove(ruta_relativa)
        except Exception as e:
            print(f"Error al borrar archivo físico del disco: {e}")
            
    db.delete(doc)
    db.commit()
    
    registrar_log(db, current_user.username, f"Eliminó documento DMS '{nombre_archivo}'", nodo_codigo)
    return {"message": "Documento eliminado correctamente."}

# Listar logs de auditoría (Requiere Admin)
@app.get("/logs/", response_model=List[LogResponse])
def listar_logs_auditoria(db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    return db.query(models.ActividadLog).order_by(models.ActividadLog.creado_en.desc()).limit(20).all()

# Obtener Indicadores del Dashboard
@app.get("/nodos/estadisticas/globales")
def obtener_estadisticas_globales(db: Session = Depends(get_db)):
    total_nodos = db.query(models.Nodo).count()
    total_ubicaciones = db.query(models.Nodo).filter(models.Nodo.es_ubicacion_fisica == True).count()
    total_categorias = total_nodos - total_ubicaciones
    total_documentos = db.query(models.Documento).count()
    
    nodos_principales = db.query(models.Nodo).filter(
        models.Nodo.parent_id == None,
        models.Nodo.es_ubicacion_fisica == False
    ).all()
    
    if not nodos_principales:
        nodos_principales = db.query(models.Nodo).filter(
            models.Nodo.es_ubicacion_fisica == False
        ).limit(5).all()
        
    distribucion = []
    for f in nodos_principales:
        doc_count = db.query(models.Documento).join(
            models.Nodo, models.Documento.nodo_id == models.Nodo.id
        ).filter(
            models.Nodo.codigo_inteligente.like(f"{f.codigo_inteligente}%")
        ).count()
        distribucion.append({
            "name": f.nombre,
            "documentos": doc_count
        })
        
    # Obtener tipos de archivos registrados de forma real
    documentos = db.query(models.Documento).all()
    conteo_tipos = {
        "pdf": 0,
        "imagenes": 0,
        "excel": 0,
        "otros": 0
    }
    for doc in documentos:
        ext = doc.nombre_archivo.split(".")[-1].lower() if "." in doc.nombre_archivo else ""
        if ext == "pdf":
            conteo_tipos["pdf"] += 1
        elif ext in ["png", "jpg", "jpeg", "gif"]:
            conteo_tipos["imagenes"] += 1
        elif ext in ["xls", "xlsx"]:
            conteo_tipos["excel"] += 1
        else:
            conteo_tipos["otros"] += 1
        
    return {
        "total_nodos": total_nodos,
        "total_ubicaciones": total_ubicaciones,
        "total_categorias": total_categorias,
        "total_documentos": total_documentos,
        "distribucion": distribucion,
        "tipos_archivo": conteo_tipos
    }

# Obtener Estadísticas Analíticas para Reportes
@app.get("/reportes/estadisticas")
def obtener_estadisticas_reportes(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    # 1. Distribución por tipo de archivo
    documentos = db.query(models.Documento).all()
    tipos = {}
    for doc in documentos:
        ext = doc.nombre_archivo.split(".")[-1].lower() if "." in doc.nombre_archivo else "desconocido"
        tipos[ext] = tipos.get(ext, 0) + 1
        
    distribucion_formatos = [{"name": ext.upper(), "value": count} for ext, count in tipos.items()]
    distribucion_formatos.sort(key=lambda x: x["value"], reverse=True)
    if len(distribucion_formatos) > 5:
        principales = distribucion_formatos[:4]
        otros_val = sum(x["value"] for x in distribucion_formatos[4:])
        principales.append({"name": "OTROS", "value": otros_val})
        distribucion_formatos = principales

    # 2. Distribución por Departamento
    vinculos = db.query(models.PersonaVinculo).join(models.Persona).all()
    depto_conteo = {}
    for v in vinculos:
        depto = v.persona.carrera_departamento or "General"
        depto_conteo[depto] = depto_conteo.get(depto, 0) + 1
        
    distribucion_deptos = [{"name": depto, "value": count} for depto, count in depto_conteo.items()]
    distribucion_deptos.sort(key=lambda x: x["value"], reverse=True)

    # 3. Ocupación física (Capacidad)
    nodos_fisicos = db.query(models.Nodo).filter(models.Nodo.es_ubicacion_fisica == True).all()
    ocupacion_fisica = []
    for nf in nodos_fisicos:
        docs_count = db.query(models.Documento).filter(models.Documento.ubicacion_fisica_id == nf.id).count()
        limite = 50
        ocupacion_fisica.append({
            "id": nf.id,
            "nombre": nf.nombre,
            "codigo": nf.codigo_inteligente,
            "ocupado": docs_count,
            "capacidad": limite,
            "porcentaje": min(100, round((docs_count / limite) * 100, 1)) if limite > 0 else 0
        })
        
    # 4. Histórico de Actividad (Últimos 7 días)
    hace_una_semana = datetime.datetime.now() - datetime.timedelta(days=7)
    logs_recientes = db.query(models.ActividadLog).filter(models.ActividadLog.creado_en >= hace_una_semana).all()
    
    actividad_diaria = {}
    for i in range(7):
        dia = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
        actividad_diaria[dia] = 0
        
    for l in logs_recientes:
        dia_str = l.creado_en.strftime('%Y-%m-%d')
        if dia_str in actividad_diaria:
            actividad_diaria[dia_str] += 1
            
    historico_actividad = [{"fecha": fecha, "eventos": conteo} for fecha, conteo in sorted(actividad_diaria.items())]

    # Alertas activas
    total_alertas = db.query(models.Documento).filter(
        models.Documento.fecha_limite_retencion != None,
        models.Documento.fecha_limite_retencion <= datetime.datetime.now()
    ).count()

    return {
        "distribucion_formatos": distribucion_formatos,
        "distribucion_deptos": distribucion_deptos,
        "ocupacion_fisica": ocupacion_fisica,
        "historico_actividad": historico_actividad,
        "total_documentos": len(documentos),
        "total_alertas": total_alertas,
        "total_nodos_fisicos": len(nodos_fisicos)
    }

# Exportación de Inventarios en CSV
@app.get("/nodos/{nodo_id}/reporte")
def exportar_reporte_inventario(nodo_id: int, db: Session = Depends(get_db)):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nodo no encontrado.")
        
    prefijo = nodo.codigo_inteligente
    nodos_rama = db.query(models.Nodo).filter(models.Nodo.codigo_inteligente.like(f"{prefijo}%")).all()
    
    output = io.StringIO()
    output.write("Reporte de Inventario Jerarquico Archi-vite\n")
    output.write(f"Nodo Raiz de Consulta: {nodo.nombre} [{nodo.codigo_inteligente}]\n")
    output.write(f"Fecha de Reporte: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
    output.write("ID,Nombre,Codigo Inteligente,Abreviacion,Es Ubicacion Fisica,Documentos Asociados\n")
    
    for n in nodos_rama:
        docs = db.query(models.Documento).filter(models.Documento.nodo_id == n.id).all()
        nombres_docs = " | ".join([f"{d.nombre_archivo} (v{d.version})" for d in docs])
        row = f'{n.id},"{n.nombre}",{n.codigo_inteligente},{n.abreviacion},{n.es_ubicacion_fisica},"{nombres_docs}"\n'
        output.write(row)
        
    registrar_log(db, "exportacion_inventario", f"Exportó inventario de nodo", nodo.codigo_inteligente)
    response_content = output.getvalue()
    output.close()
    
    return Response(
        content=response_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Reporte_{nodo.codigo_inteligente}.csv"}
    )

# ============================================================================
# ENDPOINTS PARA GESTIÓN DE WORKFLOW Y USUARIOS (RBAC)
# ============================================================================

@app.get("/estados/", response_model=List[EstadoWorkflowResponse])
def listar_estados(db: Session = Depends(get_db)):
    return db.query(models.EstadoWorkflow).order_by(models.EstadoWorkflow.secuencia.asc()).all()

@app.post("/estados/", response_model=EstadoWorkflowResponse)
def crear_o_modificar_estado(
    estado_data: EstadoWorkflowCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    # Buscar si ya existe un estado con el mismo nombre
    existente = db.query(models.EstadoWorkflow).filter(
        models.EstadoWorkflow.nombre == estado_data.nombre.strip()
    ).first()
    
    if existente:
        existente.color = estado_data.color
        existente.secuencia = estado_data.secuencia
        existente.aplica_a = estado_data.aplica_a
        db.commit()
        db.refresh(existente)
        registrar_log(db, current_user.username, f"Modificó estado de workflow '{existente.nombre}'")
        return existente
        
    nuevo_estado = models.EstadoWorkflow(
        nombre=estado_data.nombre.strip(),
        color=estado_data.color,
        secuencia=estado_data.secuencia,
        aplica_a=estado_data.aplica_a
    )
    db.add(nuevo_estado)
    db.commit()
    db.refresh(nuevo_estado)
    registrar_log(db, current_user.username, f"Creó estado de workflow '{nuevo_estado.nombre}'")
    return nuevo_estado

@app.delete("/estados/{estado_id}")
def eliminar_estado(
    estado_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    estado = db.query(models.EstadoWorkflow).filter(models.EstadoWorkflow.id == estado_id).first()
    if not estado:
        raise HTTPException(status_code=404, detail="Estado no encontrado.")
        
    db.delete(estado)
    db.commit()
    registrar_log(db, current_user.username, f"Eliminó estado de workflow '{estado.nombre}'")
    return {"message": "Estado eliminado exitosamente."}

# ENDPOINTS DE TRANSICIONES DEL WORKFLOW (FSM)

@app.get("/estados/transiciones", response_model=List[TransicionResponse])
def listar_transiciones(db: Session = Depends(get_db)):
    return db.query(models.TransicionEstado).all()

@app.post("/estados/transiciones", response_model=TransicionResponse)
def crear_transicion(
    trans_data: TransicionCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    from_est = db.query(models.EstadoWorkflow).filter(models.EstadoWorkflow.id == trans_data.from_estado_id).first()
    to_est = db.query(models.EstadoWorkflow).filter(models.EstadoWorkflow.id == trans_data.to_estado_id).first()
    if not from_est or not to_est:
        raise HTTPException(status_code=404, detail="Uno o ambos estados no existen.")
        
    existente = db.query(models.TransicionEstado).filter(
        models.TransicionEstado.from_estado_id == trans_data.from_estado_id,
        models.TransicionEstado.to_estado_id == trans_data.to_estado_id
    ).first()
    if existente:
        return existente
        
    nueva_trans = models.TransicionEstado(
        from_estado_id=trans_data.from_estado_id,
        to_estado_id=trans_data.to_estado_id
    )
    db.add(nueva_trans)
    db.commit()
    db.refresh(nueva_trans)
    registrar_log(db, current_user.username, f"Creó transición desde '{from_est.nombre}' hacia '{to_est.nombre}'")
    return nueva_trans

@app.delete("/estados/transiciones")
def eliminar_transicion(
    from_estado_id: int,
    to_estado_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    trans = db.query(models.TransicionEstado).filter(
        models.TransicionEstado.from_estado_id == from_estado_id,
        models.TransicionEstado.to_estado_id == to_estado_id
    ).first()
    
    if not trans:
        raise HTTPException(status_code=404, detail="Transición no encontrada.")
        
    db.delete(trans)
    db.commit()
    registrar_log(db, current_user.username, "Eliminó transición de workflow")
    return {"message": "Transición deshabilitada con éxito."}

# CAMBIO DE ESTADO VALIDADOS POR FSM Y TIPO

@app.put("/nodos/{nodo_id}/estado", response_model=NodoResponse)
def cambiar_estado_nodo(
    nodo_id: int,
    estado_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=404, detail="Nodo no encontrado.")
        
    if estado_id is not None:
        estado = db.query(models.EstadoWorkflow).filter(models.EstadoWorkflow.id == estado_id).first()
        if not estado:
            raise HTTPException(status_code=404, detail="El estado especificado no existe.")
        
        # Validar tipo
        if estado.aplica_a not in ["categoria", "ambos"]:
            raise HTTPException(status_code=400, detail=f"El estado '{estado.nombre}' solo aplica a archivos.")
            
        # Validar transición
        if nodo.estado_id is not None and nodo.estado_id != estado_id:
            permitida = db.query(models.TransicionEstado).filter(
                models.TransicionEstado.from_estado_id == nodo.estado_id,
                models.TransicionEstado.to_estado_id == estado_id
            ).first()
            if not permitida:
                raise HTTPException(status_code=400, detail="Transición denegada. No permitida por la máquina de estados.")
            
    nodo.estado_id = estado_id
    db.commit()
    db.refresh(nodo)
    
    estado_nombre = nodo.estado.nombre if nodo.estado else "Ninguno"
    registrar_log(db, current_user.username, f"Cambió estado de categoría a '{estado_nombre}'", nodo.codigo_inteligente)
    return nodo

@app.put("/documentos/{doc_id}/estado", response_model=DocumentoResponse)
def cambiar_estado_documento(
    doc_id: int,
    estado_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    doc = db.query(models.Documento).filter(models.Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
        
    if estado_id is not None:
        estado = db.query(models.EstadoWorkflow).filter(models.EstadoWorkflow.id == estado_id).first()
        if not estado:
            raise HTTPException(status_code=404, detail="El estado especificado no existe.")
            
        # Validar tipo
        if estado.aplica_a not in ["archivo", "ambos"]:
            raise HTTPException(status_code=400, detail=f"El estado '{estado.nombre}' solo aplica a categorías.")

        # Validar transición
        if doc.estado_id is not None and doc.estado_id != estado_id:
            permitida = db.query(models.TransicionEstado).filter(
                models.TransicionEstado.from_estado_id == doc.estado_id,
                models.TransicionEstado.to_estado_id == estado_id
            ).first()
            if not permitida:
                raise HTTPException(status_code=400, detail="Transición denegada. No permitida por la máquina de estados.")
            
    doc.estado_id = estado_id
    db.commit()
    db.refresh(doc)
    
    estado_nombre = doc.estado.nombre if doc.estado else "Ninguno"
    nodo_codigo = doc.nodo.codigo_inteligente if doc.nodo else None
    registrar_log(db, current_user.username, f"Cambió estado de documento '{doc.nombre_archivo}' a '{estado_nombre}'", nodo_codigo)
    return doc


@app.get("/usuarios/", response_model=List[UsuarioResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    return db.query(models.Usuario).all()

@app.put("/usuarios/{usuario_id}/rol", response_model=UsuarioResponse)
def cambiar_rol_usuario(
    usuario_id: int,
    rol: str,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    if rol not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Rol inválido. Debe ser 'admin' o 'user'.")
        
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
    if usuario.username == current_user.username:
        raise HTTPException(status_code=400, detail="No puedes cambiar tu propio rol.")
        
    usuario.rol = rol
    db.commit()
    db.refresh(usuario)
    registrar_log(db, current_user.username, f"Cambió rol de usuario '{usuario.username}' a '{rol}'")
    return usuario


@app.post("/usuarios/cambiar-password")
def cambiar_password_usuario(
    req: CambiarPasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    if not req.new_password or len(req.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres.")
        
    current_user.password_hash = generar_hash(req.new_password.strip())
    current_user.debe_cambiar_password = False
    db.commit()
    db.refresh(current_user)
    
    registrar_log(db, current_user.username, "Actualizó su contraseña personal por primer ingreso")
    return {"status": "success", "message": "Contraseña actualizada exitosamente."}


# ============================================================================
# ENDPOINTS PARA EXPLORADOR LOCAL REAL DEL HOST CON TRADUCCIÓN INTELIGENTE
# ============================================================================

@app.get("/pc-local/listar")
def listar_directorio_local(path: Optional[str] = None):
    path_traducido = traducir_ruta_host_a_container(path)
    
    if not os.path.exists(path_traducido):
        path_traducido = os.getcwd()
        
    path_traducido = os.path.abspath(path_traducido)
    
    try:
        items = []
        with os.scandir(path_traducido) as it:
            for entry in it:
                if entry.name.startswith('.'):
                    continue
                path_usuario = traducir_ruta_container_a_host(entry.path)
                items.append({
                    "name": entry.name,
                    "kind": "directory" if entry.is_dir() else "file",
                    "path": path_usuario
                })
        
        items.sort(key=lambda x: (x["kind"] != "directory", x["name"].lower()))
        
        path_windows_actual = traducir_ruta_container_a_host(path_traducido)
        parent_windows_path = traducir_ruta_container_a_host(os.path.dirname(path_traducido)) if os.path.dirname(path_traducido) != path_traducido else None
        
        return {
            "current_path": path_windows_actual,
            "parent_path": parent_windows_path,
            "items": items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo acceder al directorio local: {str(e)}")

@app.post("/nodos/{nodo_id}/documentos/subir-local")
def importar_archivo_local_host(
    nodo_id: int, 
    import_data: LocalFileImport, 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(require_admin)
):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=404, detail="Nodo no encontrado.")
        
    filepath_traducido = traducir_ruta_host_a_container(import_data.filepath)
    
    if not os.path.exists(filepath_traducido) or not os.path.isfile(filepath_traducido):
        raise HTTPException(status_code=400, detail="El archivo local especificado no existe en el host o el volumen Docker no está montado.")
        
    filename_original = os.path.basename(filepath_traducido)
    filename_clean = filename_original.replace(" ", "_")
    identificador_base = os.path.splitext(filename_clean)[0].lower()
    
    if nodo.es_ubicacion_fisica:
        documentos_existentes = db.query(models.Documento).filter(
            models.Documento.ubicacion_fisica_id == nodo_id,
            models.Documento.identificador_dms == identificador_base
        ).order_by(models.Documento.version.desc()).all()
    else:
        documentos_existentes = db.query(models.Documento).filter(
            models.Documento.nodo_id == nodo_id,
            models.Documento.identificador_dms == identificador_base
        ).order_by(models.Documento.version.desc()).all()
    
    if documentos_existentes:
        nueva_version = documentos_existentes[0].version + 1
    else:
        nueva_version = 1
        
    ext = os.path.splitext(filename_clean)[1]
    name_with_version = f"{nodo_id}_{identificador_base}_v{nueva_version}{ext}"
    dest_path = os.path.join(DMS_DIR, name_with_version)
    
    try:
        shutil.copy2(filepath_traducido, dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al copiar archivo físico: {e}")
        
    ruta_publica = f"/media/dms/{name_with_version}"
    
    if nodo.es_ubicacion_fisica:
        db_doc = models.Documento(
            nombre_archivo=filename_original,
            ruta_archivo=ruta_publica,
            ubicacion_fisica_id=nodo_id,
            nodo_id=None,
            version=nueva_version,
            identificador_dms=identificador_base
        )
    else:
        db_doc = models.Documento(
            nombre_archivo=filename_original,
            ruta_archivo=ruta_publica,
            nodo_id=nodo_id,
            ubicacion_fisica_id=None,
            version=nueva_version,
            identificador_dms=identificador_base
        )
        
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    registrar_log(db, current_user.username, f"Importó archivo local '{filename_original}' (v{nueva_version})", nodo.codigo_inteligente)
    return db_doc


def actualizar_codigos_inteligentes_recursivo(db: Session, nodo: models.Nodo):
    if nodo.parent_id is None:
        prefix = nodo.abreviacion
        query = db.query(models.Nodo).filter(
            models.Nodo.parent_id == None,
            models.Nodo.id != nodo.id,
            models.Nodo.codigo_inteligente.like(f"{prefix}-%")
        )
        count = query.count()
        nodo.codigo_inteligente = f"{prefix}-{count + 1:03d}"
    else:
        parent_node = db.query(models.Nodo).filter(models.Nodo.id == nodo.parent_id).first()
        parent_code = parent_node.codigo_inteligente
        prefix = f"{parent_code}-{nodo.abreviacion}"
        query = db.query(models.Nodo).filter(
            models.Nodo.parent_id == nodo.parent_id,
            models.Nodo.id != nodo.id,
            models.Nodo.codigo_inteligente.like(f"{prefix}-%")
        )
        count = query.count()
        nodo.codigo_inteligente = f"{prefix}-{count + 1:03d}"
    
    db.commit()
    db.refresh(nodo)
    
    for child in nodo.children:
        actualizar_codigos_inteligentes_recursivo(db, child)


@app.put("/nodos/{nodo_id}/mover", response_model=NodoResponse)
def mover_nodo(
    nodo_id: int,
    nuevo_parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=404, detail="Nodo no encontrado.")
        
    if nuevo_parent_id is not None:
        if nuevo_parent_id == nodo_id:
            raise HTTPException(status_code=400, detail="No puedes mover una categoría dentro de sí misma.")
            
        def es_descendiente(parent_id, child_id):
            if parent_id == child_id:
                return True
            child = db.query(models.Nodo).filter(models.Nodo.id == child_id).first()
            if not child or child.parent_id is None:
                return False
            return es_descendiente(parent_id, child.parent_id)
            
        if es_descendiente(nodo_id, nuevo_parent_id):
            raise HTTPException(status_code=400, detail="No puedes mover una categoría dentro de uno de sus propios descendientes.")
            
        nuevo_parent = db.query(models.Nodo).filter(models.Nodo.id == nuevo_parent_id).first()
        if not nuevo_parent:
            raise HTTPException(status_code=404, detail="La ubicación destino no existe.")
            
    nodo.parent_id = nuevo_parent_id
    db.commit()
    
    actualizar_codigos_inteligentes_recursivo(db, nodo)
    
    parent_nombre = nuevo_parent.nombre if nuevo_parent_id else "Raíz Central"
    registrar_log(db, current_user.username, f"Movió categoría '{nodo.nombre}' hacia '{parent_nombre}' [Re-cálculo de códigos]", nodo.codigo_inteligente)
    return nodo


@app.put("/documentos/{doc_id}/mover", response_model=DocumentoResponse)
def mover_documento(
    doc_id: int,
    nuevo_nodo_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    doc = db.query(models.Documento).filter(models.Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
        
    nuevo_nodo = db.query(models.Nodo).filter(models.Nodo.id == nuevo_nodo_id).first()
    if not nuevo_nodo:
        raise HTTPException(status_code=404, detail="La categoría destino no existe.")
        
    from_nodo_nombre = doc.nodo.nombre if doc.nodo else "Desconocido"
    doc.nodo_id = nuevo_nodo_id
    db.commit()
    db.refresh(doc)
    
    registrar_log(db, current_user.username, f"Movió archivo '{doc.nombre_archivo}' desde '{from_nodo_nombre}' hacia '{nuevo_nodo.nombre}'", nuevo_nodo.codigo_inteligente)
    return doc


@app.put("/documentos/{doc_id}/indexar", response_model=DocumentoResponse)
def indexar_documento_doble(
    doc_id: int,
    nodo_id: Optional[int] = None,
    ubicacion_fisica_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    doc = db.query(models.Documento).filter(models.Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
        
    if nodo_id is not None:
        logical_node = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
        if not logical_node:
            raise HTTPException(status_code=404, detail="La categoría lógica destino no existe.")
        if logical_node.es_ubicacion_fisica:
            raise HTTPException(status_code=400, detail="El nodo_id especificado corresponde a una ubicación física y debe ser lógico.")
        doc.nodo_id = nodo_id
        
    if ubicacion_fisica_id is not None:
        physical_node = db.query(models.Nodo).filter(models.Nodo.id == ubicacion_fisica_id).first()
        if not physical_node:
            raise HTTPException(status_code=404, detail="La ubicación física destino no existe.")
        if not physical_node.es_ubicacion_fisica:
            raise HTTPException(status_code=400, detail="El ubicacion_fisica_id especificado corresponde a una categoría lógica y debe ser físico.")
        doc.ubicacion_fisica_id = ubicacion_fisica_id
        
        # Calcular fecha límite de retención
        if physical_node.meses_retencion_limite:
            doc.fecha_limite_retencion = datetime.datetime.now() + datetime.timedelta(days=physical_node.meses_retencion_limite * 30)
        else:
            doc.fecha_limite_retencion = None
        doc.transferido_en = None  # Resetear indicador de transferencia
        
    db.commit()
    db.refresh(doc)
    
    log_msg = f"Doble indexación en archivo '{doc.nombre_archivo}': Lógico={doc.nodo.nombre if doc.nodo else 'Ninguno'}, Físico={doc.ubicacion_fisica.nombre if doc.ubicacion_fisica else 'Ninguno'}"
    registrar_log(db, current_user.username, log_msg, doc.nodo.codigo_inteligente if doc.nodo else doc.ubicacion_fisica.codigo_inteligente if doc.ubicacion_fisica else None)
    return doc


# ============================================================================
# Endpoints de Grafo de Vinculaciones Cruzadas (Personas y Shortcuts)
# ============================================================================

# 0. Catálogo Dinámico de Roles de Organización
@app.get("/roles-organizacion/", response_model=List[RolOrganizacionResponse])
def listar_roles_organizacion(db: Session = Depends(get_db)):
    return db.query(models.RolOrganizacion).order_by(models.RolOrganizacion.nombre).all()

@app.post("/roles-organizacion/", response_model=RolOrganizacionResponse, status_code=status.HTTP_201_CREATED)
def crear_rol_organizacion(rol: RolOrganizacionCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    existente = db.query(models.RolOrganizacion).filter(models.RolOrganizacion.codigo == rol.codigo.strip().upper()).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un rol registrado con ese código.")
    db_rol = models.RolOrganizacion(
        nombre=rol.nombre.strip(),
        codigo=rol.codigo.strip().upper(),
        color=rol.color.strip()
    )
    db.add(db_rol)
    db.commit()
    db.refresh(db_rol)
    registrar_log(db, current_user.username, f"Creó rol corporativo: '{db_rol.nombre}' ({db_rol.codigo})")
    return db_rol

@app.delete("/roles-organizacion/{rol_id}", status_code=status.HTTP_200_OK)
def eliminar_rol_organizacion(rol_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    rol = db.query(models.RolOrganizacion).filter(models.RolOrganizacion.id == rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol de organización no encontrado.")
    db.delete(rol)
    db.commit()
    return {"message": "Rol de organización eliminado con éxito."}


# 1. Directorio de Personas
@app.get("/personas/", response_model=List[PersonaResponse])
def listar_personas(db: Session = Depends(get_db)):
    return db.query(models.Persona).options(joinedload(models.Persona.rol_actual)).all()

@app.post("/personas/", response_model=PersonaResponse, status_code=status.HTTP_201_CREATED)
def crear_persona(persona: PersonaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    existente = db.query(models.Persona).filter(models.Persona.identificacion == persona.identificacion.strip()).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una persona registrada con ese número de identificación.")
        
    rol = db.query(models.RolOrganizacion).filter(models.RolOrganizacion.id == persona.rol_actual_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="El rol de organización especificado no existe.")

    if persona.crear_usuario:
        if not persona.username:
            raise HTTPException(status_code=400, detail="Debe especificar nombre de usuario para la cuenta.")
        usr_existente = db.query(models.Usuario).filter(models.Usuario.username == persona.username.strip()).first()
        if usr_existente:
            raise HTTPException(status_code=400, detail="El nombre de usuario especificado ya está registrado en el sistema.")

    db_persona = models.Persona(
        identificacion=persona.identificacion.strip(),
        nombre_completo=persona.nombre_completo.strip(),
        rol_actual_id=persona.rol_actual_id,
        carrera_departamento=persona.carrera_departamento.strip() if persona.carrera_departamento else None
    )
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    
    if persona.crear_usuario:
        db_usuario = models.Usuario(
            username=persona.username.strip(),
            password_hash=generar_hash(persona.identificacion.strip()),
            rol="user",
            persona_id=db_persona.id,
            debe_cambiar_password=True
        )
        db.add(db_usuario)
        db.commit()
        registrar_log(db, current_user.username, f"Creó cuenta de usuario '{db_usuario.username}' vinculada a '{db_persona.nombre_completo}'")

    registrar_log(db, current_user.username, f"Registró a '{db_persona.nombre_completo}' ({rol.nombre}) en el Catálogo Central")
    return db_persona

# 2. Vínculos de Personas con Pesos
@app.post("/vinculos/persona", response_model=PersonaVinculoResponse, status_code=status.HTTP_201_CREATED)
def crear_vinculo_persona(vinculo: PersonaVinculoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    # Validar que exista la persona
    persona = db.query(models.Persona).filter(models.Persona.id == vinculo.persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada.")
        
    if vinculo.nodo_id is None and vinculo.documento_id is None:
        raise HTTPException(status_code=400, detail="Debe especificar al menos un nodo_id o documento_id para vincular.")
        
    # Obtener el rol del momento
    rol_momento_id = vinculo.rol_momento_id if vinculo.rol_momento_id is not None else persona.rol_actual_id
    if rol_momento_id is not None:
        rol = db.query(models.RolOrganizacion).filter(models.RolOrganizacion.id == rol_momento_id).first()
        if not rol:
            raise HTTPException(status_code=404, detail="El rol del momento especificado no existe.")

    # Evitar vinculación duplicada
    dup_query = db.query(models.PersonaVinculo).filter(models.PersonaVinculo.persona_id == vinculo.persona_id)
    if vinculo.nodo_id is not None:
        dup_query = dup_query.filter(models.PersonaVinculo.nodo_id == vinculo.nodo_id)
    if vinculo.documento_id is not None:
        dup_query = dup_query.filter(models.PersonaVinculo.documento_id == vinculo.documento_id)
        
    dup = dup_query.first()
    if dup:
        raise HTTPException(status_code=400, detail="Esta persona ya se encuentra vinculada a este activo.")
        
    db_vinculo = models.PersonaVinculo(
        persona_id=vinculo.persona_id,
        nodo_id=vinculo.nodo_id,
        documento_id=vinculo.documento_id,
        rol_momento_id=rol_momento_id,
        tipo_relacion=vinculo.tipo_relacion.strip(),
        peso=min(max(vinculo.peso, 1), 10)
    )
    db.add(db_vinculo)
    db.commit()
    db.refresh(db_vinculo)
    
    activo_nombre = ""
    if vinculo.nodo_id:
        nodo = db.query(models.Nodo).filter(models.Nodo.id == vinculo.nodo_id).first()
        activo_nombre = f"categoría '{nodo.nombre}'"
    else:
        doc = db.query(models.Documento).filter(models.Documento.id == vinculo.documento_id).first()
        activo_nombre = f"archivo '{doc.nombre_archivo}'"
        
    rol_nombre = db.query(models.RolOrganizacion).filter(models.RolOrganizacion.id == rol_momento_id).first().nombre if rol_momento_id else "Sin Rol"
    registrar_log(db, current_user.username, f"Vinculó a '{persona.nombre_completo}' en rol de '{rol_nombre}' ({vinculo.tipo_relacion}, peso {vinculo.peso}) con {activo_nombre}")
    
    db_vinculo = db.query(models.PersonaVinculo).options(
        joinedload(models.PersonaVinculo.rol_momento),
        joinedload(models.PersonaVinculo.persona).joinedload(models.Persona.rol_actual)
    ).filter(models.PersonaVinculo.id == db_vinculo.id).first()
    
    return db_vinculo

@app.delete("/vinculos/persona/{vinculo_id}", status_code=status.HTTP_200_OK)
def eliminar_vinculo_persona(vinculo_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    vinculo = db.query(models.PersonaVinculo).filter(models.PersonaVinculo.id == vinculo_id).first()
    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo de persona no encontrado.")
        
    db.delete(vinculo)
    db.commit()
    
    registrar_log(db, current_user.username, f"Desvinculó relación de persona ID={vinculo.persona_id} de activo lógico/físico")
    return {"message": "Vínculo eliminado con éxito."}

# 3. Enlaces Cruzados (Accesos Directos)
@app.post("/vinculos/cruzado", response_model=EnlaceCruzadoResponse, status_code=status.HTTP_201_CREATED)
def crear_enlace_cruzado(enlace: EnlaceCruzadoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    if enlace.nodo_origen_id is None and enlace.documento_origen_id is None:
        raise HTTPException(status_code=400, detail="Debe especificar una categoría o un documento origen para enlazar.")
        
    # Verificar que el destino exista
    destino = db.query(models.Nodo).filter(models.Nodo.id == enlace.nodo_destino_id).first()
    if not destino:
        raise HTTPException(status_code=404, detail="La categoría destino del enlace no existe.")
        
    # Evitar duplicados
    dup_query = db.query(models.EnlaceCruzado).filter(models.EnlaceCruzado.nodo_destino_id == enlace.nodo_destino_id)
    if enlace.nodo_origen_id is not None:
        dup_query = dup_query.filter(models.EnlaceCruzado.nodo_origen_id == enlace.nodo_origen_id)
    if enlace.documento_origen_id is not None:
        dup_query = dup_query.filter(models.EnlaceCruzado.documento_origen_id == enlace.documento_origen_id)
        
    dup = dup_query.first()
    if dup:
        raise HTTPException(status_code=400, detail="Este enlace cruzado ya se encuentra registrado.")
        
    db_enlace = models.EnlaceCruzado(
        nodo_origen_id=enlace.nodo_origen_id,
        documento_origen_id=enlace.documento_origen_id,
        nodo_destino_id=enlace.nodo_destino_id
    )
    db.add(db_enlace)
    db.commit()
    db.refresh(db_enlace)
    
    origen_nombre = ""
    if enlace.nodo_origen_id:
        orig = db.query(models.Nodo).filter(models.Nodo.id == enlace.nodo_origen_id).first()
        origen_nombre = f"categoría '{orig.nombre}'"
    else:
        orig = db.query(models.Documento).filter(models.Documento.id == enlace.documento_origen_id).first()
        origen_nombre = f"archivo '{orig.nombre_archivo}'"
        
    registrar_log(db, current_user.username, f"Creó acceso directo virtual de {origen_nombre} en la carpeta '{destino.nombre}'")
    return db_enlace

@app.delete("/vinculos/cruzado/{vinculo_id}", status_code=status.HTTP_200_OK)
def eliminar_enlace_cruzado(vinculo_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    enlace = db.query(models.EnlaceCruzado).filter(models.EnlaceCruzado.id == vinculo_id).first()
    if not enlace:
        raise HTTPException(status_code=404, detail="Acceso directo virtual no encontrado.")
        
    db.delete(enlace)
    db.commit()
    return {"message": "Enlace cruzado eliminado con éxito."}

# 4. Expediente Consolidado de Persona
@app.get("/personas/{persona_id}/expediente")
def obtener_expediente_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = db.query(models.Persona).options(joinedload(models.Persona.rol_actual)).filter(models.Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada.")
        
    # Obtener todos los vínculos
    vinculos = db.query(models.PersonaVinculo).options(
        joinedload(models.PersonaVinculo.rol_momento),
        joinedload(models.PersonaVinculo.persona).joinedload(models.Persona.rol_actual)
    ).filter(models.PersonaVinculo.persona_id == persona_id).all()
    
    documentos = []
    categorias = []
    
    for v in vinculos:
        # Rol del Momento (con fallback a su rol actual si es nulo)
        rol_m = v.rol_momento if v.rol_momento else persona.rol_actual
        rol_nombre = rol_m.nombre if rol_m else "Sin Rol"
        rol_color = rol_m.color if rol_m else "#cbd5e1"
        
        if v.documento_id:
            doc = db.query(models.Documento).filter(models.Documento.id == v.documento_id).first()
            if doc:
                documentos.append({
                    "id": doc.id,
                    "nombre_archivo": doc.nombre_archivo,
                    "ruta_archivo": doc.ruta_archivo,
                    "version": doc.version,
                    "tipo_relacion": v.tipo_relacion,
                    "peso": v.peso,
                    "creado_en": doc.creado_en,
                    "estado_nombre": doc.estado.nombre if doc.estado else None,
                    "estado_color": doc.estado.color if doc.estado else None,
                    "rol_momento_nombre": rol_nombre,
                    "rol_momento_color": rol_color
                })
        elif v.nodo_id:
            nodo = db.query(models.Nodo).filter(models.Nodo.id == v.nodo_id).first()
            if nodo:
                categorias.append({
                    "id": nodo.id,
                    "nombre": nodo.nombre,
                    "codigo_inteligente": nodo.codigo_inteligente,
                    "es_ubicacion_fisica": nodo.es_ubicacion_fisica,
                    "tipo_relacion": v.tipo_relacion,
                    "peso": v.peso,
                    "creado_en": nodo.creado_en,
                    "estado_nombre": nodo.estado.nombre if nodo.estado else None,
                    "estado_color": nodo.estado.color if nodo.estado else None,
                    "rol_momento_nombre": rol_nombre,
                    "rol_momento_color": rol_color
                })
                
    # Ordenar por relevancia (peso) de menor a mayor
    documentos.sort(key=lambda x: x["peso"])
    categorias.sort(key=lambda x: x["peso"])
    
    return {
        "persona": {
            "id": persona.id,
            "identificacion": persona.identificacion,
            "nombre_completo": persona.nombre_completo,
            "rol_actual": persona.rol_actual.nombre if persona.rol_actual else "Sin Rol",
            "rol_actual_color": persona.rol_actual.color if persona.rol_actual else "#cbd5e1",
            "carrera_departamento": persona.carrera_departamento
        },
        "documentos": documentos,
        "categorias": categorias
    }


# --------------------------------------------------------------------
# CONFIGURACIÓN DE CODIFICACIÓN INTELIGENTE
# --------------------------------------------------------------------

@app.get("/configuracion-codificacion/", response_model=ConfiguracionCodificacionResponse)
def obtener_configuracion_codificacion(db: Session = Depends(get_db)):
    config = db.query(models.ConfiguracionCodificacion).first()
    if not config:
        config = models.ConfiguracionCodificacion(
            separador="-",
            digitos_correlativo=3,
            usar_abreviacion_padre=True,
            prefijo_global=""
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@app.put("/configuracion-codificacion/", response_model=ConfiguracionCodificacionResponse)
def actualizar_configuracion_codificacion(payload: ConfiguracionCodificacionUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    config = db.query(models.ConfiguracionCodificacion).first()
    if not config:
        config = models.ConfiguracionCodificacion()
        db.add(config)
        db.commit()
        db.refresh(config)
        
    config.separador = payload.separador
    config.digitos_correlativo = payload.digitos_correlativo
    config.usar_abreviacion_padre = payload.usar_abreviacion_padre
    config.prefijo_global = payload.prefijo_global
    
    db.commit()
    db.refresh(config)
    
    registrar_log(db, current_user.username, f"Actualizó reglas de codificación: Separador='{config.separador}', Digitos={config.digitos_correlativo}, UsarPadre={config.usar_abreviacion_padre}, Prefijo='{config.prefijo_global}'", "CONFIG-COD")
    
    return config


# --------------------------------------------------------------------
# TABLA DE RETENCIÓN DOCUMENTAL Y TRANSFERENCIA FÍSICA
# --------------------------------------------------------------------

@app.get("/retencion/alertas", response_model=List[DocumentoResponse])
def listar_alertas_retencion(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Retorna la lista de documentos que han superado su fecha límite de retención
    en su ubicación física y aún no han sido transferidos, filtrados por permisos de lectura.
    """
    now = datetime.datetime.now()
    alertas = db.query(models.Documento).filter(
        models.Documento.fecha_limite_retencion != None,
        models.Documento.fecha_limite_retencion <= now,
        models.Documento.transferido_en == None
    ).options(
        joinedload(models.Documento.nodo),
        joinedload(models.Documento.ubicacion_fisica)
    ).all()
    
    if current_user.rol == "admin":
        return alertas
        
    alertas_filtradas = []
    for doc in alertas:
        tiene_nodo_l = False
        tiene_nodo_f = False
        
        if doc.nodo_id:
            tiene_nodo_l = verificar_permiso_lectura(current_user, doc.nodo_id, db)
        if doc.ubicacion_fisica_id:
            tiene_nodo_f = verificar_permiso_lectura(current_user, doc.ubicacion_fisica_id, db)
            
        if tiene_nodo_l or tiene_nodo_f:
            alertas_filtradas.append(doc)
            
    return alertas_filtradas


@app.post("/retencion/transferir/{doc_id}", response_model=DocumentoResponse)
def transferir_documento_fisico(
    doc_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(require_admin)
):
    """
    Ejecuta la transferencia física del documento al nodo destino configurado
    en la ubicación física de origen.
    """
    doc = db.query(models.Documento).filter(models.Documento.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    
    # Obtener el nodo físico actual
    if not doc.ubicacion_fisica_id:
        raise HTTPException(
            status_code=400, 
            detail="El documento no tiene una ubicación física asignada."
        )
        
    nodo_actual = db.query(models.Nodo).filter(models.Nodo.id == doc.ubicacion_fisica_id).first()
    if not nodo_actual or not nodo_actual.nodo_destino_transferencia_id:
        raise HTTPException(
            status_code=400, 
            detail="La ubicación física actual del documento no define un destino de transferencia."
        )
        
    nodo_destino_id = nodo_actual.nodo_destino_transferencia_id
    nodo_destino = db.query(models.Nodo).filter(models.Nodo.id == nodo_destino_id).first()
    if not nodo_destino:
        raise HTTPException(
            status_code=404, 
            detail="El nodo destino de la transferencia no existe."
        )
        
    from_nombre = nodo_actual.nombre
    to_nombre = nodo_destino.nombre
    
    # Mover físicamente el documento en la base de datos
    doc.ubicacion_fisica_id = nodo_destino_id
    doc.transferido_en = datetime.datetime.now()
    
    # Recalcular la fecha límite de retención en la nueva ubicación (si el destino tiene otra regla)
    if nodo_destino.meses_retencion_limite:
        doc.fecha_limite_retencion = datetime.datetime.now() + datetime.timedelta(days=nodo_destino.meses_retencion_limite * 30)
    else:
        doc.fecha_limite_retencion = None
        
    db.commit()
    db.refresh(doc)
    
    # Log de auditoría
    log_msg = f"Transferencia física de documento '{doc.nombre_archivo}' completada: desde '{from_nombre}' hacia '{to_nombre}'"
    registrar_log(db, current_user.username, log_msg, nodo_destino.codigo_inteligente)
    
    return doc


@app.post("/sistema/resetear")
def resetear_sistema(
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(require_admin)
):
    """
    Vacía de forma segura todas las tablas del sistema excepto el usuario administrador.
    Limpia también la carpeta de almacenamiento de medios para evitar archivos huérfanos.
    """
    try:
        # 1. Eliminar vínculos
        db.query(models.PersonaVinculo).delete()
        db.query(models.EnlaceCruzado).delete()
        
        # 2. Eliminar documentos
        db.query(models.Documento).delete()
        
        # 3. Eliminar nodos rompiendo la autorreferencia
        db.query(models.Nodo).update({models.Nodo.parent_id: None})
        db.commit()
        db.query(models.Nodo).delete()
        
        # 4. Eliminar personas y roles
        db.query(models.Persona).delete()
        db.query(models.RolOrganizacion).delete()
        
        # 5. Eliminar workflow y transiciones
        db.query(models.TransicionEstado).delete()
        db.query(models.EstadoWorkflow).delete()
        
        # 6. Eliminar logs
        db.query(models.ActividadLog).delete()
        
        # 7. Eliminar otros usuarios excepto admin
        db.query(models.Usuario).filter(models.Usuario.username != 'admin').delete()
        
        db.commit()

        # 8. Borrar archivos físicos en media/dms/
        MEDIA_DIR = "media/dms"
        import os
        import shutil
        if os.path.exists(MEDIA_DIR):
            for filename in os.listdir(MEDIA_DIR):
                file_path = os.path.join(MEDIA_DIR, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    print(f"Error borrando archivo de media: {e}")

        # Registrar un log inicial nuevo en el sistema reseteado
        log_inicial = models.ActividadLog(
            usuario=current_user.username,
            accion="Inicialización completa del sistema (Reset). Base de datos vaciada.",
            codigo_nodo=None
        )
        db.add(log_inicial)
        db.commit()

        return {"status": "success", "message": "Sistema restablecido completamente con éxito."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al restablecer el sistema: {str(e)}"
        )


# --------------------------------------------------------------------
# MÓDULO DE COPIAS DE SEGURIDAD (BACKUPS)
# --------------------------------------------------------------------
BACKUP_DIR = "backups"

@app.post("/sistema/backup/crear")
def crear_backup(
    tipo: str = "total", 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(require_admin)
):
    """
    Crea una copia de seguridad del sistema.
    - 'metadatos': Exporta la base de datos serializada en un archivo JSON.
    - 'total': Empaqueta el archivo JSON de metadatos y la carpeta media/dms/ en un archivo ZIP.
    """
    import zipfile
    import json
    import os
    
    if tipo not in ["total", "metadatos"]:
        raise HTTPException(status_code=400, detail="Tipo de backup no válido. Debe ser 'total' o 'metadatos'.")

    try:
        # 1. Serializar los datos de todas las tablas en un diccionario
        metadatos = {
            "usuarios": [
                {"username": u.username, "password_hash": u.password_hash, "rol": u.rol}
                for u in db.query(models.Usuario).all()
            ],
            "roles_organizacion": [
                {"id": r.id, "nombre": r.nombre, "codigo": r.codigo, "color": r.color}
                for r in db.query(models.RolOrganizacion).all()
            ],
            "personas": [
                {"id": p.id, "identificacion": p.identificacion, "nombre_completo": p.nombre_completo, "rol_actual_id": p.rol_actual_id, "carrera_departamento": p.carrera_departamento}
                for p in db.query(models.Persona).all()
            ],
            "estados_workflow": [
                {"id": e.id, "nombre": e.nombre, "color": e.color, "secuencia": e.secuencia, "aplica_a": e.aplica_a}
                for e in db.query(models.EstadoWorkflow).all()
            ],
            "transiciones_estado": [
                {"from_estado_id": t.from_estado_id, "to_estado_id": t.to_estado_id}
                for t in db.query(models.TransicionEstado).all()
            ],
            "nodos": [
                {
                    "id": n.id,
                    "nombre": n.nombre,
                    "abreviacion": n.abreviacion,
                    "codigo_inteligente": n.codigo_inteligente,
                    "parent_id": n.parent_id,
                    "es_ubicacion_fisica": n.es_ubicacion_fisica,
                    "detalles_ubicacion": n.detalles_ubicacion,
                    "etiquetas": n.etiquetas,
                    "meses_retencion_limite": n.meses_retencion_limite,
                    "nodo_destino_transferencia_id": n.nodo_destino_transferencia_id,
                    "estado_id": n.estado_id
                }
                for n in db.query(models.Nodo).all()
            ],
            "documentos": [
                {
                    "id": d.id,
                    "nombre_archivo": d.nombre_archivo,
                    "ruta_archivo": d.ruta_archivo,
                    "nodo_id": d.nodo_id,
                    "ubicacion_fisica_id": d.ubicacion_fisica_id,
                    "version": d.version,
                    "identificador_dms": d.identificador_dms,
                    "fecha_limite_retencion": d.fecha_limite_retencion.isoformat() if d.fecha_limite_retencion else None,
                    "transferido_en": d.transferido_en.isoformat() if d.transferido_en else None,
                    "estado_id": d.estado_id
                }
                for d in db.query(models.Documento).all()
            ],
            "persona_vinculos": [
                {
                    "persona_id": v.persona_id,
                    "nodo_id": v.nodo_id,
                    "documento_id": v.documento_id,
                    "rol_momento_id": v.rol_momento_id,
                    "tipo_relacion": v.tipo_relacion,
                    "peso": v.peso
                }
                for v in db.query(models.PersonaVinculo).all()
            ],
            "enlaces_cruzados": [
                {
                    "nodo_origen_id": ec.nodo_origen_id,
                    "documento_origen_id": ec.documento_origen_id,
                    "nodo_destino_id": ec.nodo_destino_id
                }
                for ec in db.query(models.EnlaceCruzado).all()
            ],
            "configuracion_codificacion": [
                {
                    "separador": c.separador,
                    "digitos_correlativo": c.digitos_correlativo,
                    "usar_abreviacion_padre": c.usar_abreviacion_padre,
                    "prefijo_global": c.prefijo_global
                }
                for c in db.query(models.ConfiguracionCodificacion).all()
            ],
            "actividades_log": [
                {
                    "usuario": log.usuario,
                    "accion": log.accion,
                    "codigo_nodo": log.codigo_nodo,
                    "creado_en": log.creado_en.isoformat() if log.creado_en else None
                }
                for log in db.query(models.ActividadLog).all()
            ]
        }

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs(BACKUP_DIR, exist_ok=True)

        if tipo == "metadatos":
            # Guardar como archivo JSON
            filename = f"backup_metadatos_{timestamp}.json"
            filepath = os.path.join(BACKUP_DIR, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(metadatos, f, indent=4, ensure_ascii=False)
            
            # Log de auditoría
            registrar_log(db, current_user.username, f"Generación de copia de seguridad (Metadatos): {filename}", None)
            return {"status": "success", "filename": filename, "tipo": "metadatos", "size": os.path.getsize(filepath)}

        elif tipo == "total":
            # Crear archivo ZIP consolidado
            filename = f"backup_total_{timestamp}.zip"
            filepath = os.path.join(BACKUP_DIR, filename)
            
            with zipfile.ZipFile(filepath, "w", zipfile.ZIP_DEFLATED) as zip_file:
                # Escribir metadatos JSON dentro del zip
                metadatos_str = json.dumps(metadatos, indent=4, ensure_ascii=False)
                zip_file.writestr("metadatos.json", metadatos_str)
                
                # Escribir todos los archivos físicos de media/dms/
                MEDIA_DIR = "media/dms"
                if os.path.exists(MEDIA_DIR):
                    for root_dir, dirs, files in os.walk(MEDIA_DIR):
                        for file in files:
                            file_path = os.path.join(root_dir, file)
                            # Guardar conservando la estructura de carpetas en el zip
                            arcname = os.path.relpath(file_path, start=".")
                            zip_file.write(file_path, arcname=arcname)
            
            # Log de auditoría
            registrar_log(db, current_user.username, f"Generación de copia de seguridad (Total): {filename}", None)
            return {"status": "success", "filename": filename, "tipo": "total", "size": os.path.getsize(filepath)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar la copia de seguridad: {str(e)}")


@app.get("/sistema/backups")
def listar_backups(
    current_user: models.Usuario = Depends(require_admin)
):
    """
    Lista todos los archivos de copias de seguridad en la carpeta backups/
    """
    import os
    if not os.path.exists(BACKUP_DIR):
        return []
    
    backups_list = []
    for file in os.listdir(BACKUP_DIR):
        if file.startswith("backup_") and (file.endswith(".json") or file.endswith(".zip")):
            filepath = os.path.join(BACKUP_DIR, file)
            size = os.path.getsize(filepath)
            mtime = os.path.getmtime(filepath)
            mtime_dt = datetime.datetime.fromtimestamp(mtime)
            
            tipo = "total" if file.endswith(".zip") else "metadatos"
            backups_list.append({
                "filename": file,
                "tipo": tipo,
                "size": size,
                "fecha": mtime_dt.isoformat()
            })
    
    # Ordenar por fecha descendente
    backups_list.sort(key=lambda x: x["fecha"], reverse=True)
    return backups_list


from fastapi.responses import FileResponse

@app.get("/sistema/backup/descargar/{nombre}")
def descargar_backup(
    nombre: str,
    current_user: models.Usuario = Depends(require_admin)
):
    """
    Permite descargar un archivo de backup específico.
    """
    import os
    filepath = os.path.join(BACKUP_DIR, nombre)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Archivo de copia de seguridad no encontrado.")
    
    return FileResponse(filepath, filename=nombre)


@app.delete("/sistema/backup/eliminar/{nombre}")
def eliminar_backup(
    nombre: str,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    """
    Permite eliminar un archivo de backup.
    """
    import os
    filepath = os.path.join(BACKUP_DIR, nombre)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Archivo de copia de seguridad no encontrado.")
    
    try:
        os.remove(filepath)
        registrar_log(db, current_user.username, f"Eliminación de archivo de copia de seguridad: {nombre}", None)
        return {"status": "success", "message": "Copia de seguridad eliminada con éxito."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar la copia de seguridad: {str(e)}")


# ============================================================================
# ENDPOINTS PARA GESTIÓN DE PERMISOS DE CATEGORÍAS (NODOS)
# ============================================================================

@app.get("/nodos/{nodo_id}/permisos", response_model=List[PermisoNodoResponse])
def listar_permisos_nodo(
    nodo_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    return db.query(models.PermisoNodo).options(
        joinedload(models.PermisoNodo.usuario),
        joinedload(models.PermisoNodo.rol_organizacion)
    ).filter(models.PermisoNodo.nodo_id == nodo_id).all()


@app.post("/nodos/{nodo_id}/permisos", response_model=PermisoNodoResponse, status_code=status.HTTP_201_CREATED)
def crear_permiso_nodo(
    nodo_id: int,
    payload: PermisoNodoCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    if payload.tipo_permiso not in ["lectura", "escritura"]:
        raise HTTPException(status_code=400, detail="Tipo de permiso inválido. Debe ser 'lectura' o 'escritura'.")

    if not payload.usuario_id and not payload.rol_organizacion_id:
        raise HTTPException(status_code=400, detail="Debe especificar un usuario o un rol organizativo para otorgar el permiso.")

    nodo = db.query(models.Nodo).filter(models.Nodo.id == nodo_id).first()
    if not nodo:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")

    db_permiso = models.PermisoNodo(
        nodo_id=nodo_id,
        tipo_permiso=payload.tipo_permiso
    )

    if payload.usuario_id:
        usuario = db.query(models.Usuario).filter(models.Usuario.id == payload.usuario_id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
        existente = db.query(models.PermisoNodo).filter(
            models.PermisoNodo.usuario_id == payload.usuario_id,
            models.PermisoNodo.nodo_id == nodo_id,
            models.PermisoNodo.tipo_permiso == payload.tipo_permiso
        ).first()
        if existente:
            raise HTTPException(status_code=400, detail="Este usuario ya posee el permiso especificado en esta categoría.")
        
        db_permiso.usuario_id = payload.usuario_id
        db.add(db_permiso)
        db.commit()
        db.refresh(db_permiso)
        registrar_log(db, current_user.username, f"Asignó permiso de '{payload.tipo_permiso}' al usuario '{usuario.username}' en categoría '{nodo.nombre}'", nodo.codigo_inteligente)
    else:
        rol_org = db.query(models.RolOrganizacion).filter(models.RolOrganizacion.id == payload.rol_organizacion_id).first()
        if not rol_org:
            raise HTTPException(status_code=404, detail="Rol de Organización no encontrado.")

        existente = db.query(models.PermisoNodo).filter(
            models.PermisoNodo.rol_organizacion_id == payload.rol_organizacion_id,
            models.PermisoNodo.nodo_id == nodo_id,
            models.PermisoNodo.tipo_permiso == payload.tipo_permiso
        ).first()
        if existente:
            raise HTTPException(status_code=400, detail="Este rol organizativo ya posee el permiso especificado en esta categoría.")

        db_permiso.rol_organizacion_id = payload.rol_organizacion_id
        db.add(db_permiso)
        db.commit()
        db.refresh(db_permiso)
        registrar_log(db, current_user.username, f"Asignó permiso de '{payload.tipo_permiso}' al rol '{rol_org.nombre}' en categoría '{nodo.nombre}'", nodo.codigo_inteligente)

    return db_permiso


@app.delete("/nodos/permisos/{permiso_id}")
def eliminar_permiso_nodo(
    permiso_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin)
):
    permiso = db.query(models.PermisoNodo).filter(models.PermisoNodo.id == permiso_id).first()
    if not permiso:
        raise HTTPException(status_code=404, detail="Permiso de acceso no encontrado.")

    db.delete(permiso)
    db.commit()
    
    usuario_name = permiso.usuario.username if permiso.usuario else None
    rol_name = permiso.rol_organizacion.nombre if permiso.rol_organizacion else None
    nodo_name = permiso.nodo.nombre if permiso.nodo else "Categoría"
    nodo_codigo = permiso.nodo.codigo_inteligente if permiso.nodo else None

    destinatario = f"usuario '{usuario_name}'" if usuario_name else f"rol '{rol_name}'"
    registrar_log(db, current_user.username, f"Removió permiso de '{permiso.tipo_permiso}' al {destinatario} en categoría '{nodo_name}'", nodo_codigo)
    return {"status": "success", "message": "Permiso de acceso eliminado con éxito."}


# ============================================================================
# ENDPOINTS PARA GESTIÓN DE VISTAS GUARDADAS DE USUARIOS
# ============================================================================

@app.get("/vistas/", response_model=List[VistaGuardadaResponse])
def listar_vistas_usuario(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return db.query(models.VistaGuardada).filter(models.VistaGuardada.usuario_id == current_user.id).all()


@app.post("/vistas/", response_model=VistaGuardadaResponse)
def crear_vista_usuario(
    payload: VistaGuardadaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    existente = db.query(models.VistaGuardada).filter(
        models.VistaGuardada.usuario_id == current_user.id,
        models.VistaGuardada.nombre == payload.nombre.strip(),
        models.VistaGuardada.tipo_arbol == payload.tipo_arbol.strip()
    ).first()
    
    if existente:
        existente.nodos_expandidos = payload.nodos_expandidos
        db.commit()
        db.refresh(existente)
        registrar_log(db, current_user.username, f"Sobrescribió la vista guardada '{payload.nombre}' ({payload.tipo_arbol})")
        return existente

    db_vista = models.VistaGuardada(
        usuario_id=current_user.id,
        nombre=payload.nombre.strip(),
        tipo_arbol=payload.tipo_arbol.strip(),
        nodos_expandidos=payload.nodos_expandidos
    )
    db.add(db_vista)
    db.commit()
    db.refresh(db_vista)
    
    registrar_log(db, current_user.username, f"Guardó una nueva configuración de vista '{payload.nombre}' ({payload.tipo_arbol})")
    return db_vista


@app.delete("/vistas/{vista_id}")
def eliminar_vista_usuario(
    vista_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    vista = db.query(models.VistaGuardada).filter(
        models.VistaGuardada.id == vista_id,
        models.VistaGuardada.usuario_id == current_user.id
    ).first()
    if not vista:
        raise HTTPException(status_code=404, detail="Vista guardada no encontrada.")

    nombre_vista = vista.nombre
    tipo_vista = vista.tipo_arbol
    db.delete(vista)
    db.commit()
    
    registrar_log(db, current_user.username, f"Eliminó la configuración de vista '{nombre_vista}' ({tipo_vista})")
    return {"status": "success", "message": "Vista guardada eliminada con éxito."}
