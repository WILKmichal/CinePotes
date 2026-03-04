// Interface définissant la structure d'un utilisateur dans le lobby
export interface MockUser {
  id: string;
  name: string;
  avatar: string;
}

// Tableaux contenant 10 avatars prédéfinis avec différents styles
export const AVAILABLE_AVATARS = [
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Destiny&backgroundColor=ffb3ba",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Wyatt&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Aiden&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Christian&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Christopher&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Liam&backgroundColor=c7f0db",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Avery&backgroundColor=a8e6cf",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Jude&backgroundColor=ffc8dd",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Brooklynn&backgroundColor=caffbf",
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sarah&backgroundColor=fdffb6",
];
