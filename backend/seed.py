import hashlib
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models

def generar_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_database():
    print("Recreando base de datos completa adaptada a la Tabla de Retención Documental (TRD) de Investigaciones...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # --------------------------------------------------------------------
        # 1. USUARIOS Y ROLES DE ACCESO (RBAC)
        # --------------------------------------------------------------------
        print("Inyectando usuarios semilla para RBAC...")
        admin = models.Usuario(username="admin", password_hash=generar_hash("admin123"), rol="admin")
        lector = models.Usuario(username="lector", password_hash=generar_hash("lector123"), rol="user")
        revisor = models.Usuario(username="revisor", password_hash=generar_hash("revisor123"), rol="user")
        db.add_all([admin, lector, revisor])
        db.commit()

        # --------------------------------------------------------------------
        # 2. ROLES DE ORGANIZACIÓN DINÁMICOS
        # --------------------------------------------------------------------
        print("Inyectando catálogo de Roles de Organización dinámicos...")
        rol_dir = models.RolOrganizacion(nombre="Director de Investigación (DC)", codigo="DC-DIR", color="#8b5cf6")
        rol_ase = models.RolOrganizacion(nombre="Asesor Científico", codigo="DC-ASE", color="#3b82f6")
        rol_cfo = models.RolOrganizacion(nombre="Gerente Financiero (CFO)", codigo="CORP-CFO", color="#10b981")
        rol_op = models.RolOrganizacion(nombre="Operador de Archivos Nacionales", codigo="AN-OP", color="#ef4444")
        
        db.add_all([rol_dir, rol_ase, rol_cfo, rol_op])
        db.commit()
        db.refresh(rol_dir)
        db.refresh(rol_ase)
        db.refresh(rol_cfo)
        db.refresh(rol_op)

        # --------------------------------------------------------------------
        # 3. CATALOGO DE PERSONAS
        # --------------------------------------------------------------------
        print("Inyectando catálogo de personas de investigación...")
        p_vargas = models.Persona(identificacion="DC-1001", nombre_completo="Dr. Alejandro Vargas", rol_actual_id=rol_dir.id, carrera_departamento="Dirección de Operaciones")
        p_mendez = models.Persona(identificacion="DC-1002", nombre_completo="Lic. Sandra Méndez", rol_actual_id=rol_cfo.id, carrera_departamento="Finanzas Corporativas")
        p_franco = models.Persona(identificacion="DC-1003", nombre_completo="Dr. Roberto Franco", rol_actual_id=rol_ase.id, carrera_departamento="Comité de Calidad")
        p_soto = models.Persona(identificacion="DC-1004", nombre_completo="Ing. Carlos Soto", rol_actual_id=rol_op.id, carrera_departamento="Archivos Centrales")
        
        db.add_all([p_vargas, p_mendez, p_franco, p_soto])
        db.commit()

        # --------------------------------------------------------------------
        # 4. ESTADOS Y TRANSICIONES DEL WORKFLOW (FSM)
        # --------------------------------------------------------------------
        print("Inyectando estados por defecto del Workflow FSM...")
        est_borrador = models.EstadoWorkflow(nombre="Borrador", color="#eab308", secuencia=1, aplica_a="ambos")
        est_revision = models.EstadoWorkflow(nombre="En Revisión", color="#3b82f6", secuencia=2, aplica_a="ambos")
        est_aprobado = models.EstadoWorkflow(nombre="Aprobado", color="#22c55e", secuencia=3, aplica_a="ambos")
        est_vigente = models.EstadoWorkflow(nombre="Vigente", color="#8b5cf6", secuencia=4, aplica_a="ambos")
        est_archivado = models.EstadoWorkflow(nombre="Archivado", color="#64748b", secuencia=5, aplica_a="archivo")
        est_activo = models.EstadoWorkflow(nombre="Activo", color="#a855f7", secuencia=6, aplica_a="categoria")
        
        db.add_all([est_borrador, est_revision, est_aprobado, est_vigente, est_archivado, est_activo])
        db.commit()

        print("Inyectando transiciones permitidas...")
        db.add(models.TransicionEstado(from_estado_id=est_borrador.id, to_estado_id=est_revision.id))
        db.add(models.TransicionEstado(from_estado_id=est_revision.id, to_estado_id=est_aprobado.id))
        db.add(models.TransicionEstado(from_estado_id=est_aprobado.id, to_estado_id=est_vigente.id))
        db.add(models.TransicionEstado(from_estado_id=est_vigente.id, to_estado_id=est_archivado.id))
        db.commit()

        # --------------------------------------------------------------------
        # 5. AMBIENTES FÍSICOS (LUGARES DE ARCHIVO DE LA TRD)
        # --------------------------------------------------------------------
        print("Inyectando Ambientes Físicos de la TRD...")
        
        # Archivos Nacionales (AN)
        env_an = models.Nodo(
            nombre="Archivos Nacionales (AN)",
            abreviacion="AN",
            codigo_inteligente="AV-AN",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Bloque Central de Conservación", "imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Histórico", "Nacional", "Depósito Central"]
        )
        db.add(env_an)
        db.commit()
        db.refresh(env_an)

        # Oficinas GTE (Dirección General)
        env_dc = models.Nodo(
            nombre="Oficinas Dirección General",
            abreviacion="OF-GTE",
            codigo_inteligente="AV-OF-GTE",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Edificio Central - 2do Piso", "imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Local", "Gestión", "Oficina"]
        )
        db.add(env_dc)
        db.commit()
        db.refresh(env_dc)

        # Plataforma OJS (Virtual/Digital)
        env_ojs = models.Nodo(
            nombre="Plataforma OJS",
            abreviacion="OJS",
            codigo_inteligente="AV-OJS",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Portal Web Corporativo", "imagen_url": "/media/semilla/caja.png"},
            estado_id=est_activo.id,
            etiquetas=["Digital", "OJS", "Publicaciones"]
        )
        db.add(env_ojs)
        db.commit()
        db.refresh(env_ojs)

        # Cajas físicas dentro de las Oficinas de Dirección General
        # Caja 1: Retención de 2 años (24 meses) -> Destino: Archivos Nacionales (AN)
        caja_dc_2a = models.Nodo(
            nombre="Caja Temporal 2 Años (GTE)",
            abreviacion="CJ-GTE-2A",
            codigo_inteligente="AV-GTE-CJ-2A",
            parent_id=env_dc.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"caja_codigo": "BOX-GTE-PROYECTOS", "estante": "Sector A-1"},
            estado_id=est_activo.id,
            meses_retencion_limite=24,
            nodo_destino_transferencia_id=env_an.id,
            etiquetas=["Proyectos", "2 Años", "Local"]
        )
        # Caja 2: Retención de 5 años (60 meses) -> Destino: Archivos Nacionales (AN)
        caja_dc_5a = models.Nodo(
            nombre="Caja Temporal 5 Años (DC)",
            abreviacion="CJ-DC-5A",
            codigo_inteligente="AV-DC-CJ-5A",
            parent_id=env_dc.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"caja_codigo": "BOX-DC-GENERAL", "estante": "Sector A-2"},
            estado_id=est_activo.id,
            meses_retencion_limite=60,
            nodo_destino_transferencia_id=env_an.id,
            etiquetas=["Informes", "5 Años", "Quinquenio"]
        )
        # Caja 3: Retención de 1 año (12 meses) -> Destino: Archivos Nacionales (AN)
        caja_dc_1a = models.Nodo(
            nombre="Caja Temporal 1 Año (DC)",
            abreviacion="CJ-DC-1A",
            codigo_inteligente="AV-DC-CJ-1A",
            parent_id=env_dc.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"caja_codigo": "BOX-DC-ACTAS", "estante": "Sector B-1"},
            estado_id=est_activo.id,
            meses_retencion_limite=12,
            nodo_destino_transferencia_id=env_an.id,
            etiquetas=["Actas", "1 Año", "Anual"]
        )
        db.add_all([caja_dc_2a, caja_dc_5a, caja_dc_1a])
        db.commit()
        db.refresh(caja_dc_2a)
        db.refresh(caja_dc_5a)
        db.refresh(caja_dc_1a)

        # Estante definitivo en Archivos Nacionales (AN)
        estante_an = models.Nodo(
            nombre="Estante Conservación Histórica (AN)",
            abreviacion="EST-AN",
            codigo_inteligente="AV-AN-EST01",
            parent_id=env_an.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Conservación", "Permanente", "Nacional"]
        )
        db.add(estante_an)
        db.commit()
        db.refresh(estante_an)

        # --------------------------------------------------------------------
        # 6. CATEGORÍAS LÓGICAS (LOS 23 TIPOS DE DOCUMENTO DE INVESTIGACIÓN)
        # --------------------------------------------------------------------
        print("Inyectando categorías lógicas basadas en los 23 tipos de documentos de la TRD...")
        
        # Ramas Principales
        rama_proyectos = models.Nodo(nombre="Investigaciones y Proyectos", abreviacion="PRY", codigo_inteligente="AV-PRY", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        rama_gestion = models.Nodo(nombre="Gestión Académica de Investigación", abreviacion="GES", codigo_inteligente="AV-GES", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([rama_proyectos, rama_gestion])
        db.commit()
        db.refresh(rama_proyectos)
        db.refresh(rama_gestion)

        # Las 23 categorías de la tabla
        cat_1 = models.Nodo(nombre="Proyectos autorizados", abreviacion="PRY-A", codigo_inteligente="AV-PRY-AUT", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_2 = models.Nodo(nombre="RQ de los proyectos ejecutados", abreviacion="RQ-PR", codigo_inteligente="AV-PRY-RQS", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_3 = models.Nodo(nombre="Informe de ejecución de proyectos", abreviacion="INF-E", codigo_inteligente="AV-PRY-EJE", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_4 = models.Nodo(nombre="Correspondencia interna y externa", abreviacion="CORR", codigo_inteligente="AV-GES-COR", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_5 = models.Nodo(nombre="Currículum de docentes investigadores", abreviacion="CUR-D", codigo_inteligente="AV-GES-CUR", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_6 = models.Nodo(nombre="Informe de intercambio de docentes y estudiantes", abreviacion="INF-I", codigo_inteligente="AV-PRY-INT", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_7 = models.Nodo(nombre="Libro de jefaturas y direcciones de investigación", abreviacion="LIB-J", codigo_inteligente="AV-GES-LIB", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_8 = models.Nodo(nombre="Informes de gestión", abreviacion="INF-G", codigo_inteligente="AV-GES-GES", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_9 = models.Nodo(nombre="Propuestas de investigación no aprobadas", abreviacion="PRP-N", codigo_inteligente="AV-PRY-NAP", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_10 = models.Nodo(nombre="Protocolos de investigación", abreviacion="PRT-I", codigo_inteligente="AV-PRY-PRT", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_11 = models.Nodo(nombre="Actas de reuniones del comité de investigación", abreviacion="ACT-C", codigo_inteligente="AV-GES-ACT", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_12 = models.Nodo(nombre="Tabla sistematizada de Evaluaciones de proyectos", abreviacion="TAB-E", codigo_inteligente="AV-PRY-EVL", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_13 = models.Nodo(nombre="Reportes de financiamiento y presupuestos", abreviacion="REP-F", codigo_inteligente="AV-PRY-FIN", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_14 = models.Nodo(nombre="Convenios y acuerdos de colaboración", abreviacion="CONV", codigo_inteligente="AV-GES-CNV", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_15 = models.Nodo(nombre="Resultados de investigaciones y publicaciones (Revistas)", abreviacion="RES-P", codigo_inteligente="AV-PRY-PUB", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_16 = models.Nodo(nombre="Informes de actividades de centros de investigación", abreviacion="INF-C", codigo_inteligente="AV-PRY-ACT", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_17 = models.Nodo(nombre="Documentación de membresía y participación de sociedades", abreviacion="DOC-M", codigo_inteligente="AV-GES-MEM", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_18 = models.Nodo(nombre="Actas de reuniones de sociedades científicas", abreviacion="ACT-S", codigo_inteligente="AV-GES-ACS", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_19 = models.Nodo(nombre="Informes de colaboración de sociedades científicas", abreviacion="INF-S", codigo_inteligente="AV-GES-ICS", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_20 = models.Nodo(nombre="Programas de eventos de investigación", abreviacion="PRG-E", codigo_inteligente="AV-GES-PRG", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_21 = models.Nodo(nombre="Materiales de presentación (ponencias, posters)", abreviacion="MAT-P", codigo_inteligente="AV-PRY-MAT", parent_id=rama_proyectos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_22 = models.Nodo(nombre="Fotografías y grabaciones de eventos", abreviacion="FOT-G", codigo_inteligente="AV-GES-FOT", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_23 = models.Nodo(nombre="Listas de asistentes a eventos", abreviacion="LST-A", codigo_inteligente="AV-GES-AST", parent_id=rama_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)

        db.add_all([
            cat_1, cat_2, cat_3, cat_4, cat_5, cat_6, cat_7, cat_8, cat_9, cat_10,
            cat_11, cat_12, cat_13, cat_14, cat_15, cat_16, cat_17, cat_18, cat_19,
            cat_20, cat_21, cat_22, cat_23
        ])
        db.commit()

        # --------------------------------------------------------------------
        # 7. DOCUMENTOS SEMILLA DE PRUEBA
        # --------------------------------------------------------------------
        print("Inyectando documentos de prueba basados en el contexto...")
        
        # Documento 1: Proyectos autorizados (vencido hace 45 días para generar alerta en Caja de 2 años)
        fecha_vencida_2a = datetime.datetime.now() - datetime.timedelta(days=45)
        doc_1 = models.Documento(
            nombre_archivo="Proyecto_Investigacion_Litio_Bolivia_Firmado.pdf",
            ruta_archivo="/media/dms/Proyecto_Investigacion_Litio_Bolivia_Firmado.pdf",
            nodo_id=cat_1.id,
            ubicacion_fisica_id=caja_dc_2a.id,
            version=1,
            identificador_dms="av_pry_litio_firmado",
            estado_id=est_vigente.id,
            fecha_limite_retencion=fecha_vencida_2a
        )

        # Documento 2: Informe de Intercambio (vencido hace 15 días en Caja de 1 año)
        fecha_vencida_1a = datetime.datetime.now() - datetime.timedelta(days=15)
        doc_2 = models.Documento(
            nombre_archivo="Informe_Intercambio_Docentes_UNITEPC_2025.pdf",
            ruta_archivo="/media/dms/Informe_Intercambio_Docentes_UNITEPC_2025.pdf",
            nodo_id=cat_6.id,
            ubicacion_fisica_id=caja_dc_1a.id,
            version=1,
            identificador_dms="av_inf_intercambio25",
            estado_id=est_vigente.id,
            fecha_limite_retencion=fecha_vencida_1a
        )

        # Documento 3: Convenio de colaboración (Guardado directo en Archivos Nacionales, retención ilimitada)
        doc_3 = models.Documento(
            nombre_archivo="Convenio_Colaboracion_Academica_UAGRM.pdf",
            ruta_archivo="/media/dms/Convenio_Colaboracion_Academica_UAGRM.pdf",
            nodo_id=cat_14.id,
            ubicacion_fisica_id=estante_an.id,
            version=1,
            identificador_dms="av_cnv_colaboracion_uagrm",
            estado_id=est_archivado.id,
            fecha_limite_retencion=None
        )

        # Documento 4: Protocolo de investigación (Borrador activo en Oficina DC)
        doc_4 = models.Documento(
            nombre_archivo="Protocolo_Investigacion_Plantas_Medicinales.pdf",
            ruta_archivo="/media/dms/Protocolo_Investigacion_Plantas_Medicinales.pdf",
            nodo_id=cat_10.id,
            ubicacion_fisica_id=caja_dc_2a.id,
            version=1,
            identificador_dms="av_prt_plantas_med",
            estado_id=est_borrador.id,
            fecha_limite_retencion=datetime.datetime.now() + datetime.timedelta(days=24*30)
        )

        db.add_all([doc_1, doc_2, doc_3, doc_4])
        db.commit()
        db.refresh(doc_1)
        db.refresh(doc_2)
        db.refresh(doc_3)
        db.refresh(doc_4)

        # --------------------------------------------------------------------
        # 8. VINCULACIONES DE MIEMBROS (CON ROLES HISTÓRICOS Y PESO)
        # --------------------------------------------------------------------
        print("Inyectando vinculaciones de miembros...")
        
        # Director de Investigación firma el Proyecto Autorizado
        db.add(models.PersonaVinculo(persona_id=p_vargas.id, documento_id=doc_1.id, rol_momento_id=rol_dir.id, tipo_relacion="Director Autorizador", peso=1))
        # Asesor Científico revisa el Protocolo en Borrador
        db.add(models.PersonaVinculo(persona_id=p_franco.id, documento_id=doc_4.id, rol_momento_id=rol_ase.id, tipo_relacion="Revisor Técnico", peso=3))
        # Gerente de Finanzas firma el Convenio de Colaboración
        db.add(models.PersonaVinculo(persona_id=p_mendez.id, documento_id=doc_3.id, rol_momento_id=rol_cfo.id, tipo_relacion="Validador Financiero", peso=2))
        
        db.commit()

        # --------------------------------------------------------------------
        # 9. ENLACES CRUZADOS (INTERSECCIONES ENTRE GRAFOS)
        # --------------------------------------------------------------------
        print("Inyectando enlaces cruzados...")
        
        # Enlace 1: Informe de Intercambio (Proyectos) -> Libro de Jefaturas (Gestión)
        db.add(models.EnlaceCruzado(documento_origen_id=doc_2.id, nodo_destino_id=cat_7.id))
        
        # Enlace 2: Convenio de colaboración (Gestión) -> Proyectos autorizados (Proyectos)
        db.add(models.EnlaceCruzado(documento_origen_id=doc_3.id, nodo_destino_id=cat_1.id))
        
        db.commit()

        # --------------------------------------------------------------------
        # 10. CONFIGURACIÓN DE CODIFICACIÓN SEMILLA
        # --------------------------------------------------------------------
        print("Inyectando configuración de codificación por defecto...")
        conf_cod = models.ConfiguracionCodificacion(
            separador="-",
            digitos_correlativo=3,
            usar_abreviacion_padre=True,
            prefijo_global="AV"
        )
        db.add(conf_cod)
        db.commit()

        print("¡Inyección de la estructura de investigación de la TRD finalizada con total éxito!")

    except Exception as e:
        db.rollback()
        print(f"Error crítico al inyectar set de datos corporativos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
