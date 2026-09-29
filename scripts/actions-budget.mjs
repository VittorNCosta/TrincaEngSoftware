#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Limite de tempo de runner para este repositorio. A API de faturamento da
// conta exige uma credencial pessoal; GITHUB_TOKEN so consegue ler os jobs.
const LIMIT_MINUTES = Number(process.env.ACTIONS_BUDGET_LIMIT_MINUTES || 2000);
const RESERVE_MINUTES = Number(
  process.env.ACTIONS_BUDGET_RESERVE_MINUTES || 100,
);
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const REPOSITORY = process.env.GITHUB_REPOSITORY;
const NOW = new Date();
const MONTH = NOW.toISOString().slice(0, 7);
const THRESHOLD = Math.floor(LIMIT_MINUTES * 0.9);

function minutesForJob(job, now = NOW) {
  if (!job.started_at) return 0;
  const start = Date.parse(job.started_at);
  const end = job.completed_at ? Date.parse(job.completed_at) : now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new Error(`Horarios invalidos no job ${job.id}`);
  }
  return Math.ceil((end - start) / 60000);
}

function floorForMonth(value, month = MONTH) {
  if (!value) return 0;
  const match = /^(\d{4}-\d{2}):(\d+)$/.exec(value);
  if (!match) throw new Error("ACTIONS_BUDGET_FLOOR deve ser AAAA-MM:minutos");
  return match[1] === month ? Number(match[2]) : 0;
}

async function api(path) {
  const response = await fetch(
    `https://api.github.com/repos/${REPOSITORY}${path}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "trincamania-actions-budget",
      },
    },
  );
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${path}`);
  return response.json();
}

async function measuredMinutes(
  stopAt,
  { request = api, now = NOW, month = MONTH } = {},
) {
  let total = 0;
  // Consultas por dia impedem que um mes com >1.000 runs perca os mais antigos.
  for (let day = now.getUTCDate(); day >= 1; day--) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    for (let page = 1; ; page++) {
      const data = await request(
        `/actions/runs?per_page=100&page=${page}&created=${date}..${date}`,
      );
      if (data.total_count > 1000) {
        throw new Error(`Mais de 1.000 runs em ${date}; contagem incompleta`);
      }
      const runs = data.workflow_runs || [];
      // Limite de concorrencia: uma verificacao nao deve esgotar o rate limit.
      for (let offset = 0; offset < runs.length; offset += 10) {
        const batch = runs.slice(offset, offset + 10);
        const jobs = await Promise.all(
          batch.map(async (run) => {
            const result = await request(
              `/actions/runs/${run.id}/jobs?per_page=100&filter=all`,
            );
            if (result.total_count > 100) {
              throw new Error(
                `Run ${run.id} tem mais de 100 jobs; contagem incompleta`,
              );
            }
            return result.jobs || [];
          }),
        );
        total += jobs
          .flat()
          .reduce((sum, job) => sum + minutesForJob(job, now), 0);
        if (total >= stopAt) return total;
      }
      if (runs.length < 100) break;
    }
  }
  return total;
}

async function main() {
  if (!Number.isSafeInteger(LIMIT_MINUTES) || LIMIT_MINUTES <= 0) {
    throw new Error("Limite mensal invalido");
  }
  if (!Number.isSafeInteger(RESERVE_MINUTES) || RESERVE_MINUTES < 0) {
    throw new Error("Reserva invalida");
  }
  if (!TOKEN || !/^[^/]+\/[^/]+$/.test(REPOSITORY || "")) {
    throw new Error("GH_TOKEN e GITHUB_REPOSITORY sao obrigatorios");
  }
  const floor = floorForMonth(process.env.ACTIONS_BUDGET_FLOOR);
  const stopAt = Math.max(0, THRESHOLD - RESERVE_MINUTES);
  const measured = floor >= stopAt ? 0 : await measuredMinutes(stopAt);
  const used = Math.max(floor, measured);
  const message = `${MONTH}: ${used} min contabilizados (piso informado: ${floor}, reserva: ${RESERVE_MINUTES}, corte: ${THRESHOLD}/${LIMIT_MINUTES})`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `### Orcamento Actions\n\n${message}\n`,
    );
  }
  if (used + RESERVE_MINUTES >= THRESHOLD) {
    throw new Error("Orcamento mensal atingido; jobs pesados bloqueados.");
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export { floorForMonth, measuredMinutes, minutesForJob };
