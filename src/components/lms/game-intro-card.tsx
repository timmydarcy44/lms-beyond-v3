"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cleanGameTitle, parseDurationMin, type GameMeta } from "@/lib/lms/presentation";
import { LmsScreen } from "./lms-screen";

export type LastPlay = {
  situationsOk: number;
  situations: number;
};

const SKILL_COLORS = ["#f5c542", "#5edcc3", "#ff8fab", "#8eb6ff"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "•";
}

export function GameIntroCard({
  lessonTitle,
  chapterTitle,
  durationLabel,
  meta,
  blockId,
  lastPlay,
  onStart,
  laterHref,
}: {
  lessonTitle?: string | null;
  chapterTitle?: string | null;
  durationLabel?: string | null;
  meta?: GameMeta | null;
  blockId?: string;
  lastPlay?: LastPlay | null;
  onStart: () => void;
  laterHref?: string | null;
}) {
  const [remotePlay, setRemotePlay] = useState<LastPlay | null>(null);

  useEffect(() => {
    if (lastPlay !== undefined || !blockId) return;
    let ignore = false;
    fetch(`/api/serious-games/last?blockId=${encodeURIComponent(blockId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { played?: boolean; situationsOk?: number; situations?: number } | null) => {
        if (ignore || !payload?.played) return;
        if (typeof payload.situationsOk === "number" && typeof payload.situations === "number" && payload.situations > 0) {
          setRemotePlay({ situationsOk: payload.situationsOk, situations: payload.situations });
        } else {
          setRemotePlay({ situationsOk: 0, situations: 0 });
        }
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [blockId, lastPlay]);

  const play = lastPlay === undefined ? remotePlay : lastPlay;
  const played = Boolean(play);
  const title = cleanGameTitle(meta?.title || lessonTitle, chapterTitle);
  const minutes = meta?.duration_min || parseDurationMin(durationLabel);
  const steps = meta?.steps_count && meta.steps_count > 0 ? meta.steps_count : null;
  const skills = (meta?.skills ?? []).map((skill) => skill.trim()).filter(Boolean);
  const character = meta?.character?.name?.trim() ? meta.character : null;
  const hook =
    meta?.hook?.trim() ||
    "Tu vas mettre en pratique ce que tu viens de voir. Chaque situation te demande un choix.";
  const opening = meta?.opening?.trim() || hook;
  const cover = meta?.cover_url?.trim() || "";
  const attempts =
    meta?.max_attempts && meta.max_attempts > 0
      ? `${meta.max_attempts} essai${meta.max_attempts > 1 ? "s" : ""}`
      : "Libre";
  const attemptHint = meta?.max_attempts && meta.max_attempts > 0 ? "essais possibles" : "tu peux recommencer";

  return (
    <LmsScreen>
      <article className="game-intro">
        <div className="game-intro__copy">
          <span className="game-intro__pill">
            🎮 Mise en pratique{minutes ? ` · environ ${minutes} min` : ""}
          </span>
          <h2>{title}</h2>
          <p className="game-intro__hook">{hook}</p>
          {skills.length ? (
            <ul className="game-intro__skills">
              {skills.map((skill, index) => (
                <li key={skill}>
                  <i style={{ background: SKILL_COLORS[index % SKILL_COLORS.length] }} />
                  {skill}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="game-intro__stats">
            {steps ? (
              <div>
                <strong>{steps}</strong>
                <span>{steps > 1 ? "situations" : "situation"}</span>
              </div>
            ) : null}
            {skills.length ? (
              <div>
                <strong>{skills.length}</strong>
                <span>{skills.length > 1 ? "notions à repérer" : "notion à repérer"}</span>
              </div>
            ) : null}
            <div>
              <strong>{attempts}</strong>
              <span>{attemptHint}</span>
            </div>
          </div>
          {played && play && play.situations > 0 ? (
            <p className="game-intro__last">
              Dernière partie : {play.situationsOk} / {play.situations} situations réussies
            </p>
          ) : played ? (
            <p className="game-intro__last">Dernière partie enregistrée</p>
          ) : null}
        </div>
        <div className="game-intro__scene">
          {character ? (
            <>
              {character.intro_line ? <div className="game-intro__bubble">« {character.intro_line} »</div> : null}
              <div className="game-intro__person">
                <span className="game-intro__avatar">
                  {character.avatar ? <img src={character.avatar} alt="" /> : initials(character.name || "")}
                </span>
                <div>
                  <strong>{character.name}</strong>
                  {character.role ? <small>{character.role}</small> : null}
                </div>
              </div>
              <div className="game-intro__situation">
                <small>
                  Situation 1{steps ? ` / ${steps}` : ""}
                </small>
                <p>{opening}</p>
                <div className="game-intro__bars" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </>
          ) : (
            <div
              className="game-intro__cover"
              style={cover ? { backgroundImage: `linear-gradient(180deg, transparent, rgba(20,16,40,.45)), url(${cover})` } : undefined}
            >
              <strong>{title}</strong>
            </div>
          )}
        </div>
        <div className="game-intro__actions">
          <button type="button" className="game-intro__go" onClick={onStart}>
            ▶ {played ? "Rejouer" : "C’est parti"}
          </button>
          {laterHref ? (
            <Link className="game-intro__later" href={laterHref}>
              Faire plus tard
            </Link>
          ) : null}
        </div>
      </article>
    </LmsScreen>
  );
}
