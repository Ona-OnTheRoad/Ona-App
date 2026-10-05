import { useState } from "react";
import { compressImageFile } from "@/lib/image-compress";
import { ARTISAN_TRADE_CATALOG, tradeDef } from "@/lib/artisan/catalog";
import type { SkillAnswerValue } from "@/lib/skill-questions";
import type { ProService } from "@/lib/types";

/** Exactly one skill + required specialty, plus skill-specific answers. */
export function useSkillSelection() {
  const [skill, setSkill] = useState<ProService | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [skillAnswers, setSkillAnswers] = useState<
    Record<string, SkillAnswerValue>
  >({});

  const selectSkill = (id: ProService, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSkill(id);
    setSpecialty(null);
    setSkillAnswers({});
    // Stay on step 1 until specialty chosen + Next
  };

  const setSkillAnswer = (qid: string, value: SkillAnswerValue) => {
    setSkillAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const toggleMulti = (qid: string, option: string, maxSelect?: number) => {
    setSkillAnswers((prev) => {
      const cur = Array.isArray(prev[qid]) ? [...(prev[qid] as string[])] : [];
      if (cur.includes(option)) {
        return { ...prev, [qid]: cur.filter((x) => x !== option) };
      }
      if (maxSelect != null && cur.length >= maxSelect) {
        return prev; // already at max (e.g. 3 specialties)
      }
      return { ...prev, [qid]: [...cur, option] };
    });
  };

  const onCertFile = (qid: string, file: File | null) => {
    if (!file) {
      setSkillAnswers((prev) => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
      return;
    }
    // Compress images so vulcanizer/pro signup does not hit body-size limits
    void (async () => {
      try {
        const isImage = (file.type || "").startsWith("image/");
        const dataUrl = isImage
          ? await compressImageFile(file, { maxEdge: 1280, quality: 0.72 })
          : await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result ?? ""));
              reader.onerror = () => reject(new Error("read failed"));
              reader.readAsDataURL(file);
            });
        // PDF or still-huge: store name only; server keeps signup working
        if (!isImage && dataUrl.length > 350_000) {
          setSkillAnswer(qid, {
            name: file.name,
            mime: file.type || "application/pdf",
          });
          return;
        }
        setSkillAnswer(qid, {
          name: file.name,
          dataUrl,
          mime: file.type || "application/octet-stream",
        });
      } catch {
        setSkillAnswer(qid, {
          name: file.name,
          mime: file.type || "application/octet-stream",
        });
      }
    })();
  };

  const specialtyOptions = skill
    ? tradeDef(skill)?.specialties ||
      ARTISAN_TRADE_CATALOG.find((t) => t.service === skill)?.specialties ||
      []
    : [];

  return {
    skill,
    specialty,
    setSpecialty,
    skillAnswers,
    selectSkill,
    setSkillAnswer,
    toggleMulti,
    onCertFile,
    specialtyOptions,
  };
}

export type SkillSelection = ReturnType<typeof useSkillSelection>;
