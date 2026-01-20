import { AVAILABLE_AVATARS } from "./types";

// Props = propriétés passées au composant par son parent
interface AvatarPickerProps {
  selectedAvatar: string;           // L'avatar actuellement sélectionné
  onSelectAvatar: (avatar: string) => void;  // Fonction callback pour notifier le parent du changement
}

/**
 * Composant AvatarPicker
 * Affiche une grille d'avatars cliquables
 * Permet à l'utilisateur de sélectionner un avatar parmi les options disponibles
 */
export function AvatarPicker({ selectedAvatar, onSelectAvatar }: AvatarPickerProps) {
  return (
    <div>
      <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Choisissez votre avatar
      </label>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
        {/* Boucle sur tous les avatars disponibles */}
        {AVAILABLE_AVATARS.map((avatarUrl, index) => (
          <button
            key={index}
            type="button"
            // Appelle la fonction onSelectAvatar quand l'utilisateur clique
            onClick={() => onSelectAvatar(avatarUrl)}
            // Classes conditionnelles : style différent si l'avatar est sélectionné
            className={`w-full aspect-square rounded-xl border-4 transition-all duration-200 transform hover:scale-110 ${
              selectedAvatar === avatarUrl
                ? "border-blue-600 shadow-lg scale-110 ring-4 ring-blue-300"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
            }`}
          >
            <img
              src={avatarUrl}
              alt={`Avatar ${index + 1}`}
              className="w-full h-full rounded-lg"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
