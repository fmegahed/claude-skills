# Writing: the 80% ASD-STE100 rule

The rule applies to all files that the skill writes. These include the record README, the documents, the ledger headers, the table rows and the `CLAUDE.md` block. Chat replies can be normal.

## The rules

About 80% of the text follows ASD-STE100 (Simplified Technical English):

| Rule | Limit |
|---|---|
| Sentence length in a procedure | At most 20 words. |
| Sentence length in a description | At most 25 words. |
| Instructions | One instruction in each sentence. |
| Voice | Active voice. Name the one who acts. |
| Procedures | The imperative: "Run the build check." |
| Contractions | None. Write "do not", not "don't". |
| Words | One word for one meaning. Keep the same word for the same thing. |

## The other 20%

- Technical terms are permitted: package names, commands, file names, statistical terms.
- Natural flow is permitted where a strict rule makes the text unclear.
- A quote in an `Evidence` cell stays as the person wrote it. Do not edit a quote to follow this rule.

## Why active voice matters in a record

A record shows who decided what. A passive sentence hides the one who acted.

| Do not write | Write |
|---|---|
| Ridge regression was rejected. | Fadel chose the lasso over ridge regression. |
| The ledger was copied. | Claude Code copied the ledger. |
| It is recommended that the build is run. | Run the build check. |

## Examples

| Do not write | Write |
|---|---|
| Don't commit until you've checked that the build passes, since a failed build blocks the site. | Run the build check. Do not commit while it fails. A failed build does not update the website. |
| The roadmap should be kept up to date and the next milestone moved to now. | Set the next milestone to `now`. |
| Run, verify and commit the change. | Run the build check. Commit the change. |

## One word for one meaning

Use these words with one meaning each:

| Word | Meaning |
|---|---|
| record | the `replication_materials/` folder and its files |
| website | the site that the workflow publishes on GitHub Pages |
| decision | a choice that changes what is built or how |
| ruling | a decision that Claude Code makes alone, mostly in a ledger |
| milestone | a row of `## Milestones` in `roadmap.md` |
| stage | a value of the `Stage` column in `process.md` |
| person | a human with an ID in `## People` |

## Check before you save

1. Read each sentence that has more than one comma. Split it if it has more than one instruction.
2. Count the words of each long sentence. Split each sentence above the limit.
3. Search for `n't`, `'re`, `'ll`, `'ve` and `'s` (as "it's"). Write each contraction in full.
4. Search for "was", "were", "is ... by" and "been". Name the one who acts.
