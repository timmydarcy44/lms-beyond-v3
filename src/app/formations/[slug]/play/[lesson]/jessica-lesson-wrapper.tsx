"use client";

import { LessonPlayView } from "@/components/apprenant/lesson-play-view";
import type {
  LearnerDetail,
  LearnerFlashcard,
  LearnerLesson,
  LearnerModule,
} from "@/lib/queries/apprenant";

type LessonPlayViewProps = {
  detail: LearnerDetail;
  modules: LearnerModule[];
  activeLesson: LearnerLesson;
  activeModule?: LearnerModule;
  videoSrc?: string | null;
  cardHref: string;
  flashcards: LearnerFlashcard[];
  previousLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  courseId: string;
  courseTitle: string;
};

export function JessicaLessonPlayView(props: LessonPlayViewProps) {
  return (
    <>
      <style jsx global>{`
        /* Styles Jessica Contentin pour l'interface apprenant */
        /* Fond général - beige clair (sauf le sommaire qui doit être blanc) */
        [class*="bg-black"]:not(aside):not(aside *):not(div[class*="space-y-5"]):not(div[class*="space-y-5"] *) {
          background-color: #F8F5F0 !important;
        }
        
        /* Conteneur aside du sommaire - BLANC - PRIORITÉ MAXIMALE */
        aside,
        aside[class*="rounded-3xl"],
        aside[class*="border"],
        aside[class*="bg-black/55"],
        aside[class*="bg-black/80"],
        aside[class*="p-5"],
        aside[class*="shadow-lg"] {
          background-color: #FFFFFF !important;
        }
        
        /* Tous les enfants directs de aside - fond blanc */
        aside > div {
          background-color: #FFFFFF !important;
        }
        
        /* Tous les éléments dans aside - fond blanc SAUF les éléments transparents */
        aside > *:not(div[class*="rounded-2xl"][class*="border"][class*="p-3"]):not(a[class*="rounded-2xl"][class*="border"]:not([class*="bg-gradient-to-r"])) {
          background-color: #FFFFFF !important;
        }
        
        /* Texte général - marron foncé */
        [class*="text-white"] {
          color: #2F2A25 !important;
        }
        
        /* Bordures générales */
        [class*="border-white"] {
          border-color: #E6D9C6 !important;
        }
        
        /* Bordures du sommaire - #E6D9C6 */
        aside[class*="border"],
        aside[class*="border-white/10"],
        aside[class*="border-white/15"] {
          border-color: #E6D9C6 !important;
        }
        
        [class*="bg-white/5"]:not(div[class*="space-y-5"] *),
        [class*="bg-white/10"]:not(div[class*="space-y-5"] *) {
          background-color: rgba(230, 217, 198, 0.1) !important;
        }
        
        /* Couleur ambre/miel remplacée par #E6D9C6 */
        [class*="from-[#FF512F]"],
        [class*="via-[#DD2476]"],
        [class*="to-[#DD2476]"],
        [class*="from-amber"],
        [class*="to-amber"],
        [class*="text-amber"] {
          background: linear-gradient(to right, #E6D9C6, #E6D9C6) !important;
          color: #E6D9C6 !important;
        }
        
        /* Espaces entre paragraphes */
        .prose p {
          margin-top: 1.25em !important;
          margin-bottom: 1.25em !important;
        }
        
        .prose p:first-child {
          margin-top: 0 !important;
        }
        
        .prose p:last-child {
          margin-bottom: 0 !important;
        }
        
        /* Contenu du chapitre - BLANC avec écriture NOIRE */
        div[class*="space-y-6"][class*="rounded-3xl"][class*="border"][class*="bg-black/35"] {
          background-color: #FFFFFF !important;
        }
        
        /* Texte du contenu du chapitre en noir */
        div[class*="space-y-6"][class*="rounded-3xl"][class*="border"][class*="bg-black/35"] h3,
        div[class*="space-y-6"][class*="rounded-3xl"][class*="border"][class*="bg-black/35"] p,
        div[class*="space-y-6"][class*="rounded-3xl"][class*="border"][class*="bg-black/35"] * {
          color: #000000 !important;
        }
        
        /* Prose content en noir */
        .prose,
        .prose * {
          color: #000000 !important;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: #000000 !important;
        }
        
        /* Couleur de l'espace de transformation (#E6D9C6) - section OUTILS IMMÉDIATS */
        div[class*="mt-8"][class*="rounded-3xl"][class*="border"][class*="p-6"] {
          background: #E6D9C6 !important;
          background-image: none !important;
        }
        
        /* Forcer la couleur pour la section OUTILS même avec gradient */
        div[class*="from-[#0f172a]"][class*="via-[#111827]"][class*="to-[#1f2937]"] {
          background: #E6D9C6 !important;
          background-image: none !important;
        }
        
        /* Cibler spécifiquement le gradient de la section OUTILS */
        div[class*="bg-gradient-to-br"][class*="from-[#0f172a]"][class*="via-[#111827]"][class*="to-[#1f2937]"] {
          background: #E6D9C6 !important;
        }
        
        /* Texte de la section OUTILS en noir */
        div[class*="mt-8"][class*="rounded-3xl"][class*="border"][class*="p-6"] p,
        div[class*="mt-8"][class*="rounded-3xl"][class*="border"][class*="p-6"] h3,
        div[class*="mt-8"][class*="rounded-3xl"][class*="border"][class*="p-6"] * {
          color: #000000 !important;
        }
        
        /* Boutons et cartes dans la section OUTILS */
        div[class*="mt-8"][class*="rounded-3xl"][class*="border"][class*="p-6"] button,
        div[class*="mt-8"][class*="rounded-3xl"][class*="border"][class*="p-6"] [class*="rounded-2xl"] {
          border-color: rgba(0, 0, 0, 0.2) !important;
          background-color: rgba(255, 255, 255, 0.5) !important;
          color: #000000 !important;
        }
        
        /* Sommaire sur le côté droit - BLANC avec bordures #E6D9C6 */
        div[class*="space-y-5"] {
          background-color: #FFFFFF !important;
        }
        
        /* Conteneur parent du sommaire (colonne de droite) - BLANC */
        div[class*="lg:grid-cols"] > div:last-child,
        div[class*="grid"][class*="lg:grid-cols"] > div:last-child {
          background-color: #FFFFFF !important;
        }
        
        /* Forcer le fond blanc pour toute la colonne du sommaire */
        aside,
        div[class*="order-2"][class*="lg:order-2"],
        div[class*="lg:col-span-1"]:has(div[class*="space-y-5"]),
        /* Cibler le conteneur qui contient le sommaire */
        div[class*="flex"][class*="flex-col"][class*="gap-6"] > div:last-child,
        div[class*="lg:grid"] > div:last-child {
          background-color: #FFFFFF !important;
        }
        
        /* S'assurer que le fond général ne s'applique pas au sommaire */
        div[class*="space-y-5"] {
          background-color: #FFFFFF !important;
        }
        
        /* Exception : les éléments transparents du sommaire */
        div[class*="space-y-5"] div[class*="rounded-2xl"][class*="border"][class*="p-3"],
        div[class*="space-y-5"] a[class*="rounded-2xl"][class*="border"]:not([class*="bg-gradient-to-r"]) {
          background-color: transparent !important;
        }
        
        /* Forcer le fond blanc pour le conteneur parent du sommaire */
        div[class*="lg:grid-cols"] > div:last-child {
          background-color: #FFFFFF !important;
        }
        
        /* S'assurer que le fond beige ne s'applique pas au sommaire */
        div[class*="space-y-5"],
        div[class*="space-y-5"] > *:not(div[class*="rounded-2xl"][class*="border"][class*="p-3"]):not(a[class*="rounded-2xl"][class*="border"]:not([class*="bg-gradient-to-r"])) {
          background-color: #FFFFFF !important;
        }
        
        /* Cartes du sommaire - TRANSPARENT avec bordures #E6D9C6 */
        div[class*="rounded-2xl"][class*="border"][class*="p-3"] {
          background-color: transparent !important;
          border-color: #E6D9C6 !important;
        }
        
        /* Texte du sommaire en noir */
        div[class*="space-y-5"] p,
        div[class*="space-y-5"] h2,
        div[class*="space-y-5"] span,
        div[class*="space-y-5"] * {
          color: #000000 !important;
        }
        
        /* Couleur du titre "Sommaire" */
        p[class*="uppercase"][class*="tracking"] {
          color: #000000 !important;
        }
        
        /* Couleur du titre du module dans le sommaire */
        h2[class*="text-lg"][class*="font-semibold"] {
          color: #000000 !important;
        }
        
        /* Liens dans le sommaire */
        div[class*="space-y-5"] a {
          color: #000000 !important;
        }
        
        /* Liens dans le sommaire - transparent avec bordure #E6D9C6 */
        div[class*="space-y-5"] a[class*="rounded-2xl"][class*="border"] {
          background-color: transparent !important;
          border-color: #E6D9C6 !important;
          color: #000000 !important;
        }
        
        /* Tous les éléments de liste dans le sommaire - transparent */
        div[class*="space-y-5"] ul li,
        div[class*="space-y-5"] ul li a {
          background-color: transparent !important;
        }
        
        /* Couleur du bouton "Choisir sa stratégie" - blanc avec bordure #E6D9C6 */
        button[class*="border-white/20"][class*="bg-white/5"] {
          background-color: #FFFFFF !important;
          border-color: #E6D9C6 !important;
          color: #000000 !important;
        }
        
        /* Couleur des liens actifs dans le sommaire - utiliser #E6D9C6 */
        a[class*="rounded-2xl"][class*="border"][class*="py-3"][class*="bg-gradient-to-r"],
        a[class*="rounded-2xl"][class*="border"][class*="py-3"]:has([class*="from-[#FF512F]"]) {
          background: #E6D9C6 !important;
          background-image: none !important;
          border-color: #E6D9C6 !important;
          color: #000000 !important;
        }
        
        /* Liens hover dans le sommaire */
        div[class*="space-y-5"] a[class*="rounded-2xl"][class*="border"]:hover {
          background-color: rgba(230, 217, 198, 0.2) !important;
          border-color: #E6D9C6 !important;
        }
        
        /* Items de liste dans le sommaire - transparent avec bordure #E6D9C6 */
        div[class*="space-y-5"] ul[class*="space-y-2"] li a[class*="rounded-2xl"] {
          background-color: transparent !important;
          border-color: #E6D9C6 !important;
        }
        
        /* ============================================
           STYLES POUR LES FLASHCARDS - JESSICA CONTENTIN
           ============================================ */
        
        /* SOLUTION RADICALE : Cibler TOUS les éléments dans le conteneur flashcards */
        /* Conteneur principal - identifier par la structure unique */
        div[class*="space-y-5"][class*="rounded-3xl"][class*="border"][class*="p-6"]:has(div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"]),
        div[class*="space-y-5"][class*="rounded-3xl"][class*="border"][class*="p-6"]:has(p[class*="text-xs"][class*="font-semibold"][class*="uppercase"]:contains("Flashcards intelligentes")) {
          background-color: #2F2A25 !important;
          background-image: none !important;
          border-color: #E6D9C6 !important;
        }
        
        /* FORCER TOUS LES FONDS BLANCS/CLAIRS À #2F2A25 - SÉLECTEURS GLOBAUX */
        /* Cibler TOUS les éléments enfants avec des classes de fond blanc */
        div[class*="space-y-5"][class*="rounded-3xl"] *[class*="bg-white"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[class*="bg-slate-50"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[class*="bg-slate-100"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[class*="bg-white/5"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[class*="bg-white/10"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[class*="bg-white/20"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[class*="bg-gradient-to-br"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[class*="bg-gradient-to-r"] {
          background-color: #2F2A25 !important;
          background-image: none !important;
        }
        
        /* Cibler spécifiquement les divs avec shadow-inner (carte flashcard) */
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="shadow-inner"] {
          background-color: #2F2A25 !important;
          background-image: none !important;
        }
        
        /* Cibler les éléments avec des styles inline de fond blanc */
        div[class*="space-y-5"][class*="rounded-3xl"] *[style*="background-color: white"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[style*="background-color: rgb(255"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[style*="background: white"],
        div[class*="space-y-5"][class*="rounded-3xl"] *[style*="background: rgb(255"] {
          background-color: #2F2A25 !important;
          background: #2F2A25 !important;
        }
        
        /* SOLUTION ULTIME : Cibler TOUS les divs enfants de la carte flashcard */
        /* Sauf les badges et boutons qui doivent garder leur style */
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] > div:not([class*="rounded-full"]):not(button):not([class*="inline-flex"]) {
          background-color: #2F2A25 !important;
          background-image: none !important;
        }
        
        /* Cibler les motion.div et autres éléments React */
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] div[class*="relative"][class*="space-y-4"] {
          background-color: transparent !important;
        }
        
        /* Forcer le fond #2F2A25 pour tous les éléments qui ont un fond clair */
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] * {
          background-color: transparent !important;
        }
        
        /* Exception : garder le fond #2F2A25 pour le conteneur principal */
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] {
          background-color: #2F2A25 !important;
        }
        
        /* FORCER TOUS LES FONDS BLANCS/CLAIRS À #2F2A25 */
        /* Conteneur principal des flashcards */
        div[class*="space-y-5"][class*="rounded-3xl"][class*="border"][class*="p-6"],
        div[class*="space-y-5"][class*="rounded-3xl"][class*="border"][class*="p-6"][class*="bg-white"],
        div[class*="space-y-5"][class*="rounded-3xl"][class*="border"][class*="p-6"][class*="bg-slate-50"],
        div[class*="space-y-5"][class*="rounded-3xl"][class*="border"][class*="p-6"][class*="bg-gradient-to-br"] {
          background-color: #2F2A25 !important;
          background-image: none !important;
          border-color: #E6D9C6 !important;
        }
        
        /* Carte flashcard principale - FORCER #2F2A25 - TOUS LES CAS POSSIBLES */
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"][class*="shadow-inner"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"][class*="bg-white"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"][class*="bg-slate-50"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"][class*="bg-white/5"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"][class*="bg-white/10"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"][class*="bg-gradient-to-br"],
        /* Cibler aussi sans le préfixe space-y-5 */
        div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"][class*="shadow-inner"]:not(aside *):not(div[class*="space-y-5"] *) {
          background-color: #2F2A25 !important;
          background-image: none !important;
          border-color: #E6D9C6 !important;
        }
        
        /* TOUS LES TEXTES EN BLANC - SÉLECTEURS GLOBAUX */
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-slate-800"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-slate-900"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-slate-700"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-slate-600"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-slate-500"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-slate-400"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-black"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-white/50"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-white/60"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-white/70"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-white/80"],
        div[class*="space-y-5"][class*="rounded-3xl"] [class*="text-white/85"] {
          color: #FFFFFF !important;
        }
        
        /* TOUS LES TEXTES EN BLANC */
        div[class*="space-y-5"][class*="rounded-3xl"] p,
        div[class*="space-y-5"][class*="rounded-3xl"] h3,
        div[class*="space-y-5"][class*="rounded-3xl"] span,
        div[class*="space-y-5"][class*="rounded-3xl"] div,
        div[class*="space-y-5"][class*="rounded-3xl"] * {
          color: #FFFFFF !important;
        }
        
        /* Texte principal des flashcards - blanc */
        div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] p,
        div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] p[class*="text-lg"],
        div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] * {
          color: #FFFFFF !important;
        }
        
        /* Badge "Question" / "Réponse" - fond beige avec texte noir */
        div[class*="inline-flex"][class*="items-center"][class*="gap-2"][class*="rounded-full"][class*="px-3"][class*="py-1"][class*="text-[11px]"],
        div[class*="inline-flex"][class*="items-center"][class*="gap-2"][class*="rounded-full"][class*="px-3"][class*="py-1"][class*="bg-white/10"],
        div[class*="inline-flex"][class*="items-center"][class*="gap-2"][class*="rounded-full"][class*="px-3"][class*="py-1"][class*="bg-slate-200"] {
          background-color: #E6D9C6 !important;
          color: #000000 !important;
        }
        
        /* Titre "Flashcards intelligentes" - texte blanc */
        div[class*="space-y-5"][class*="rounded-3xl"] p[class*="text-xs"][class*="font-semibold"][class*="uppercase"],
        div[class*="space-y-5"][class*="rounded-3xl"] p[class*="text-slate-400"],
        div[class*="space-y-5"][class*="rounded-3xl"] p[class*="text-white/60"] {
          color: #FFFFFF !important;
        }
        
        /* Sous-titre "Récapitulatif express" - texte blanc */
        div[class*="space-y-5"][class*="rounded-3xl"] h3,
        div[class*="space-y-5"][class*="rounded-3xl"] h3[class*="text-xl"],
        div[class*="space-y-5"][class*="rounded-3xl"] h3[class*="text-slate-900"],
        div[class*="space-y-5"][class*="rounded-3xl"] h3[class*="text-white"] {
          color: #FFFFFF !important;
        }
        
        /* Compteur de flashcards - texte blanc */
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="flex"][class*="items-center"][class*="gap-2"][class*="text-xs"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="text-slate-500"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="text-white/50"] {
          color: #FFFFFF !important;
        }
        
        /* Boutons des flashcards - bordure beige, fond transparent, texte blanc */
        div[class*="space-y-5"][class*="rounded-3xl"] button,
        div[class*="space-y-5"][class*="rounded-3xl"] button[class*="rounded-full"],
        div[class*="space-y-5"][class*="rounded-3xl"] button[class*="bg-white"],
        div[class*="space-y-5"][class*="rounded-3xl"] button[class*="bg-white/10"],
        div[class*="space-y-5"][class*="rounded-3xl"] button[class*="bg-white/20"],
        div[class*="space-y-5"][class*="rounded-3xl"] button[class*="bg-slate-100"] {
          border-color: #E6D9C6 !important;
          background-color: transparent !important;
          color: #FFFFFF !important;
        }
        
        div[class*="space-y-5"][class*="rounded-3xl"] button:hover,
        div[class*="space-y-5"][class*="rounded-3xl"] button[class*="hover:bg-white/20"],
        div[class*="space-y-5"][class*="rounded-3xl"] button[class*="hover:bg-slate-100"] {
          background-color: #E6D9C6 !important;
          color: #000000 !important;
        }
        
        /* Compteur "Carte X / Y" - texte blanc */
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="text-xs"][class*="uppercase"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="text-slate-400"],
        div[class*="space-y-5"][class*="rounded-3xl"] div[class*="text-white/50"] {
          color: #FFFFFF !important;
        }
        
        /* Tags des flashcards - fond beige clair, texte noir */
        div[class*="space-y-5"][class*="rounded-3xl"] span[class*="rounded-full"][class*="px-3"][class*="py-1"],
        div[class*="space-y-5"][class*="rounded-3xl"] span[class*="bg-white/10"],
        div[class*="space-y-5"][class*="rounded-3xl"] span[class*="bg-slate-200"] {
          background-color: #E6D9C6 !important;
          color: #000000 !important;
          border-color: #E6D9C6 !important;
        }
        
        /* Supprimer les gradients colorés des flashcards */
        div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] div[class*="pointer-events-none"][class*="absolute"][class*="inset-0"][class*="opacity-60"],
        div[class*="rounded-3xl"][class*="border"][class*="px-6"][class*="py-8"] div[class*="bg-[radial-gradient"] {
          display: none !important;
        }
        
        /* Icônes dans les badges - couleur noire */
        div[class*="space-y-5"][class*="rounded-3xl"] svg[class*="h-3.5"][class*="w-3.5"] {
          color: #000000 !important;
        }
        
        /* Icônes dans les boutons et autres - couleur blanche */
        div[class*="space-y-5"][class*="rounded-3xl"] svg[class*="h-4"][class*="w-4"],
        div[class*="space-y-5"][class*="rounded-3xl"] svg:not([class*="h-3.5"]) {
          color: #FFFFFF !important;
        }
        
        /* ============================================
           STYLES POUR LE BOUTON D'ACTIVATION DES FLASHCARDS
           ============================================ */
        
        /* Conteneur du bouton d'activation - fond #2F2A25 avec bordure beige */
        div[class*="space-y-6"]:has(div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"]) {
          background-color: transparent !important;
        }
        
        /* Carte d'activation des flashcards - fond #2F2A25 avec bordure beige */
        div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"][class*="shadow"] {
          background-color: #2F2A25 !important;
          border-color: #E6D9C6 !important;
        }
        
        /* Texte du bouton d'activation - blanc */
        div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"] p,
        div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"] h3,
        div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"] * {
          color: #FFFFFF !important;
        }
        
        /* Bouton d'activation - fond beige avec texte noir */
        div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"] button {
          background-color: #E6D9C6 !important;
          border-color: #E6D9C6 !important;
          color: #000000 !important;
        }
        
        div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"] button:hover {
          background-color: #D4C4A8 !important;
          border-color: #D4C4A8 !important;
        }
        
        /* Supprimer les gradients colorés du bouton d'activation */
        div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"] div[class*="pointer-events-none"][class*="absolute"][class*="inset-0"][class*="opacity-60"] {
          display: none !important;
        }
        
        /* Icône du bouton d'activation - couleur blanche */
        div[class*="relative"][class*="overflow-hidden"][class*="rounded-3xl"][class*="border"][class*="p-8"] svg {
          color: #FFFFFF !important;
        }
        
        /* Cartes d'animation des flashcards - fond #2F2A25 avec bordure beige */
        div[class*="grid"][class*="grid-cols-2"] div[class*="aspect-[3/4]"][class*="rounded-2xl"][class*="border-2"] {
          background-color: #2F2A25 !important;
          border-color: #E6D9C6 !important;
        }
        
        /* Texte des cartes d'animation - blanc */
        div[class*="grid"][class*="grid-cols-2"] div[class*="aspect-[3/4]"] p,
        div[class*="grid"][class*="grid-cols-2"] div[class*="aspect-[3/4]"] svg {
          color: #FFFFFF !important;
        }
      `}</style>
      <div style={{ backgroundColor: "#FFFFFF", minHeight: "100vh" }}>
        <LessonPlayView {...props} />
      </div>
    </>
  );
}

