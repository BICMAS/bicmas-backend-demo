/**
 * One-off: rename CertificateTemplate themeConfig.theme "mecure" → "tgi".
 *
 * Usage:
 *   node scripts/migrate-mecure-theme-to-tgi.js          # dry-run (default)
 *   node scripts/migrate-mecure-theme-to-tgi.js --dry-run
 *   node scripts/migrate-mecure-theme-to-tgi.js --apply
 */
import { prisma, pool } from '../src/utils/db.js';

const APPLY_MODE = process.argv.includes('--apply');

function parseDescription(description) {
    if (!description || typeof description !== 'string') {
        return { ok: false, reason: 'empty' };
    }

    try {
        const parsed = JSON.parse(description);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { ok: false, reason: 'not-object' };
        }
        return { ok: true, parsed };
    } catch {
        return { ok: false, reason: 'invalid-json' };
    }
}

async function main() {
    console.log(`[MIGRATE THEME] Starting in ${APPLY_MODE ? 'APPLY' : 'DRY-RUN'} mode`);

    const templates = await prisma.certificateTemplate.findMany({
        select: {
            id: true,
            filename: true,
            description: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    let skippedEmpty = 0;
    let skippedInvalid = 0;
    let skippedNoTheme = 0;
    let alreadyTgi = 0;
    let wouldUpdate = 0;
    let updated = 0;

    for (const template of templates) {
        const parsedResult = parseDescription(template.description);
        if (!parsedResult.ok) {
            if (parsedResult.reason === 'empty') {
                skippedEmpty += 1;
            } else {
                skippedInvalid += 1;
            }
            continue;
        }

        const { parsed } = parsedResult;
        const theme = parsed.themeConfig?.theme;
        if (!theme) {
            skippedNoTheme += 1;
            continue;
        }
        if (theme === 'tgi') {
            alreadyTgi += 1;
            continue;
        }
        if (theme !== 'mecure') {
            skippedNoTheme += 1;
            continue;
        }

        wouldUpdate += 1;
        parsed.themeConfig.theme = 'tgi';
        const nextDescription = JSON.stringify(parsed);

        console.log(
            `[MIGRATE THEME] ${APPLY_MODE ? 'Updating' : 'Would update'} ${template.id} (${template.filename}) mecure → tgi`,
        );

        if (APPLY_MODE) {
            await prisma.certificateTemplate.update({
                where: { id: template.id },
                data: { description: nextDescription },
            });
            updated += 1;
        }
    }

    console.log('[MIGRATE THEME] Result:');
    console.log(`- templates scanned: ${templates.length}`);
    console.log(`- skipped empty description: ${skippedEmpty}`);
    console.log(`- skipped invalid JSON: ${skippedInvalid}`);
    console.log(`- skipped other/missing theme: ${skippedNoTheme}`);
    console.log(`- already tgi: ${alreadyTgi}`);
    console.log(`- ${APPLY_MODE ? 'updated' : 'would update'}: ${APPLY_MODE ? updated : wouldUpdate}`);
    console.log(`[MIGRATE THEME] Completed in ${APPLY_MODE ? 'APPLY' : 'DRY-RUN'} mode`);
}

main()
    .catch((error) => {
        console.error('[MIGRATE THEME ERROR]', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
