import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import fs from 'fs';

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

    // Create a vector store
    const vectorStore = await openai.vectorStores.create({
      name: "knowledge_base",
    });
    const vectorStoreId = vectorStore.id;

    // Associate the file with the vector store
    await openai.vectorStores.files.create(
      vectorStoreId,
      {
        file_id: fileId,
      }
    );


    return NextResponse.json({ fileId, vectorStoreId });
  } catch (error) {
    console.error('Error processing material:', error);
    return NextResponse.json(
      { error: 'Failed to process material' },
      { status: 500 }
    );
  }
}