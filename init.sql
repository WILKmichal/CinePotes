-- Extension UUID (nécessaire pour les UUID dans PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------
-- Table Utilisateur
CREATE TABLE IF NOT EXISTS utilisateur (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    mot_de_passe_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'chef')),

    -- 🔐 Confirmation email
    email_verifie BOOLEAN NOT NULL DEFAULT false,
    email_verification_token UUID,

    cree_le TIMESTAMP DEFAULT NOW(),
    maj_le TIMESTAMP DEFAULT NOW()
);

-----------------------------
-- Table Film
CREATE TABLE IF NOT EXISTS film (
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
CREATE TABLE IF NOT EXISTS seance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL,
    date TIMESTAMP NOT NULL,
    max_films INTEGER CHECK (max_films > 0 AND max_films <= 5),
    proprietaire_id UUID NOT NULL,
    statut VARCHAR(50) NOT NULL CHECK (
        statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')
    ),
    cree_le TIMESTAMP DEFAULT NOW(),
    maj_le TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_seance_utilisateur FOREIGN KEY (proprietaire_id)
        REFERENCES utilisateur(id) ON DELETE CASCADE
);

-----------------------------
-- Table Selection
CREATE TABLE IF NOT EXISTS selection (
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
CREATE TABLE IF NOT EXISTS classement (
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
    CONSTRAINT uk_classement UNIQUE (seance_id, utilisateur_id, film_id)
);

-----------------------------
-- Indexes
CREATE INDEX IF NOT EXISTS idx_utilisateur_email
    ON utilisateur(email);

CREATE INDEX IF NOT EXISTS idx_selection_seance
    ON selection(seance_id);
CREATE INDEX IF NOT EXISTS idx_selection_utilisateur
    ON selection(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_selection_film
    ON selection(film_id);

CREATE INDEX IF NOT EXISTS idx_classement_seance
    ON classement(seance_id);
CREATE INDEX IF NOT EXISTS idx_classement_utilisateur
    ON classement(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_classement_film
    ON classement(film_id);

-- Index pour les listes
CREATE INDEX idx_liste_utilisateur ON liste(utilisateur_id);
CREATE INDEX idx_listefilm_liste ON listefilm(liste_id);
CREATE INDEX idx_listefilm_tmdb ON listefilm(tmdb_id);

-----------------------------
-- Données de test (DEV UNIQUEMENT)
-- ⚠️ Comptes déjà confirmés pour éviter le blocage au login

INSERT INTO utilisateur (
    nom,
    email,
    mot_de_passe_hash,
    role,
    email_verifie
)
VALUES
(
    'Admin CinéPote',
    'admin@cinepote.fr',
    '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- hash bcrypt
    'admin',
    true
),
(
    'Max Dupont',
    'max.chef@cinepote.fr',
    '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'chef',
    true
),
(
    'August Martin',
    'august.user@cinepote.fr',
    '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'user',
    true
);
