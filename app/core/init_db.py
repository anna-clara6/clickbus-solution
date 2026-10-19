from app.core.database import connect_database, database_name


TABLES = (
    """CREATE TABLE IF NOT EXISTS viacoes (
        id INT NOT NULL AUTO_INCREMENT,
        nome VARCHAR(120) NOT NULL,
        cnpj VARCHAR(18) NOT NULL,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT pk_viacoes PRIMARY KEY (id),
        CONSTRAINT uq_viacoes_cnpj UNIQUE (cnpj)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""",
    """CREATE TABLE IF NOT EXISTS passagens (
        id INT NOT NULL AUTO_INCREMENT,
        origem VARCHAR(120) NOT NULL,
        destino VARCHAR(120) NOT NULL,
        data_ida DATETIME NOT NULL,
        data_volta DATETIME NULL,
        usuario_id VARCHAR(120) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'reservada',
        viacao_id INT NOT NULL,
        CONSTRAINT pk_passagens PRIMARY KEY (id),
        CONSTRAINT fk_passagens_viacao FOREIGN KEY (viacao_id) REFERENCES viacoes (id),
        CONSTRAINT ck_passagens_status CHECK (status IN ('reservada', 'confirmada', 'cancelada')),
        CONSTRAINT ck_passagens_valor CHECK (valor >= 0),
        INDEX idx_passagens_usuario (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""",
    """CREATE TABLE IF NOT EXISTS conexoes (
        id INT NOT NULL AUTO_INCREMENT,
        passagem_id INT NOT NULL,
        origem VARCHAR(120) NOT NULL,
        destino VARCHAR(120) NOT NULL,
        horario_saida DATETIME NOT NULL,
        horario_chegada DATETIME NOT NULL,
        ordem INT NOT NULL,
        CONSTRAINT pk_conexoes PRIMARY KEY (id),
        CONSTRAINT fk_conexoes_passagem FOREIGN KEY (passagem_id)
            REFERENCES passagens (id) ON DELETE CASCADE,
        CONSTRAINT uq_conexoes_ordem UNIQUE (passagem_id, ordem),
        CONSTRAINT ck_conexoes_horarios CHECK (horario_chegada > horario_saida)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""",
    """CREATE TABLE IF NOT EXISTS reembolsos (
        id INT NOT NULL AUTO_INCREMENT,
        passagem_id INT NOT NULL,
        motivo TEXT NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'solicitado',
        solicitado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        processado_em DATETIME NULL,
        CONSTRAINT pk_reembolsos PRIMARY KEY (id),
        CONSTRAINT fk_reembolsos_passagem FOREIGN KEY (passagem_id)
            REFERENCES passagens (id) ON DELETE CASCADE,
        CONSTRAINT ck_reembolsos_status CHECK (status IN ('solicitado', 'aprovado', 'rejeitado', 'pago')),
        CONSTRAINT ck_reembolsos_valor CHECK (valor >= 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""",
    """CREATE TABLE IF NOT EXISTS solicitacoes (
        id INT NOT NULL AUTO_INCREMENT,
        tipo VARCHAR(30) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'aberta',
        criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT pk_solicitacoes PRIMARY KEY (id),
        CONSTRAINT ck_solicitacoes_status CHECK (status IN ('aberta', 'processando', 'concluida', 'cancelada'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""",
    """CREATE TABLE IF NOT EXISTS solicitacoes_passagem (
        id INT NOT NULL,
        passagem_id INT NULL,
        CONSTRAINT pk_solic_passagem PRIMARY KEY (id),
        CONSTRAINT fk_solic_passagem_base FOREIGN KEY (id)
            REFERENCES solicitacoes (id) ON DELETE CASCADE,
        CONSTRAINT fk_solic_passagem_passagem FOREIGN KEY (passagem_id)
            REFERENCES passagens (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""",
    """CREATE TABLE IF NOT EXISTS solicitacoes_reembolso (
        id INT NOT NULL,
        reembolso_id INT NULL,
        CONSTRAINT pk_solic_reembolso PRIMARY KEY (id),
        CONSTRAINT fk_solic_reembolso_base FOREIGN KEY (id)
            REFERENCES solicitacoes (id) ON DELETE CASCADE,
        CONSTRAINT fk_solic_reembolso_reembolso FOREIGN KEY (reembolso_id)
            REFERENCES reembolsos (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci""",
)

SEED_STATEMENTS = (
    (
        """INSERT IGNORE INTO viacoes (id, nome, cnpj, ativo)
           VALUES (%s, %s, %s, %s)""",
        [
            (1, "Viação Cometa", "11.111.111/0001-11", True),
            (2, "Expresso Ouro", "22.222.222/0001-22", True),
        ],
    ),
    (
        """INSERT IGNORE INTO passagens
           (id, origem, destino, data_ida, data_volta, usuario_id, valor, status, viacao_id)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        [(1, "Brasília", "Ribeirão Preto", "2026-09-19 22:00:00", None,
          "usuario-001", "156.40", "confirmada", 1)],
    ),
    (
        """INSERT IGNORE INTO conexoes
           (id, passagem_id, origem, destino, horario_saida, horario_chegada, ordem)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [
            (1, 1, "Brasília", "Franca", "2026-09-19 22:00:00", "2026-09-20 07:10:00", 1),
            (2, 1, "Franca", "Ribeirão Preto", "2026-09-20 06:45:00", "2026-09-20 07:40:00", 2),
        ],
    ),
    (
        """INSERT IGNORE INTO reembolsos
           (id, passagem_id, motivo, valor, status, solicitado_em, processado_em)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [(1, 1, "Perdi a conexão em Franca por atraso do primeiro ônibus", "156.40",
          "solicitado", "2026-09-20 08:00:00", None)],
    ),
    (
        "INSERT IGNORE INTO solicitacoes (id, tipo, status) VALUES (%s, %s, %s)",
        [(1, "reembolso", "aberta"), (2, "passagem", "concluida")],
    ),
    (
        "INSERT IGNORE INTO solicitacoes_reembolso (id, reembolso_id) VALUES (%s, %s)",
        [(1, 1)],
    ),
    (
        "INSERT IGNORE INTO solicitacoes_passagem (id, passagem_id) VALUES (%s, %s)",
        [(2, 1)],
    ),
)


def create_tables() -> None:
    name = database_name()
    connection = connect_database(select_database=False)
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        connection.commit()
    finally:
        connection.close()

    connection = connect_database()
    try:
        with connection.cursor() as cursor:
            for statement in TABLES:
                cursor.execute(statement)
            for statement, rows in SEED_STATEMENTS:
                cursor.executemany(statement, rows)
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == "__main__":
    create_tables()