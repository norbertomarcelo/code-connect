import * as axe from 'axe-core'
import { expect } from 'vitest'

/**
 * WCAG 2.0/2.1 level A + AA success criteria. axe-core tags 'A' and 'AA'
 * separately (AA doesn't restate A), so both are needed to assert AA
 * conformance.
 */
const wcagLevelAATags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

export async function checkAccessibility(container: Element) {
  return axe.run(container, {
    runOnly: { type: 'tag', values: wcagLevelAATags },
  })
}

function formatViolations(violations: axe.Result[]) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `    ${node.target.join(' ')}\n      ${node.failureSummary}`)
        .join('\n')
      return `[${violation.impact}] ${violation.id} — ${violation.help}\n    ${violation.helpUrl}\n${nodes}`
    })
    .join('\n\n')
}

interface AxeMatchers<R = unknown> {
  toHaveNoAccessibilityViolations(): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends AxeMatchers<T> {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

expect.extend({
  toHaveNoAccessibilityViolations(results: axe.AxeResults) {
    const { violations } = results

    return {
      pass: violations.length === 0,
      message: () =>
        violations.length === 0
          ? 'expected accessibility violations, but none were found'
          : `found ${violations.length} accessibility violation(s) against WCAG 2.1 AA:\n\n${formatViolations(violations)}`,
    }
  },
})
