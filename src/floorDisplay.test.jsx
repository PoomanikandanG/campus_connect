import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import App from './App'
import { faculty } from './data/faculty'
import { deriveFloorFromCabin, normalizeFaculty } from './utils/faculty'

beforeEach(() => window.history.replaceState(null, '', '/'))
afterEach(cleanup)

const cabinFloors = [
  ['206', '2nd Floor'], ['207', '2nd Floor'], ['307', '3rd Floor'],
  ['407', '4th Floor'], ['507', '5th Floor'], ['607', '6th Floor'],
]

function displayedLocation(label) {
  const location = screen.getByRole('heading', { name: 'Cabin location' }).parentElement
  return within(location).getByText(label, { selector: 'dt' }).nextElementSibling.textContent
}

describe('floor derivation and normalization', () => {
  it.each(cabinFloors)('derives %s for both string and numeric cabins as %s', (cabin, expected) => {
    for (const value of [cabin, Number(cabin), ` ${cabin} `]) {
      expect(deriveFloorFromCabin(value)).toBe(expected)
      const source = Object.freeze({ id: 'teacher', name: 'Teacher', cabin: value })
      expect(normalizeFaculty(source).floor).toBe(expected)
      expect(source).not.toHaveProperty('floor')
    }
  })

  it.each([undefined, null, '', ' ', 0, NaN, Infinity, true, {}, [], 'A-204', '208', 999, '206.5', 'constructor'])('uses a placeholder for missing or unrecognized cabin %s', cabin => {
    expect(deriveFloorFromCabin(cabin)).toBe('Not provided')
    expect(normalizeFaculty({ id: 'teacher', cabin }).floor).toBe('Not provided')
  })

  it('uses the confirmed Ground Floor convention for G09', () => {
    expect(deriveFloorFromCabin('G09')).toBe('Ground Floor')
    expect(deriveFloorFromCabin(' g09 ')).toBe('Ground Floor')
    expect(normalizeFaculty({ id: 'teacher', cabin: 'G09' }).floor).toBe('Ground Floor')
    expect(normalizeFaculty({ id: 'teacher', cabin: 'G09', floor: 'Verified mezzanine' }).floor).toBe('Verified mezzanine')
  })

  it.each(['Ground Floor', 'Verified mezzanine', 'Fifth floor'])('preserves explicit floor %s even when it conflicts with the cabin convention', floor => {
    const source = Object.freeze({ id: 'teacher', cabin: 307, floor })
    expect(normalizeFaculty(source).floor).toBe(floor)
    expect(source.floor).toBe(floor)
  })

  it.each([undefined, null, '', ' ', 'Not provided', ' not provided '])('infers a floor when the stored value is empty or a placeholder: %s', floor => {
    expect(normalizeFaculty({ id: 'teacher', cabin: '507', floor }).floor).toBe('5th Floor')
  })
})

describe('profile floor display', () => {
  // Exercise every real profile with floor omitted, so the fallback cannot be
  // masked by the existing explicit floor values in the centralized dataset.
  const records = faculty.map(({ floor, ...record }) => record)
  const expectedFloors = { ...Object.fromEntries(cabinFloors), G09: 'Ground Floor' }

  it.each(records)('fills the missing floor on the existing profile for $name', person => {
    window.history.replaceState(null, '', `/#/faculty/${person.id}`)
    render(<App records={records} />)
    expect(screen.getByRole('heading', { level: 1, name: person.name })).toBeTruthy()
    expect(displayedLocation('Floor')).toBe(expectedFloors[person.cabin] || 'Not provided')
    expect(displayedLocation('Cabin number')).toBe(person.cabin || 'Not provided')
    expect(screen.getByRole('region', { name: 'Faculty Avatar' })).toBeTruthy()
  })

  it('shows a derived floor and retains a numeric cabin on a direct profile URL', () => {
    window.history.replaceState(null, '', '/#/faculty/numeric-cabin')
    render(<App records={[{ id: 'numeric-cabin', name: 'Teacher', cabin: 607 }]} />)
    expect(displayedLocation('Floor')).toBe('6th Floor')
    expect(displayedLocation('Cabin number')).toBe('607')
  })

  it('shows a verified explicit Ground Floor for G09', () => {
    window.history.replaceState(null, '', '/#/faculty/verified-ground')
    render(<App records={[{ id: 'verified-ground', name: 'Teacher', cabin: 'G09', floor: 'Ground Floor' }]} />)
    expect(displayedLocation('Floor')).toBe('Ground Floor')
    expect(displayedLocation('Cabin number')).toBe('G09')
  })
})
