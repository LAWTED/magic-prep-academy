import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Note: Using server-side env variable
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const inputType = formData.get('inputType') as 'document' | 'website';

    if (!inputType) {
      return NextResponse.json(
        { error: 'Missing input type' },
        { status: 400 }
      );
    }

    let fileId: string;

    if (inputType === 'document' && file) {
      // Create a temporary file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tmpFilePath = path.join(os.tmpdir(), file.name);
      await writeFile(tmpFilePath, buffer);

      const result = await openai.files.create({
        file: fs.createReadStream(tmpFilePath),
        purpose: "assistants",
      });
      fileId = result.id;

      // Clean up temporary file
      fs.unlinkSync(tmpFilePath);
    } else if (inputType === 'website' && url) {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const urlParts = url.split("/");
      const fileName = urlParts[urlParts.length - 1] || 'downloaded-content.txt';
      const tmpFilePath = path.join(os.tmpdir(), fileName);
      await writeFile(tmpFilePath, Buffer.from(buffer));

      const result = await openai.files.create({
        file: fs.createReadStream(tmpFilePath),
        purpose: "assistants",
      });
      fileId = result.id;

      // Clean up temporary file
      fs.unlinkSync(tmpFilePath);
    } else {
      return NextResponse.json(
        { error: 'No file or URL provided' },
        { status: 400 }
      );
    }

    // TODO: Save to database
    // const material = await db.materials.create({
    //   data: {
    //     title,
    //     description,
    //     fileId,
    //     inputType,
    //   },
    // });

    return NextResponse.json({ fileId });
  } catch (error) {
    console.error('Error processing material:', error);
    return NextResponse.json(
      { error: 'Failed to process material' },
      { status: 500 }
    );
  }
}