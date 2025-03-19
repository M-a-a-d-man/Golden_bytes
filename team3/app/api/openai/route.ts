import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const eventSchema = {
    type: "object",
    properties: {
      start: { type: "string", format: "date-time", description: "Event start date-time in ISO format" },
      end: { type: "string", format: "date-time", description: "Event end date-time in ISO format" }
    },
    required: ["start", "end"]
  };
  

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }


        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileStream = file.stream();

        const newFile = new File([buffer], file.name, { type: file.type });


        const uploadedFile = await openai.files.create({
            file: newFile,
            purpose: "assistants",
        });

        console.log("File uploaded:", uploadedFile.id);
        const messageContent = file
        ? `Based on the provided assignment file, schedule "${title}" at a suitable date and time without conflicting existing events. Return only a JSON object with exact 'start' and 'end' ISO date-time strings. Start date should be after ${new Date().toISOString()}.`
        : `Schedule "${title}" at a suitable date and time without conflicting existing events. Return only a JSON object with exact 'start' and 'end' ISO date-time strings. Start date should be after ${new Date().toISOString()}.`;
        
        const thread = await openai.beta.threads.create();
        //Temporary solution. Each user should have their thread.


        const message = await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: messageContent,
      attachments: file ? [{ file_id: uploadedFile.id, tools: [{ type: "code_interpreter" }] }] : undefined
    });

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: process.env.OPENAI_ASSISTANT_ID!,
            response_format: { type: "json_object" }
        });

        while (true) {
            await new Promise((resolve) => setTimeout(resolve, 3000));

            const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

            console.log("Run status:", runStatus.status);

            if (runStatus.status === "completed") {
                break;
            }
        }

        const messages = await openai.beta.threads.messages.list(thread.id);
        const response = messages.data[0].content[0].text.value;
        console.log(messages.data[0].content); //messages.data[0].content.text.value contains the estimated time "hh:mm"
        console.log(messages.data[1].content);
        console.log(messages.data[0].content[0].text.value);
        return NextResponse.json({
            message: response,
        });
    } catch (error: unknown) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
