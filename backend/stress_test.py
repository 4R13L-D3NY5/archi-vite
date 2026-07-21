import time
import random
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models
from main import calcular_codigo_inteligente

def ejecutar_stress_test():
    print("=== Iniciando Simulación de Carga Masiva (Stress Test) ===")
    db = SessionLocal()
    
    try:
        # Contar registros actuales
        nodos_iniciales = db.query(models.Nodo).count()
        docs_iniciales = db.query(models.Documento).count()
        
        print(f"Estado inicial de BD: {nodos_iniciales} nodos, {docs_iniciales} documentos.")
        print("Generando 150 nodos y 200 documentos de prueba de forma aleatoria...")
        
        # 1. Obtener una lista de nodos existentes para usarlos como padres
        nodos_padres = db.query(models.Nodo).all()
        if not nodos_padres:
            print("Error: No hay datos semilla para iniciar la ramificación. Ejecuta seed.py primero.")
            return

        t_start_inject = time.time()
        
        # Inyectar 150 nodos ramificados
        nodos_creados = []
        for i in range(1, 151):
            padre = random.choice(nodos_padres + nodos_creados)
            nombre = f"Nodo Auxiliar Stress Test #{i}"
            abbr = f"ST{i}"
            
            codigo = calcular_codigo_inteligente(db, abbr, padre.id)
            
            nuevo_nodo = models.Nodo(
                nombre=nombre,
                abreviacion=abbr,
                codigo_inteligente=codigo,
                parent_id=padre.id,
                es_ubicacion_fisica=random.choice([True, False])
            )
            db.add(nuevo_nodo)
            db.commit()
            db.refresh(nuevo_nodo)
            nodos_creados.append(nuevo_nodo)

        # Inyectar 200 documentos
        todos_nodos = db.query(models.Nodo).all()
        for j in range(1, 201):
            nodo_target = random.choice(todos_nodos)
            doc = models.Documento(
                nombre_archivo=f"Documento_Carga_Masiva_{j}.pdf",
                ruta_archivo=f"/media/dms/stress_doc_{j}.pdf",
                nodo_id=nodo_target.id,
                version=random.randint(1, 3),
                identificador_dms=f"stress_doc_{j}"
            )
            db.add(doc)
        db.commit()
        
        t_end_inject = time.time()
        inject_duration = t_end_inject - t_start_inject
        
        # 2. Medir tiempos de serialización del árbol completo
        t_start_query = time.time()
        
        # Simular lo que haría el endpoint /nodos/arbol
        raices = db.query(models.Nodo).filter(models.Nodo.parent_id == None).all()
        def construir_rama(nodo):
            rama = {
                "name": nodo.nombre,
                "attributes": {"id": nodo.id, "codigo": nodo.codigo_inteligente}
            }
            hijos = nodo.children
            if hijos:
                rama["children"] = [construir_rama(h) for h in hijos]
            return rama
            
        arbol_completo = [construir_rama(r) for r in raices]
        
        t_end_query = time.time()
        query_duration = t_end_query - t_start_query
        
        total_nodos = db.query(models.Nodo).count()
        total_docs = db.query(models.Documento).count()
        
        print("\n=== Resultados del Reporte de Rendimiento (Archi-vite Stats) ===")
        print(f"-> Total Nodos en Base de Datos: {total_nodos}")
        print(f"-> Total Documentos en Base de Datos: {total_docs}")
        print(f"-> Tiempo de inyección masiva: {inject_duration:.3f} segundos")
        print(f"-> Tiempo de serialización del árbol jerárquico: {query_duration:.3f} segundos")
        
        if query_duration < 0.1:
            print("-> Rendimiento del Árbol: [EXCELENTE] (Menor a 100ms)")
        elif query_duration < 0.5:
            print("-> Rendimiento del Árbol: [ACEPTABLE] (Menor a 500ms)")
        else:
            print("-> Rendimiento del Árbol: [DEGRADADO] (Requiere indexación o caché)")
            
    except Exception as e:
        db.rollback()
        print(f"Error durante el test: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    ejecutar_stress_test()
