"use client";

import { Header, Footer } from "@/components/utils";

/**
 * Page A Propos de CinePotes
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-grow flex flex-col items-center px-4 py-24 md:py-32">
        <div className="max-w-6xl w-full space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-6 px-4">
            <h1 className="text-6xl md:text-7xl font-semibold text-gray-900 tracking-tight">
              A propos de CinePotes
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-normal leading-relaxed">
              Une plateforme collaborative pour partager votre passion du cinema avec vos amis
            </p>
          </div>

          {/* Mission Sectio */}
          <div className="bg-white rounded-3xl p-10 md:p-16 shadow-sm">
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
                Notre Mission
              </h2>
              <div className="space-y-5 text-gray-700">
                <p className="text-lg md:text-xl leading-relaxed">
                  CinePotes est ne d'une idee simple : rendre l'experience cinematographique plus sociale
                  et interactive. Nous croyons que regarder des films avec des amis, partager ses opinions
                  et decouvrir de nouvelles oeuvres ensemble enrichit l'experience.
                </p>
                <p className="text-lg md:text-xl leading-relaxed">
                  Notre plateforme vous permet de creer des sessions de visionnage, d'echanger avec vos amis
                  en temps reel, et de construire votre propre bibliotheque de films tout en decouvrant
                  les recommandations de votre communaute.
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid*/}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            <div className="bg-white rounded-3xl p-10 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl">
                  👥
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
                  Sessions Collaboratives
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Creez des lobbies et invitez vos amis pour des sessions de visionnage synchronisees.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl">
                  🎥
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
                  Bibliotheque Complete
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Accedez a une vaste collection de films avec des informations detaillees et des critiques.
                </p>
              </div>
            </div>
          </div>

          {/* Team Section*/}
          <div className="bg-white rounded-3xl p-10 md:p-16 shadow-sm">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-5xl mx-auto">
                🎓
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
                L'Equipe
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                CinePotes est developpe par une equipe de 5 etudiants passionnes de cinema et de developpement web.
                Ce projet est ne dans le cadre de notre formation, avec l'ambition de creer une plateforme
                qui combine nos competences techniques et notre amour du septieme art.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
                <div className="space-y-3">
                  <div className="text-5xl font-semibold text-gray-900">5</div>
                  <div className="text-base text-gray-600">Developpeurs</div>
                </div>
                <div className="space-y-3">
                  <div className="text-5xl font-semibold text-gray-900">1</div>
                  <div className="text-base text-gray-600">Passion Commune</div>
                </div>
                <div className="space-y-3">
                  <div className="text-5xl font-semibold text-gray-900">∞</div>
                  <div className="text-base text-gray-600">Films a Decouvrir</div>
                </div>
                <div className="space-y-3">
                  <div className="text-5xl font-semibold text-gray-900">100%</div>
                  <div className="text-base text-gray-600">Engagement</div>
                </div>
              </div>
            </div>
          </div>

        {/* Films préférés - Grid */}
          <div className="px-4">
            <div className="text-center space-y-8 mb-12">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
                Les films préferés de l'équipe
              </h2>
            </div>

            {/* Grid d'images */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <img
                  src="/courgette.jpg"
                  alt="Ma vie de Courgette"
                  className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold">Ma vie de Courgette</h3>
                    <p className="text-white text-sm font-bold">de Pierre</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <img
                  src="/a night in nude.jpg"
                  alt="A Night in Nude"
                  className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold">A Night in Nude</h3>
                    <p className="text-white text-sm font-bold">de Rémi</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <img
                  src="/sonatine2.jpg"
                  alt="Sonatine"
                  className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold">Sonatine</h3>
                    <p className="text-white text-sm font-bold">de Rémi</p>
                  </div>
                </div>
              </div>

                <div className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <img
                  src="/INTERSTELLAR.jpg"
                  alt="interstellar"
                  className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold">Interstellar</h3>
                    <p className="text-white text-sm font-bold">de Mehdi</p>
                  </div>
                </div>
              </div>

                <div className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <img
                  src="/la-femme-de-menage.jpg"
                  alt="La femme de menage"
                  className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold">La femme de menage</h3>
                    <p className="text-white text-sm font-bold">de Ahmed</p>
                  </div>
                </div>
              </div>

                <div className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <img
                  src="/seven.jpeg"
                  alt="Seven"
                  className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold">Seven</h3>
                    <p className="text-white text-sm font-bold">de Michal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
