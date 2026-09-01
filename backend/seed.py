import os
import hashlib
import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models

def generar_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generar_pdf_con_titulo(ruta_destino: str, titulo: str, subtitulo: str = "Universidad Técnica Privada Cosmos (UNITEPC)", codigo_doc: str = "AV-DOC"):
    """Crea un PDF físico real y legible con encabezado institucional, título, subtítulo, caja de metadatos y pie de página."""
    titulo_limpio = titulo.replace("(", r"\(").replace(")", r"\)").replace("\\", r"\\")
    subtitulo_limpio = subtitulo.replace("(", r"\(").replace(")", r"\)").replace("\\", r"\\")
    codigo_limpio = codigo_doc.replace("(", r"\(").replace(")", r"\)").replace("\\", r"\\")
    fecha_str = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    
    stream_content = f"""q
0.02 0.45 0.44 rg
0 710 612 82 re f
1 1 1 rg
BT
/F1 17 Tf
50 758 Td
(UNIVERSIDAD TECNICA PRIVADA COSMOS - UNITEPC) Tj
ET
BT
/F2 10 Tf
50 736 Td
(Sistema de Gestion Documental Hibrido Archi-vite | Repositorio Oficial DMS) Tj
ET
0.08 0.12 0.25 rg
BT
/F1 15 Tf
50 645 Td
({titulo_limpio}) Tj
ET
0.35 0.35 0.40 rg
BT
/F2 11 Tf
50 622 Td
({subtitulo_limpio}) Tj
ET
0.80 0.80 0.85 RG
1.5 w
50 605 m 562 605 l S
0.20 0.20 0.25 rg
BT
/F2 10 Tf
50 575 Td
(Este expediente ha sido digitalizado, indexado y catalogado en la estructura oficial de UNITEPC.) Tj
0 -18 Td
(Fecha y hora de indexacion en DMS: {fecha_str}) Tj
0 -18 Td
(Validez legal e institucional verificada bajo normativa de la Direccion de Archivo Central.) Tj
ET
0.95 0.96 0.98 rg
50 230 512 210 re f
0.72 0.75 0.82 RG
1 w
50 230 512 210 re S
0.08 0.15 0.35 rg
BT
/F1 12 Tf
70 410 Td
(METADATOS Y FICHA DE TRAZABILIDAD DOCUMENTAL) Tj
ET
0.22 0.25 0.30 rg
BT
/F2 10 Tf
70 382 Td
(Codigo de Expediente DMS: {codigo_limpio}) Tj
0 -18 Td
(Institucion Titular: Universidad Tecnica Privada Cosmos - UNITEPC Bolivia) Tj
0 -18 Td
(Nivel Jerarquico: Custodia Departamental / Institucional Central) Tj
0 -18 Td
(Control de Acceso: Confidencialidad segun Rol Organizacional RBAC) Tj
0 -18 Td
(Flujo de Trabajo: Regulado mediante Maquina de Estados Finitas FSM) Tj
0 -18 Td
(Ubicacion Fisica: Archivador Palanca / Contenedor en Galpon Central) Tj
ET
0.50 0.50 0.55 rg
BT
/F2 9 Tf
50 40 Td
(UNITEPC - Direccion General de Archivo Central y Correspondencia | Pagina 1 de 1) Tj
ET
0.80 0.80 0.85 RG
0.5 w
50 55 m 562 55 l S
Q"""
    stream_bytes = stream_content.strip().encode("latin-1", errors="replace")
    stream_len = len(stream_bytes)
    
    pdf_data = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length {stream_len} >>
stream
{stream_content.strip()}
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000326 00000 n 
0000000403 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
500
%%EOF
"""
    with open(ruta_destino, "wb") as f:
        f.write(pdf_data.encode("latin-1", errors="replace"))

def asegurar_archivos_media(documentos_info):
    """Crea archivos PDF físicos reales con encabezado y título institucional en media/dms."""
    dms_dir = os.path.join(os.path.dirname(__file__), "media", "dms")
    os.makedirs(dms_dir, exist_ok=True)
    
    for doc in documentos_info:
        nombre_archivo = doc["archivo"]
        titulo = doc.get("titulo", nombre_archivo.replace(".pdf", "").replace("_", " "))
        subtitulo = doc.get("subtitulo", "Universidad Técnica Privada Cosmos (UNITEPC)")
        codigo = doc.get("codigo", "AV-DOC-001")
        target_path = os.path.join(dms_dir, nombre_archivo)
        generar_pdf_con_titulo(target_path, titulo, subtitulo, codigo)

def seed_database():
    print("Iniciando reconstrucción de la Base de Datos para el Ecosistema Archi-vite (UNITEPC)...")
    
    # Limpieza segura de esquemas tanto en PostgreSQL como en SQLite
    with engine.connect() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
            conn.commit()
        else:
            Base.metadata.drop_all(bind=engine)
            
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # --------------------------------------------------------------------
        # 1. ROLES DE ORGANIZACIÓN (UNITEPC)
        # --------------------------------------------------------------------
        print("1. Inyectando Catálogo de Roles de Organización...")
        rol_arc_dir = models.RolOrganizacion(nombre="Dirección de Archivo Central", codigo="ARC-DIR", color="#8b5cf6")
        rol_doc_tut = models.RolOrganizacion(nombre="Docente Tutor / Asesor P.A.T.", codigo="DOC-TUT", color="#3b82f6")
        rol_est_pos = models.RolOrganizacion(nombre="Postulante / Tesista de Grado", codigo="EST-POST", color="#10b981")
        rol_dir_car = models.RolOrganizacion(nombre="Director de Carrera (Sistemas)", codigo="DIR-CAR", color="#f59e0b")
        rol_sec_gen = models.RolOrganizacion(nombre="Secretaría General y Títulos", codigo="SEC-GEN", color="#ec4899")
        rol_daf_cfo = models.RolOrganizacion(nombre="Dirección Administrativa Financiera (DAF)", codigo="DAF-CFO", color="#06b6d4")
        rol_reg_adm = models.RolOrganizacion(nombre="Jefatura de Registro e Inscripciones", codigo="REG-ADM", color="#14b8a6")
        
        db.add_all([rol_arc_dir, rol_doc_tut, rol_est_pos, rol_dir_car, rol_sec_gen, rol_daf_cfo, rol_reg_adm])
        db.commit()
        db.refresh(rol_arc_dir)
        db.refresh(rol_doc_tut)
        db.refresh(rol_est_pos)
        db.refresh(rol_dir_car)
        db.refresh(rol_sec_gen)
        db.refresh(rol_daf_cfo)
        db.refresh(rol_reg_adm)

        # --------------------------------------------------------------------
        # 2. CATÁLOGO DE PERSONAS (UNITEPC)
        # --------------------------------------------------------------------
        print("2. Inyectando Catálogo de Personas de la Universidad...")
        p_dino = models.Persona(identificacion="SIS-2025-01", nombre_completo="Dino Rosas Montecinos", rol_actual_id=rol_est_pos.id, carrera_departamento="Ingeniería de Sistemas")
        p_claure = models.Persona(identificacion="DOC-1020", nombre_completo="Ing. Jose James Claure Ricaldi", rol_actual_id=rol_doc_tut.id, carrera_departamento="P.A.T. / Carrera Sistemas")
        p_mendez = models.Persona(identificacion="ADM-3001", nombre_completo="Lic. Sandra Méndez", rol_actual_id=rol_arc_dir.id, carrera_departamento="Dpto. Central de Archivos")
        p_vargas = models.Persona(identificacion="DIR-4001", nombre_completo="Dr. Alejandro Vargas", rol_actual_id=rol_dir_car.id, carrera_departamento="Dirección de Carrera Sistemas")
        p_franco = models.Persona(identificacion="ADM-3002", nombre_completo="Lic. Roberto Franco", rol_actual_id=rol_sec_gen.id, carrera_departamento="Secretaría General")
        p_gomez = models.Persona(identificacion="FIN-5001", nombre_completo="Lic. Fernando Gómez", rol_actual_id=rol_daf_cfo.id, carrera_departamento="Dirección Administrativa y Financiera")
        p_torres = models.Persona(identificacion="REG-6001", nombre_completo="Lic. Patricia Torres", rol_actual_id=rol_reg_adm.id, carrera_departamento="Registro e Inscripciones Académicas")
        
        db.add_all([p_dino, p_claure, p_mendez, p_vargas, p_franco, p_gomez, p_torres])
        db.commit()
        db.refresh(p_dino)
        db.refresh(p_claure)
        db.refresh(p_mendez)
        db.refresh(p_vargas)
        db.refresh(p_franco)
        db.refresh(p_gomez)
        db.refresh(p_torres)

        # --------------------------------------------------------------------
        # 3. USUARIOS Y ACCESOS RBAC
        # --------------------------------------------------------------------
        print("3. Inyectando Usuarios de Sistema RBAC...")
        u_admin = models.Usuario(username="admin", password_hash=generar_hash("admin123"), rol="admin", persona_id=p_mendez.id)
        u_dino = models.Usuario(username="dino.rosas", password_hash=generar_hash("dino123"), rol="user", persona_id=p_dino.id)
        u_claure = models.Usuario(username="james.claure", password_hash=generar_hash("claure123"), rol="user", persona_id=p_claure.id)
        u_vargas = models.Usuario(username="alejandro.vargas", password_hash=generar_hash("vargas123"), rol="user", persona_id=p_vargas.id)
        u_gomez = models.Usuario(username="fernando.gomez", password_hash=generar_hash("gomez123"), rol="user", persona_id=p_gomez.id)
        u_torres = models.Usuario(username="patricia.torres", password_hash=generar_hash("torres123"), rol="user", persona_id=p_torres.id)
        u_lector = models.Usuario(username="lector", password_hash=generar_hash("lector123"), rol="user", persona_id=p_franco.id)
        
        db.add_all([u_admin, u_dino, u_claure, u_vargas, u_gomez, u_torres, u_lector])
        db.commit()

        # --------------------------------------------------------------------
        # 4. ESTADOS Y TRANSICIONES WORKFLOW (FSM)
        # --------------------------------------------------------------------
        print("4. Inyectando Estados y Transiciones de Flujo FSM...")
        est_borrador = models.EstadoWorkflow(nombre="Borrador", color="#eab308", secuencia=1, aplica_a="ambos")
        est_revision = models.EstadoWorkflow(nombre="En Revisión", color="#3b82f6", secuencia=2, aplica_a="ambos")
        est_aprobado = models.EstadoWorkflow(nombre="Aprobado", color="#22c55e", secuencia=3, aplica_a="ambos")
        est_vigente = models.EstadoWorkflow(nombre="Vigente", color="#8b5cf6", secuencia=4, aplica_a="ambos")
        est_archivado = models.EstadoWorkflow(nombre="Archivado", color="#64748b", secuencia=5, aplica_a="archivo")
        est_activo = models.EstadoWorkflow(nombre="Activo", color="#a855f7", secuencia=6, aplica_a="categoria")
        
        db.add_all([est_borrador, est_revision, est_aprobado, est_vigente, est_archivado, est_activo])
        db.commit()

        db.add(models.TransicionEstado(from_estado_id=est_borrador.id, to_estado_id=est_revision.id))
        db.add(models.TransicionEstado(from_estado_id=est_revision.id, to_estado_id=est_aprobado.id))
        db.add(models.TransicionEstado(from_estado_id=est_aprobado.id, to_estado_id=est_vigente.id))
        db.add(models.TransicionEstado(from_estado_id=est_vigente.id, to_estado_id=est_archivado.id))
        db.commit()

        # --------------------------------------------------------------------
        # 5. JERARQUÍA FÍSICA UNIVERSITARIA COMPLETA
        # dpto archivos -> galpon -> ambiente -> estante, caja, armario -> archivador -> documentos
        # --------------------------------------------------------------------
        print("5. Inyectando Jerarquía Física Universitaria Real...")

        # NIVEL 1: DPTO. ARCHIVOS (Raíz Física)
        dpto_archivos = models.Nodo(
            nombre="Dpto. Central de Archivos UNITEPC",
            abreviacion="DARC",
            codigo_inteligente="AV-DARC",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={
                "tipo_nivel": "departamento",
                "institucion": "Universidad Técnica Privada Cosmos (UNITEPC)",
                "responsable": "Lic. Sandra Méndez",
                "sede": "Campus Central Cochabamba",
                "descripcion": "Dirección General de Archivo, Custodia y Correspondencia Institucional"
            },
            estado_id=est_activo.id,
            etiquetas=["UNITEPC", "Archivo Central", "Nivel Raíz", "Sede Central"]
        )
        db.add(dpto_archivos)
        db.commit()
        db.refresh(dpto_archivos)

        # NIVEL 2: GALPONES
        galpon_1 = models.Nodo(
            nombre="Galpón 01 - Custodia Central y Trámite Activo",
            abreviacion="GLP01",
            codigo_inteligente="AV-DARC-GLP01",
            parent_id=dpto_archivos.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={
                "tipo_nivel": "galpon",
                "campus": "Campus Florida - Bloque C",
                "capacidad_estanterias": 40,
                "superficie_m2": 480,
                "sistema_seguridad": "CCTV + Detección de Humo",
                "estado_operativo": "Operativo Activo"
            },
            estado_id=est_activo.id,
            etiquetas=["Galpón 1", "Custodia Activa", "Campus Florida"]
        )

        galpon_2 = models.Nodo(
            nombre="Galpón 02 - Fondo Pasivo e Histórico Permanente",
            abreviacion="GLP02",
            codigo_inteligente="AV-DARC-GLP02",
            parent_id=dpto_archivos.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={
                "tipo_nivel": "galpon",
                "campus": "Campus Juan Pablo II",
                "capacidad_estanterias": 60,
                "superficie_m2": 650,
                "sistema_seguridad": "CCTV + Control de Acceso Biométrico",
                "estado_operativo": "Fondo Pasivo Permanente"
            },
            estado_id=est_activo.id,
            etiquetas=["Galpón 2", "Fondo Histórico", "Custodia Pasiva"]
        )
        db.add_all([galpon_1, galpon_2])
        db.commit()
        db.refresh(galpon_1)
        db.refresh(galpon_2)

        # NIVEL 3: AMBIENTES
        amb_a1 = models.Nodo(
            nombre="Ambiente A-1: Sala de Expedientes Académicos y Grados",
            abreviacion="AMB-A1",
            codigo_inteligente="AV-GLP01-A1",
            parent_id=galpon_1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={
                "tipo_nivel": "ambiente",
                "sala": "A-1",
                "temperatura": "20°C",
                "humedad_relativa": "45%",
                "tipo_custodia": "Expedientes de Titulación, P.A.T., Grados y Registro"
            },
            estado_id=est_activo.id,
            etiquetas=["Ambiente A1", "Académico", "Grados", "Titulación", "Registro"]
        )

        amb_a2 = models.Nodo(
            nombre="Ambiente A-2: Sala de Legajos Administrativos, Finanzas y RRHH",
            abreviacion="AMB-A2",
            codigo_inteligente="AV-GLP01-A2",
            parent_id=galpon_1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={
                "tipo_nivel": "ambiente",
                "sala": "A-2",
                "temperatura": "21°C",
                "humedad_relativa": "48%",
                "tipo_custodia": "Contabilidad DAF, Legajos Docentes, RRHH y Convenios"
            },
            estado_id=est_activo.id,
            etiquetas=["Ambiente A2", "Administrativo", "Finanzas", "DAF", "RRHH"]
        )

        amb_b1 = models.Nodo(
            nombre="Ambiente B-1: Sala de Custodia Histórica y Fondo Pasivo (> 5 Años)",
            abreviacion="AMB-B1",
            codigo_inteligente="AV-GLP02-B1",
            parent_id=galpon_2.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={
                "tipo_nivel": "ambiente",
                "sala": "B-1",
                "temperatura": "18°C",
                "humedad_relativa": "40%",
                "tipo_custodia": "Archivo Histórico Permanente Institucional"
            },
            estado_id=est_activo.id,
            etiquetas=["Ambiente B1", "Histórico", "Fondo Pasivo", "Permanente"]
        )
        db.add_all([amb_a1, amb_a2, amb_b1])
        db.commit()
        db.refresh(amb_a1)
        db.refresh(amb_a2)
        db.refresh(amb_b1)

        # NIVEL 4: ESTANTES, CAJAS Y ARMARIOS
        # Ambiente A-1 (Académico, Grados, Registro y Salud)
        estante_01 = models.Nodo(
            nombre="Estante Metálico 01 (Expedientes Titulación y P.A.T. Tecnología)",
            abreviacion="EST-01",
            codigo_inteligente="AV-A1-EST01",
            parent_id=amb_a1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "estante", "material": "Acero Galvanizado", "filas_baldas": 5, "capacidad": 50, "sector": "Pasillo 1"},
            estado_id=est_activo.id,
            etiquetas=["Estante 01", "P.A.T.", "Sistemas", "Tecnología"]
        )
        armario_01 = models.Nodo(
            nombre="Armario Blindado 01 (Títulos, Resoluciones y Valores Académicos)",
            abreviacion="ARM-01",
            codigo_inteligente="AV-A1-ARM01",
            parent_id=amb_a1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "armario", "seguridad": "Cerradura Digital", "compartimientos": 4},
            estado_id=est_activo.id,
            etiquetas=["Armario 01", "Blindado", "Títulos", "Valores"]
        )
        caja_101 = models.Nodo(
            nombre="Caja Masiva C-101 (Acopio Semestral P.A.T.)",
            abreviacion="CJ-101",
            codigo_inteligente="AV-A1-CJ101",
            parent_id=amb_a1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "caja", "material": "Cartón Corrugado Ignífugo", "capacidad": 20},
            estado_id=est_activo.id,
            meses_retencion_limite=24,
            nodo_destino_transferencia_id=galpon_2.id,
            etiquetas=["Caja C101", "Acopio Semestral", "Retención 2 Años"]
        )
        estante_04 = models.Nodo(
            nombre="Estante Metálico 04 (Registro, Admisiones y Matrícula)",
            abreviacion="EST-04",
            codigo_inteligente="AV-A1-EST04",
            parent_id=amb_a1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "estante", "material": "Acero Reforzado", "capacidad": 60, "sector": "Sector Registro"},
            estado_id=est_activo.id,
            etiquetas=["Estante 04", "Registro", "Matrícula", "Admisiones"]
        )
        estante_05 = models.Nodo(
            nombre="Estante Metálico 05 (Facultad de Ciencias de la Salud)",
            abreviacion="EST-05",
            codigo_inteligente="AV-A1-EST05",
            parent_id=amb_a1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "estante", "material": "Acero Quirúrgico Tratado", "capacidad": 60, "sector": "Sector Salud"},
            estado_id=est_activo.id,
            etiquetas=["Estante 05", "Salud", "Medicina", "Odontología", "Enfermería"]
        )

        # Ambiente A-2 (Finanzas, DAF, RRHH, FACEA y Jurídica)
        estante_02 = models.Nodo(
            nombre="Estante Metálico 02 (Legajos Docentes, RRHH y Personal)",
            abreviacion="EST-02",
            codigo_inteligente="AV-A2-EST02",
            parent_id=amb_a2.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "estante", "material": "Acero Inoxidable", "capacidad": 50, "sector": "Pasillo 2"},
            estado_id=est_activo.id,
            etiquetas=["Estante 02", "Docentes", "Investigación", "RRHH"]
        )
        estante_03 = models.Nodo(
            nombre="Estante Metálico 03 (Contabilidad General y Finanzas DAF)",
            abreviacion="EST-03",
            codigo_inteligente="AV-A2-EST03",
            parent_id=amb_a2.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "estante", "material": "Acero Industrial Pesado", "capacidad": 70, "sector": "Sector Contabilidad"},
            estado_id=est_activo.id,
            etiquetas=["Estante 03", "Contabilidad", "Finanzas", "DAF"]
        )
        estante_06 = models.Nodo(
            nombre="Estante Metálico 06 (Facultad FACEA y Ciencias Sociales)",
            abreviacion="EST-06",
            codigo_inteligente="AV-A2-EST06",
            parent_id=amb_a2.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "estante", "material": "Acero Galvanizado", "capacidad": 50, "sector": "Sector FACEA"},
            estado_id=est_activo.id,
            etiquetas=["Estante 06", "FACEA", "Sociales", "Derecho", "Administración"]
        )
        armario_02 = models.Nodo(
            nombre="Armario de Seguridad 02 (Convenios, Poderes y Contratos)",
            abreviacion="ARM-02",
            codigo_inteligente="AV-A2-ARM02",
            parent_id=amb_a2.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "armario", "seguridad": "Llave Maestra + Registro de Acceso"},
            estado_id=est_activo.id,
            etiquetas=["Armario 02", "Convenios", "Jurídica", "Contratos"]
        )
        caja_102 = models.Nodo(
            nombre="Caja Temporal C-102 (Comprobantes Tributarios y Facturación)",
            abreviacion="CJ-102",
            codigo_inteligente="AV-A2-CJ102",
            parent_id=amb_a2.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "caja", "gestion": "2024-2025"},
            estado_id=est_activo.id,
            meses_retencion_limite=12,
            nodo_destino_transferencia_id=galpon_2.id,
            etiquetas=["Caja C102", "Facturación", "Retención 1 Año"]
        )

        # Ambiente B-1 (Galpón 2 - Histórico)
        estante_p01 = models.Nodo(
            nombre="Estante Pasivo 01 (Series Históricas y Resoluciones)",
            abreviacion="EST-P01",
            codigo_inteligente="AV-B1-EST01",
            parent_id=amb_b1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "estante", "capacidad": 80},
            estado_id=est_activo.id,
            etiquetas=["Estante Pasivo", "Histórico", "Resoluciones"]
        )
        caja_201 = models.Nodo(
            nombre="Caja Pasiva Histórica CJ-201 (Kárdex Egresados Década Pasada)",
            abreviacion="CJ-201",
            codigo_inteligente="AV-B1-CJ201",
            parent_id=amb_b1.id,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"tipo_nivel": "caja", "material": "Cartón Neutro de Conservación"},
            estado_id=est_activo.id,
            etiquetas=["Caja Histórica", "Kárdex", "Permanente"]
        )

        db.add_all([estante_01, armario_01, caja_101, estante_04, estante_05, estante_02, estante_03, estante_06, armario_02, caja_102, estante_p01, caja_201])
        db.commit()
        db.refresh(estante_01)
        db.refresh(armario_01)
        db.refresh(caja_101)
        db.refresh(estante_04)
        db.refresh(estante_05)
        db.refresh(estante_02)
        db.refresh(estante_03)
        db.refresh(estante_06)
        db.refresh(armario_02)
        db.refresh(caja_102)
        db.refresh(estante_p01)
        db.refresh(caja_201)

        # NIVEL 5: ARCHIVADORES (Contenedores físicos inmediatos)
        # En Estante 01 (Titulación y P.A.T. Tecnología)
        arc_pg25 = models.Nodo(nombre="Archivador Palanca A-01: Proyectos de Grado - Ing. de Sistemas 2025", abreviacion="ARC-PG25", codigo_inteligente="AV-EST01-ARC01", parent_id=estante_01.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Azul"}, estado_id=est_activo.id, etiquetas=["Archivador", "Proyectos Grado"])
        arc_act25 = models.Nodo(nombre="Archivador Palanca A-02: Actas de Defensa de Grado y Titulación", abreviacion="ARC-ACT25", codigo_inteligente="AV-EST01-ARC02", parent_id=estante_01.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Verde"}, estado_id=est_activo.id, etiquetas=["Archivador", "Actas Defensa"])
        arc_son01 = models.Nodo(nombre="Archivador Palanca A-03: Proyectos de Grado - Ing. de Sonido y Electrónica", abreviacion="ARC-SON01", codigo_inteligente="AV-EST01-ARC03", parent_id=estante_01.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Morado"}, estado_id=est_activo.id, etiquetas=["Archivador", "Sonido", "Electrónica"])

        # En Armario Blindado 01 (Títulos y Resoluciones Ministeriales)
        arc_tpn01 = models.Nodo(nombre="Archivador Palanca B-01: Títulos en Provisión Nacional en Trámite", abreviacion="ARC-TPN01", codigo_inteligente="AV-ARM01-ARC01", parent_id=armario_01.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Carpeta Seguridad Reforzada"}, estado_id=est_activo.id, etiquetas=["Archivador", "Títulos"])
        arc_acr01 = models.Nodo(nombre="Archivador Palanca B-02: Acreditaciones MERCOSUR y Resoluciones Ministeriales", abreviacion="ARC-ACR01", codigo_inteligente="AV-ARM01-ARC02", parent_id=armario_01.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Carpeta Cuero Dorado"}, estado_id=est_activo.id, etiquetas=["Acreditación", "Mercosur", "Resoluciones"])

        # En Caja Masiva C-101 (Acopio PAT)
        arc_pat25 = models.Nodo(nombre="Archivador Carpeta C-01: Fichas de Asesoramiento P.A.T. 2025", abreviacion="ARC-PAT25", codigo_inteligente="AV-CJ101-ARC01", parent_id=caja_101.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Folder Colgante Acordeón"}, estado_id=est_activo.id, etiquetas=["Folder", "P.A.T.", "Asesoramiento"])

        # En Estante 04 (Registro e Inscripciones)
        arc_reg01 = models.Nodo(nombre="Archivador Palanca REG-01: Formularios de Matrícula y Traspasos Sede Central", abreviacion="ARC-REG01", codigo_inteligente="AV-EST04-ARC01", parent_id=estante_04.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Celeste"}, estado_id=est_activo.id, etiquetas=["Registro", "Inscripciones", "Matrícula"])
        arc_bec01 = models.Nodo(nombre="Archivador Palanca BEC-01: Expedientes de Becas y Beneficios Estudiantiles", abreviacion="ARC-BEC01", codigo_inteligente="AV-EST04-ARC02", parent_id=estante_04.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Amarillo"}, estado_id=est_activo.id, etiquetas=["Becas", "Bienestar", "Estudiantes"])
        arc_cnv01 = models.Nodo(nombre="Archivador Palanca CNV-01: Resoluciones de Homologación y Convalidación de Materias", abreviacion="ARC-CNV01", codigo_inteligente="AV-EST04-ARC03", parent_id=estante_04.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Crema"}, estado_id=est_activo.id, etiquetas=["Convalidaciones", "Homologaciones"])

        # En Estante 05 (Facultad de Salud)
        arc_med01 = models.Nodo(nombre="Archivador Palanca SAL-01: Expedientes de Internado Rotatorio y Reválidas Medicina", abreviacion="ARC-MED01", codigo_inteligente="AV-EST05-ARC01", parent_id=estante_05.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Blanco Clínico"}, estado_id=est_activo.id, etiquetas=["Medicina", "Internado", "Salud"])
        arc_odo01 = models.Nodo(nombre="Archivador Palanca SAL-02: Fichas Clínicas Odontológicas y Prótesis Dental", abreviacion="ARC-ODO01", codigo_inteligente="AV-EST05-ARC02", parent_id=estante_05.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Turquesa"}, estado_id=est_activo.id, etiquetas=["Odontología", "Clínicas"])
        arc_enf01 = models.Nodo(nombre="Archivador Palanca SAL-03: Informes de Prácticas Hospitalarias Enfermería y Bioquímica", abreviacion="ARC-ENF01", codigo_inteligente="AV-EST05-ARC03", parent_id=estante_05.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Rosa Pastel"}, estado_id=est_activo.id, etiquetas=["Enfermería", "Bioquímica"])

        # En Estante 02 (Docentes y RRHH)
        arc_ld01 = models.Nodo(nombre="Archivador Palanca L-01: Legajos Docentes Carrera Ing. de Sistemas y Tecnología", abreviacion="ARC-LD01", codigo_inteligente="AV-EST02-ARC01", parent_id=estante_02.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Gris"}, estado_id=est_activo.id, etiquetas=["Docentes", "Legajos"])
        arc_rrhh01 = models.Nodo(nombre="Archivador Palanca RRHH-01: Planillas de Sueldos y Aportes a la Seguridad Social", abreviacion="ARC-RH01", codigo_inteligente="AV-EST02-ARC02", parent_id=estante_02.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Naranja"}, estado_id=est_activo.id, etiquetas=["RRHH", "Sueldos", "Planillas", "AFPs"])
        arc_ctr01 = models.Nodo(nombre="Archivador Palanca RRHH-02: Contratos Laborales y Nombramientos de Personal", abreviacion="ARC-RH02", codigo_inteligente="AV-EST02-ARC03", parent_id=estante_02.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Marrón"}, estado_id=est_activo.id, etiquetas=["RRHH", "Contratos"])

        # En Estante 03 (Contabilidad y Finanzas DAF)
        arc_cont01 = models.Nodo(nombre="Archivador Palanca CONT-01: Balances y Estados Financieros Auditados 2024-2025", abreviacion="ARC-CNT01", codigo_inteligente="AV-EST03-ARC01", parent_id=estante_03.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Azul Marino"}, estado_id=est_activo.id, etiquetas=["DAF", "Contabilidad", "Balances", "Finanzas"])
        arc_comp01 = models.Nodo(nombre="Archivador Palanca COMP-01: Comprobantes de Egreso y Chequeras DAF", abreviacion="ARC-CMP01", codigo_inteligente="AV-EST03-ARC02", parent_id=estante_03.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Guindo"}, estado_id=est_activo.id, etiquetas=["DAF", "Comprobantes", "Egresos", "Chequeras"])
        arc_fac01 = models.Nodo(nombre="Archivador Palanca FAC-01: Libros de Compras/Ventas IVA y Facturación Bancaria", abreviacion="ARC-FAC01", codigo_inteligente="AV-EST03-ARC03", parent_id=estante_03.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Verde Olivo"}, estado_id=est_activo.id, etiquetas=["DAF", "Impuestos", "Bancos", "Facturas"])

        # En Estante 06 (FACEA y Ciencias Sociales)
        arc_fac_adm01 = models.Nodo(nombre="Archivador Palanca FAC-01: Proyectos de Grado Administración y Contaduría", abreviacion="ARC-FADM01", codigo_inteligente="AV-EST06-ARC01", parent_id=estante_06.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Violeta"}, estado_id=est_activo.id, etiquetas=["FACEA", "Administración", "Auditoría"])
        arc_der01 = models.Nodo(nombre="Archivador Palanca DER-01: Expedientes de Clínica Jurídica y Consultorio Gratuito", abreviacion="ARC-DER01", codigo_inteligente="AV-EST06-ARC02", parent_id=estante_06.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Negro Jurídico"}, estado_id=est_activo.id, etiquetas=["Derecho", "Consultorio", "Sociales"])

        # En Armario 02 (Convenios y Jurídica)
        arc_cv01 = models.Nodo(nombre="Archivador Palanca CV-01: Convenios Interinstitucionales de Salud y Tecnología", abreviacion="ARC-CV01", codigo_inteligente="AV-ARM02-ARC01", parent_id=armario_02.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Lomo Ancho Rojo"}, estado_id=est_activo.id, etiquetas=["Convenios", "Salud", "Tecnología"])
        arc_jur01 = models.Nodo(nombre="Archivador Palanca JUR-01: Poderes Notariados y Personería Jurídica Institucional", abreviacion="ARC-JUR01", codigo_inteligente="AV-ARM02-ARC02", parent_id=armario_02.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Cuero Negro Reforzado"}, estado_id=est_activo.id, etiquetas=["Jurídica", "Poderes", "Notariado"])

        # En Galpón 2 (Histórico)
        arc_res15 = models.Nodo(nombre="Archivador Palanca H-01: Resoluciones Rectorales Históricas 2015-2020", abreviacion="ARC-RES15", codigo_inteligente="AV-ESTP01-ARC01", parent_id=estante_p01.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Palanca Conservación Permanente"}, estado_id=est_activo.id, etiquetas=["Resoluciones", "Histórico"])
        arc_kdx01 = models.Nodo(nombre="Archivador Folder K-01: Kárdex Académicos Históricos Facultad de Tecnología", abreviacion="ARC-KDX01", codigo_inteligente="AV-CJ201-ARC01", parent_id=caja_201.id, es_ubicacion_fisica=True, detalles_ubicacion={"tipo_nivel": "archivador", "tipo": "Folder Manila Reforzado"}, estado_id=est_activo.id, etiquetas=["Kárdex", "Histórico"])

        db.add_all([
            arc_pg25, arc_act25, arc_son01, arc_tpn01, arc_acr01, arc_pat25,
            arc_reg01, arc_bec01, arc_cnv01, arc_med01, arc_odo01, arc_enf01,
            arc_ld01, arc_rrhh01, arc_ctr01, arc_cont01, arc_comp01, arc_fac01,
            arc_fac_adm01, arc_der01, arc_cv01, arc_jur01, arc_res15, arc_kdx01
        ])
        db.commit()
        db.refresh(arc_pg25)
        db.refresh(arc_act25)
        db.refresh(arc_son01)
        db.refresh(arc_tpn01)
        db.refresh(arc_acr01)
        db.refresh(arc_pat25)
        db.refresh(arc_reg01)
        db.refresh(arc_bec01)
        db.refresh(arc_cnv01)
        db.refresh(arc_med01)
        db.refresh(arc_odo01)
        db.refresh(arc_enf01)
        db.refresh(arc_ld01)
        db.refresh(arc_rrhh01)
        db.refresh(arc_ctr01)
        db.refresh(arc_cont01)
        db.refresh(arc_comp01)
        db.refresh(arc_fac01)
        db.refresh(arc_fac_adm01)
        db.refresh(arc_der01)
        db.refresh(arc_cv01)
        db.refresh(arc_jur01)
        db.refresh(arc_res15)
        db.refresh(arc_kdx01)

        # --------------------------------------------------------------------
        # 6. JERARQUÍA LÓGICA OFICIAL UNITEPC (ESTRUCTURA ACADÉMICA E INSTITUCIONAL)
        # Obtenida del portal institucional https://unitepc.edu.bo/
        # --------------------------------------------------------------------
        print("6. Inyectando Jerarquía Lógica Académica e Institucional Oficial...")

        # --- ÁREA 1: FACULTAD DE CIENCIAS DE LA SALUD ---
        fac_salud = models.Nodo(nombre="Facultad de Ciencias de la Salud", abreviacion="FCS", codigo_inteligente="AV-FCS", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Facultad", "Salud"])
        db.add(fac_salud)
        db.commit()
        db.refresh(fac_salud)

        car_med = models.Nodo(nombre="Carrera de Medicina", abreviacion="MED", codigo_inteligente="AV-FCS-MED", parent_id=fac_salud.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_odo = models.Nodo(nombre="Carrera de Odontología", abreviacion="ODO", codigo_inteligente="AV-FCS-ODO", parent_id=fac_salud.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_enf = models.Nodo(nombre="Carrera de Enfermería", abreviacion="ENF", codigo_inteligente="AV-FCS-ENF", parent_id=fac_salud.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_bio = models.Nodo(nombre="Carrera de Bioquímica y Farmacia", abreviacion="BIO", codigo_inteligente="AV-FCS-BIO", parent_id=fac_salud.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_vet = models.Nodo(nombre="Carrera de Medicina Veterinaria y Zootecnia", abreviacion="VET", codigo_inteligente="AV-FCS-VET", parent_id=fac_salud.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_fis = models.Nodo(nombre="Carrera de Fisioterapia y Kinesiología", abreviacion="FIS", codigo_inteligente="AV-FCS-FIS", parent_id=fac_salud.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([car_med, car_odo, car_enf, car_bio, car_vet, car_fis])
        db.commit()
        db.refresh(car_med)
        db.refresh(car_odo)
        db.refresh(car_enf)
        db.refresh(car_bio)
        db.refresh(car_vet)
        db.refresh(car_fis)

        cat_med_internado = models.Nodo(nombre="Expedientes de Internado Rotatorio y Casos Clínicos", abreviacion="MED-INT", codigo_inteligente="AV-MED-INT", parent_id=car_med.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_med_grados = models.Nodo(nombre="Actas de Examen de Grado y Reválidas", abreviacion="MED-ACT", codigo_inteligente="AV-MED-ACT", parent_id=car_med.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_med_convenios = models.Nodo(nombre="Convenios de Prácticas Hospitalarias e Internado", abreviacion="MED-CNV", codigo_inteligente="AV-MED-CNV", parent_id=car_med.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        
        cat_odo_fichas = models.Nodo(nombre="Fichas Clínicas Odontológicas y Protocolos", abreviacion="ODO-FCH", codigo_inteligente="AV-ODO-FCH", parent_id=car_odo.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_odo_actas = models.Nodo(nombre="Actas de Titulación e Internado Asistencial", abreviacion="ODO-ACT", codigo_inteligente="AV-ODO-ACT", parent_id=car_odo.id, es_ubicacion_fisica=False, estado_id=est_activo.id)

        cat_enf_informes = models.Nodo(nombre="Informes de Prácticas Hospitalarias y Comunitarias", abreviacion="ENF-INF", codigo_inteligente="AV-ENF-INF", parent_id=car_enf.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_bio_lab = models.Nodo(nombre="Trabajos Dirigidos e Informes de Laboratorio", abreviacion="BIO-LAB", codigo_inteligente="AV-BIO-LAB", parent_id=car_bio.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_vet_hos = models.Nodo(nombre="Protocolos Quirúrgicos y Hospital Veterinario", abreviacion="VET-HOS", codigo_inteligente="AV-VET-HOS", parent_id=car_vet.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_fis_eval = models.Nodo(nombre="Evaluaciones Clínicas y Proyectos de Rehabilitación", abreviacion="FIS-EVL", codigo_inteligente="AV-FIS-EVL", parent_id=car_fis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)

        db.add_all([
            cat_med_internado, cat_med_grados, cat_med_convenios,
            cat_odo_fichas, cat_odo_actas, cat_enf_informes, cat_bio_lab, cat_vet_hos, cat_fis_eval
        ])
        db.commit()

        # --- ÁREA 2: FACULTAD DE CIENCIAS DE LA TECNOLOGÍA ---
        fac_tec = models.Nodo(nombre="Facultad de Ciencias de la Tecnología", abreviacion="FCT", codigo_inteligente="AV-FCT", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Facultad", "Tecnología", "Ingeniería"])
        db.add(fac_tec)
        db.commit()
        db.refresh(fac_tec)

        car_sis = models.Nodo(nombre="Carrera de Ingeniería de Sistemas", abreviacion="SIS", codigo_inteligente="AV-FCT-SIS", parent_id=fac_tec.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_son = models.Nodo(nombre="Carrera de Ingeniería de Sonido", abreviacion="SON", codigo_inteligente="AV-FCT-SON", parent_id=fac_tec.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_biomed = models.Nodo(nombre="Carrera de Ingeniería Biomédica", abreviacion="BIO-ENG", codigo_inteligente="AV-FCT-BIOENG", parent_id=fac_tec.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_elec = models.Nodo(nombre="Carrera de Ingeniería Electrónica", abreviacion="ELEC", codigo_inteligente="AV-FCT-ELEC", parent_id=fac_tec.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([car_sis, car_son, car_biomed, car_elec])
        db.commit()
        db.refresh(car_sis)
        db.refresh(car_son)
        db.refresh(car_biomed)
        db.refresh(car_elec)

        cat_sis_proyectos = models.Nodo(nombre="Proyectos de Grado y Tesis Autorizadas (P.A.T.)", abreviacion="SIS-PG", codigo_inteligente="AV-SIS-PG", parent_id=car_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_sis_actas = models.Nodo(nombre="Actas de Defensa Pública y Titulación", abreviacion="SIS-ACT", codigo_inteligente="AV-SIS-ACT", parent_id=car_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_sis_pat = models.Nodo(nombre="Fichas y Protocolos de Asesoramiento P.A.T.", abreviacion="SIS-PAT", codigo_inteligente="AV-SIS-PAT", parent_id=car_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_sis_legajos = models.Nodo(nombre="Legajos de Docentes e Investigadores", abreviacion="SIS-DOC", codigo_inteligente="AV-SIS-DOC", parent_id=car_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_sis_mallas = models.Nodo(nombre="Planes de Estudio, Mallas y Convalidaciones", abreviacion="SIS-MAL", codigo_inteligente="AV-SIS-MAL", parent_id=car_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        
        cat_son_proy = models.Nodo(nombre="Proyectos Acústicos y Producción Sonora", abreviacion="SON-PRY", codigo_inteligente="AV-SON-PRY", parent_id=car_son.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_biomed_proy = models.Nodo(nombre="Diseños de Equipamiento Médico y Pasantías", abreviacion="BIO-MED-PRY", codigo_inteligente="AV-BIO-PRY", parent_id=car_biomed.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_elec_auto = models.Nodo(nombre="Proyectos de Automatización y Robótica", abreviacion="ELC-AUT", codigo_inteligente="AV-ELC-AUT", parent_id=car_elec.id, es_ubicacion_fisica=False, estado_id=est_activo.id)

        db.add_all([cat_sis_proyectos, cat_sis_actas, cat_sis_pat, cat_sis_legajos, cat_sis_mallas, cat_son_proy, cat_biomed_proy, cat_elec_auto])
        db.commit()

        # --- ÁREA 3: FACULTAD DE CIENCIAS ECONÓMICAS, FINANCIERAS Y ADM. (FACEA) ---
        fac_facea = models.Nodo(nombre="Facultad de Ciencias Económicas, Financieras y Administrativas", abreviacion="FACEA", codigo_inteligente="AV-FACEA", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Facultad", "FACEA"])
        db.add(fac_facea)
        db.commit()
        db.refresh(fac_facea)

        car_adm = models.Nodo(nombre="Carrera de Administración de Empresas", abreviacion="ADM", codigo_inteligente="AV-FACEA-ADM", parent_id=fac_facea.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_con = models.Nodo(nombre="Carrera de Contaduría Pública", abreviacion="CON", codigo_inteligente="AV-FACEA-CON", parent_id=fac_facea.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_com = models.Nodo(nombre="Carrera de Ingeniería Comercial", abreviacion="COM", codigo_inteligente="AV-FACEA-COM", parent_id=fac_facea.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_eco = models.Nodo(nombre="Carrera de Economía", abreviacion="ECO", codigo_inteligente="AV-FACEA-ECO", parent_id=fac_facea.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([car_adm, car_con, car_com, car_eco])
        db.commit()
        db.refresh(car_adm)
        db.refresh(car_con)
        db.refresh(car_com)

        cat_adm_proy = models.Nodo(nombre="Proyectos de Grado y Emprendimiento", abreviacion="ADM-PRY", codigo_inteligente="AV-ADM-PRY", parent_id=car_adm.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_con_aud = models.Nodo(nombre="Auditorías de Grado y Trabajos Dirigidos", abreviacion="CON-AUD", codigo_inteligente="AV-CON-AUD", parent_id=car_con.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_com_mkt = models.Nodo(nombre="Planes de Negocio e Investigación de Mercados", abreviacion="COM-MKT", codigo_inteligente="AV-COM-MKT", parent_id=car_com.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([cat_adm_proy, cat_con_aud, cat_com_mkt])
        db.commit()

        # --- ÁREA 4: FACULTAD DE CIENCIAS SOCIALES Y JURÍDICAS ---
        fac_soc = models.Nodo(nombre="Facultad de Ciencias Sociales y Jurídicas", abreviacion="FCSJ", codigo_inteligente="AV-FCSJ", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Facultad", "Sociales", "Derecho"])
        db.add(fac_soc)
        db.commit()
        db.refresh(fac_soc)

        car_der = models.Nodo(nombre="Carrera de Derecho", abreviacion="DER", codigo_inteligente="AV-FCSJ-DER", parent_id=fac_soc.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_csoc = models.Nodo(nombre="Carrera de Comunicación Social", abreviacion="CSOC", codigo_inteligente="AV-FCSJ-CSOC", parent_id=fac_soc.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        car_cine = models.Nodo(nombre="Carrera de Cinematografía (UNICINE)", abreviacion="CINE", codigo_inteligente="AV-FCSJ-CINE", parent_id=fac_soc.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([car_der, car_csoc, car_cine])
        db.commit()
        db.refresh(car_der)
        db.refresh(car_cine)

        cat_der_clinica = models.Nodo(nombre="Expedientes de Práctica Forense y Consultorio Jurídico", abreviacion="DER-CLN", codigo_inteligente="AV-DER-CLN", parent_id=car_der.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_cine_guiones = models.Nodo(nombre="Festivales UNICINE y Proyectos de Cortometrajes", abreviacion="CINE-GUI", codigo_inteligente="AV-CINE-GUI", parent_id=car_cine.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([cat_der_clinica, cat_cine_guiones])
        db.commit()

        # --- ÁREA 5: DIRECCIÓN ADMINISTRATIVA Y FINANCIERA (DAF) / CONTABILIDAD ---
        dir_daf = models.Nodo(nombre="Dirección Administrativa y Financiera (DAF)", abreviacion="DAF", codigo_inteligente="AV-DAF", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Finanzas", "Contabilidad", "DAF", "Presupuestos"])
        db.add(dir_daf)
        db.commit()
        db.refresh(dir_daf)

        cat_daf_balances = models.Nodo(nombre="Balances Generales y Estados Financieros Auditados", abreviacion="DAF-BAL", codigo_inteligente="AV-DAF-BAL", parent_id=dir_daf.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_daf_comprobantes = models.Nodo(nombre="Comprobantes de Ingreso, Egreso y Pagos a Proveedores", abreviacion="DAF-CMP", codigo_inteligente="AV-DAF-CMP", parent_id=dir_daf.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_daf_poa = models.Nodo(nombre="Programas Operativos Anuales (POA) y Presupuestos", abreviacion="DAF-POA", codigo_inteligente="AV-DAF-POA", parent_id=dir_daf.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_daf_tributos = models.Nodo(nombre="Declaraciones Juradas Tributarias y Libros de Compras/Ventas IVA", abreviacion="DAF-TRB", codigo_inteligente="AV-DAF-TRB", parent_id=dir_daf.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_daf_bancos = models.Nodo(nombre="Conciliaciones Bancarias y Arqueos de Caja", abreviacion="DAF-BNC", codigo_inteligente="AV-DAF-BNC", parent_id=dir_daf.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([cat_daf_balances, cat_daf_comprobantes, cat_daf_poa, cat_daf_tributos, cat_daf_bancos])
        db.commit()

        # --- ÁREA 6: DIRECCIÓN DE REGISTRO E INSCRIPCIONES ACADÉMICAS (DRE) ---
        dir_dre = models.Nodo(nombre="Dirección de Registro e Inscripciones Académicas (DRE)", abreviacion="DRE", codigo_inteligente="AV-DRE", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Registro", "Inscripciones", "Matrícula", "Admisiones"])
        db.add(dir_dre)
        db.commit()
        db.refresh(dir_dre)

        cat_dre_matricula = models.Nodo(nombre="Expedientes de Matrícula y Admisión de Estudiantes Nuevos", abreviacion="DRE-MAT", codigo_inteligente="AV-DRE-MAT", parent_id=dir_dre.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_dre_convalida = models.Nodo(nombre="Resoluciones de Homologación y Convalidación de Materias", abreviacion="DRE-CNV", codigo_inteligente="AV-DRE-CNV", parent_id=dir_dre.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_dre_becas = models.Nodo(nombre="Expedientes de Becas Institucionales y Bienestar Social", abreviacion="DRE-BEC", codigo_inteligente="AV-DRE-BEC", parent_id=dir_dre.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_dre_traspasos = models.Nodo(nombre="Trámites de Traspasos de Sede y Cambio de Carrera", abreviacion="DRE-TRP", codigo_inteligente="AV-DRE-TRP", parent_id=dir_dre.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([cat_dre_matricula, cat_dre_convalida, cat_dre_becas, cat_dre_traspasos])
        db.commit()

        # --- ÁREA 7: DIRECCIÓN DE TALENTO HUMANO (RRHH) ---
        dir_rrhh = models.Nodo(nombre="Dirección de Talento Humano (Recursos Humanos)", abreviacion="RRHH", codigo_inteligente="AV-RRHH", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["RRHH", "Sueldos", "Planillas", "Contratos"])
        db.add(dir_rrhh)
        db.commit()
        db.refresh(dir_rrhh)

        cat_rrhh_planillas = models.Nodo(nombre="Planillas de Sueldos y Aportes a la Seguridad Social (AFPs y Caja)", abreviacion="RRHH-PLA", codigo_inteligente="AV-RRHH-PLA", parent_id=dir_rrhh.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_rrhh_contratos = models.Nodo(nombre="Contratos Laborales y Nombramientos de Personal", abreviacion="RRHH-CTR", codigo_inteligente="AV-RRHH-CTR", parent_id=dir_rrhh.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_rrhh_reglamento = models.Nodo(nombre="Reglamento Interno de Trabajo y Biométrico", abreviacion="RRHH-REG", codigo_inteligente="AV-RRHH-REG", parent_id=dir_rrhh.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([cat_rrhh_planillas, cat_rrhh_contratos, cat_rrhh_reglamento])
        db.commit()

        # --- ÁREA 8: DIRECCIÓN NACIONAL DE INVESTIGACIÓN (DIDC / OJS) ---
        dir_inv = models.Nodo(nombre="Dirección Nacional de Investigación y Desarrollo Científico (DIDC)", abreviacion="DIDC", codigo_inteligente="AV-DIDC", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Investigación", "DIDC", "OJS", "Revistas Científicas"])
        db.add(dir_inv)
        db.commit()
        db.refresh(dir_inv)

        cat_jrn_gnews = models.Nodo(nombre="Revista Científica G-News (Ingenierías y Tecnología)", abreviacion="JRN-GNW", codigo_inteligente="AV-DIDC-GNEWS", parent_id=dir_inv.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_jrn_med = models.Nodo(nombre="Revista Científica de Medicina UNITEPC", abreviacion="JRN-MED", codigo_inteligente="AV-DIDC-MED", parent_id=dir_inv.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_jrn_odo = models.Nodo(nombre="Revista Científica de Odontología", abreviacion="JRN-ODO", codigo_inteligente="AV-DIDC-ODO", parent_id=dir_inv.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_inv_fondos = models.Nodo(nombre="Proyectos de Investigación con Fondos Concursables", abreviacion="INV-FND", codigo_inteligente="AV-DIDC-FND", parent_id=dir_inv.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([cat_jrn_gnews, cat_jrn_med, cat_jrn_odo, cat_inv_fondos])
        db.commit()

        # --- ÁREA 9: SECRETARÍA GENERAL Y REGISTRO ACADÉMICO CENTRAL ---
        sec_central = models.Nodo(nombre="Secretaría General y Registro Académico Central", abreviacion="SGRAC", codigo_inteligente="AV-SGRAC", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Secretaría General", "Títulos", "Resoluciones", "Kárdex"])
        db.add(sec_central)
        db.commit()
        db.refresh(sec_central)

        cat_tpn = models.Nodo(nombre="Títulos en Provisión Nacional y Diplomas Académicos", abreviacion="TPN-REG", codigo_inteligente="AV-SGRAC-TPN", parent_id=sec_central.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_cert_leg = models.Nodo(nombre="Certificados de Calificaciones y Legalizaciones", abreviacion="CAL-LEG", codigo_inteligente="AV-SGRAC-LEG", parent_id=sec_central.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_res_rec = models.Nodo(nombre="Resoluciones Rectorales y Reglamentos Oficiales", abreviacion="RES-REC", codigo_inteligente="AV-SGRAC-RES", parent_id=sec_central.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_kardex_nal = models.Nodo(nombre="Kárdex y Registro Histórico Nacional (8 Sedes)", abreviacion="KDX-NAL", codigo_inteligente="AV-SGRAC-KDX", parent_id=sec_central.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_convenios_inst = models.Nodo(nombre="Convenios y Acuerdos Marco Interinstitucionales", abreviacion="CNV-MST", codigo_inteligente="AV-SGRAC-CNV", parent_id=sec_central.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([cat_tpn, cat_cert_leg, cat_res_rec, cat_kardex_nal, cat_convenios_inst])
        db.commit()

        # --------------------------------------------------------------------
        # 7. GENERACIÓN Y SIEMBRA DE DOCUMENTOS REALES EN AMBAS JERARQUÍAS
        # --------------------------------------------------------------------
        print("7. Generando documentos PDF físicos con título y sembrando en la base de datos...")

        documentos_catalogo = [
            # 1. Ingeniería de Sistemas y Tecnología
            {
                "archivo": "Proyecto_Grado_Dino_Rosas_DMS_Hibrido_Vite.pdf",
                "titulo": "Proyecto de Grado: DMS Hibrido con FSM Archi-vite",
                "subtitulo": "Postulante: Dino Rosas Montecinos | Carrera: Ingenieria de Sistemas",
                "codigo": "AV-SIS-PG-2025-01",
                "nodo_logico": cat_sis_proyectos,
                "nodo_fisico": arc_pg25,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_pg_dino_rosas_2025"
            },
            {
                "archivo": "Acta_Defensa_Grado_Ing_Sistemas_Claure.pdf",
                "titulo": "Acta de Defensa Publica y Calificacion de Grado",
                "subtitulo": "Tribunal Evaluador: Ing. Jose James Claure Ricaldi",
                "codigo": "AV-SIS-ACT-2025-04",
                "nodo_logico": cat_sis_actas,
                "nodo_fisico": arc_act25,
                "estado": est_aprobado,
                "dias_retencion": 365 * 10,
                "dms_id": "av_act_defensa_sistemas"
            },
            {
                "archivo": "Ficha_Asesoramiento_PAT_Sistemas_Claure_Rosas.pdf",
                "titulo": "Ficha de Asesoramiento Tecnico P.A.T. 2025",
                "subtitulo": "Tutor: Ing. James Claure | Asesorado: Dino Rosas",
                "codigo": "AV-SIS-PAT-2025-08",
                "nodo_logico": cat_sis_pat,
                "nodo_fisico": arc_pat25,
                "estado": est_vigente,
                "dias_retencion": -20, # Alerta de retención superada
                "dms_id": "av_pat_ficha_claure_rosas"
            },
            {
                "archivo": "Legajo_Docente_Investigador_Claure_James.pdf",
                "titulo": "Legajo Academico y Curricular de Docente Investigador",
                "subtitulo": "Docente Titular: Ing. Jose James Claure Ricaldi",
                "codigo": "AV-SIS-DOC-1020",
                "nodo_logico": cat_sis_legajos,
                "nodo_fisico": arc_ld01,
                "estado": est_vigente,
                "dias_retencion": None,
                "dms_id": "av_leg_docente_claure_james"
            },
            {
                "archivo": "Plan_Estudios_Malla_Curricular_Ingenieria_Sistemas_2025.pdf",
                "titulo": "Malla Curricular Oficial y Plan de Estudios 2025-2029",
                "subtitulo": "Direccion de Carrera Ingenieria de Sistemas | Aprobacion Ministerial",
                "codigo": "AV-SIS-MAL-2025",
                "nodo_logico": cat_sis_mallas,
                "nodo_fisico": arc_pg25,
                "estado": est_aprobado,
                "dias_retencion": None,
                "dms_id": "av_sis_malla_2025"
            },
            {
                "archivo": "Proyecto_Diseno_Acustico_Estudio_Grabacion_Master.pdf",
                "titulo": "Diseno Acustico y Electroacustico de Estudio de Grabacion 5.1",
                "subtitulo": "Carrera de Ingenieria de Sonido | Proyecto de Titulacion",
                "codigo": "AV-SON-PRY-01",
                "nodo_logico": cat_son_proy,
                "nodo_fisico": arc_son01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 5,
                "dms_id": "av_son_estudio_51"
            },
            {
                "archivo": "Diseno_Prototipo_Monitor_Signos_Vitales_UCI.pdf",
                "titulo": "Diseno y Calibracion de Prototipo de Monitor Multiparametrico UCI",
                "subtitulo": "Carrera de Ingenieria Biomedica | Pasantia Hospitalaria",
                "codigo": "AV-BIO-PRY-01",
                "nodo_logico": cat_biomed_proy,
                "nodo_fisico": arc_son01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_biomed_monitor_uci"
            },
            {
                "archivo": "Proyecto_Automatizacion_Invernadero_Agroindustrial.pdf",
                "titulo": "Sistema de Control Automatico y Telemetria para Invernaderos",
                "subtitulo": "Carrera de Ingenieria Electronica | Automatizacion y Robotica",
                "codigo": "AV-ELC-AUT-01",
                "nodo_logico": cat_elec_auto,
                "nodo_fisico": arc_son01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_elec_invernadero"
            },

            # 2. Facultad de Ciencias de la Salud
            {
                "archivo": "Historial_Clinico_Internado_Rotatorio_Hospital_Viedma.pdf",
                "titulo": "Expediente de Casos Clinicos e Internado Rotatorio - Hospital Viedma",
                "subtitulo": "Facultad de Ciencias de la Salud | Carrera de Medicina",
                "codigo": "AV-MED-INT-2025",
                "nodo_logico": cat_med_internado,
                "nodo_fisico": arc_med01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 10,
                "dms_id": "av_med_expediente_viedma"
            },
            {
                "archivo": "Acta_Examen_Grado_Internado_Salud_Dra_Morales.pdf",
                "titulo": "Acta de Examen de Grado y Reválida Medica Nacional",
                "subtitulo": "Postulante: Dra. Valeria Morales | Carrera de Medicina",
                "codigo": "AV-MED-ACT-2025",
                "nodo_logico": cat_med_grados,
                "nodo_fisico": arc_med01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 10,
                "dms_id": "av_med_acta_morales"
            },
            {
                "archivo": "Ficha_Clinica_Cirugia_Bucal_Clinica_Odontologica_UNITEPC.pdf",
                "titulo": "Protocolo Clinico de Cirugia Bucal y Regeneracion Osea",
                "subtitulo": "Clinica Odontologica Universitaria UNITEPC",
                "codigo": "AV-ODO-FCH-01",
                "nodo_logico": cat_odo_fichas,
                "nodo_fisico": arc_odo01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_odo_cirugia_bucal"
            },
            {
                "archivo": "Informe_Practica_Salud_Publica_Comunitaria_Quillacollo.pdf",
                "titulo": "Informe de Atencion Primaria y Salud Comunitaria en Red Quillacollo",
                "subtitulo": "Carrera de Enfermeria | Prácticas Integrales",
                "codigo": "AV-ENF-INF-01",
                "nodo_logico": cat_enf_informes,
                "nodo_fisico": arc_enf01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 5,
                "dms_id": "av_enf_quillacollo"
            },
            {
                "archivo": "Trabajo_Dirigido_Analisis_Toxicologico_Laboratorio_Central.pdf",
                "titulo": "Analisis Cuantitativo de Principios Activos en Farmacologia",
                "subtitulo": "Carrera de Bioquimica y Farmacia | Trabajo Dirigido",
                "codigo": "AV-BIO-LAB-01",
                "nodo_logico": cat_bio_lab,
                "nodo_fisico": arc_enf01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_bio_toxicologia"
            },
            {
                "archivo": "Protocolo_Quirurgico_Hospital_Veterinario_Tiquipaya.pdf",
                "titulo": "Protocolos de Cirugia Mayor y Anestesiologia Veterinaria",
                "subtitulo": "Hospital Veterinario UNITEPC Sede Tiquipaya",
                "codigo": "AV-VET-HOS-01",
                "nodo_logico": cat_vet_hos,
                "nodo_fisico": arc_med01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_vet_cirugia_tiquipaya"
            },
            {
                "archivo": "Convenio_Marco_UNITEPC_Ministerio_Salud_Bolivia.pdf",
                "titulo": "Convenio Marco de Colaboracion Interinstitucional en Salud",
                "subtitulo": "UNITEPC - Ministerio de Salud y Deportes de Bolivia",
                "codigo": "AV-MED-CNV-01",
                "nodo_logico": cat_med_convenios,
                "nodo_fisico": arc_cv01,
                "estado": est_vigente,
                "dias_retencion": 365 * 4,
                "dms_id": "av_cnv_min_salud_bolivia"
            },

            # 3. Facultad FACEA y Ciencias Sociales
            {
                "archivo": "Proyecto_Grado_Plan_Estrategico_Empresarial_Cerveceria.pdf",
                "titulo": "Plan Estrategico de Expansion y Logistica para Sector Bebidas",
                "subtitulo": "Carrera de Administracion de Empresas | Proyecto de Grado",
                "codigo": "AV-ADM-PRY-01",
                "nodo_logico": cat_adm_proy,
                "nodo_fisico": arc_fac_adm01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_adm_expansion_bebidas"
            },
            {
                "archivo": "Dictamen_Auditoria_Financiera_Operativa_Empresa_Logistica.pdf",
                "titulo": "Dictamen de Auditoria Financiera y Control Interno Operativo",
                "subtitulo": "Carrera de Contaduria Publica | Trabajo Dirigido de Grado",
                "codigo": "AV-CON-AUD-01",
                "nodo_logico": cat_con_aud,
                "nodo_fisico": arc_fac_adm01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 5,
                "dms_id": "av_con_auditoria_logistica"
            },
            {
                "archivo": "Estudio_Mercado_Posicionamiento_Marca_Nacional_2025.pdf",
                "titulo": "Investigacion Cuantitativa de Mercados y Branding Regional",
                "subtitulo": "Carrera de Ingenieria Comercial | Trabajo de Aplicacion",
                "codigo": "AV-COM-MKT-01",
                "nodo_logico": cat_com_mkt,
                "nodo_fisico": arc_fac_adm01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_com_branding_2025"
            },
            {
                "archivo": "Expediente_Clinica_Juridica_Asistencia_Familiar_Consultorio.pdf",
                "titulo": "Expediente de Patrocinio Legal y Conciliacion en Derecho de Familia",
                "subtitulo": "Consultorio Juridico Popular Gratuito UNITEPC",
                "codigo": "AV-DER-CLN-01",
                "nodo_logico": cat_der_clinica,
                "nodo_fisico": arc_der01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 10,
                "dms_id": "av_der_asistencia_familiar"
            },
            {
                "archivo": "Guion_Cinematografico_Cortometraje_Ganador_UNICINE.pdf",
                "titulo": "Guion Cinematografico y Carpeta de Produccion Cortometraje UNICINE",
                "subtitulo": "Carrera de Cinematografia | Premio Festival Universitario",
                "codigo": "AV-CINE-GUI-01",
                "nodo_logico": cat_cine_guiones,
                "nodo_fisico": arc_der01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_cine_cortometraje_unicine"
            },

            # 4. Dirección Administrativa y Financiera (DAF)
            {
                "archivo": "Balance_General_Estados_Financieros_UNITEPC_2024.pdf",
                "titulo": "Balance General y Estados Financieros Auditados Gestion 2024",
                "subtitulo": "Direccion Administrativa y Financiera (DAF) - Dictamen de Auditoria Externa",
                "codigo": "AV-DAF-BAL-2024",
                "nodo_logico": cat_daf_balances,
                "nodo_fisico": arc_cont01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 10,
                "dms_id": "av_daf_balance_2024"
            },
            {
                "archivo": "Comprobante_Egreso_Equipamiento_Laboratorios_Sistemas.pdf",
                "titulo": "Comprobante de Egreso No. 4502 - Adquisicion Servidores TI",
                "subtitulo": "Beneficiario: Proveedora Tecnologica SRL | DAF Finanzas",
                "codigo": "AV-DAF-CMP-4502",
                "nodo_logico": cat_daf_comprobantes,
                "nodo_fisico": arc_comp01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_daf_egreso_4502"
            },
            {
                "archivo": "Plan_Operativo_Anual_POA_Presupuesto_2025.pdf",
                "titulo": "Programa Operativo Anual (POA) y Presupuesto Maestro 2025",
                "subtitulo": "Aprobado por Directorio Universitario UNITEPC",
                "codigo": "AV-DAF-POA-2025",
                "nodo_logico": cat_daf_poa,
                "nodo_fisico": arc_cont01,
                "estado": est_vigente,
                "dias_retencion": 365 * 3,
                "dms_id": "av_daf_poa_2025"
            },
            {
                "archivo": "Libro_Ventas_IVA_Facturacion_Electronica_Enero_2025.pdf",
                "titulo": "Libro de Ventas IVA y Reporte SIAT Servicio de Impuestos Nacionales",
                "subtitulo": "Departamento de Tributacion y Facturacion Central",
                "codigo": "AV-DAF-TRB-0125",
                "nodo_logico": cat_daf_tributos,
                "nodo_fisico": arc_fac01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 8,
                "dms_id": "av_daf_libro_iva_0125"
            },
            {
                "archivo": "Arqueo_Caja_Chica_Conciliacion_Bancaria_Banco_Union.pdf",
                "titulo": "Conciliacion Bancaria Mensual y Arqueo de Fondos - Banco Union",
                "subtitulo": "Tesoreria Central UNITEPC Sede Cochabamba",
                "codigo": "AV-DAF-BNC-2025",
                "nodo_logico": cat_daf_bancos,
                "nodo_fisico": arc_fac01,
                "estado": est_vigente,
                "dias_retencion": 365 * 3,
                "dms_id": "av_daf_conciliacion_union"
            },

            # 5. Dirección de Registro e Inscripciones Académicas (DRE)
            {
                "archivo": "Formulario_Inscripcion_Matricula_Campus_Florida_2025.pdf",
                "titulo": "Expediente de Inscripcion y Matriculacion Estudiantil I-2025",
                "subtitulo": "Direccion de Registro e Inscripciones Académicas (DRE)",
                "codigo": "AV-DRE-MAT-2025",
                "nodo_logico": cat_dre_matricula,
                "nodo_fisico": arc_reg01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_dre_matricula_2025"
            },
            {
                "archivo": "Resolucion_Otorgamiento_Becas_Excelencia_Academica_2025.pdf",
                "titulo": "Nomina de Beneficiarios y Becas de Excelencia I-2025",
                "subtitulo": "Comite de Bienestar Universitario y Admisiones",
                "codigo": "AV-DRE-BEC-2025-01",
                "nodo_logico": cat_dre_becas,
                "nodo_fisico": arc_bec01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 2,
                "dms_id": "av_dre_becas_2025"
            },
            {
                "archivo": "Expediente_Traspaso_Sede_SantaCruz_Cochabamba_2025.pdf",
                "titulo": "Solicitud y Resolucion de Traspaso de Sede Santa Cruz a Central",
                "subtitulo": "Departamento de Admisiones y Registro Nacional",
                "codigo": "AV-DRE-TRP-01",
                "nodo_logico": cat_dre_traspasos,
                "nodo_fisico": arc_cnv01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 5,
                "dms_id": "av_dre_traspaso_scz"
            },
            {
                "archivo": "Certificado_Convalidacion_Asignaturas_Troncales_Ingenieria.pdf",
                "titulo": "Dictamen de Homologacion y Convalidacion de Asignaturas",
                "subtitulo": "Comision Academica de Validacion Curricular",
                "codigo": "AV-DRE-CNV-01",
                "nodo_logico": cat_dre_convalida,
                "nodo_fisico": arc_cnv01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 10,
                "dms_id": "av_dre_convalidacion_troncal"
            },

            # 6. Dirección de Talento Humano (RRHH)
            {
                "archivo": "Planilla_Sueldos_Aportes_Patronales_Caja_Salud_Diciembre.pdf",
                "titulo": "Planilla Consolidada de Sueldos y Aportes Patronales",
                "subtitulo": "Direccion de Talento Humano | Respaldo AFPs y Caja de Salud",
                "codigo": "AV-RRHH-PLA-1224",
                "nodo_logico": cat_rrhh_planillas,
                "nodo_fisico": arc_rrhh01,
                "estado": est_aprobado,
                "dias_retencion": 365 * 10,
                "dms_id": "av_rrhh_planilla_1224"
            },
            {
                "archivo": "Contrato_Docente_Tiempo_Horario_Ing_Sistemas_2025.pdf",
                "titulo": "Contrato de Prestacion de Servicios Academicos Docentes I-2025",
                "subtitulo": "Direccion de Talento Humano | Nombramiento Oficial",
                "codigo": "AV-RRHH-CTR-2025",
                "nodo_logico": cat_rrhh_contratos,
                "nodo_fisico": arc_ctr01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_rrhh_contrato_docente"
            },
            {
                "archivo": "Reglamento_Interno_Trabajo_Manual_Funciones_UNITEPC.pdf",
                "titulo": "Reglamento Interno de Personal y Manual de Organizacion y Funciones",
                "subtitulo": "Aprobado por el Ministerio de Trabajo, Empleo y Prevision Social",
                "codigo": "AV-RRHH-REG-2024",
                "nodo_logico": cat_rrhh_reglamento,
                "nodo_fisico": arc_ctr01,
                "estado": est_aprobado,
                "dias_retencion": None,
                "dms_id": "av_rrhh_reglamento_funciones"
            },

            # 7. Dirección Nacional de Investigación (DIDC / OJS)
            {
                "archivo": "Articulo_Cientifico_Revista_GNews_Sistemas.pdf",
                "titulo": "Articulo Cientifico: Arquitectura de Software para DMS Hibridos",
                "subtitulo": "Revista G-News Indexada OJS | Autor: Ing. Jose James Claure",
                "codigo": "AV-DIDC-GNW-01",
                "nodo_logico": cat_jrn_gnews,
                "nodo_fisico": arc_cv01,
                "estado": est_vigente,
                "dias_retencion": None,
                "dms_id": "av_jrn_gnews_sistemas_2025"
            },
            {
                "archivo": "Revista_Medicina_UNITEPC_Vol12_Num2_Articulo_Cardiologia.pdf",
                "titulo": "Estudio Epidemiologico de Hipertension Arterial en Valles Altos",
                "subtitulo": "Revista Cientifica de Medicina UNITEPC | Indexacion SciELO",
                "codigo": "AV-DIDC-MED-02",
                "nodo_logico": cat_jrn_med,
                "nodo_fisico": arc_cv01,
                "estado": est_vigente,
                "dias_retencion": None,
                "dms_id": "av_jrn_medicina_cardiologia"
            },
            {
                "archivo": "Revista_Odontologia_UNITEPC_Vol8_Articulo_Implantologia.pdf",
                "titulo": "Evaluacion de Implantes de Carga Inmediata en Adultos Mayores",
                "subtitulo": "Revista Cientifica de Odontologia UNITEPC | OJS",
                "codigo": "AV-DIDC-ODO-01",
                "nodo_logico": cat_jrn_odo,
                "nodo_fisico": arc_cv01,
                "estado": est_vigente,
                "dias_retencion": None,
                "dms_id": "av_jrn_odontologia_implantes"
            },
            {
                "archivo": "Proyecto_Investigacion_Fondos_Concursables_Nanotecnologia.pdf",
                "titulo": "Proyecto de Investigacion con Fondos Concursables: Sintesis Verde",
                "subtitulo": "Direccion Nacional de Investigacion (DIDC) | Fondo Semilla",
                "codigo": "AV-DIDC-FND-01",
                "nodo_logico": cat_inv_fondos,
                "nodo_fisico": arc_cv01,
                "estado": est_vigente,
                "dias_retencion": 365 * 5,
                "dms_id": "av_inv_fondos_nanotec"
            },

            # 8. Secretaría General y Registro Académico Central
            {
                "archivo": "Certificado_Calificaciones_Legalizado_UNITEPC.pdf",
                "titulo": "Certificado Oficial de Calificaciones Legalizado",
                "subtitulo": "Secretaria General y Registro Academico Central",
                "codigo": "AV-SGRAC-LEG-8840",
                "nodo_logico": cat_cert_leg,
                "nodo_fisico": arc_tpn01,
                "estado": est_aprobado,
                "dias_retencion": None,
                "dms_id": "av_crt_calificaciones_legalizado"
            },
            {
                "archivo": "Poder_Notariado_Representacion_Legal_UNITEPC.pdf",
                "titulo": "Testimonio Notarial de Poder Especial y Personeria Juridica",
                "subtitulo": "Notaria de Fe Publica No. 12 | Asesoria Juridica UNITEPC",
                "codigo": "AV-JUR-POD-104",
                "nodo_logico": cat_res_rec,
                "nodo_fisico": arc_jur01,
                "estado": est_vigente,
                "dias_retencion": None,
                "dms_id": "av_jur_poder_notariado"
            },
            {
                "archivo": "Resolucion_Rectoral_Aprobacion_Reglamento_Grado.pdf",
                "titulo": "Resolucion Rectoral No. 042/2024: Aprobacion Reglamento Grado",
                "subtitulo": "Consejo Superior Universitario UNITEPC",
                "codigo": "AV-SGRAC-RES-042",
                "nodo_logico": cat_res_rec,
                "nodo_fisico": arc_res15,
                "estado": est_archivado,
                "dias_retencion": None,
                "dms_id": "av_res_reglamento_grado_2018"
            },
            {
                "archivo": "Kardex_Historico_Egresados_Facultad_Tecnologia.pdf",
                "titulo": "Libro de Registro y Kardex Historico de Egresados 2010-2020",
                "subtitulo": "Facultad de Ciencias de la Tecnologia - Fondo Permanente",
                "codigo": "AV-SGRAC-KDX-FCT",
                "nodo_logico": cat_kardex_nal,
                "nodo_fisico": arc_kdx01,
                "estado": est_archivado,
                "dias_retencion": None,
                "dms_id": "av_kdx_historico_tecnologia"
            },
            {
                "archivo": "Acta_Fundacional_Acreditacion_Institucional_Mercosur.pdf",
                "titulo": "Certificado y Dictamen de Acreditacion Internacional ARCUSUR / MERCOSUR",
                "subtitulo": "Secretaria General | Reconocimiento a la Excelencia Academica",
                "codigo": "AV-SGRAC-ARC-01",
                "nodo_logico": cat_tpn,
                "nodo_fisico": arc_acr01,
                "estado": est_aprobado,
                "dias_retencion": None,
                "dms_id": "av_acreditacion_mercosur"
            }
        ]

        # Asegurar la creación de los PDFs en disco
        asegurar_archivos_media(documentos_catalogo)

        # Inyectar objetos Documento en SQLAlchemy
        docs_instancias = []
        for doc in documentos_catalogo:
            fecha_retencion = None
            if doc["dias_retencion"] is not None:
                fecha_retencion = datetime.datetime.now() + datetime.timedelta(days=doc["dias_retencion"])
            
            d_obj = models.Documento(
                nombre_archivo=doc["archivo"],
                ruta_archivo=f"/media/dms/{doc['archivo']}",
                nodo_id=doc["nodo_logico"].id,
                ubicacion_fisica_id=doc["nodo_fisico"].id,
                version=1,
                identificador_dms=doc["dms_id"],
                estado_id=doc["estado"].id,
                fecha_limite_retencion=fecha_retencion
            )
            docs_instancias.append(d_obj)

        db.add_all(docs_instancias)
        db.commit()
        for d in docs_instancias:
            db.refresh(d)

        # --------------------------------------------------------------------
        # 8. VINCULACIONES PERSONA-DOCUMENTO Y ROLES
        # --------------------------------------------------------------------
        print("8. Inyectando Vinculaciones de Personas con Documentos...")
        
        doc_map = {d.nombre_archivo: d for d in docs_instancias}

        # Vinculaciones Académicas
        db.add(models.PersonaVinculo(persona_id=p_dino.id, documento_id=doc_map["Proyecto_Grado_Dino_Rosas_DMS_Hibrido_Vite.pdf"].id, rol_momento_id=rol_est_pos.id, tipo_relacion="Postulante / Autor", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_claure.id, documento_id=doc_map["Proyecto_Grado_Dino_Rosas_DMS_Hibrido_Vite.pdf"].id, rol_momento_id=rol_doc_tut.id, tipo_relacion="Tutor Académico de Grado", peso=2))
        db.add(models.PersonaVinculo(persona_id=p_vargas.id, documento_id=doc_map["Acta_Defensa_Grado_Ing_Sistemas_Claure.pdf"].id, rol_momento_id=rol_dir_car.id, tipo_relacion="Presidente Tribunal de Grado", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_claure.id, documento_id=doc_map["Acta_Defensa_Grado_Ing_Sistemas_Claure.pdf"].id, rol_momento_id=rol_doc_tut.id, tipo_relacion="Tribunal Evaluador", peso=2))
        db.add(models.PersonaVinculo(persona_id=p_claure.id, documento_id=doc_map["Ficha_Asesoramiento_PAT_Sistemas_Claure_Rosas.pdf"].id, rol_momento_id=rol_doc_tut.id, tipo_relacion="Docente Guía PAT", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_dino.id, documento_id=doc_map["Ficha_Asesoramiento_PAT_Sistemas_Claure_Rosas.pdf"].id, rol_momento_id=rol_est_pos.id, tipo_relacion="Estudiante Asesorado", peso=2))
        db.add(models.PersonaVinculo(persona_id=p_claure.id, documento_id=doc_map["Legajo_Docente_Investigador_Claure_James.pdf"].id, rol_momento_id=rol_doc_tut.id, tipo_relacion="Titular de Legajo Docente", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_claure.id, documento_id=doc_map["Articulo_Cientifico_Revista_GNews_Sistemas.pdf"].id, rol_momento_id=rol_doc_tut.id, tipo_relacion="Autor de Artículo Científico", peso=1))

        # Vinculaciones Administrativas y Financieras
        db.add(models.PersonaVinculo(persona_id=p_gomez.id, documento_id=doc_map["Balance_General_Estados_Financieros_UNITEPC_2024.pdf"].id, rol_momento_id=rol_daf_cfo.id, tipo_relacion="Director Financiero DAF", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_gomez.id, documento_id=doc_map["Comprobante_Egreso_Equipamiento_Laboratorios_Sistemas.pdf"].id, rol_momento_id=rol_daf_cfo.id, tipo_relacion="Autorizador de Pagos DAF", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_gomez.id, documento_id=doc_map["Plan_Operativo_Anual_POA_Presupuesto_2025.pdf"].id, rol_momento_id=rol_daf_cfo.id, tipo_relacion="Formulador POA y Presupuestos", peso=1))

        # Vinculaciones de Registro y Secretaría General
        db.add(models.PersonaVinculo(persona_id=p_torres.id, documento_id=doc_map["Formulario_Inscripcion_Matricula_Campus_Florida_2025.pdf"].id, rol_momento_id=rol_reg_adm.id, tipo_relacion="Jefa de Registro e Inscripciones", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_torres.id, documento_id=doc_map["Resolucion_Otorgamiento_Becas_Excelencia_Academica_2025.pdf"].id, rol_momento_id=rol_reg_adm.id, tipo_relacion="Validadora de Becas Académicas", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_franco.id, documento_id=doc_map["Certificado_Calificaciones_Legalizado_UNITEPC.pdf"].id, rol_momento_id=rol_sec_gen.id, tipo_relacion="Secretario de Legalizaciones", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_mendez.id, documento_id=doc_map["Convenio_Marco_UNITEPC_Ministerio_Salud_Bolivia.pdf"].id, rol_momento_id=rol_arc_dir.id, tipo_relacion="Custodio de Convenios Institucionales", peso=1))

        db.commit()

        # --------------------------------------------------------------------
        # 9. ENLACES CRUZADOS (CROSS-LINKS)
        # --------------------------------------------------------------------
        print("9. Inyectando Enlaces Cruzados...")
        db.add(models.EnlaceCruzado(documento_origen_id=doc_map["Proyecto_Grado_Dino_Rosas_DMS_Hibrido_Vite.pdf"].id, nodo_destino_id=cat_sis_actas.id))
        db.add(models.EnlaceCruzado(documento_origen_id=doc_map["Ficha_Asesoramiento_PAT_Sistemas_Claure_Rosas.pdf"].id, nodo_destino_id=cat_sis_proyectos.id))
        db.add(models.EnlaceCruzado(documento_origen_id=doc_map["Articulo_Cientifico_Revista_GNews_Sistemas.pdf"].id, nodo_destino_id=cat_sis_proyectos.id))
        db.add(models.EnlaceCruzado(documento_origen_id=doc_map["Plan_Operativo_Anual_POA_Presupuesto_2025.pdf"].id, nodo_destino_id=cat_daf_balances.id))
        db.add(models.EnlaceCruzado(documento_origen_id=doc_map["Historial_Clinico_Internado_Rotatorio_Hospital_Viedma.pdf"].id, nodo_destino_id=cat_med_grados.id))
        db.add(models.EnlaceCruzado(documento_origen_id=doc_map["Dictamen_Auditoria_Financiera_Operativa_Empresa_Logistica.pdf"].id, nodo_destino_id=cat_daf_balances.id))
        db.commit()

        # --------------------------------------------------------------------
        # 10. CONFIGURACIÓN DE CODIFICACIÓN INSTITUCIONAL
        # --------------------------------------------------------------------
        print("10. Inyectando Configuración de Codificación...")
        conf_cod = models.ConfiguracionCodificacion(
            separador="-",
            digitos_correlativo=3,
            usar_abreviacion_padre=True,
            prefijo_global="AV"
        )
        db.add(conf_cod)
        db.commit()

        print("¡Base de datos sembrada y PDFs generados con total éxito!")

    except Exception as e:
        db.rollback()
        print(f"Error al sembrar la base de datos: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()



