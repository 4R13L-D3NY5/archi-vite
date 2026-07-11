import hashlib
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models

def generar_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_database():
    print("Recreando base de datos completa orientada al ecosistema universitario completo...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # --------------------------------------------------------------------
        # 1. USUARIOS Y ROLES DE ACCESO
        # --------------------------------------------------------------------
        print("Inyectando usuarios semilla para RBAC...")
        admin = models.Usuario(username="admin", password_hash=generar_hash("admin123"), rol="admin")
        lector = models.Usuario(username="lector", password_hash=generar_hash("lector123"), rol="user")
        revisor = models.Usuario(username="revisor", password_hash=generar_hash("revisor123"), rol="user")
        db.add(admin)
        db.add(lector)
        db.add(revisor)
        db.commit()

        # --------------------------------------------------------------------
        # 2. ROLES DE ORGANIZACIÓN DINÁMICOS
        # --------------------------------------------------------------------
        print("Inyectando catálogo de Roles de Organización dinámicos...")
        rol_doc = models.RolOrganizacion(nombre="Docente Titular", codigo="DOC-TIT", color="#10b981")
        rol_aux = models.RolOrganizacion(nombre="Docente Auxiliar", codigo="DOC-AUX", color="#3b82f6")
        rol_dir = models.RolOrganizacion(nombre="Director de Carrera", codigo="DIR-CAR", color="#ec4899")
        rol_adm = models.RolOrganizacion(nombre="Administrativo / RRHH", codigo="ADM-RRHH", color="#f59e0b")
        rol_dec = models.RolOrganizacion(nombre="Decano de Facultad", codigo="DEC-FAC", color="#ef4444")
        rol_rec = models.RolOrganizacion(nombre="Rector", codigo="RECTOR", color="#8b5cf6")
        
        db.add(rol_doc)
        db.add(rol_aux)
        db.add(rol_dir)
        db.add(rol_adm)
        db.add(rol_dec)
        db.add(rol_rec)
        db.commit()
        db.refresh(rol_doc)
        db.refresh(rol_aux)
        db.refresh(rol_dir)
        db.refresh(rol_adm)
        db.refresh(rol_dec)
        db.refresh(rol_rec)

        # --------------------------------------------------------------------
        # 3. CATALOGO DE PERSONAS
        # --------------------------------------------------------------------
        print("Inyectando catálogo de personas (Docentes, Decanos, Administrativos, Rector)...")
        p_espinoza = models.Persona(identificacion="DOC-7841", nombre_completo="Dr. Alberto Espinoza", rol_actual_id=rol_doc.id, carrera_departamento="Ingeniería de Sistemas")
        p_rojas = models.Persona(identificacion="DOC-9562", nombre_completo="Lic. María Rojas", rol_actual_id=rol_doc.id, carrera_departamento="Administración de Empresas")
        p_mendoza = models.Persona(identificacion="DOC-1234", nombre_completo="Ing. Carlos Mendoza", rol_actual_id=rol_dir.id, carrera_departamento="Ingeniería de Sistemas")
        p_quiroga = models.Persona(identificacion="DOC-5678", nombre_completo="Dra. Patricia Quiroga", rol_actual_id=rol_doc.id, carrera_departamento="Derecho")
        p_torres = models.Persona(identificacion="DOC-9901", nombre_completo="Dr. Fernando Torres", rol_actual_id=rol_dec.id, carrera_departamento="Facultad de Ingeniería")
        p_benitez = models.Persona(identificacion="DOC-8802", nombre_completo="Dra. Beatriz Benitez", rol_actual_id=rol_rec.id, carrera_departamento="Rectorado")
        p_perez = models.Persona(identificacion="DOC-1122", nombre_completo="Lic. Juan Pérez", rol_actual_id=rol_adm.id, carrera_departamento="Recursos Humanos")
        p_valdez = models.Persona(identificacion="DOC-3344", nombre_completo="Dr. Jorge Valdéz", rol_actual_id=rol_doc.id, carrera_departamento="Derecho")
        p_martinez = models.Persona(identificacion="DOC-5566", nombre_completo="Msc. Ana Martínez", rol_actual_id=rol_aux.id, carrera_departamento="Ingeniería de Sistemas")
        
        db.add_all([p_espinoza, p_rojas, p_mendoza, p_quiroga, p_torres, p_benitez, p_perez, p_valdez, p_martinez])
        db.commit()

        # --------------------------------------------------------------------
        # 4. ESTADOS Y TRANSICIONES DEL WORKFLOW
        # --------------------------------------------------------------------
        print("Inyectando estados por defecto del Workflow...")
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
        db.add(models.TransicionEstado(from_estado_id=est_aprobado.id, to_estado_id=est_activo.id))
        db.commit()

        # --------------------------------------------------------------------
        # 5. CINCO CATEGORÍAS LÓGICAS PRINCIPALES
        # --------------------------------------------------------------------
        print("Inyectando 5 Categorías Lógicas Principales...")
        cat_contratos = models.Nodo(nombre="Contratos y Expedientes de Personal", abreviacion="CON", codigo_inteligente="CON-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_asistencias = models.Nodo(nombre="Control de Asistencias", abreviacion="ASI", codigo_inteligente="ASI-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_planificaciones = models.Nodo(nombre="Planificaciones Académicas", abreviacion="PLA", codigo_inteligente="PLA-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_actas = models.Nodo(nombre="Actas de Calificaciones", abreviacion="ACT", codigo_inteligente="ACT-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_convenios = models.Nodo(nombre="Convenios y Relaciones", abreviacion="COV", codigo_inteligente="COV-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        
        db.add_all([cat_contratos, cat_asistencias, cat_planificaciones, cat_actas, cat_convenios])
        db.commit()

        # --------------------------------------------------------------------
        # 6. ESTRUCTURACIÓN DE LAS RAMAS LÓGICAS
        # --------------------------------------------------------------------
        
        # --- RAMA 1: CONTRATOS (RRHH) ---
        print("Inyectando subcategorías de Contratos por Facultad y Carrera...")
        con_fac_ing = models.Nodo(nombre="Facultad de Ingeniería", abreviacion="CON-ING", codigo_inteligente="CON-ING-001", parent_id=cat_contratos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        con_fac_der = models.Nodo(nombre="Facultad de Derecho", abreviacion="CON-DER", codigo_inteligente="CON-DER-001", parent_id=cat_contratos.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([con_fac_ing, con_fac_der])
        db.commit()

        con_sis = models.Nodo(nombre="Ingeniería de Sistemas", abreviacion="CON-SIS", codigo_inteligente="CON-ING-SIS", parent_id=con_fac_ing.id, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Sistemas", "Sistemas-INS", "Acreditación"])
        con_der = models.Nodo(nombre="Carrera de Derecho", abreviacion="CON-DERE", codigo_inteligente="CON-DER-DERE", parent_id=con_fac_der.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([con_sis, con_der])
        db.commit()

        con_sis_g26 = models.Nodo(nombre="Gestión I-2026", abreviacion="I-26", codigo_inteligente="CON-ING-SIS-I26", parent_id=con_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Gestión I-2026", "Semestre Activo", "Contratos 2026"])
        con_der_g26 = models.Nodo(nombre="Gestión I-2026", abreviacion="I-26", codigo_inteligente="CON-DER-DERE-I26", parent_id=con_der.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([con_sis_g26, con_der_g26])
        db.commit()

        # --- RAMA 2: ASISTENCIAS ---
        print("Inyectando subcategorías de Asistencia (Sede -> Facultad -> Carrera -> Currícula -> Asignatura -> Grupo)...")
        asi_sede = models.Nodo(nombre="Sede Norte", abreviacion="ASI-SN", codigo_inteligente="ASI-SN-001", parent_id=cat_asistencias.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(asi_sede)
        db.commit()

        asi_fac_ing = models.Nodo(nombre="Facultad de Ingeniería", abreviacion="ASI-ING", codigo_inteligente="ASI-SN-ING", parent_id=asi_sede.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(asi_fac_ing)
        db.commit()

        asi_carrera_sis = models.Nodo(nombre="Ingeniería de Sistemas", abreviacion="ASI-SIS", codigo_inteligente="ASI-SN-ING-SIS", parent_id=asi_fac_ing.id, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Sistemas-Control", "Asistencias", "Carrera"])
        db.add(asi_carrera_sis)
        db.commit()

        asi_curricula = models.Nodo(nombre="Plan Curricular 2026", abreviacion="ASI-C26", codigo_inteligente="ASI-SN-ING-SIS-C26", parent_id=asi_carrera_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(asi_curricula)
        db.commit()

        asi_gestion = models.Nodo(nombre="Gestión I-2026", abreviacion="ASI-I26", codigo_inteligente="ASI-SN-ING-SIS-C26-I26", parent_id=asi_curricula.id, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Gestión I-2026", "Asistencias I-2026", "Semestre Activo"])
        db.add(asi_gestion)
        db.commit()

        asi_asignatura_prog1 = models.Nodo(nombre="Programación I", abreviacion="ASI-PRG1", codigo_inteligente="ASI-SN-ING-SIS-C26-I26-PRG1", parent_id=asi_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        asi_asignatura_db1 = models.Nodo(nombre="Bases de Datos I", abreviacion="ASI-DB1", codigo_inteligente="ASI-SN-ING-SIS-C26-I26-DB1", parent_id=asi_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([asi_asignatura_prog1, asi_asignatura_db1])
        db.commit()

        asi_grupo_prog1_a = models.Nodo(nombre="Grupo A - Prog I", abreviacion="ASI-PRG1-A", codigo_inteligente="ASI-SN-ING-SIS-C26-I26-PRG1-A", parent_id=asi_asignatura_prog1.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        asi_grupo_db1_a = models.Nodo(nombre="Grupo A - DB I", abreviacion="ASI-DB1-A", codigo_inteligente="ASI-SN-ING-SIS-C26-I26-DB1-A", parent_id=asi_asignatura_db1.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([asi_grupo_prog1_a, asi_grupo_db1_a])
        db.commit()

        # --- RAMA 3: PLANIFICACIONES (SÍLABOS) ---
        print("Inyectando subcategorías de Planificaciones (Sílabos)...")
        pla_sede = models.Nodo(nombre="Sede Norte", abreviacion="PLA-SN", codigo_inteligente="PLA-SN-001", parent_id=cat_planificaciones.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(pla_sede)
        db.commit()

        pla_fac_ing = models.Nodo(nombre="Facultad de Ingeniería", abreviacion="PLA-ING", codigo_inteligente="PLA-SN-ING", parent_id=pla_sede.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(pla_fac_ing)
        db.commit()

        pla_carr_sis = models.Nodo(nombre="Ingeniería de Sistemas", abreviacion="PLA-SIS", codigo_inteligente="PLA-SN-ING-SIS", parent_id=pla_fac_ing.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(pla_carr_sis)
        db.commit()

        pla_gestion = models.Nodo(nombre="Gestión I-2026", abreviacion="PLA-I26", codigo_inteligente="PLA-SN-ING-SIS-I26", parent_id=pla_carr_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(pla_gestion)
        db.commit()

        pla_sil_prog1 = models.Nodo(nombre="Sílabos - Programación I", abreviacion="PLA-PRG1", codigo_inteligente="PLA-SN-ING-SIS-I26-PRG1", parent_id=pla_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        pla_sil_db1 = models.Nodo(nombre="Sílabos - Bases de Datos I", abreviacion="PLA-DB1", codigo_inteligente="PLA-SN-ING-SIS-I26-DB1", parent_id=pla_gestion.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([pla_sil_prog1, pla_sil_db1])
        db.commit()

        # --- RAMA 4: ACTAS DE CALIFICACIONES ---
        print("Inyectando subcategorías de Actas de Calificaciones...")
        act_sede = models.Nodo(nombre="Sede Norte", abreviacion="ACT-SN", codigo_inteligente="ACT-SN-001", parent_id=cat_actas.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(act_sede)
        db.commit()

        act_fac_ing = models.Nodo(nombre="Facultad de Ingeniería", abreviacion="ACT-ING", codigo_inteligente="ACT-SN-ING", parent_id=act_sede.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(act_fac_ing)
        db.commit()

        act_carr_sis = models.Nodo(nombre="Ingeniería de Sistemas", abreviacion="ACT-SIS", codigo_inteligente="ACT-SN-ING-SIS", parent_id=act_fac_ing.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(act_carr_sis)
        db.commit()

        act_gestion_25 = models.Nodo(nombre="Gestión II-2025", abreviacion="II-25", codigo_inteligente="ACT-SN-ING-SIS-II25", parent_id=act_carr_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        act_gestion_26 = models.Nodo(nombre="Gestión I-2026", abreviacion="I-26", codigo_inteligente="ACT-SN-ING-SIS-I26", parent_id=act_carr_sis.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([act_gestion_25, act_gestion_26])
        db.commit()

        # --- RAMA 5: CONVENIOS ---
        print("Inyectando subcategorías de Convenios...")
        cov_nacionales = models.Nodo(nombre="Convenios Nacionales", abreviacion="COV-NAC", codigo_inteligente="COV-NAC-001", parent_id=cat_convenios.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cov_internacionales = models.Nodo(nombre="Convenios Internacionales", abreviacion="COV-INT", codigo_inteligente="COV-INT-001", parent_id=cat_convenios.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add_all([cov_nacionales, cov_internacionales])
        db.commit()


        # --------------------------------------------------------------------
        # 7. ESTRUCTURAS FÍSICAS (CUATRO AMBIENTES INDEPENDIENTES)
        # --------------------------------------------------------------------
        
        # --- AMBIENTE 1: ARCHIVO GENERAL CENTRAL ---
        print("Inyectando Estructura Física 1: Archivo General Central (Sótano Bloque B)...")
        env_central = models.Nodo(
            nombre="Archivo General Central",
            abreviacion="AGC",
            codigo_inteligente="AGC-001",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Sótano Bloque B", "seguridad": "Acceso Biométrico", "imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Archivo Central", "Sótano", "Depósito"]
        )
        db.add(env_central)
        db.commit()
        db.refresh(env_central)

        est_central_a = models.Nodo(
            nombre="Estante Físico A", 
            abreviacion="EST-A", 
            codigo_inteligente="AGC-EST-A", 
            parent_id=env_central.id, 
            es_ubicacion_fisica=True, 
            estado_id=est_activo.id,
            detalles_ubicacion={"imagen_url": "/media/semilla/estante.png"},
            etiquetas=["Estante A", "Metal"]
        )
        db.add(est_central_a)
        db.commit()
        db.refresh(est_central_a)

        fil_central_01 = models.Nodo(nombre="Fila Física 01", abreviacion="FIL-01", codigo_inteligente="AGC-EST-A-F01", parent_id=est_central_a.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        fil_central_02 = models.Nodo(nombre="Fila Física 02", abreviacion="FIL-02", codigo_inteligente="AGC-EST-A-F02", parent_id=est_central_a.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        db.add_all([fil_central_01, fil_central_02])
        db.commit()
        db.refresh(fil_central_01)
        db.refresh(fil_central_02)

        arc_con_sis = models.Nodo(
            nombre="Archivador Contratos Sistemas", 
            abreviacion="ARC-SIS", 
            codigo_inteligente="AGC-EST-A-F01-SIS", 
            parent_id=fil_central_01.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"etiqueta": "CONTRATOS SISTEMAS", "imagen_url": "/media/semilla/archivador.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Contratos", "Sistemas", "Docentes"]
        )
        arc_con_der = models.Nodo(
            nombre="Archivador Contratos Derecho", 
            abreviacion="ARC-DER", 
            codigo_inteligente="AGC-EST-A-F02-DER", 
            parent_id=fil_central_02.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"etiqueta": "CONTRATOS DERECHO", "imagen_url": "/media/semilla/archivador.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Contratos", "Derecho", "Docentes"]
        )
        db.add_all([arc_con_sis, arc_con_der])
        db.commit()
        db.refresh(arc_con_sis)
        db.refresh(arc_con_der)

        # --- AMBIENTE 2: OFICINA DE REGISTRO ACADÉMICO ---
        print("Inyectando Estructura Física 2: Oficina de Registro Académico...")
        env_registro = models.Nodo(
            nombre="Oficina de Registro Académico",
            abreviacion="ORA",
            codigo_inteligente="ORA-001",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Bloque Administrativo - 2do Piso", "oficina": "Control Docente", "imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Registro Académico", "Administración"]
        )
        db.add(env_registro)
        db.commit()
        db.refresh(env_registro)

        est_reg_b = models.Nodo(nombre="Estante Académico B", abreviacion="EST-B", codigo_inteligente="ORA-EST-B", parent_id=env_registro.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        db.add(est_reg_b)
        db.commit()
        db.refresh(est_reg_b)

        fil_reg_01 = models.Nodo(nombre="Fila Asistencias 01", abreviacion="FIL-A01", codigo_inteligente="ORA-EST-B-FA01", parent_id=est_reg_b.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        fil_reg_02 = models.Nodo(nombre="Fila Actas Calificaciones", abreviacion="FIL-ACT", codigo_inteligente="ORA-EST-B-FACT", parent_id=est_reg_b.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        db.add_all([fil_reg_01, fil_reg_02])
        db.commit()
        db.refresh(fil_reg_01)
        db.refresh(fil_reg_02)

        caja_asi_26 = models.Nodo(
            nombre="Caja de Asistencias I-2026", 
            abreviacion="CJ-ASI26", 
            codigo_inteligente="ORA-EST-B-FA01-CJ26", 
            parent_id=fil_reg_01.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"caja_codigo": "BOX-ASI-2026", "imagen_url": "/media/semilla/caja.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Asistencias", "2026", "Cartón"]
        )
        caja_actas_25 = models.Nodo(
            nombre="Caja de Actas Gestión 2025", 
            abreviacion="CJ-ACT25", 
            codigo_inteligente="ORA-EST-B-FACT-CJ25", 
            parent_id=fil_reg_02.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"caja_codigo": "BOX-ACTAS-2025", "imagen_url": "/media/semilla/caja.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Actas", "2025", "Cartón"]
        )
        db.add_all([caja_asi_26, caja_actas_25])
        db.commit()
        db.refresh(caja_asi_26)
        db.refresh(caja_actas_25)

        arc_asi_sis = models.Nodo(
            nombre="Archivador Asistencias Sistemas", 
            abreviacion="ARC-ASI", 
            codigo_inteligente="ORA-EST-B-CJ26-SIS", 
            parent_id=caja_asi_26.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"etiqueta": "ASISTENCIAS SISTEMAS", "imagen_url": "/media/semilla/archivador.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Asistencias", "Sistemas", "Grupos"]
        )
        arc_actas_sis = models.Nodo(
            nombre="Archivador Actas Sistemas", 
            abreviacion="ARC-ACT-SI", 
            codigo_inteligente="ORA-EST-B-CJ25-SIS", 
            parent_id=caja_actas_25.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"etiqueta": "ACTAS SISTEMAS", "imagen_url": "/media/semilla/archivador.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Actas", "Sistemas", "Calificaciones"]
        )
        db.add_all([arc_asi_sis, arc_actas_sis])
        db.commit()
        db.refresh(arc_asi_sis)
        db.refresh(arc_actas_sis)

        # --- AMBIENTE 3: DECANATO DE LA FACULTAD DE INGENIERÍA ---
        print("Inyectando Estructura Física 3: Decanato de Ingeniería...")
        env_decanato = models.Nodo(
            nombre="Decanato de Ingeniería",
            abreviacion="DFI",
            codigo_inteligente="DFI-001",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Bloque Tecnológico - 3er Piso", "oficina": "Gestión Curricular", "imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Decanato", "Ingeniería"]
        )
        db.add(env_decanato)
        db.commit()
        db.refresh(env_decanato)

        est_dec_c = models.Nodo(nombre="Estante Decanato C", abreviacion="EST-C", codigo_inteligente="DFI-EST-C", parent_id=env_decanato.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        db.add(est_dec_c)
        db.commit()
        db.refresh(est_dec_c)

        fil_dec_01 = models.Nodo(nombre="Fila Sílabos 01", abreviacion="FIL-D01", codigo_inteligente="DFI-EST-C-FD01", parent_id=est_dec_c.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        db.add(fil_dec_01)
        db.commit()
        db.refresh(fil_dec_01)

        caja_silabos = models.Nodo(nombre="Caja de Sílabos de Ingeniería 2026", abreviacion="CJ-SILA26", codigo_inteligente="DFI-EST-C-FD01-CJ26", parent_id=fil_dec_01.id, es_ubicacion_fisica=True, detalles_ubicacion={"caja_codigo": "BOX-SILA-2026"}, estado_id=est_activo.id)
        db.add(caja_silabos)
        db.commit()
        db.refresh(caja_silabos)

        arc_sil_sis = models.Nodo(nombre="Archivador Sílabos Sistemas", abreviacion="ARC-SILA", codigo_inteligente="DFI-EST-C-CJ26-SIS", parent_id=caja_silabos.id, es_ubicacion_fisica=True, detalles_ubicacion={"etiqueta": "SILABOS SISTEMAS"}, estado_id=est_activo.id)
        db.add(arc_sil_sis)
        db.commit()
        db.refresh(arc_sil_sis)

        # --- AMBIENTE 4: ARCHIVO CENTRAL DE RECTORADO ---
        print("Inyectando Estructura Física 4: Archivo Central de Rectorado...")
        env_rectorado = models.Nodo(
            nombre="Archivo Central de Rectorado",
            abreviacion="ACR",
            codigo_inteligente="ACR-001",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Edificio Rectorado - 1er Piso", "seguridad": "Acceso Restringido Especial"},
            estado_id=est_activo.id
        )
        db.add(env_rectorado)
        db.commit()
        db.refresh(env_rectorado)

        est_rec_d = models.Nodo(nombre="Estante Convenios D", abreviacion="EST-D", codigo_inteligente="ACR-EST-D", parent_id=env_rectorado.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        db.add(est_rec_d)
        db.commit()
        db.refresh(est_rec_d)

        fil_rec_01 = models.Nodo(nombre="Fila Convenios Especiales", abreviacion="FIL-R01", codigo_inteligente="ACR-EST-D-FR01", parent_id=est_rec_d.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        db.add(fil_rec_01)
        db.commit()
        db.refresh(fil_rec_01)

        caja_convenios = models.Nodo(nombre="Caja de Convenios de Gestión", abreviacion="CJ-COV", codigo_inteligente="ACR-EST-D-FR01-CJ", parent_id=fil_rec_01.id, es_ubicacion_fisica=True, detalles_ubicacion={"caja_codigo": "BOX-CONVENIOS"}, estado_id=est_activo.id)
        db.add(caja_convenios)
        db.commit()
        db.refresh(caja_convenios)

        arc_cov_int = models.Nodo(nombre="Archivador Convenios Internacionales", abreviacion="ARC-COVINT", codigo_inteligente="ACR-EST-D-CJ-INT", parent_id=caja_convenios.id, es_ubicacion_fisica=True, detalles_ubicacion={"etiqueta": "CONVENIOS INTERNACIONALES"}, estado_id=est_activo.id)
        db.add(arc_cov_int)
        db.commit()
        db.refresh(arc_cov_int)


        # --------------------------------------------------------------------
        # 8. SET COMPLETO DE MÁS DE 20 DOCUMENTOS UNIVERSITARIOS
        # --------------------------------------------------------------------
        print("Inyectando más de 20 Documentos Universitarios con metadatos reales...")
        
        documentos_semilla = [
            # CONTRATOS (SISTEMAS)
            {"nombre": "Contrato_Trabajo_Dr_Alberto_Espinoza_2026.pdf", "logico_id": con_sis_g26.id, "fisico_id": arc_con_sis.id, "version": 1, "identificador": "uni_con_espinoza_26", "estado": est_vigente.id},
            {"nombre": "Titulo_Doctorado_Alberto_Espinoza_Copia.pdf", "logico_id": con_sis_g26.id, "fisico_id": arc_con_sis.id, "version": 1, "identificador": "uni_con_espinoza_doc", "estado": est_aprobado.id},
            {"nombre": "Contrato_Laboral_Msc_Ana_Martinez_2026.pdf", "logico_id": con_sis_g26.id, "fisico_id": arc_con_sis.id, "version": 1, "identificador": "uni_con_martinez_26", "estado": est_vigente.id},
            {"nombre": "Contrato_Director_Carrera_Carlos_Mendoza_2026.pdf", "logico_id": con_sis_g26.id, "fisico_id": arc_con_sis.id, "version": 2, "identificador": "uni_con_mendoza_26", "estado": est_vigente.id},
            
            # CONTRATOS (DERECHO)
            {"nombre": "Contrato_Trabajo_Dra_Patricia_Quiroga_2026.pdf", "logico_id": con_der_g26.id, "fisico_id": arc_con_der.id, "version": 1, "identificador": "uni_con_quiroga_26", "estado": est_vigente.id},
            {"nombre": "Contrato_Laboral_Dr_Jorge_Valdez_2026.pdf", "logico_id": con_der_g26.id, "fisico_id": arc_con_der.id, "version": 1, "identificador": "uni_con_valdez_26", "estado": est_vigente.id},
            {"nombre": "Titulo_Doctorado_Jorge_Valdez_Legalizado.pdf", "logico_id": con_der_g26.id, "fisico_id": arc_con_der.id, "version": 1, "identificador": "uni_con_valdez_doc", "estado": est_aprobado.id},

            # ASISTENCIAS
            {"nombre": "Control_Asistencia_Clase_1_Prog1_Grupo_A.pdf", "logico_id": asi_grupo_prog1_a.id, "fisico_id": arc_asi_sis.id, "version": 1, "identificador": "uni_asi_prog1_a_c1", "estado": est_aprobado.id},
            {"nombre": "Control_Asistencia_Clase_2_Prog1_Grupo_A.pdf", "logico_id": asi_grupo_prog1_a.id, "fisico_id": arc_asi_sis.id, "version": 1, "identificador": "uni_asi_prog1_a_c2", "estado": est_revision.id},
            {"nombre": "Control_Asistencia_Clase_3_Prog1_Grupo_A.pdf", "logico_id": asi_grupo_prog1_a.id, "fisico_id": arc_asi_sis.id, "version": 1, "identificador": "uni_asi_prog1_a_c3", "estado": est_borrador.id},
            {"nombre": "Control_Asistencia_Clase_1_DB1_Grupo_A.pdf", "logico_id": asi_grupo_db1_a.id, "fisico_id": arc_asi_sis.id, "version": 1, "identificador": "uni_asi_db1_a_c1", "estado": est_aprobado.id},
            {"nombre": "Control_Asistencia_Clase_2_DB1_Grupo_A.pdf", "logico_id": asi_grupo_db1_a.id, "fisico_id": arc_asi_sis.id, "version": 1, "identificador": "uni_asi_db1_a_c2", "estado": est_borrador.id},

            # PLANIFICACIONES (SÍLABOS)
            {"nombre": "Silabo_Oficial_Programacion_I_2026.pdf", "logico_id": pla_sil_prog1.id, "fisico_id": arc_sil_sis.id, "version": 1, "identificador": "uni_pla_sil_prog1", "estado": est_aprobado.id},
            {"nombre": "Guia_Laboratorios_Programacion_I_2026.pdf", "logico_id": pla_sil_prog1.id, "fisico_id": arc_sil_sis.id, "version": 1, "identificador": "uni_pla_lab_prog1", "estado": est_aprobado.id},
            {"nombre": "Silabo_Oficial_Bases_De_Datos_I_2026.pdf", "logico_id": pla_sil_db1.id, "fisico_id": arc_sil_sis.id, "version": 2, "identificador": "uni_pla_sil_db1", "estado": est_aprobado.id},

            # ACTAS DE CALIFICACIONES
            {"nombre": "Acta_Calificaciones_Final_Prog1_Sistemas_II-2025.pdf", "logico_id": act_gestion_25.id, "fisico_id": arc_actas_sis.id, "version": 1, "identificador": "uni_act_prog1_25", "estado": est_archivado.id},
            {"nombre": "Acta_Calificaciones_Final_DB1_Sistemas_II-2025.pdf", "logico_id": act_gestion_25.id, "fisico_id": arc_actas_sis.id, "version": 1, "identificador": "uni_act_db1_25", "estado": est_archivado.id},
            {"nombre": "Acta_Calificaciones_Parcial_1_Prog1_Sistemas_I-2026.pdf", "logico_id": act_gestion_26.id, "fisico_id": arc_actas_sis.id, "version": 1, "identificador": "uni_act_prog1_26_p1", "estado": est_aprobado.id},
            {"nombre": "Acta_Calificaciones_Parcial_1_DB1_Sistemas_I-2026.pdf", "logico_id": act_gestion_26.id, "fisico_id": arc_actas_sis.id, "version": 1, "identificador": "uni_act_db1_26_p1", "estado": est_aprobado.id},

            # CONVENIOS
            {"nombre": "Convenio_Doble_Titulacion_Universidad_De_Zaragoza_2026.pdf", "logico_id": cov_internacionales.id, "fisico_id": arc_cov_int.id, "version": 1, "identificador": "uni_cov_zaragoza_26", "estado": est_vigente.id},
            {"nombre": "Convenio_Intercambio_Academico_MIT_2026.pdf", "logico_id": cov_internacionales.id, "fisico_id": arc_cov_int.id, "version": 2, "identificador": "uni_cov_mit_26", "estado": est_vigente.id},
            {"nombre": "Convenio_Pasantias_Empresariales_Google_Latam.pdf", "logico_id": cov_internacionales.id, "fisico_id": arc_cov_int.id, "version": 1, "identificador": "uni_cov_google_26", "estado": est_aprobado.id}
        ]

        documentos_objetos = {}
        for doc_item in documentos_semilla:
            doc = models.Documento(
                nombre_archivo=doc_item["nombre"],
                ruta_archivo=f"/media/dms/{doc_item['nombre']}",
                nodo_id=doc_item["logico_id"],
                ubicacion_fisica_id=doc_item["fisico_id"],
                version=doc_item["version"],
                identificador_dms=doc_item["identificador"],
                estado_id=doc_item["estado"]
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            documentos_objetos[doc_item["nombre"]] = doc

        # --------------------------------------------------------------------
        # 9. VINCULACIONES DE MIEMBROS (CON ROLES HISTÓRICOS Y PESO)
        # --------------------------------------------------------------------
        print("Inyectando vinculaciones de miembros e historial de expedientes...")
        
        # Vínculos Contrato Dr. Espinoza
        db.add(models.PersonaVinculo(persona_id=p_espinoza.id, documento_id=documentos_objetos["Contrato_Trabajo_Dr_Alberto_Espinoza_2026.pdf"].id, rol_momento_id=rol_doc.id, tipo_relacion="Propietario Principal", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_mendoza.id, documento_id=documentos_objetos["Contrato_Trabajo_Dr_Alberto_Espinoza_2026.pdf"].id, rol_momento_id=rol_dir.id, tipo_relacion="Aprobador / Firma Convenio", peso=3))
        
        # Vínculos Título Dr. Espinoza
        db.add(models.PersonaVinculo(persona_id=p_espinoza.id, documento_id=documentos_objetos["Titulo_Doctorado_Alberto_Espinoza_Copia.pdf"].id, rol_momento_id=rol_doc.id, tipo_relacion="Titular de Grado", peso=1))

        # Vínculos Contrato Ana Martínez
        db.add(models.PersonaVinculo(persona_id=p_martinez.id, documento_id=documentos_objetos["Contrato_Laboral_Msc_Ana_Martinez_2026.pdf"].id, rol_momento_id=rol_aux.id, tipo_relacion="Propietario Principal", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_perez.id, documento_id=documentos_objetos["Contrato_Laboral_Msc_Ana_Martinez_2026.pdf"].id, rol_momento_id=rol_adm.id, tipo_relacion="Liquidador / Registro RRHH", peso=5))

        # Vínculos Asistencias Programación I
        db.add(models.PersonaVinculo(persona_id=p_espinoza.id, documento_id=documentos_objetos["Control_Asistencia_Clase_1_Prog1_Grupo_A.pdf"].id, rol_momento_id=rol_doc.id, tipo_relacion="Docente Dictante", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_espinoza.id, documento_id=documentos_objetos["Control_Asistencia_Clase_2_Prog1_Grupo_A.pdf"].id, rol_momento_id=rol_doc.id, tipo_relacion="Docente Dictante", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_espinoza.id, documento_id=documentos_objetos["Control_Asistencia_Clase_3_Prog1_Grupo_A.pdf"].id, rol_momento_id=rol_doc.id, tipo_relacion="Docente Dictante", peso=1))

        # Vínculos Asistencias Bases de Datos
        db.add(models.PersonaVinculo(persona_id=p_martinez.id, documento_id=documentos_objetos["Control_Asistencia_Clase_1_DB1_Grupo_A.pdf"].id, rol_momento_id=rol_aux.id, tipo_relacion="Docente Dictante", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_martinez.id, documento_id=documentos_objetos["Control_Asistencia_Clase_2_DB1_Grupo_A.pdf"].id, rol_momento_id=rol_aux.id, tipo_relacion="Docente Dictante", peso=1))

        # Vínculos Sílabos
        db.add(models.PersonaVinculo(persona_id=p_espinoza.id, documento_id=documentos_objetos["Silabo_Oficial_Programacion_I_2026.pdf"].id, rol_momento_id=rol_doc.id, tipo_relacion="Docente Elaborador", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_mendoza.id, documento_id=documentos_objetos["Silabo_Oficial_Programacion_I_2026.pdf"].id, rol_momento_id=rol_dir.id, tipo_relacion="Director Validador", peso=3))
        db.add(models.PersonaVinculo(persona_id=p_martinez.id, documento_id=documentos_objetos["Silabo_Oficial_Bases_De_Datos_I_2026.pdf"].id, rol_momento_id=rol_aux.id, tipo_relacion="Docente Elaborador", peso=1))

        # Vínculos Actas de Calificación
        db.add(models.PersonaVinculo(persona_id=p_espinoza.id, documento_id=documentos_objetos["Acta_Calificaciones_Final_Prog1_Sistemas_II-2025.pdf"].id, rol_momento_id=rol_doc.id, tipo_relacion="Docente Evaluador", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_mendoza.id, documento_id=documentos_objetos["Acta_Calificaciones_Final_Prog1_Sistemas_II-2025.pdf"].id, rol_momento_id=rol_dir.id, tipo_relacion="Director Validador", peso=3))
        db.add(models.PersonaVinculo(persona_id=p_torres.id, documento_id=documentos_objetos["Acta_Calificaciones_Final_Prog1_Sistemas_II-2025.pdf"].id, rol_momento_id=rol_dec.id, tipo_relacion="Decano Firmante", peso=5))

        # Vínculos Convenios Rectorado
        db.add(models.PersonaVinculo(persona_id=p_benitez.id, documento_id=documentos_objetos["Convenio_Doble_Titulacion_Universidad_De_Zaragoza_2026.pdf"].id, rol_momento_id=rol_rec.id, tipo_relacion="Rector Firmante", peso=1))
        db.add(models.PersonaVinculo(persona_id=p_benitez.id, documento_id=documentos_objetos["Convenio_Intercambio_Academico_MIT_2026.pdf"].id, rol_momento_id=rol_rec.id, tipo_relacion="Rector Firmante", peso=1))
        
        db.commit()

        # --------------------------------------------------------------------
        # 10. ENLACES CRUZADOS (INTERSECCIONES ENTRE GRAFOS UNIVERSITARIOS)
        # --------------------------------------------------------------------
        print("Inyectando malla densa de enlaces cruzados (shortcuts)...")
        
        # Enlace 1: Sílabo de Programación I (Planificaciones) -> Asistencia Grupo A (Asistencias)
        db.add(models.EnlaceCruzado(documento_origen_id=documentos_objetos["Silabo_Oficial_Programacion_I_2026.pdf"].id, nodo_destino_id=asi_grupo_prog1_a.id))
        
        # Enlace 2: Contrato del Dr. Espinoza (Contratos) -> Asistencia Grupo A (Asistencias)
        db.add(models.EnlaceCruzado(documento_origen_id=documentos_objetos["Contrato_Trabajo_Dr_Alberto_Espinoza_2026.pdf"].id, nodo_destino_id=asi_grupo_prog1_a.id))
        
        # Enlace 3: Contrato de Ana Martínez (Contratos) -> Asistencia Grupo A - DB (Asistencias)
        db.add(models.EnlaceCruzado(documento_origen_id=documentos_objetos["Contrato_Laboral_Msc_Ana_Martinez_2026.pdf"].id, nodo_destino_id=asi_grupo_db1_a.id))

        # Enlace 4: Acta de Calificación Final Prog I (Actas) -> Programación I (Asistencias)
        db.add(models.EnlaceCruzado(documento_origen_id=documentos_objetos["Acta_Calificaciones_Final_Prog1_Sistemas_II-2025.pdf"].id, nodo_destino_id=asi_asignatura_prog1.id))

        # Enlace 5: Convenio MIT (Convenios) -> Carrera Sistemas (Contratos)
        db.add(models.EnlaceCruzado(documento_origen_id=documentos_objetos["Convenio_Intercambio_Academico_MIT_2026.pdf"].id, nodo_destino_id=con_sis_g26.id))

        # Enlace 6: Nodo Académico de Bases de Datos I (Asistencias) -> Ingeniería de Sistemas (Contratos)
        db.add(models.EnlaceCruzado(nodo_origen_id=asi_asignatura_db1.id, nodo_destino_id=con_sis_g26.id))

        # 11. CONFIGURACIÓN DE CODIFICACIÓN SEMILLA
        print("Inyectando configuración de codificación por defecto...")
        conf_cod = models.ConfiguracionCodificacion(
            separador="-",
            digitos_correlativo=3,
            usar_abreviacion_padre=True,
            prefijo_global=""
        )
        db.add(conf_cod)
        db.commit()

        print("¡Inyección del set universitario completo de demostración y pruebas finalizada con total éxito!")

    except Exception as e:
        db.rollback()
        print(f"Error crítico al inyectar set de datos universitarios: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
