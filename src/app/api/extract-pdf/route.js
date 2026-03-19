import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a valid PDF file" }, { status: 400 });
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF must be under 10MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse();
    const result = await parser.parseBuffer(buffer);

    const text = result.text || "";
    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from this PDF. It may be image-based or empty." }, { status: 422 });
    }

    return NextResponse.json({
      text: text.trim(),
      pages: result.pages?.length || 0,
      title: result.meta?.title || "",
    });
  } catch (err) {
    console.error("PDF extraction error:", err);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}
