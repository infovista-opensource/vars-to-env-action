import {expect, jest, test} from '@jest/globals'
import * as core from '@actions/core'
import main from '../src/main'

jest.mock('@actions/core')

let mockedCore: jest.Mocked<typeof core>

jest.mocked(core.debug).mockImplementation(s => console.log(`DEBUG: ${s}`))
jest.mocked(core.info).mockImplementation(s => console.log(`INFO: ${s}`))
jest.mocked(core.warning).mockImplementation(s => console.log(`WARNING: ${s}`))

function mockInputs(inputs: {[key: string]: string}) {
  jest.mocked(core.getInput).mockImplementation(s => inputs[s] || '')
}

describe('secrets-to-env-action', () => {
  let inputSecrets: {[key: string]: string}
  let outputSecrets: {[key: string]: string}
  let newSecrets: {[key: string]: string}

  beforeEach(() => {
    inputSecrets = {
      MY_SECRET_1: 'VALUE_1',
      MY_SECRET_2: 'VALUE_2',
      my_low_secret_1: 'low_value_1',
    }
    outputSecrets = {
      MY_SECRET_1: 'VALUE_1',
      MY_SECRET_2: 'VALUE_2',
      MY_LOW_SECRET_1: 'low_value_1',
    }

    newSecrets = {}
    jest
      .mocked(core.exportVariable)
      .mockImplementation((k, v) => (newSecrets[k] = v))
  })

  it('exports all variables', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets)
    })
    main()
    expect(newSecrets).toEqual(outputSecrets)
  })

  it('excludes variables (single)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      exclude: 'MY_SECRET_1'
    })
    main()
    delete outputSecrets.MY_SECRET_1
    expect(newSecrets).toEqual(outputSecrets)
  })

  it('excludes variables (array)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      exclude: 'MY_SECRET_1,MY_SECRET_2,ignore'
    })
    main()
    delete outputSecrets.MY_SECRET_1
    delete outputSecrets.MY_SECRET_2
    expect(newSecrets).toEqual(outputSecrets)
  })

  it('excludes variables (regex)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      exclude: 'MY_SECRET_*,ignore'
    })
    main()
    delete outputSecrets.MY_SECRET_1
    delete outputSecrets.MY_SECRET_2
    expect(newSecrets).toEqual(outputSecrets)
  })

  it('includes variables (single)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      include: 'MY_SECRET_1'
    })
    main()

    expect(newSecrets).toEqual({
      MY_SECRET_1: inputSecrets.MY_SECRET_1
    })
  })

  it('includes variables (array)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      include: 'MY_SECRET_1, MY_SECRET_2, ignore'
    })
    main()

    expect(newSecrets).toEqual({
      MY_SECRET_1: inputSecrets.MY_SECRET_1,
      MY_SECRET_2: inputSecrets.MY_SECRET_2
    })
  })

  it('includes variables (regex)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      include: 'MY_SECRET_.+'
    })
    main()

    expect(newSecrets).toEqual({
      MY_SECRET_1: inputSecrets.MY_SECRET_1,
      MY_SECRET_2: inputSecrets.MY_SECRET_2
    })
  })

  it('adds a prefix', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      prefix: 'PREF_',
      include: 'MY_SECRET_1, MY_SECRET_2',
      tracelog: 'true'
    })
    main()

    expect(newSecrets).toEqual({
      PREF_MY_SECRET_1: inputSecrets.MY_SECRET_1,
      PREF_MY_SECRET_2: inputSecrets.MY_SECRET_2
    })
  })

  it('removes a prefix', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      removeprefix: 'MY_',
      include: 'MY_SECRET_1,MY_SECRET_2,DONTREMOVE_MY_PREFIX',
      tracelog: 'true'
    })
    main()

    expect(newSecrets).toEqual({
      SECRET_1: inputSecrets.MY_SECRET_1,
      SECRET_2: inputSecrets.MY_SECRET_2,
    })
  })

  it('removes a prefix not in the middle of the string', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      removeprefix: 'SECRET_',
      include: 'MY_SECRET_1,MY_SECRET_2',
      tracelog: 'true'
    })
    main()

    expect(newSecrets).toEqual({
      MY_SECRET_1: inputSecrets.MY_SECRET_1,
      MY_SECRET_2: inputSecrets.MY_SECRET_2
    })
  })

  it('converts key (lower)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      include: 'MY_SECRET_1, MY_SECRET_2',
      convert: 'lower'
    })
    main()

    expect(newSecrets).toEqual({
      my_secret_1: inputSecrets.MY_SECRET_1,
      my_secret_2: inputSecrets.MY_SECRET_2
    })
  })

  it('overrides variables', () => {
    process.env = {
      MY_SECRET_1: 'OVERRIDE'
    }

    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      override: 'true'
    })
    main()

    expect(newSecrets).toEqual(outputSecrets)
  })

  it('does not override variables', () => {
    process.env = {
      MY_SECRET_1: 'DONT_OVERRIDE'
    }

    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      override: 'false'
    })
    main()

    const filteredNewSecrets = Object.assign({}, newSecrets)
    delete filteredNewSecrets.MY_SECRET_1

    expect(newSecrets).toEqual(filteredNewSecrets)
  })
})
