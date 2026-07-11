from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), default="user", nullable=False)  # "admin" o "user"
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class ActividadLog(Base):
    __tablename__ = "actividades_log"

    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(100), nullable=False)
    accion = Column(String(255), nullable=False)
    codigo_nodo = Column(String(100), nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class EstadoWorkflow(Base):
    __tablename__ = "estados_workflow"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    color = Column(String(20), default="#a855f7")  # Código hexadecimal neón
    secuencia = Column(Integer, default=1)        # Orden de transición
    aplica_a = Column(String(20), default="ambos") # "categoria", "archivo", "ambos"

class TransicionEstado(Base):
    __tablename__ = "transiciones_estado"

    id = Column(Integer, primary_key=True, index=True)
    from_estado_id = Column(Integer, ForeignKey("estados_workflow.id", ondelete="CASCADE"), nullable=False)
    to_estado_id = Column(Integer, ForeignKey("estados_workflow.id", ondelete="CASCADE"), nullable=False)

    from_estado = relationship("EstadoWorkflow", foreign_keys=[from_estado_id])
    to_estado = relationship("EstadoWorkflow", foreign_keys=[to_estado_id])


class Nodo(Base):
    __tablename__ = "nodos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    abreviacion = Column(String(10), nullable=False)
    codigo_inteligente = Column(String(100), unique=True, index=True)
    parent_id = Column(Integer, ForeignKey("nodos.id", ondelete="CASCADE"), nullable=True)
    es_ubicacion_fisica = Column(Boolean, default=False)
    detalles_ubicacion = Column(JSON, nullable=True)
    etiquetas = Column(JSON, nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # Flujo de Trabajo
    estado_id = Column(Integer, ForeignKey("estados_workflow.id", ondelete="SET NULL"), nullable=True)
    estado = relationship("EstadoWorkflow")

    # Relación autoreferenciada para el árbol jerárquico N-ario
    parent = relationship("Nodo", remote_side=[id], backref=backref("children", cascade="all, delete-orphan"))
    
    # Relación con los documentos del DMS (Lógica y Física)
    documentos_logicos = relationship("Documento", foreign_keys="[Documento.nodo_id]", back_populates="nodo", cascade="all, delete-orphan")
    documentos_fisicos = relationship("Documento", foreign_keys="[Documento.ubicacion_fisica_id]", back_populates="ubicacion_fisica", cascade="all, delete-orphan")

class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    nodo_id = Column(Integer, ForeignKey("nodos.id", ondelete="SET NULL"), nullable=True) # Lógica
    ubicacion_fisica_id = Column(Integer, ForeignKey("nodos.id", ondelete="SET NULL"), nullable=True) # Física
    version = Column(Integer, default=1, nullable=False)
    identificador_dms = Column(String(100), nullable=True)  # Clave para agrupar versiones
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # Flujo de Trabajo
    estado_id = Column(Integer, ForeignKey("estados_workflow.id", ondelete="SET NULL"), nullable=True)
    estado = relationship("EstadoWorkflow")

    # Relación hacia el Nodo de la jerarquía (Lógica y Física)
    nodo = relationship("Nodo", foreign_keys=[nodo_id], back_populates="documentos_logicos")
    ubicacion_fisica = relationship("Nodo", foreign_keys=[ubicacion_fisica_id], back_populates="documentos_fisicos")


class RolOrganizacion(Base):
    __tablename__ = "roles_organizacion"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    codigo = Column(String(20), unique=True, index=True, nullable=False)
    color = Column(String(20), default="#3b82f6")  # Hexadecimal neón
    creado_en = Column(DateTime(timezone=True), server_default=func.now())


class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    identificacion = Column(String(50), unique=True, index=True, nullable=False)
    nombre_completo = Column(String(255), nullable=False)
    rol_actual_id = Column(Integer, ForeignKey("roles_organizacion.id", ondelete="SET NULL"), nullable=True)
    carrera_departamento = Column(String(255), nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    rol_actual = relationship("RolOrganizacion")


class PersonaVinculo(Base):
    __tablename__ = "persona_vinculos"

    id = Column(Integer, primary_key=True, index=True)
    persona_id = Column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    nodo_id = Column(Integer, ForeignKey("nodos.id", ondelete="CASCADE"), nullable=True)
    documento_id = Column(Integer, ForeignKey("documentos.id", ondelete="CASCADE"), nullable=True)
    rol_momento_id = Column(Integer, ForeignKey("roles_organizacion.id", ondelete="SET NULL"), nullable=True)
    tipo_relacion = Column(String(100), default="Colaborador")
    peso = Column(Integer, default=5)  # 1 a 10
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    persona = relationship("Persona")
    rol_momento = relationship("RolOrganizacion")
    nodo = relationship("Nodo", foreign_keys=[nodo_id], backref=backref("personas_vinculadas", cascade="all, delete-orphan"))
    documento = relationship("Documento", foreign_keys=[documento_id], backref=backref("personas_vinculadas", cascade="all, delete-orphan"))


class EnlaceCruzado(Base):
    __tablename__ = "enlaces_cruzados"

    id = Column(Integer, primary_key=True, index=True)
    nodo_origen_id = Column(Integer, ForeignKey("nodos.id", ondelete="CASCADE"), nullable=True)
    documento_origen_id = Column(Integer, ForeignKey("documentos.id", ondelete="CASCADE"), nullable=True)
    nodo_destino_id = Column(Integer, ForeignKey("nodos.id", ondelete="CASCADE"), nullable=False)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    nodo_destino = relationship("Nodo", foreign_keys=[nodo_destino_id], backref=backref("enlaces_cruzados_dest", cascade="all, delete-orphan"))
    nodo_origen = relationship("Nodo", foreign_keys=[nodo_origen_id], backref=backref("enlaces_cruzados_orig_nodos", cascade="all, delete-orphan"))
    documento_origen = relationship("Documento", foreign_keys=[documento_origen_id], backref=backref("enlaces_cruzados_orig_docs", cascade="all, delete-orphan"))


class ConfiguracionCodificacion(Base):
    __tablename__ = "configuracion_codificacion"

    id = Column(Integer, primary_key=True, index=True)
    separador = Column(String(5), default="-")
    digitos_correlativo = Column(Integer, default=3)
    usar_abreviacion_padre = Column(Boolean, default=True)
    prefijo_global = Column(String(20), default="")
    creado_en = Column(DateTime(timezone=True), server_default=func.now())


