import { Grid } from "@repo/ui";
import { AVAILABLE_AVATARS } from "./types";

// Props = propriétés passées au composant par son parent
interface AvatarPickerProps {
  readonly selectedAvatar: string;           // L'avatar actuellement sélectionné
  readonly onSelectAvatar: (avatar: string) => void;  // Fonction callback pour notifier le parent du changement
}

/**
 * Composant AvatarPicker
 * Affiche une grille d'avatars cliquables
 * Permet à l'utilisateur de sélectionner un avatar parmi les options disponibles
 */
export function AvatarPicker({ selectedAvatar, onSelectAvatar }: AvatarPickerProps) {
  return (
    <div>
      <div className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Choisissez votre avatar
      </div>
      <Grid cols={10} gap={3}>
        {AVAILABLE_AVATARS.map((avatarUrl) => (
          <button
            key={avatarUrl}
            type="button"
            onClick={() => onSelectAvatar(avatarUrl)}
            className={`w-full aspect-square rounded-xl border-4 transition-all duration-200 transform hover:scale-110 ${
              selectedAvatar === avatarUrl
                ? "border-blue-600 shadow-lg scale-110 ring-4 ring-blue-300"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
            }`}
            aria-label={`Sélectionner l'avatar ${avatarUrl}`}
          >
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full rounded-lg"
            />
          </button>
        ))}
      </Grid>
    </div>
  );
}
