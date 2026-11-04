/**
 * ============================================================
 *  EDIT ME: one letter per year, plus the final anniversary letter.
 *  Separate paragraphs with a blank line. Template literals (backticks)
 *  let you write across many lines; avoid typing a backtick inside.
 * ============================================================
 */

export type Letter = {
  /** shown at the top of the letter, e.g. "Dear you," */
  greeting: string
  body: string
  /** shown at the bottom, e.g. "Yours, Deb" */
  signoff: string
}

export const letters: Record<'year1' | 'year2' | 'year3' | 'year4' | 'year5', Letter> = {
  year1: {
    greeting: 'Dear HER_NAME,',
    body: `PLACEHOLDER. Write the letter for our first year here.

A second paragraph goes after a blank line like this one.`,
    signoff: 'Yours, Deb',
  },
  year2: {
    greeting: 'Dear HER_NAME,',
    body: `PLACEHOLDER. Write the letter for our second year here.

A second paragraph goes after a blank line like this one.`,
    signoff: 'Yours, Deb',
  },
  year3: {
    greeting: 'Dear HER_NAME,',
    body: `PLACEHOLDER. Write the letter for our third year here.

A second paragraph goes after a blank line like this one.`,
    signoff: 'Yours, Deb',
  },
  year4: {
    greeting: 'Dear HER_NAME,',
    body: `PLACEHOLDER. Write the letter for our fourth year here.

A second paragraph goes after a blank line like this one.`,
    signoff: 'Yours, Deb',
  },
  year5: {
    greeting: 'Dear HER_NAME,',
    body: `PLACEHOLDER. Write the letter for our fifth year here.

A second paragraph goes after a blank line like this one.`,
    signoff: 'Yours, Deb',
  },
}

export const finalLetter: Letter = {
  greeting: 'My dearest HER_NAME,',
  body: `PLACEHOLDER. This is the big one: the letter she reads on 10 November 2026.

Write as many paragraphs as you like. Each paragraph fades in gently as she scrolls.

The last paragraph is followed by a little celebration.`,
  signoff: 'Forever yours, Deb',
}
