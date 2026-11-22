# Dermatologia
PROYECTO FINAL LABORATORIO DE PROGRAMACIÓN III

Para crear las Tablas Roles y Usuario

CREATE TABLE IF NOT EXISTS roles (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL,
    codigo_rol VARCHAR(20) NOT NULL UNIQUE,
    estado_rol VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT chk_estado_rol
        CHECK (estado_rol IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL,
    correo_usuario VARCHAR(150) NOT NULL,
    password_usuario VARCHAR(255) NOT NULL,
    id_rol INTEGER NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol),

    CONSTRAINT uq_correo_usuario
        UNIQUE (correo_usuario)
);

-- 4. Índice para facilitar las búsquedas por correo
CREATE INDEX IF NOT EXISTS idx_usuarios_correo
ON usuarios (correo_usuario);

COMMIT;


INSERT INTO roles (nombre_rol, codigo_rol, estado_rol)
VALUES
    ('Administrador', 'ADMIN', 'ACTIVO'),
    ('Cliente', 'CLIENTE', 'ACTIVO');

    CREATE TABLE dermatologos (
    id_dermatologo SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE especialidades (
    id_especialidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE dermatologo_especialidad (
    id_dermatologo INTEGER NOT NULL,
    id_especialidad INTEGER NOT NULL,

    PRIMARY KEY (id_dermatologo, id_especialidad),

    CONSTRAINT fk_dermatologo
        FOREIGN KEY (id_dermatologo)
        REFERENCES dermatologos(id_dermatologo)
        ON DELETE CASCADE,

    CONSTRAINT fk_especialidad
        FOREIGN KEY (id_especialidad)
        REFERENCES especialidades(id_especialidad)
        ON DELETE RESTRICT
);

tabla de servicios: 
CREATE TABLE servicios (
    id_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(150) UNIQUE NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),
    estado BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

tabla horario: 
CREATE TABLE horarios (
    id_horario SERIAL PRIMARY KEY,
    id_dermatologo INTEGER NOT NULL,
    dia_semana VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_horario_dermatologo
        FOREIGN KEY (id_dermatologo)
        REFERENCES dermatologos(id_dermatologo)
        ON DELETE CASCADE,

    CONSTRAINT chk_dia_semana
        CHECK (dia_semana IN (
            'Lunes',
            'Martes',
            'Miercoles',
            'Jueves',
            'Viernes',
            'Sabado',
            'Domingo'
        )),

    CONSTRAINT chk_horas
        CHECK (hora_fin > hora_inicio)
);

CREATE TABLE IF NOT EXISTS citas (
    id_cita INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_usuario INTEGER NOT NULL,
    id_dermatologo INTEGER NOT NULL,
    id_servicio INTEGER NOT NULL,

    fecha_cita DATE NOT NULL,
    hora_cita TIME NOT NULL,

    estado_cita VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',

    motivo_consulta TEXT,

    fecha_registro TIMESTAMP WITH TIME ZONE
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cita_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT fk_cita_dermatologo
        FOREIGN KEY (id_dermatologo)
        REFERENCES dermatologos(id_dermatologo),

    CONSTRAINT fk_cita_servicio
        FOREIGN KEY (id_servicio)
        REFERENCES servicios(id_servicio),

    CONSTRAINT chk_estado_cita
        CHECK (estado_cita IN (
            'PENDIENTE',
            'CONFIRMADA',
            'CANCELADA',
            'COMPLETADA'
        ))
);

CREATE INDEX idx_citas_usuario
ON citas(id_usuario);

CREATE INDEX idx_citas_dermatologo_fecha
ON citas(id_dermatologo, fecha_cita)