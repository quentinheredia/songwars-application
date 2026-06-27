import {
  ACCEPTED_TRACK_TYPES,
  ensureTrackBucket,
  MAX_TRACK_SIZE,
  TRACK_BUCKET,
} from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

type UploadRequest = {
  fileName?: unknown;
  fileSize?: unknown;
  fileType?: unknown;
};

function safeFileName(fileName: string) {
  const normalized = fileName
    .normalize("NFKD")
    .replaceAll(/[^a-zA-Z0-9._-]/g, "_")
    .replaceAll(/_+/g, "_")
    .slice(-120);

  return normalized || "track";
}

export async function POST(request: Request) {
  try {
    const missingConfig = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
      (key) => !process.env[key],
    );
    if (missingConfig.length > 0) {
      console.error(
        `Track upload service is missing environment variables: ${missingConfig.join(", ")}`,
      );
      return Response.json(
        { message: "Track uploads are temporarily unavailable." },
        { status: 503 },
      );
    }

    const input = (await request.json()) as UploadRequest;
    const fileName =
      typeof input.fileName === "string" ? input.fileName.trim() : "";
    const fileType =
      typeof input.fileType === "string" ? input.fileType.trim() : "";
    const fileSize = Number(input.fileSize);

    if (!fileName) {
      return Response.json({ message: "Choose an audio file." }, { status: 400 });
    }
    if (
      !Number.isInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_TRACK_SIZE
    ) {
      return Response.json(
        { message: "The audio track must be 10 MB or smaller." },
        { status: 400 },
      );
    }
    if (!ACCEPTED_TRACK_TYPES.includes(fileType as never)) {
      return Response.json(
        { message: "Upload an MP3, WAV, M4A, or AAC audio file." },
        { status: 400 },
      );
    }

    const supabase = await ensureTrackBucket();
    const date = new Date().toISOString().slice(0, 10);
    const path = `submissions/${date}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
    const { data, error } = await supabase.storage
      .from(TRACK_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (error) throw error;

    return Response.json({
      path: data.path,
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error("Could not create signed track upload:", error);
    return Response.json(
      { message: "Track uploads are temporarily unavailable." },
      { status: 503 },
    );
  }
}
