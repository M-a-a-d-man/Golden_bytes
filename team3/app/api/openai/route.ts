import { NextResponse } from "next/server";
import OpenAI from "openai";
import { EventObjectSchemaGPT } from "@/app/schema";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Validate environment variables
    if (!process.env.OPENAI_ASSISTANT_ID) {
      throw new Error("OPENAI_ASSISTANT_ID environment variable is not set");
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const startTime = formData.get("start") as string;
    const endTime = formData.get("end") as string;

    // Validate inputs
    if (!file || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: file, start, or end" },
        { status: 400 }
      );
    }

    // Upload file to OpenAI
    const uploadedFile = await openai.files.create({
      file: file,
      purpose: "assistants",
    });
    console.log("File uploaded:", uploadedFile.id);

    // Create thread with detailed scheduling instructions
    const thread = await openai.beta.threads.create();
    const messageContent = `
      Assignment: "${title}"
      Proposed Time Window: ${startTime} to ${endTime}
      
      Based on the attached assignment file:
      1. Analyze the assignment requirements and complexity
      2. Verify if the proposed time slot is feasible
      3. Check for conflicts with existing events
      4. Ensure minimum 1-hour buffer between events
      5. Consider typical work hours (9 AM to 6 PM)
      6. Make it suitable for a student, and try to breakdown the time into smaller chunks
      7. A task should not exceed 8 hours in a single day
      
      Return a JSON response with the following structure:
      {
        "id": "event-${Date.now()}-${title.replace(/\s+/g, '').toLowerCase()}",
        "title": "${title}",
        "start": "${startTime}",
        "end": "${endTime}",
        "startStr": "${startTime}",
        "endStr": "${endTime}",
        "allDay": false,
        "description": "Brief description of the assignment",
        "location": "N/A",
        "attendees": [],
        "recurrence": "",
        "ChatGptComment": "CONCISE ANALYSIS: [2-3 sentences max]",
        "FirstQuestion": "Include the first question from the assignment if available",
        "timeBreakdown": {
          "estimatedTotalHours": 0,
          "readingTime": 0,
          "researchTime": 0,
          "writingTime": 0,
          "reviewTime": 0,
          "bufferTime": 0,
          "isTimeWindowSufficient": true,
          "recommendedStartTime": "${startTime}",
          "recommendedEndTime": "${endTime}"
        },
        "schedulingNotes": {
          "conflicts": [],
          "optimalTimeOfDay": "morning/afternoon/evening",
          "recommendedBreaks": ["10:00-10:15", "12:00-13:00", "15:00-15:15"]
        }
      }
      
      Keep the ChatGptComment brief and focus on providing detailed time breakdowns in the structured fields.
    `;

    // Create message with structured prompt
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: messageContent,
      attachments: [{
        file_id: uploadedFile.id,
        tools: [{ type: "code_interpreter" }]
      }],
    });

    // Create and monitor run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      response_format: zodResponseFormat(EventObjectSchemaGPT, "CalendarEvent"),
    });

    // Enhanced polling with status tracking
    let runStatus;
    let retries = 0;
    const maxRetries = 10;
    
    do {
      await new Promise(resolve => setTimeout(resolve, 3000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log(`Run status [${retries + 1}/${maxRetries}]:`, runStatus.status);
      retries++;
    } while (runStatus.status !== "completed" && retries < maxRetries);

    if (runStatus.status !== "completed") {
      throw new Error(`Processing timed out. Final status: ${runStatus.status}`);
    }

    // Process response
    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 1,
      order: "desc"
    });

    const [latestMessage] = messages.data;
    const [contentBlock] = latestMessage.content;

    if (!contentBlock || !("text" in contentBlock)) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Parse and validate response
    const responseText = contentBlock.text.value;
    console.log("Raw OpenAI response:", responseText);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      // Try to extract JSON from the text if it's embedded in markdown or other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error("Could not extract valid JSON from OpenAI response");
        }
      } else {
        throw new Error("Could not find JSON in OpenAI response");
      }
    }
    
    // Ensure ChatGptComment is present and meaningful
    if (!parsedResponse.ChatGptComment || parsedResponse.ChatGptComment === "N/A") {
      // Extract meaningful comment from the response if possible
      const commentMatch = responseText.match(/Comment:?\s*([^\n]+)/i) || 
                          responseText.match(/Analysis:?\s*([^\n]+)/i);
      if (commentMatch) {
        parsedResponse.ChatGptComment = commentMatch[1].trim();
      } else {
        // Generate a default comment based on the time window
        const startDate = new Date(parsedResponse.start);
        const endDate = new Date(parsedResponse.end);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        parsedResponse.ChatGptComment = `Based on the assignment details, a ${daysDiff}-day window from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} should be sufficient to complete this task.`;
      }
    }
    
    const validationResult = EventObjectSchemaGPT.safeParse(parsedResponse);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 }
      );
    }

    // Add timestamp metadata
    const responseWithMetadata = {
      ...validationResult.data,
      processedAt: new Date().toISOString(),
      fileId: uploadedFile.id
    };

    return NextResponse.json(responseWithMetadata);

  } catch (error: any) {
    console.error("Error:", error);
    const status = error.status || 500;
    const message = error.message || "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
