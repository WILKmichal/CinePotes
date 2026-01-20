import { MockUser } from "./types";

// Props du composant ParticipantList
interface ParticipantListProps {
  users: MockUser[];                    // Tableau des utilisateurs à afficher
  onRemoveUser: (userId: string) => void;  // Fonction callback pour supprimer un utilisateur
}

/**
 * Composant ParticipantList
 * Affiche la liste de tous les participants dans le lobby
 * Chaque participant peut être retiré avec un bouton
 */
export function ParticipantList({ users, onRemoveUser }: ParticipantListProps) {
  // Si aucun participant, affiche un message vide
  if (users.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-xl text-gray-400 dark:text-gray-500">
          Aucun participant pour le moment
        </p>
      </div>
    );
  }

  // Sinon, affiche la grille des participants
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Boucle sur tous les utilisateurs */}
      {users.map((user) => (
        <div
          key={user.id}  // Clé unique pour React
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl p-5 flex items-center gap-4 hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          {/* Avatar de l'utilisateur */}
          <img
            src={user.avatar}
            className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-600 shadow-lg"
          />

          {/* Informations de l'utilisateur */}
          <div className="flex-grow">
            <p className="font-bold text-lg text-gray-900 dark:text-white">
              {user.name}
            </p>
          </div>

          {/* Bouton de suppression */}
          <button
            // Appelle onRemoveUser avec l'ID de cet utilisateur
            onClick={() => onRemoveUser(user.id)}
            className="text-red-600 hover:text-white hover:bg-red-600 dark:hover:bg-red-700 rounded-xl p-3 transition-all duration-200 transform hover:scale-110"
          >
            {/* Icône de poubelle (SVG) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
            <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
