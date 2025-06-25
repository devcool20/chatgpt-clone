import { v2 as cloudinary } from 'cloudinary';
import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";

// Configure Cloudinary with explicit individual parameters
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log('Cloudinary config check:', {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ? 'PRESENT' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING',
});

const FileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size should be less than 10MB",
    })
    .refine(
      (file) =>
        [
          "image/jpeg", 
          "image/png", 
          "image/gif", 
          "image/webp",
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ].includes(file.type),
      {
        message: "File type should be JPEG, PNG, GIF, WebP, PDF, TXT, DOC, or DOCX",
      },
    ),
});

export async function POST(request: NextRequest) {
  // Remove auth check for now - you can add it back if needed
  // const { userId } = getAuth(request);
  // if (!userId) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      // Use unsigned upload preset - no signature required!
      console.log('Attempting Cloudinary unsigned upload...');
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            upload_preset: "unsigned-chatgpt", // Your unsigned preset
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload failed:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful:', result?.secure_url);
              resolve(result);
            }
          }
        ).end(buffer);
      });

      const uploadResult = result as any;

      return NextResponse.json({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        originalFilename: file.name,
        contentType: file.type,
        size: file.size,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
