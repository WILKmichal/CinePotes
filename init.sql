-- Extension UUID parceque par defaut sur postgreSQL ce n'est pas actif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--------------------------------
-- Table Utilisateur
CREATE TABLE IF NOT EXISTS Utilisateur (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    mot_de_passe_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'chef')),
    cree_le TIMESTAMP DEFAULT NOW(),
    maj_le TIMESTAMP DEFAULT NOW()
);
--------------------------------
-- Table Séance
CREATE TABLE IF NOT EXISTS Seance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL,
    date TIMESTAMP NOT NULL,
    max_films INTEGER CHECK (max_films > 0 AND max_films <= 20),
    proprietaire_id UUID NOT NULL,
    statut VARCHAR(50) NOT NULL CHECK (statut IN ('en_attente','selection','classement', 'terminee', 'annulee')),
    cree_le TIMESTAMP DEFAULT NOW(),
    maj_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_seance_utilisateur FOREIGN KEY (proprietaire_id)
        REFERENCES utilisateur(id) ON DELETE CASCADE
);
--------------------------------
-- Table Sélection
CREATE TABLE IF NOT EXISTS Selection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seance_id UUID NOT NULL,
    utilisateur_id UUID NOT NULL,
    tmdb_id INTEGER NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_selection_seance FOREIGN KEY (seance_id)
        REFERENCES seance(id) ON DELETE CASCADE,
    CONSTRAINT fk_selection_utilisateur FOREIGN KEY (utilisateur_id)
        REFERENCES utilisateur(id) ON DELETE CASCADE,
    CONSTRAINT uk_selection UNIQUE (seance_id, utilisateur_id, tmdb_id)
);
--------------------------------
-- Table Classement
CREATE TABLE IF NOT EXISTS Classement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seance_id UUID NOT NULL,
    utilisateur_id UUID NOT NULL,
    tmdb_id INTEGER NOT NULL,
    rang INTEGER NOT NULL CHECK (rang > 0),
    cree_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_classement_seance FOREIGN KEY (seance_id)
        REFERENCES seance(id) ON DELETE CASCADE,
    CONSTRAINT fk_classement_utilisateur FOREIGN KEY (utilisateur_id)
        REFERENCES utilisateur(id) ON DELETE CASCADE,
    CONSTRAINT uk_classement UNIQUE (seance_id, utilisateur_id, tmdb_id)
);
INSERT INTO utilisateur (nom, email, mot_de_passe_hash, role)
VALUES
('Admin CinéPote', 'admin@cinepote.fr', '$2b$10$fvYtsMibMSx1GdedFZCnoe6r6eVK1VUUOHwaL9loXZzEqFDvH3DCy', 'admin');

INSERT INTO utilisateur (nom, email, mot_de_passe_hash, role)
VALUES
('Max Dupont', 'max.chef@cinepote.fr', '$2b$10$nOjGULHNYuWMGteTF7WA.hmRqTECq/Q/7A0EYpt4oMojbrbE.4yUO', 'chef');

INSERT INTO utilisateur (nom, email, mot_de_passe_hash, role)
VALUES
('August Martin', 'august.user@cinepote.fr', '$2b$10$W7.emBmUK7QMGFCnH7Dhguz5WZhTwMu8lY3DjUUCJmi7tOXuqqs8e', 'user');
