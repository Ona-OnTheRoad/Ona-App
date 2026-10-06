/**
 * Parses the composed `job.problem` blob into readable Q&A rows.
 *
 * Two formats are produced by the question-flow composers:
 * 1. "Inline" (solar / generator / painter / carpenter):
 * `Solar work: {start label} ({start question})` then `{question} {answer}`
 * on one line, plus `Location: X` / `Extra: X` labeled lines.
 * 2. "Alternating" (mechanic / vulcanizer / tow / battery / ac / body /
 * electrical / diagnostics / fashion / plumber): every question line is
 * immediately followed by its answer on the next line.
 */

export interface JobProblemRow {
  label: string;
  answer: string;
}

export interface ParsedJobProblem {
  summary: string | null;
  rows: JobProblemRow[];
  notes: string[];
}

const F2_SUMMARY = /^(?:[A-Za-z /]+ work|Work needed):\s*(.+?)\s*\((.*)\)$/i;
const LABELED_LINE =
  /^(Location \/ landmark|Location|Extra detail|Extra|Service|Vehicle):\s*(.+)$/i;

function isQuestionLine(line: string): boolean {
  return line.endsWith("?");
}

function pairAlternatingLines(lines: string[]): {
  rows: JobProblemRow[];
  notes: string[];
} {
  const rows: JobProblemRow[] = [];
  const notes: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const labeled = line.match(LABELED_LINE);
    if (labeled) {
      rows.push({ label: labeled[1], answer: labeled[2].trim() });
      i += 1;
      continue;
    }
    const qi = line.lastIndexOf("?");
    if (qi >= 0 && qi < line.length - 1) {
      rows.push({
        label: line.slice(0, qi + 1).trim(),
        answer: line.slice(qi + 1).trim(),
      });
      i += 1;
      continue;
    }
    const next = lines[i + 1];
    const nextIsAnswer =
      Boolean(next) && !isQuestionLine(next) && !LABELED_LINE.test(next);
    if (nextIsAnswer) {
      rows.push({ label: line, answer: next });
      i += 2;
      continue;
    }
    notes.push(line);
    i += 1;
  }
  return { rows, notes };
}

export function parseJobProblem(problem: string): ParsedJobProblem {
  const lines = (problem || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let summary: string | null = null;
  if (lines.some((l) => F2_SUMMARY.test(l))) {
    // Inline format: leading summary + one-line "question answer" rows.
    const rows: JobProblemRow[] = [];
    const notes: string[] = [];
    let pending: string | null = null;
    for (const line of lines) {
      const m = line.match(F2_SUMMARY);
      if (m) {
        summary = m[1].trim();
        continue;
      }
      const labeled = line.match(LABELED_LINE);
      if (labeled) {
        rows.push({ label: labeled[1], answer: labeled[2].trim() });
        pending = null;
        continue;
      }
      const qi = line.lastIndexOf("?");
      if (qi >= 0) {
        const question = line.slice(0, qi + 1).trim();
        const answer = line.slice(qi + 1).trim();
        if (answer) {
          rows.push({ label: question, answer });
          pending = null;
        } else {
          pending = question;
        }
      } else if (pending) {
        rows.push({ label: pending, answer: line });
        pending = null;
      } else {
        notes.push(line);
      }
    }
    if (pending) notes.push(pending);
    return { summary, rows, notes };
  }

  // Alternating format: labeled lines stand alone; each question pairs
  // with the following answer. A leading "Vehicle: …" must not shift
  // every pair one line off.
  const paired = pairAlternatingLines(lines);
  return { summary, rows: paired.rows, notes: paired.notes };
}
