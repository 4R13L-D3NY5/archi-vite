import hashlib
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models

def generar_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_database():
    print("Recreando base de datos completa orientada al ecosistema corporativo estándar (XpertiFlow Corp)...")
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
        rol_ceo = models.RolOrganizacion(nombre="Director General (CEO)", codigo="CORP-CEO", color="#8b5cf6")
        rol_cfo = models.RolOrganizacion(nombre="Gerente Financiero (CFO)", codigo="CORP-CFO", color="#10b981")
        rol_clo = models.RolOrganizacion(nombre="Asesor Legal (CLO)", codigo="CORP-CLO", color="#3b82f6")
        rol_hr = models.RolOrganizacion(nombre="Analista de RRHH", codigo="CORP-HR", color="#f59e0b")
        rol_aud = models.RolOrganizacion(nombre="Auditor de Calidad", codigo="CORP-AUD", color="#ef4444")
        
        db.add(rol_ceo)
        db.add(rol_cfo)
        db.add(rol_clo)
        db.add(rol_hr)
        db.add(rol_aud)
        db.commit()
        db.refresh(rol_ceo)
        db.refresh(rol_cfo)
        db.refresh(rol_clo)
        db.refresh(rol_hr)
        db.refresh(rol_aud)

        # --------------------------------------------------------------------
        # 3. CATALOGO DE PERSONAS
        # --------------------------------------------------------------------
        print("Inyectando catálogo de personas corporativas...")
        p_vargas = models.Persona(identificacion="CORP-1001", nombre_completo="Ing. Alejandro Vargas", rol_actual_id=rol_ceo.id, carrera_departamento="Dirección General")
        p_mendez = models.Persona(identificacion="CORP-1002", nombre_completo="Lic. Sandra Méndez", rol_actual_id=rol_cfo.id, carrera_departamento="Gerencia de Finanzas")
        p_franco = models.Persona(identificacion="CORP-1003", nombre_completo="Dr. Roberto Franco", rol_actual_id=rol_clo.id, carrera_departamento="Asuntos Legales")
        p_ortiz = models.Persona(identificacion="CORP-1004", nombre_completo="Lic. Laura Ortiz", rol_actual_id=rol_hr.id, carrera_departamento="Recursos Humanos")
        p_soto = models.Persona(identificacion="CORP-1005", nombre_completo="Ing. Carlos Soto", rol_actual_id=rol_aud.id, carrera_departamento="Gestión de Calidad")
        
        db.add_all([p_vargas, p_mendez, p_franco, p_ortiz, p_soto])
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
        print("Inyectando 5 Categorías Lógicas Corporativas...")
        cat_rrhh = models.Nodo(nombre="Recursos Humanos", abreviacion="RRH", codigo_inteligente="CORP-RRH-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_finanzas = models.Nodo(nombre="Finanzas y Contabilidad", abreviacion="FIN", codigo_inteligente="CORP-FIN-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_legal = models.Nodo(nombre="Asuntos Legales", abreviacion="LEG", codigo_inteligente="CORP-LEG-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_operaciones = models.Nodo(nombre="Operaciones y Logística", abreviacion="OPE", codigo_inteligente="CORP-OPE-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        cat_calidad = models.Nodo(nombre="Políticas y Calidad", abreviacion="CAL", codigo_inteligente="CORP-CAL-001", parent_id=None, es_ubicacion_fisica=False, estado_id=est_activo.id)
        
        db.add_all([cat_rrhh, cat_finanzas, cat_legal, cat_operaciones, cat_calidad])
        db.commit()

        # --------------------------------------------------------------------
        # 6. ESTRUCTURACIÓN DE LAS RAMAS LÓGICAS
        # --------------------------------------------------------------------
        print("Estructurando subcategorías corporativas...")
        
        # RRHH Subcategorías
        sub_rrhh_exp = models.Nodo(nombre="Expedientes de Empleados", abreviacion="EXP", codigo_inteligente="CORP-RRH-EXP-001", parent_id=cat_rrhh.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(sub_rrhh_exp)
        db.commit()
        
        sub_rrhh_g26 = models.Nodo(nombre="Gestión 2026", abreviacion="G26", codigo_inteligente="CORP-RRH-EXP-G26-001", parent_id=sub_rrhh_exp.id, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["RRHH", "Personal", "2026"])
        db.add(sub_rrhh_g26)
        db.commit()

        # Finanzas Subcategorías
        sub_fin_pre = models.Nodo(nombre="Presupuestos y Costos", abreviacion="PRE", codigo_inteligente="CORP-FIN-PRE-001", parent_id=cat_finanzas.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(sub_fin_pre)
        db.commit()
        
        sub_fin_g26 = models.Nodo(nombre="Gestión 2026", abreviacion="G26", codigo_inteligente="CORP-FIN-PRE-G26-001", parent_id=sub_fin_pre.id, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Presupuesto", "Finanzas", "Costos"])
        db.add(sub_fin_g26)
        db.commit()

        # Legal Subcategorías
        sub_leg_con = models.Nodo(nombre="Contratos y Convenios", abreviacion="CON", codigo_inteligente="CORP-LEG-CON-001", parent_id=cat_legal.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(sub_leg_con)
        db.commit()

        sub_leg_g26 = models.Nodo(nombre="Gestión 2026", abreviacion="G26", codigo_inteligente="CORP-LEG-CON-G26-001", parent_id=sub_leg_con.id, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Contratos", "Legal", "Acuerdos"])
        db.add(sub_leg_g26)
        db.commit()

        # Operaciones Subcategorías
        sub_ope_inv = models.Nodo(nombre="Inventarios e Infraestructura", abreviacion="INV", codigo_inteligente="CORP-OPE-INV-001", parent_id=cat_operaciones.id, es_ubicacion_fisica=False, estado_id=est_activo.id)
        db.add(sub_ope_inv)
        db.commit()

        # Calidad Subcategorías
        sub_cal_nor = models.Nodo(nombre="Normas y Procedimientos", abreviacion="NOR", codigo_inteligente="CORP-CAL-NOR-001", parent_id=cat_calidad.id, es_ubicacion_fisica=False, estado_id=est_activo.id, etiquetas=["Normativa", "ISO", "Calidad"])
        db.add(sub_cal_nor)
        db.commit()

        # --------------------------------------------------------------------
        # 7. ESTRUCTURAS FÍSICAS (4 AMBIENTES CORPORATIVOS)
        # --------------------------------------------------------------------
        print("Inyectando Ambientes Físicos Corporativos...")
        
        # Archivo Central Corporativo
        env_central = models.Nodo(
            nombre="Archivo Central Corporativo",
            abreviacion="ACC",
            codigo_inteligente="CORP-ACC-001",
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
            codigo_inteligente="CORP-ACC-EST-A", 
            parent_id=env_central.id, 
            es_ubicacion_fisica=True, 
            estado_id=est_activo.id,
            detalles_ubicacion={"imagen_url": "/media/semilla/estante.png"},
            etiquetas=["Estante A", "Metal"]
        )
        db.add(est_central_a)
        db.commit()
        db.refresh(est_central_a)

        fil_central_01 = models.Nodo(nombre="Fila Física 01", abreviacion="FIL-01", codigo_inteligente="CORP-ACC-EST-A-F01", parent_id=est_central_a.id, es_ubicacion_fisica=True, estado_id=est_activo.id)
        db.add(fil_central_01)
        db.commit()
        db.refresh(fil_central_01)

        arc_rrhh = models.Nodo(
            nombre="Archivador Expedientes RRHH", 
            abreviacion="ARC-HR", 
            codigo_inteligente="CORP-ACC-EST-A-F01-HR", 
            parent_id=fil_central_01.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"etiqueta": "EXPEDIENTES RRHH", "imagen_url": "/media/semilla/archivador.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Expedientes", "RRHH", "Personal"]
        )
        db.add(arc_rrhh)
        db.commit()
        db.refresh(arc_rrhh)

        # Bóveda de Seguridad Legal
        env_boveda = models.Nodo(
            nombre="Bóveda de Seguridad Legal",
            abreviacion="BSL",
            codigo_inteligente="CORP-BSL-001",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Oficina 501 - Edificio Principal", "seguridad": "Caja Fuerte de Alta Seguridad", "imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Bóveda", "Legal", "Confidencial"]
        )
        db.add(env_boveda)
        db.commit()
        db.refresh(env_boveda)

        caja_legal = models.Nodo(
            nombre="Caja Blindada 01", 
            abreviacion="CJ-LEG", 
            codigo_inteligente="CORP-BSL-CJ01", 
            parent_id=env_boveda.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"caja_codigo": "BOX-LEGAL-CONFIDENCIAL", "imagen_url": "/media/semilla/caja.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Contratos", "Legal", "Seguridad"]
        )
        db.add(caja_legal)
        db.commit()
        db.refresh(caja_legal)

        # Oficina de Finanzas
        env_finanzas = models.Nodo(
            nombre="Oficina de Finanzas",
            abreviacion="OFF",
            codigo_inteligente="CORP-OFF-001",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "3er Piso - Oficina Financiera", "oficina": "Facturación y Contabilidad", "imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Oficina", "Finanzas", "Facturas"]
        )
        db.add(env_finanzas)
        db.commit()
        db.refresh(env_finanzas)

        caja_finanzas = models.Nodo(
            nombre="Caja Facturas 2025", 
            abreviacion="CJ-FIN25", 
            codigo_inteligente="CORP-OFF-CJ25", 
            parent_id=env_finanzas.id, 
            es_ubicacion_fisica=True, 
            detalles_ubicacion={"caja_codigo": "BOX-FINANZAS-2025", "imagen_url": "/media/semilla/caja.png"}, 
            estado_id=est_activo.id,
            etiquetas=["Facturas", "Finanzas", "Histórico"]
        )
        db.add(caja_finanzas)
        db.commit()
        db.refresh(caja_finanzas)

        # Bodega de Operaciones
        env_bodega = models.Nodo(
            nombre="Bodega de Operaciones",
            abreviacion="BOP",
            codigo_inteligente="CORP-BOP-001",
            parent_id=None,
            es_ubicacion_fisica=True,
            detalles_ubicacion={"ambiente": "Planta Baja - Galpón Central", "oficina": "Despacho y Logística", "imagen_url": "/media/semilla/estante.png"},
            estado_id=est_activo.id,
            etiquetas=["Bodega", "Operaciones", "Logística"]
        )
        db.add(env_bodega)
        db.commit()
        db.refresh(env_bodega)

        # --------------------------------------------------------------------
        # 8. DOCUMENTOS DE DEMOSTRACIÓN CORPORATIVOS
        # --------------------------------------------------------------------
        print("Inyectando documentos corporativos en la nube...")
        documentos_semilla = [
            # RRHH
            {"nombre": "Contrato_Trabajo_Laura_Ortiz.pdf", "logico_id": sub_rrhh_g26.id, "fisico_id": arc_rrhh.id, "version": 1, "identificador": "corp_con_laura", "estado": est_aprobado.id},
            {"nombre": "Politica_Induccion_Personal_v1.pdf", "logico_id": sub_rrhh_g26.id, "fisico_id": arc_rrhh.id, "version": 1, "identificador": "corp_pol_induccion", "estado": est_vigente.id},
            {"nombre": "Planilla_Sueldos_Enero_2026.pdf", "logico_id": sub_rrhh_g26.id, "fisico_id": arc_rrhh.id, "version": 1, "identificador": "corp_pla_sueldos_ene26", "estado": est_revision.id},
            
            # Finanzas
            {"nombre": "Balance_General_Consolidado_2025.pdf", "logico_id": sub_fin_g26.id, "fisico_id": caja_finanzas.id, "version": 1, "identificador": "corp_fin_balance25", "estado": est_archivado.id},
            {"nombre": "Factura_Compra_Servidores_Dell.pdf", "logico_id": sub_fin_g26.id, "fisico_id": caja_finanzas.id, "version": 1, "identificador": "corp_fin_factura_dell", "estado": est_aprobado.id},
            {"nombre": "Auditoria_Financiera_Externa_2025.pdf", "logico_id": sub_fin_g26.id, "fisico_id": caja_finanzas.id, "version": 1, "identificador": "corp_fin_auditoria25", "estado": est_archivado.id},
            
            # Legal
            {"nombre": "Contrato_Alquiler_Oficinas_Piso5.pdf", "logico_id": sub_leg_g26.id, "fisico_id": caja_legal.id, "version": 1, "identificador": "corp_leg_alquiler5", "estado": est_vigente.id},
            {"nombre": "Convenio_Confidencialidad_NDA_Proveedores.pdf", "logico_id": sub_leg_g26.id, "fisico_id": caja_legal.id, "version": 1, "identificador": "corp_leg_nda_prov", "estado": est_aprobado.id},
            {"nombre": "Acta_Constitutiva_XFC_Corp.pdf", "logico_id": sub_leg_g26.id, "fisico_id": caja_legal.id, "version": 1, "identificador": "corp_leg_constitucion", "estado": est_vigente.id},
            
            # Operaciones
            {"nombre": "Guia_Despacho_Logistica_Lote45.pdf", "logico_id": sub_ope_inv.id, "fisico_id": env_bodega.id, "version": 1, "identificador": "corp_ope_guia45", "estado": est_aprobado.id},
            {"nombre": "Inventario_Activos_Fijos_Ene2026.pdf", "logico_id": sub_ope_inv.id, "fisico_id": env_bodega.id, "version": 1, "identificador": "corp_ope_inventario", "estado": est_revision.id},
            
            # Calidad
            {"nombre": "Manual_Politicas_Seguridad_ISO27001.pdf", "logico_id": sub_cal_nor.id, "fisico_id": env_central.id, "version": 2, "identificador": "corp_cal_iso27001", "estado": est_vigente.id}
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
        print("Inyectando vinculaciones de miembros...")
        
        # CEO firma acta constitutiva
        db.add(models.PersonaVinculo(persona_id=p_vargas.id, documento_id=documentos_objetos["Acta_Constitutiva_XFC_Corp.pdf"].id, rol_momento_id=rol_ceo.id, tipo_relacion="Representante Legal", peso=1))
        # CFO aprueba balance y factura
        db.add(models.PersonaVinculo(persona_id=p_mendez.id, documento_id=documentos_objetos["Balance_General_Consolidado_2025.pdf"].id, rol_momento_id=rol_cfo.id, tipo_relacion="Aprobador Responsable", peso=2))
        db.add(models.PersonaVinculo(persona_id=p_mendez.id, documento_id=documentos_objetos["Factura_Compra_Servidores_Dell.pdf"].id, rol_momento_id=rol_cfo.id, tipo_relacion="Autorizador de Pago", peso=2))
        # CLO valida NDA y Alquiler
        db.add(models.PersonaVinculo(persona_id=p_franco.id, documento_id=documentos_objetos["Contrato_Alquiler_Oficinas_Piso5.pdf"].id, rol_momento_id=rol_clo.id, tipo_relacion="Redactor Legal", peso=3))
        # Analista RRHH responsable de planilla y contrato
        db.add(models.PersonaVinculo(persona_id=p_ortiz.id, documento_id=documentos_objetos["Planilla_Sueldos_Enero_2026.pdf"].id, rol_momento_id=rol_hr.id, tipo_relacion="Elaborador", peso=4))
        # Auditor valida ISO
        db.add(models.PersonaVinculo(persona_id=p_soto.id, documento_id=documentos_objetos["Manual_Politicas_Seguridad_ISO27001.pdf"].id, rol_momento_id=rol_aud.id, tipo_relacion="Auditor Principal", peso=2))
        
        db.commit()

        # --------------------------------------------------------------------
        # 10. ENLACES CRUZADOS (INTERSECCIONES ENTRE GRAFOS)
        # --------------------------------------------------------------------
        print("Inyectando enlaces cruzados...")
        
        # Enlace 1: Contrato de Alquiler de Oficinas (Asuntos Legales) -> Presupuestos y Costos (Finanzas)
        db.add(models.EnlaceCruzado(documento_origen_id=documentos_objetos["Contrato_Alquiler_Oficinas_Piso5.pdf"].id, nodo_destino_id=sub_fin_g26.id))
        
        # Enlace 2: Manual de Seguridad ISO 27001 (Políticas de Calidad) -> Expedientes RRHH (Recursos Humanos)
        db.add(models.EnlaceCruzado(documento_origen_id=documentos_objetos["Manual_Politicas_Seguridad_ISO27001.pdf"].id, nodo_destino_id=sub_rrhh_g26.id))
        
        # Enlace 3: Manual de Seguridad ISO 27001 (Políticas de Calidad) -> Inventarios e Infraestructura (Operaciones)
        db.add(models.EnlaceCruzado(documento_origen_id=documentos_objetos["Manual_Politicas_Seguridad_ISO27001.pdf"].id, nodo_destino_id=sub_ope_inv.id))

        db.commit()

        # --------------------------------------------------------------------
        # 11. CONFIGURACIÓN DE CODIFICACIÓN SEMILLA
        # --------------------------------------------------------------------
        print("Inyectando configuración de codificación por defecto...")
        conf_cod = models.ConfiguracionCodificacion(
            separador="-",
            digitos_correlativo=3,
            usar_abreviacion_padre=True,
            prefijo_global="CORP"
        )
        db.add(conf_cod)
        db.commit()

        print("¡Inyección del set corporativo estándar de demostración y pruebas finalizada con total éxito!")

    except Exception as e:
        db.rollback()
        print(f"Error crítico al inyectar set de datos corporativos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
