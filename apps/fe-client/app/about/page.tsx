"use client";

import { Grid, Section, FeatureCard, StatCard, MovieCard } from "@repo/ui";
import { Header, Footer } from "@/components/utils";

const favoriteMovies = [
  { imageSrc: "/courgette.jpg", title: "Ma vie de Courgette", author: "Pierre" },
  { imageSrc: "/a night in nude.jpg", title: "A Night in Nude", author: "Rémi" },
  { imageSrc: "/sonatine2.jpg", title: "Sonatine", author: "Rémi" },
  { imageSrc: "/INTERSTELLAR.jpg", title: "Interstellar", author: "Mehdi", alt: "interstellar" },
  { imageSrc: "/la-femme-de-menage.jpg", title: "La femme de menage", author: "Ahmed" },
  { imageSrc: "/seven.jpeg", title: "Seven", author: "Michal" },
];

/**
 * Page A Propos de CinePotes blabla
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-grow flex flex-col items-center px-4 py-24 md:py-32">
        <div className="max-w-6xl w-full space-y-16">
          <div className="text-center space-y-6 px-4">
            <h1 className="text-6xl md:text-7xl font-semibold text-gray-900 tracking-tight">
              A propos de CinePotes
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-normal leading-relaxed">
              Une plateforme collaborative pour partager votre passion du cinema avec vos amis
            </p>
          </div>
    
          <Section>
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
          </Section>

          <Grid cols={2} gap={4} className="px-4">
            <FeatureCard
              icon="👥"
              title="Sessions Collaboratives"
              description="Creez des lobbies et invitez vos amis pour des sessions de visionnage synchronisees."
            />
            <FeatureCard
              icon="🎥"
              title="Bibliotheque Complete"
              description="Accedez a une vaste collection de films avec des informations detaillees et des critiques."
            />
          </Grid>

          <Section>
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

              <Grid cols={4} gap={4} className="pt-12">
                <StatCard value="5" label="Developpeurs" />
                <StatCard value="1" label="Passion Commune" />
                <StatCard value="∞" label="Films a Decouvrir" />
                <StatCard value="100%" label="Engagement" />
              </Grid>
            </div>
          </Section>

          <div className="px-4">
            <div className="text-center space-y-8 mb-12">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
                Les films préferés de l'équipe
              </h2>
            </div>

            <Grid cols={3} gap={6}>
              {favoriteMovies.map((movie) => (
                <MovieCard
                  key={movie.title}
                  imageSrc={movie.imageSrc}
                  title={movie.title}
                  author={movie.author}
                  alt={movie.alt}
                />
              ))}
            </Grid>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
