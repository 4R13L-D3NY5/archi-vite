import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Obtener la URL de conexión
DATABASE_URL = os.environ.get("DATABASE_URL")

# Si no está en las variables de entorno, hacer fallback a SQLite local portátil
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./archivite.db"

# Configurar el motor de base de datos
if DATABASE_URL.startswith("sqlite"):
    # SQLite requiere este parámetro para múltiples hilos en FastAPI
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependencia para obtener la sesión de BD en los endpoints de FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
