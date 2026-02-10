import { useState } from "react";
import { Button, Card, Input } from "@repo/ui";
import { AvatarPicker } from "./AvatarPicker";
import { AVAILABLE_AVATARS, MockUser } from "./types";

// Props du composant SessionForm
interface SessionFormProps {
  readonly onAddUser: (user: MockUser) => void;  // Fonction callback pour ajouter un utilisateur
  readonly onCancel: () => void;                 // Fonction callback pour annuler
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
    <Card variant="gradient" padding="md" className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
        Nouveau participant
      </h3>

      <Input
        label="Nom du participant"
        type="text"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        placeholder="Entrez un nom..."
        maxLength={20}
      />

      <AvatarPicker
        selectedAvatar={selectedAvatar}
        onSelectAvatar={setSelectedAvatar}
      />

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={userName.trim() === ""}
          size="lg"
          className="flex-grow bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500"
        >
          ✓ Ajouter au lobby
        </Button>
        <Button
          onClick={onCancel}
          variant="secondary"
          size="lg"
        >
          ✕
        </Button>
      </div>
    </Card>
  );
}
