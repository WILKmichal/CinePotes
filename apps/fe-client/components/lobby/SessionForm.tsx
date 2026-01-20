import { useState } from "react";
import { AvatarPicker } from "./AvatarPicker";
import { AVAILABLE_AVATARS, MockUser } from "./types";

// Props du composant SessionForm
interface SessionFormProps {
  onAddUser: (user: MockUser) => void;  // Fonction callback pour ajouter un utilisateur
  onCancel: () => void;                 // Fonction callback pour annuler
}

/**
 * Composant SessionForm
 * Formulaire pour ajouter un nouveau participant au lobby
 * Contient : input pour le nom + sélecteur d'avatar + bouton de validation
 */
export function SessionForm({ onAddUser, onCancel }: SessionFormProps) {
  // État local pour le nom (géré uniquement dans ce composant)
  const [userName, setUserName] = useState("");
  // État local pour l'avatar sélectionné
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVAILABLE_AVATARS[0]);

  // Fonction appelée lors de la soumission du formulaire
  const handleSubmit = () => {
    // Vérifie que le nom n'est pas vide
    if (userName.trim() === "") return;

    // Crée un nouvel utilisateur
    const newUser: MockUser = {
      id: Date.now().toString(),        // ID unique basé sur le timestamp
      name: userName.trim(),             // Nom sans espaces avant/après
      avatar: selectedAvatar,            // Avatar sélectionné
    };

    // Appelle la fonction onAddUser passée en props par le parent
    // Cela "remonte" l'information vers le parent (page.tsx)
    onAddUser(newUser);

    // Reset des champs du formulaire
    setUserName("");
    setSelectedAvatar(AVAILABLE_AVATARS[0]);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 border-2 border-blue-300 dark:border-blue-600 rounded-2xl p-8 space-y-6 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
        Nouveau participant
      </h3>

      {/* Input pour le nom */}
      <div>
        <label
          htmlFor="userName"
          className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3"
        >
          Nom du participant
        </label>
        <input
          id="userName"
          type="text"
          value={userName}
          // À chaque frappe, met à jour l'état local userName
          onChange={(e) => setUserName(e.target.value)}
          // Permet de valider avec la touche Enter
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Entrez un nom..."
          maxLength={20}
          className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-4 text-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
        />
      </div>

      {/* Composant AvatarPicker */}
      {/* On lui passe l'avatar sélectionné et une fonction pour le changer */}
      <AvatarPicker
        selectedAvatar={selectedAvatar}
        onSelectAvatar={setSelectedAvatar}  // Fonction pour mettre à jour l'état
      />

      {/* Boutons d'action */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={userName.trim() === ""}
          className="flex-grow rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-8 py-5 text-xl font-bold text-white shadow-lg hover:from-green-400 hover:to-green-500 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
        >
          ✓ Ajouter au lobby
        </button>
        <button
          onClick={onCancel}
          className="rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-5 text-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
