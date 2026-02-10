import { Avatar, Button, Card, EmptyState, Grid } from "@repo/ui";
import { MockUser } from "./types";

// Props du composant ParticipantList
interface ParticipantListProps {
  readonly users: MockUser[];                    // Tableau des utilisateurs à afficher
  readonly onRemoveUser: (userId: string) => void;  // Fonction callback pour supprimer un utilisateur
}

/**
 * Composant ParticipantList
 * Affiche la liste de tous les participants dans le lobby
 * Chaque participant peut être retiré avec un bouton
 */
export function ParticipantList({ users, onRemoveUser }: ParticipantListProps) {
  if (users.length === 0) {
    return <EmptyState message="Aucun participant pour le moment" />;
  }

  return (
    <Grid cols={3} gap={4}>
      {users.map((user) => (
        <Card
          key={user.id}
          variant="bordered"
          padding="sm"
          className="flex items-center gap-4"
        >
          <Avatar
            src={user.avatar}
            alt={`Avatar de ${user.name}`}
            size="lg"
            bordered
          />

          <div className="flex-grow">
            <p className="font-bold text-lg text-gray-900 dark:text-white">
              {user.name}
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => onRemoveUser(user.id)}
            className="rounded-xl p-3"
            aria-label={`Retirer ${user.name}`}
          >
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
          </Button>
        </Card>
      ))}
    </Grid>
  );
}
