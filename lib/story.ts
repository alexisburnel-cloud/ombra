export type StoryChapter = {
  start: number;
  end: number;
  eyebrow: string;
  title: string;
};

export const STORY_CHAPTERS: StoryChapter[] = [
  { start: 1, end: 75, eyebrow: "Carène — depuis 1979", title: "Créateur de\nlieux de vie." },
  { start: 75, end: 175, eyebrow: "Plans", title: "L'idée\ndevient plan." },
  { start: 175, end: 325, eyebrow: "Fondations", title: "Le plan\ndevient structure." },
  { start: 325, end: 450, eyebrow: "Structure", title: "La structure\nprend vie." },
  { start: 450, end: 575, eyebrow: "Enveloppe", title: "La matière\ns'assemble." },
  { start: 575, end: 600, eyebrow: "Lieu de vie", title: "Bienvenue\nchez vous." },
];
