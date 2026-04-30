import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

export const GET = async () => {
    const dir = path.join(process.cwd(), "public/images/img-embeds");

    if (!fs.existsSync(dir)) {
        return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(dir).filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ALLOWED_EXTENSIONS.includes(ext);
    });

    return NextResponse.json({ files });
};
