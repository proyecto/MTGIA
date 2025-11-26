
import { Jimp } from 'jimp';

async function roundCorners() {
    const inputFile = process.argv[2];
    const outputFile = process.argv[3];
    const radius = parseInt(process.argv[4] || '180'); // Adjust radius as needed

    console.log(`Processing ${inputFile} -> ${outputFile} with radius ${radius}`);

    try {
        const image = await Jimp.read(inputFile);

        // Resize to ensure standard size (e.g., 1024x1024)
        image.resize({ w: 1024, h: 1024 });

        // Create a rounded mask
        // Since Jimp 1.0, the API might have changed slightly, but let's try the standard circle/mask approach
        // Actually, Jimp has a built-in circle() method, but for rounded squares (squircles) it's harder.
        // Let's just try to mask it with a circle for now? No, macOS icons are squircles.
        // A simple circle is better than a square for "looking like the rest" if we can't do squircle.
        // But wait, standard Jimp might not have "round corners" easily without a mask.

        // Let's try a simple approach: just use the 'circle' method if available, or just leave it as is if we can't do it easily.
        // Wait, the user wants it to look like the others. The others are squircles.
        // If I can't do a squircle, a circle is worse.

        // Let's try to find a way to do rounded corners.
        // We can iterate over pixels and set alpha to 0 for corners.

        const r = radius;
        const w = image.bitmap.width;
        const h = image.bitmap.height;

        // Naive rounded corner implementation
        image.scan(0, 0, w, h, (x, y, idx) => {
            // Check if pixel is in one of the 4 corners
            let dist = 0;
            if (x < r && y < r) {
                // Top-left
                dist = Math.sqrt(Math.pow(r - x, 2) + Math.pow(r - y, 2));
            } else if (x > w - r && y < r) {
                // Top-right
                dist = Math.sqrt(Math.pow(x - (w - r), 2) + Math.pow(r - y, 2));
            } else if (x < r && y > h - r) {
                // Bottom-left
                dist = Math.sqrt(Math.pow(r - x, 2) + Math.pow(y - (h - r), 2));
            } else if (x > w - r && y > h - r) {
                // Bottom-right
                dist = Math.sqrt(Math.pow(x - (w - r), 2) + Math.pow(y - (h - r), 2));
            }

            if (dist > r) {
                // Outside the radius, make transparent
                image.bitmap.data[idx + 3] = 0;
            } else if (dist > r - 1) {
                // Antialiasing (simple)
                const alpha = image.bitmap.data[idx + 3];
                image.bitmap.data[idx + 3] = Math.floor(alpha * (1 - (dist - (r - 1))));
            }
        });

        await image.write(outputFile);
        console.log('Done!');
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

roundCorners();
