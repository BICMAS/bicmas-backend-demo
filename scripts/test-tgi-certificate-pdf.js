/**
 * Generates sample TGI Distri certificate PDFs locally for visual verification.
 * Usage: node scripts/test-tgi-certificate-pdf.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const SCRIPT_FONT_PATH = path.join(__dirname, '../assets/fonts/GreatVibes-Regular.ttf');

const TGI_COLORS = {
    primary: rgb(2 / 255, 35 / 255, 106 / 255), // #02236a
    primaryDark: rgb(1 / 255, 26 / 255, 80 / 255),
    secondary: rgb(252 / 255, 223 / 255, 21 / 255), // #fcdf15
    text: rgb(0.2, 0.2, 0.2),
    white: rgb(1, 1, 1),
};

function drawTgiFrame(page, width, height) {
    const cornerSize = 110;
    page.drawSvgPath(`M 0 ${height} L 0 ${height - cornerSize} L ${cornerSize} ${height} Z`, {
        color: TGI_COLORS.primary,
    });
    page.drawSvgPath(
        `M ${width} ${height} L ${width} ${height - cornerSize} L ${width - cornerSize} ${height} Z`,
        { color: TGI_COLORS.primary },
    );
    page.drawRectangle({ x: 0, y: 0, width, height: 22, color: TGI_COLORS.primary });
    page.drawRectangle({ x: 0, y: 22, width, height: 6, color: TGI_COLORS.primaryDark });
}

function drawCenteredText(page, text, y, size, font, color) {
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
}

async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: 0, width, height, color: TGI_COLORS.white });
    drawTgiFrame(page, width, height);

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const scriptFont = await pdfDoc.embedFont(fs.readFileSync(SCRIPT_FONT_PATH));

    drawCenteredText(page, 'CERTIFICATE', height - 88, 46, titleFont, TGI_COLORS.secondary);
    drawCenteredText(page, 'OF COMPLETION', height - 118, 14, titleFont, TGI_COLORS.text);
    drawCenteredText(page, 'This is to certify that', height - 162, 14, bodyFont, TGI_COLORS.text);
    drawCenteredText(page, 'Macdara Rashawn', height - 210, 38, scriptFont, TGI_COLORS.secondary);
    drawCenteredText(page, 'Has successfully completed the', height - 248, 14, bodyFont, TGI_COLORS.text);
    drawCenteredText(page, '2030 ONLINE COURSE DEVELOPER', height - 278, 16, titleFont, TGI_COLORS.text);
    drawCenteredText(
        page,
        'Monday, 20 April 2030',
        height - 310,
        13,
        bodyFont,
        TGI_COLORS.text,
    );

    const outputPath = path.join(OUTPUT_DIR, 'tgi-certificate-sample.pdf');
    fs.writeFileSync(outputPath, await pdfDoc.save());
    console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
