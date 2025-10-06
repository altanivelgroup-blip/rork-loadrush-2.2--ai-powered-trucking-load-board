import { generateText } from "@rork/toolkit-sdk";

export async function runAITool(
  toolName: string,
  inputData: string | object
): Promise<string> {
  let prompt: string;

  switch (toolName) {
    case 'listingAssistant':
      prompt = `Extract Pickup, Delivery, Equipment, Notes from: ${inputData}`;
      break;
    
    case 'voiceToPost':
      prompt = `Transcribed voice input. Clean up into structured posting: ${inputData}`;
      break;
    
    case 'replyDrafts':
      prompt = `Generate 3 short professional replies to: ${inputData}`;
      break;
    
    case 'matchmaker':
      prompt = `Suggest top 3 drivers for this load: ${typeof inputData === 'object' ? JSON.stringify(inputData) : inputData}`;
      break;
    
    case 'smartDocs':
      prompt = `Summarize key fields from this document text: ${inputData}`;
      break;
    
    case 'workflowAutomations':
      prompt = `Suggest an automation alert for this trigger: ${inputData}`;
      break;
    
    default:
      return `Unknown tool: ${toolName}`;
  }

  try {
    const response = await generateText({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    return response;
  } catch (error) {
    console.error(`AI Tool Error [${toolName}]:`, error);
    return `Error processing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
