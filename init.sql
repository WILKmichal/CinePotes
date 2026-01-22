-- Extension UUID (nécessaire pour les UUID dans PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------
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

-----------------------------
-- Table Film
CREATE TABLE IF NOT EXISTS Film (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(200) NOT NULL,
    realisateur VARCHAR(150),
    annee_sortie INTEGER,
    affiche_url TEXT,
    bande_annonce_url TEXT,
    synopsis TEXT,
    note_imdb FLOAT,
    cree_le TIMESTAMP DEFAULT NOW(),
    maj_le TIMESTAMP DEFAULT NOW()
);

-----------------------------
-- Table Seance
CREATE TABLE IF NOT EXISTS Seance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL,
    date TIMESTAMP NOT NULL,
    max_films INTEGER CHECK (max_films > 0 AND max_films <= 5),
    proprietaire_id UUID NOT NULL,
    statut VARCHAR(50) NOT NULL CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')),
    cree_le TIMESTAMP DEFAULT NOW(),
    maj_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_seance_utilisateur FOREIGN KEY (proprietaire_id)
        REFERENCES utilisateur(id) ON DELETE CASCADE
);

-----------------------------
-- Table Selection
CREATE TABLE IF NOT EXISTS Selection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seance_id UUID NOT NULL,
    utilisateur_id UUID NOT NULL,
    film_id UUID NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_selection_seance FOREIGN KEY (seance_id)
        REFERENCES seance(id) ON DELETE CASCADE,
    CONSTRAINT fk_selection_utilisateur FOREIGN KEY (utilisateur_id)
        REFERENCES utilisateur(id) ON DELETE CASCADE,
    CONSTRAINT fk_selection_film FOREIGN KEY (film_id)
        REFERENCES film(id) ON DELETE CASCADE,
    -- Un utilisateur ne peut proposer qu'une seule fois un même film dans une séance
    CONSTRAINT uk_selection UNIQUE (seance_id, utilisateur_id, film_id)
);

-----------------------------
-- Table Liste (listes personnelles d'utilisateurs)
CREATE TABLE IF NOT EXISTS Liste (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    utilisateur_id UUID NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW(),
    maj_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_liste_utilisateur FOREIGN KEY (utilisateur_id)
        REFERENCES utilisateur(id) ON DELETE CASCADE
);

-----------------------------
-- Table ListeFilm (association liste <-> film TMDB)
CREATE TABLE IF NOT EXISTS ListeFilm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    liste_id UUID NOT NULL,
    tmdb_id INTEGER NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_listefilm_liste FOREIGN KEY (liste_id)
        REFERENCES liste(id) ON DELETE CASCADE,
    CONSTRAINT uk_listefilm UNIQUE (liste_id, tmdb_id)
);

-----------------------------
-- Table Classement
CREATE TABLE IF NOT EXISTS Classement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seance_id UUID NOT NULL,
    utilisateur_id UUID NOT NULL,
    film_id UUID NOT NULL,
    rang INTEGER NOT NULL CHECK (rang > 0),
    cree_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_classement_seance FOREIGN KEY (seance_id)
        REFERENCES seance(id) ON DELETE CASCADE,
    CONSTRAINT fk_classement_utilisateur FOREIGN KEY (utilisateur_id)
        REFERENCES utilisateur(id) ON DELETE CASCADE,
    CONSTRAINT fk_classement_film FOREIGN KEY (film_id)
        REFERENCES film(id) ON DELETE CASCADE,
    -- Un utilisateur ne peut classer un même film qu'une seule fois dans une séance
    CONSTRAINT uk_classement UNIQUE (seance_id, utilisateur_id, film_id)
);

-----------------------------
-- Indexes pour optimiser les requêtes
CREATE INDEX idx_selection_seance ON selection(seance_id);
CREATE INDEX idx_selection_utilisateur ON selection(utilisateur_id);
CREATE INDEX idx_selection_film ON selection(film_id);

CREATE INDEX idx_classement_seance ON classement(seance_id);
CREATE INDEX idx_classement_utilisateur ON classement(utilisateur_id);
CREATE INDEX idx_classement_film ON classement(film_id);

-- Index sur email pour login
CREATE INDEX idx_utilisateur_email ON utilisateur(email);

-- Index pour les listes
CREATE INDEX idx_liste_utilisateur ON liste(utilisateur_id);
CREATE INDEX idx_listefilm_liste ON listefilm(liste_id);
CREATE INDEX idx_listefilm_tmdb ON listefilm(tmdb_id);

-----------------------------
-- Insertion de valeurs de test
-- NOSONAR - Test data for local development only
INSERT INTO utilisateur (nom, email, mot_de_passe_hash, role)
VALUES
('Admin CinéPote', 'admin@cinepote.fr', 'test', 'admin'),
-- NOSONAR - Test data for local development only
('Max Dupont', 'max.chef@cinepote.fr', 'kalilinux', 'chef'),
('August Martin', 'august.user@cinepote.fr', 'Ryzen2025', 'user');
