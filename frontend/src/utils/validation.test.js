import { isValidName } from './validation';

describe('isValidName', () => {
  it('accepts valid standard names', () => {
    expect(isValidName('John Doe')).toBe(true);
    expect(isValidName('karan')).toBe(true);
    expect(isValidName('Li')).toBe(true);
  });

  it('accepts valid CamelCase and special prefixed names', () => {
    expect(isValidName('McDonald')).toBe(true);
    expect(isValidName("O'Connor")).toBe(true);
    expect(isValidName("D'Angelo")).toBe(true);
  });

  it('rejects names with irregular case mixing / gibberish', () => {
    expect(isValidName('asQVDEWJFGEBGDE')).toBe(false);
    expect(isValidName('JOhn')).toBe(false);
    expect(isValidName('joHn')).toBe(false);
  });

  it('rejects strings with too many repeated letters', () => {
    expect(isValidName('Jooohn')).toBe(false);
    expect(isValidName('aaaaa')).toBe(false);
  });

  it('rejects strings without vowels when length >= 3', () => {
    expect(isValidName('bcd')).toBe(false);
    expect(isValidName('xyzqwe')).toBe(false);
  });

  it('rejects strings containing invalid characters', () => {
    expect(isValidName('John@123')).toBe(false);
    expect(isValidName('John$')).toBe(false);
  });
});
