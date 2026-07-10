import { createHash } from 'node:crypto';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  loadWriteupSources,
  parseWriteupSource,
  resolveCommissionerAuthor,
  validateWriteupSourceSet,
  type WriteupSource,
} from '../../../scripts/lib/writeup-source-archive';

const archiveDirectory = path.join(process.cwd(), 'docs', 'writeups', '2025');

const expectedContentHashes = [
  '4dd393ad96689060c672cfecd6b7626f151f473d2d7f15fe7f965579ac391b95',
  '89d814248ccaab40450bbb49b707217d8cba6bb25bdcced43c7298c8e5b205b5',
  '53a7e0e565f53e90bd0bf0d74de8052705e8c1c264edaa7f90ecbfb14a3a319c',
  '09370170ecc8ddd371c93951f812c35cd2be1dbe380b5023760c3c051653a65f',
  'cacbdf45607870778ab6a761aecc6134ec4847a435fb066f3d0aa43dc926a158',
  '4924a1e07c8a09b8ba965f13bd32e6c65ecf61b85ac630f809699b63a3e71f33',
];

function validSource(overrides: Partial<WriteupSource> = {}): WriteupSource {
  return {
    source_key: 'email-2025-01-01-example',
    season: 2025,
    published_date: '2025-01-01',
    published_time_local: '12:00',
    date_precision: 'exact_from_email_header',
    writeup_type: 'weekly_recap',
    week: 1,
    original_order: 1,
    content_status: 'verbatim',
    title: 'Example',
    content: 'Original commissioner copy.',
    source_path: 'example.md',
    ...overrides,
  };
}

describe('commissioner writeup source archive', () => {
  it('loads the six 2025 records in their original sequence', () => {
    const sources = loadWriteupSources(archiveDirectory);

    expect(sources).toHaveLength(6);
    expect(sources.map((source) => source.original_order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(sources.map((source) => source.source_key)).size).toBe(6);
    expect(sources.every((source) => source.season === 2025)).toBe(true);
  });

  it('resolves the established archive author when multiple commissioners are active', () => {
    const author = resolveCommissionerAuthor(
      [
        { id: 'established', display_name: 'Matt OD' },
        { id: 'unused', display_name: 'Matthew' },
      ],
      ['established', 'established', 'established'],
    );

    expect(author.id).toBe('established');
    expect(() => resolveCommissionerAuthor(
      [
        { id: 'one', display_name: 'One' },
        { id: 'two', display_name: 'Two' },
      ],
      [],
    )).toThrow(/Could not identify one commissioner author/);
  });

  it('preserves the curated body text byte-for-byte', () => {
    const hashes = loadWriteupSources(archiveDirectory).map((source) => (
      createHash('sha256').update(source.content).digest('hex')
    ));

    expect(hashes).toEqual(expectedContentHashes);
  });

  it('keeps exact dates and explicitly preserves the undated final-four source', () => {
    const sources = loadWriteupSources(archiveDirectory);
    const finalFour = sources.at(-1);

    expect(sources.slice(0, -1).every((source) => source.date_precision === 'exact_from_email_header')).toBe(true);
    expect(finalFour).toMatchObject({
      source_key: 'email-2025-undated-final-four',
      published_date: null,
      date_precision: 'omitted_from_export',
      sequence_after: '2025-12-10',
    });
  });

  it('rejects email transport metadata in source content', () => {
    const raw = `---
source_key: email-2025-01-01-example
season: 2025
published_date: 2025-01-01
published_time_local: "12:00"
date_precision: exact_from_email_header
writeup_type: weekly_recap
week: 1
original_order: 1
content_status: verbatim
---

# Example

On Jan 1, Somebody <somebody@example.com> wrote:`;

    expect(() => parseWriteupSource(raw, 'example.md')).toThrow(/email transport metadata/);
  });

  it('rejects duplicate identities, duplicate order, and sequence gaps', () => {
    expect(() => validateWriteupSourceSet([
      validSource(),
      validSource({ original_order: 2 }),
    ])).toThrow(/Duplicate source_key/);

    expect(() => validateWriteupSourceSet([
      validSource(),
      validSource({ source_key: 'email-2025-01-02-example' }),
    ])).toThrow(/Duplicate original_order/);

    expect(() => validateWriteupSourceSet([
      validSource(),
      validSource({ source_key: 'email-2025-01-03-example', original_order: 3 }),
    ])).toThrow(/contiguous from 1/);
  });
});
