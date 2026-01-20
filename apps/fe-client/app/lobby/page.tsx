"use client";

import { useState } from "react";
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
          {/* Header du lobby */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Lobby CinéPotes
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Créez votre session de visionnage avec vos amis
            </p>
          </div>

          {/* Carte du lobby */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl shadow-2xl p-6 md:p-10 space-y-8">
            {/* Info du lobby + Bouton pour ajouter un participant */}
            <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b-2 border-gray-200 dark:border-gray-700 gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Session en cours
                </h2>
                <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                  {lobbyUsers.length} participant{lobbyUsers.length > 1 ? "s" : ""} dans le lobby
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-bold text-white shadow-lg hover:from-blue-500 hover:to-blue-600 transform hover:scale-105 transition-all duration-200"
              >
              {/* Si l formulaire est affiché, propose d'annuler, sinon ajouter */}
                {showAddForm ? "✕ Annuler" : "Ajouter un participant"}
              </button>
            </div>

            {/* Formulaire d'ajout (affiché conditionnellement) */}
            {showAddForm && (
              <SessionForm
                onAddUser={handleAddUser}           // Passe la fonction handleAddUser
                onCancel={() => setShowAddForm(false)}  // Passe une fonction pour fermer le formulaire
              />
            )}

            {/* Liste des participants */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                 Participants
              </h3>
              {/* Composant ParticipantList qui gère l'affichage */}
              <ParticipantList
                users={lobbyUsers}              // Passe la liste des utilisateurs
                onRemoveUser={handleRemoveUser} // Passe la fonction de suppression
              />
            </div>

            {/* Actions du lobby */}
            <div className="pt-8 border-t-2 border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
              <button
                disabled={lobbyUsers.length === 0}
                className="flex-grow rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-5 text-xl font-bold text-white shadow-xl hover:from-blue-500 hover:to-purple-500 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200">
                Commencer la session
              </button>
              <button className="rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-8 py-5 text-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg transform hover:scale-105 transition-all duration-200">
                Partager le lien
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
