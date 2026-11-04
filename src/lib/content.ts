import memoriesRaw from '../content/memories.json'
import quizRaw from '../content/quiz.json'
import { config, type Role } from '../content/config'

export type Memory = { file: string; date: string; place: string; caption: string }
export type QuizQuestion = { about: Role; text: string; options?: string[] }

const memories = memoriesRaw as Record<string, Memory[]>

export const YEARS = [1, 2, 3, 4, 5] as const
export const yearCount = config.years.length

export function memoriesFor(year: number): Memory[] {
  return memories[`year${year}`] ?? []
}

export function photoUrl(year: number, file: string): string {
  return `/photos/year${year}/${file}`
}

export type PhotoRef = Memory & { year: number; index: number }

export function allPhotos(): PhotoRef[] {
  return YEARS.flatMap((year) => memoriesFor(year).map((m, index) => ({ ...m, year, index })))
}

export const quiz = {
  roundsPerGame: (quizRaw as { roundsPerGame?: number }).roundsPerGame ?? 10,
  questions: (quizRaw as { questions: QuizQuestion[] }).questions.filter(
    (q) => q && (q.about === 'me' || q.about === 'her') && typeof q.text === 'string',
  ),
}
