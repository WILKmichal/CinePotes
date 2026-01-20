"use client";

import { useState } from "react";
import { Button, Card, Badge } from "@repo/ui";
import { Header, Footer } from "@/components/utils";
import { SessionForm } from "@/components/lobby/SessionForm";
import { ParticipantList } from "@/components/lobby/ParticipantList";
import { MockUser } from "@/components/lobby/types";

/**
 * Page principale du Lobby
 * Gère l'état global de la liste des participants
 */
export default function LobbyPage() {
  // État pour la liste des utilisateurs dans le lobby
  const [lobbyUsers, setLobbyUsers] = useState<MockUser[]>([]);
  // État pour afficher ou masquer le formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false);

  /**
   * Fonction pour ajouter un nouvel utilisateur au lobby
   * Cette fonction est passée au composant SessionForm via les props
   */
  const handleAddUser = (newUser: MockUser) => {
    // Ajoute le nouvel utilisateur à la liste existante
    setLobbyUsers([...lobbyUsers, newUser]);
    // Cache le formulaire après l'ajou t
    setShowAddForm(false);
  };

  /**
   * Fonction pour supprimer un utilisateur du lobby
   * Cette fonction est passée au composant ParticipantList via les props
   */
  const handleRemoveUser = (userId: string) => {
    // Filtre le tableau pour garder tous les users sauf celui avec cet ID
    setLobbyUsers(lobbyUsers.filter((user) => user.id !== userId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      <main className="flex-grow flex flex-col items-center px-4 py-24 md:py-32">
        <div className="max-w-6xl w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Lobby CinéPotes
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Invitez vos amis et commencez une session pour choisir le film de ce soir ! 
            </p>
          </div>

          <Card variant="default" padding="lg" className="space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b-2 border-gray-200 dark:border-gray-700 gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Session en cours
                </h2>
                <div className="flex items-center gap-2 mt-1 justify-center md:justify-start">
                  <p className="text-base text-gray-500 dark:text-gray-400">
                    {lobbyUsers.length} participant{lobbyUsers.length > 1 ? "s" : ""} dans le lobby
                  </p>
                  {lobbyUsers.length > 0 && (
                    <Badge variant="primary">{lobbyUsers.length}</Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant="primary"
                size="lg"
              >
                {showAddForm ? "Annuler" : "Ajouter un participant"}
              </Button>
            </div>

            {showAddForm && (
              <SessionForm
                onAddUser={handleAddUser}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Participants
              </h3>
              <ParticipantList
                users={lobbyUsers}
                onRemoveUser={handleRemoveUser}
              />
            </div>

            <div className="pt-8 border-t-2 border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
              <Button
                disabled={lobbyUsers.length === 0}
                variant="gradient"
                size="lg"
                fullWidth
                className="flex-grow"
              >
              Commencer la session
              </Button>
              <Button
                variant="secondary"
                size="lg"
              >
              Partager le lien
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
