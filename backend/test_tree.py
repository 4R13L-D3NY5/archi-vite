import os
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configurar motor SQLite temporal en memoria para pruebas unitarias limpias
DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Importar modelos y base
from database import Base
import models
from main import calcular_codigo_inteligente

class TestArbolJerarquico(unittest.TestCase):
    
    def setUp(self):
        # Crear todas las tablas en la base de datos temporal
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()
        
    def tearDown(self):
        # Cerrar sesión y destruir las tablas temporales
        self.db.close()
        Base.metadata.drop_all(bind=engine)
        
    def test_creacion_codigo_raiz(self):
        # Test 1: Crear nodo raíz con abreviación 'UM'
        codigo1 = calcular_codigo_inteligente(self.db, "UM", None)
        self.assertEqual(codigo1, "UM-001")
        
        # Guardar en base de datos para simular nodos existentes
        nodo_raiz = models.Nodo(nombre="Universidad Central", abreviacion="UM", codigo_inteligente=codigo1, parent_id=None)
        self.db.add(nodo_raiz)
        self.db.commit()
        
        # Test 2: Crear segunda raíz con abreviación 'UM' (debe autoincrementar)
        codigo2 = calcular_codigo_inteligente(self.db, "UM", None)
        self.assertEqual(codigo2, "UM-002")

    def test_creacion_codigo_hijo(self):
        # Crear nodo raíz
        codigo_raiz = "UM-001"
        nodo_raiz = models.Nodo(nombre="Universidad Central", abreviacion="UM", codigo_inteligente=codigo_raiz, parent_id=None)
        self.db.add(nodo_raiz)
        self.db.commit()
        self.db.refresh(nodo_raiz)
        
        # Test 1: Crear hijo 'SN' (Sede Norte)
        codigo_hijo1 = calcular_codigo_inteligente(self.db, "SN", nodo_raiz.id)
        self.assertEqual(codigo_hijo1, "UM-001-SN-001")
        
        nodo_hijo1 = models.Nodo(nombre="Sede Norte", abreviacion="SN", codigo_inteligente=codigo_hijo1, parent_id=nodo_raiz.id)
        self.db.add(nodo_hijo1)
        self.db.commit()
        self.db.refresh(nodo_hijo1)
        
        # Test 2: Crear segundo hijo 'SN' (debe incrementar)
        codigo_hijo2 = calcular_codigo_inteligente(self.db, "SN", nodo_raiz.id)
        self.assertEqual(codigo_hijo2, "UM-001-SN-002")

    def test_eliminacion_en_cascada(self):
        # Crear estructura de 3 niveles: Raíz -> Hijo -> Nieto
        r = models.Nodo(nombre="Raiz", abreviacion="R", codigo_inteligente="R-001", parent_id=None)
        self.db.add(r)
        self.db.commit()
        self.db.refresh(r)
        
        h = models.Nodo(nombre="Hijo", abreviacion="H", codigo_inteligente="R-001-H-001", parent_id=r.id)
        self.db.add(h)
        self.db.commit()
        self.db.refresh(h)
        
        n = models.Nodo(nombre="Nieto", abreviacion="N", codigo_inteligente="R-001-H-001-N-001", parent_id=h.id)
        self.db.add(n)
        self.db.commit()
        
        # Verificar que existen los 3 nodos en la base de datos
        self.assertEqual(self.db.query(models.Nodo).count(), 3)
        
        # Eliminar el nodo Hijo
        self.db.delete(h)
        self.db.commit()
        
        # El nodo Nieto debe haberse eliminado automáticamente en cascada por la FK de base de datos
        self.assertEqual(self.db.query(models.Nodo).count(), 1)
        self.assertEqual(self.db.query(models.Nodo).first().nombre, "Raiz")

if __name__ == "__main__":
    unittest.main()
