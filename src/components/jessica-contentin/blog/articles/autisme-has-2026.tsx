import Link from "next/link";
import { programmePresentationHref } from "@/lib/jessica-contentin/programmes-catalog";
import {
  BlogBlockquote,
  BlogCta,
  BlogH2,
  BlogH3,
  BlogLi,
  BlogOl,
  BlogP,
  JessicaBlogProse as BlogProse,
  BlogTable,
  BlogUl,
} from "@/components/jessica-contentin/blog/jessica-blog-prose";

const CONSULTATIONS_HREF = "/jessica-contentin/consultations";

export function AutismeHas2026Article() {
  return (
    <BlogProse>
      <BlogP>
        En février 2026, la Haute Autorité de Santé (HAS) a publié ses nouvelles Recommandations de Bonnes
        Pratiques (RBP) concernant le trouble du spectre de l&apos;autisme (TSA) chez le nourrisson, l&apos;enfant et
        l&apos;adolescent. Il s&apos;agit de la première actualisation majeure depuis 14 ans.
      </BlogP>
      <BlogP>
        Pour les parents, enseignants et professionnels de l&apos;accompagnement, ce texte officiel redéfinit
        profondément le parcours de soins, l&apos;inclusion scolaire et la place de l&apos;intervention précoce en
        France.
      </BlogP>

      <BlogH2 id="pourquoi-mise-a-jour-has-2026">1. Pourquoi une mise à jour des recommandations de la HAS en 2026 ?</BlogH2>
      <BlogP>
        Les précédentes recommandations officielles remontaient à 2012. En quatorze ans, l&apos;avancée de la
        recherche et l&apos;évolution des politiques publiques ont rendu cette réactualisation indispensable :
      </BlogP>
      <BlogUl>
        <BlogLi>
          <strong>L&apos;évolution des classifications :</strong> Le terme générique de « troubles envahissants du
          développement » (TED) a définitivement laissé la place à celui de{" "}
          <strong>Trouble du Spectre de l&apos;Autisme (TSA)</strong>, traduisant la grande diversité des profils.
        </BlogLi>
        <BlogLi>
          <strong>Les neurosciences et les comorbidités :</strong> Les connaissances scientifiques se sont affinées,
          notamment concernant les particularités sensorielles et les troubles associés (comme le TDAH, l&apos;anxiété
          ou l&apos;épilepsie).
        </BlogLi>
        <BlogLi>
          <strong>La structuration des parcours :</strong> Le déploiement des Plateformes de Coordination et
          d&apos;Orientation (PCO) a profondément modifié l&apos;accès aux bilans et aux interventions de terrain.
        </BlogLi>
      </BlogUl>
      <BlogBlockquote cite="https://www.has-sante.fr/">
        « L&apos;objectif est d&apos;améliorer et d&apos;harmoniser les modes d&apos;accompagnement et les pratiques de
        soins proposés aux enfants autistes afin de favoriser leur développement et leurs apprentissages. »
        <footer className="mt-4 not-italic text-sm text-[#7A6F62]">
          — <cite>Haute Autorité de Santé</cite>, Communiqué officiel du 12 février 2026
        </footer>
      </BlogBlockquote>

      <BlogH2 id="qu-est-ce-que-le-tsa">2. Qu&apos;est-ce que le Trouble du Spectre de l&apos;Autisme (TSA) ?</BlogH2>
      <BlogP>
        Le trouble du spectre de l&apos;autisme est un <strong>trouble du neurodéveloppement (TND)</strong>. Bien que
        les profils soient d&apos;une immense hétérogénéité, le diagnostic repose sur deux dimensions principales (la
        dyade autistique) :
      </BlogP>
      <BlogOl>
        <BlogLi>
          <strong>Des particularités dans la communication</strong> et les interactions sociales.
        </BlogLi>
        <BlogLi>
          <strong>Des intérêts restreints</strong> ou des comportements répétitifs, très souvent associés à des
          hypersensibilités ou hyposensibilités sensorielles.
        </BlogLi>
      </BlogOl>
      <BlogP>
        En France, le TSA concerne entre 1 et 2&nbsp;% de la population, ce qui représente entre 600&nbsp;000 et
        1&nbsp;200&nbsp;000 personnes.
      </BlogP>

      <BlogH2 id="intervention-precoce">3. L&apos;intervention précoce : agir avant le diagnostic formel</BlogH2>
      <BlogP>
        C&apos;est le message central de la HAS en 2026 :{" "}
        <strong>il ne faut plus attendre un diagnostic officiel pour mettre en place un accompagnement</strong>.
      </BlogP>
      <BlogP>
        Grâce à la plasticité cérébrale, les interventions initiées dès les premiers signes d&apos;alerte (parfois dès
        les premiers mois de vie du nourrisson) maximisent le développement des habiletés sociales, de la communication
        et de l&apos;autonomie, évitant ainsi que les difficultés cognitives ou comportementales ne se cristallisent.
      </BlogP>
      <BlogP>
        La HAS préconise une réévaluation des effets de ces interventions au moins une fois par an en étroite
        collaboration avec les familles.
      </BlogP>

      <BlogH2 id="interventions-recommandees">4. Quelles sont les interventions recommandées et rejetées par la HAS ?</BlogH2>
      <BlogP>
        Le texte de 2026 opère un tri strict basé sur les données de la science contemporaine. Il liste précisément les
        approches validées et celles qui doivent être abandonnées.
      </BlogP>

      <BlogH3>Interventions recommandées (validées scientifiquement)</BlogH3>
      <BlogP>
        Les approches recommandées sont de nature comportementale et développementale. Elles ciblent plusieurs domaines
        fonctionnels :
      </BlogP>
      <BlogUl>
        <BlogLi>La communication (y compris la communication augmentative et alternative — CAA).</BlogLi>
        <BlogLi>Les habiletés sociales et l&apos;interaction avec les pairs.</BlogLi>
        <BlogLi>La régulation cognitive et sensorielle.</BlogLi>
        <BlogLi>L&apos;activité physique adaptée (pour ses bénéfices sur la qualité de vie).</BlogLi>
        <BlogLi>L&apos;usage pertinent des outils numériques et de la téléexpertise.</BlogLi>
      </BlogUl>

      <BlogH3>Interventions non recommandées (preuves insuffisantes ou contre-indiquées)</BlogH3>
      <BlogP>
        Certaines méthodes présentent une absence d&apos;efficacité démontrée ou des risques de dérives. Elles doivent
        être définitivement écartées :
      </BlogP>
      <BlogUl>
        <BlogLi>
          <strong>La psychanalyse appliquée au TSA</strong> (non recommandée).
        </BlogLi>
        <BlogLi>
          <strong>Le Packing</strong> (explicitement contre-indiqué).
        </BlogLi>
        <BlogLi>
          <strong>Les méthodes Doman-Delacato et Padovan</strong> (preuves insuffisantes).
        </BlogLi>
        <BlogLi>
          <strong>Les approches Son-Rise / 3i</strong> (efficacité non démontrée).
        </BlogLi>
        <BlogLi>
          <strong>Le Neurofeedback et la méthode Tomatis</strong> (preuves insuffisantes dans le cadre du TSA).
        </BlogLi>
      </BlogUl>

      <BlogH2 id="famille-fratrie">5. La famille et la fratrie au cœur du dispositif</BlogH2>
      <BlogP>
        Les recommandations marquent un virage historique en reconnaissant l&apos;
        <strong>expertise d&apos;usage</strong> des familles. Les parents ne sont plus de simples spectateurs ou des
        informateurs, mais de véritables co-constructeurs du projet d&apos;accompagnement.
      </BlogP>
      <BlogP>
        Le texte met également en garde contre l&apos;épuisement des aidants, reconnu comme un facteur de risque majeur,
        et appelle à un soutien renforcé des familles (formation, guidance parentale). Pour aller plus loin dans la
        gestion du quotidien, vous pouvez découvrir des clés concrètes pour{" "}
        <Link
          href={programmePresentationHref("tdah-tsa-troubles-dys-haut-potentiel")}
          className="font-medium text-[#8B6914] underline underline-offset-4 transition hover:text-[#C6A664]"
        >
          comprendre et apaiser les tensions sans conflit à la maison
        </Link>
        .
      </BlogP>

      <BlogH2 id="scolarisation-inclusion">6. Scolarisation et inclusion : vers l&apos;autodétermination de l&apos;enfant</BlogH2>
      <BlogP>
        Le droit à une scolarité adaptée est réaffirmé, mais la HAS insiste sur le fait que l&apos;inclusion doit être
        réelle et durable, et non simplement administrative.
      </BlogP>
      <BlogP>
        Cela passe par l&apos;aménagement sensoriel et organisationnel des classes, une coordination étroite entre
        l&apos;école et les professionnels de santé, et surtout par le respect de l&apos;
        <strong>autodétermination</strong>. Ce concept clé signifie qu&apos;il faut donner la parole à l&apos;enfant,
        respecter ses choix et s&apos;appuyer sur ses compétences cognitives spécifiques plutôt que de chercher à calquer
        un modèle standardisé.
      </BlogP>

      <BlogH2 id="role-pco">7. Le rôle pivot des Plateformes de Coordination et d&apos;Orientation (PCO)</BlogH2>
      <BlogP>
        Pour les familles, les PCO (comme la PCO TND du Calvados) constituent la porte d&apos;entrée unique. Elles
        permettent de :
      </BlogP>
      <BlogUl>
        <BlogLi>
          Déclencher un forfait d&apos;intervention précoce pour financer les bilans et suivis en libéral
          (ergothérapie, psychomotricité, psychologie/psychopédagogie).
        </BlogLi>
        <BlogLi>
          Garantir une approche transdisciplinaire et coordonnée, essentielle pour structurer l&apos;environnement de
          l&apos;enfant.
        </BlogLi>
      </BlogUl>

      <BlogH2 id="synthese-2012-2026">8. Synthèse : Qu&apos;est-ce qui change concrètement par rapport à 2012 ?</BlogH2>
      <BlogP>
        Pour comprendre l&apos;évolution de la prise en charge en un coup d&apos;œil, voici le tableau comparatif des
        deux doctrines :
      </BlogP>
      <BlogTable>
        <thead>
          <tr className="bg-[#F3E8D8]">
            <th scope="col" className="border-b border-[#E6D9C6] px-4 py-3 font-semibold text-[#2F2A25]">
              Critères d&apos;accompagnement
            </th>
            <th scope="col" className="border-b border-[#E6D9C6] px-4 py-3 font-semibold text-[#2F2A25]">
              Doctrine HAS 2012
            </th>
            <th scope="col" className="border-b border-[#E6D9C6] px-4 py-3 font-semibold text-[#2F2A25]">
              Nouvelles Recommandations 2026
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#E6D9C6]/80">
            <th scope="row" className="px-4 py-3 font-semibold text-[#2F2A25]">
              Public cible
            </th>
            <td className="px-4 py-3 text-[#4A4339]">Enfants et adolescents</td>
            <td className="px-4 py-3 text-[#4A4339]">
              Inclusion explicite des <strong>nourrissons</strong> dès les premiers signes
            </td>
          </tr>
          <tr className="border-b border-[#E6D9C6]/80 bg-[#FFFCF9]">
            <th scope="row" className="px-4 py-3 font-semibold text-[#2F2A25]">
              Pratiques exclues
            </th>
            <td className="px-4 py-3 text-[#4A4339]">Psychanalyse, Packing</td>
            <td className="px-4 py-3 text-[#4A4339]">
              Liste élargie (Tomatis, Padovan, Neurofeedback…)
            </td>
          </tr>
          <tr className="border-b border-[#E6D9C6]/80">
            <th scope="row" className="px-4 py-3 font-semibold text-[#2F2A25]">
              Rôle de l&apos;enfant
            </th>
            <td className="px-4 py-3 text-[#4A4339]">Sujet de soins et de rééducation</td>
            <td className="px-4 py-3 text-[#4A4339]">
              Acteur de son parcours (<strong>Autodétermination</strong>)
            </td>
          </tr>
          <tr className="border-b border-[#E6D9C6]/80 bg-[#FFFCF9]">
            <th scope="row" className="px-4 py-3 font-semibold text-[#2F2A25]">
              Place de la technologie
            </th>
            <td className="px-4 py-3 text-[#4A4339]">Peu mentionnée</td>
            <td className="px-4 py-3 text-[#4A4339]">
              Intégration encadrée du <strong>numérique</strong> (outils de CAA)
            </td>
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-semibold text-[#2F2A25]">
              Approche éducative
            </th>
            <td className="px-4 py-3 text-[#4A4339]">Focus scolaire classique</td>
            <td className="px-4 py-3 text-[#4A4339]">
              Focus sur les <strong>fonctions exécutives</strong> et la sensorialité
            </td>
          </tr>
        </tbody>
      </BlogTable>

      <BlogH3>💡 L&apos;éclairage de Jessica : Fonctions exécutives et stratégies d&apos;apprentissage</BlogH3>
      <BlogBlockquote>
        « En tant que psychopédagogue spécialisée en neuroéducation à Bretteville-sur-Odon (Caen), je constate chaque
        jour l&apos;importance de ce changement de paradigme. L&apos;autisme n&apos;est pas une maladie à guérir, mais
        une structure cognitive singulière à accompagner.
        <br />
        <br />
        L&apos;accent mis par la HAS en 2026 sur l&apos;autodétermination et les interventions développementales
        valide directement notre travail sur le terrain. En aidant l&apos;enfant ou l&apos;adolescent TSA à comprendre
        son propre fonctionnement, en travaillant sur la flexibilité cognitive, la planification et la régulation
        émotionnelle, nous lui donnons des clés concrètes pour s&apos;épanouir à l&apos;école. Si vous ressentez le
        besoin de soulager la charge cognitive de votre adolescent, vous pouvez consulter nos outils pour{" "}
        <Link
          href={programmePresentationHref("comprendre-son-fonctionnement")}
          className="font-medium text-[#8B6914] underline underline-offset-4 not-italic transition hover:text-[#C6A664]"
        >
          apaiser le mental et surmonter les blocages
        </Link>
        . »
        <footer className="mt-4 not-italic text-sm font-semibold text-[#2F2A25]">
          — Jessica Contentin, Cabinet de psychopédagogie (Calvados)
        </footer>
      </BlogBlockquote>

      <BlogH2 id="sources">Sources et liens officiels (E-E-A-T)</BlogH2>
      <BlogUl>
        <BlogLi>
          <a
            href="https://www.has-sante.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#8B6914] underline underline-offset-4 hover:text-[#C6A664]"
          >
            Communiqué officiel de la HAS (Février 2026)
          </a>{" "}
          – Haute Autorité de Santé.
        </BlogLi>
        <BlogLi>
          <a
            href="https://www.has-sante.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#8B6914] underline underline-offset-4 hover:text-[#C6A664]"
          >
            Recommandations de Bonnes Pratiques : TSA et TND 2026
          </a>{" "}
          – Outils de cadrage légal.
        </BlogLi>
        <BlogLi>Centre de Ressources Autisme (CRA) Normandie &amp; Plateformes PCO du Calvados.</BlogLi>
      </BlogUl>

      <BlogCta href={CONSULTATIONS_HREF}>
        Un doute sur le fonctionnement cognitif de votre enfant ? Besoin de mettre en place des stratégies
        d&apos;apprentissage adaptées à son profil unique ? Contactez le cabinet à Bretteville-sur-Odon pour échanger
        ou réaliser un bilan psychopédagogique.
      </BlogCta>
    </BlogProse>
  );
}
