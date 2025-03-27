import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// create constant for phillips hue bridge ip address
const PHILLIPS_HUE_BRIDGE_IP = "192.168.68.60";

// Create constant for phillips hue bridge id
const PHILLIPS_HUE_BRIDGE_ID = "001788FFFE4087DD";


  // Create server instance
const server = new McpServer({
  name: "phillips-hue-lights",
  version: "1.0.0",
});

// Helper function to set the color of a light group
async function setLightGroupColor(groupId: string, color: string) {

}

// Helper functio that sets the brightness of a light group
async function setLightGroupBrightness(groupId: string, brightness: number) {
  // if brightness id hiugher than 100, set it to 100
  if (brightness > 100) {
    brightness = 100;
  }
  // if brightness is lower than 0, set it to 0
  if (brightness < 0) { 
    brightness = 0;
  }

}

// Helper function that gets the brightness as an integer for a light group
async function getLightGroupBrightness(groupId: string): Promise<number> {
  return 50; // Simulate getting brightness
}


// Register tool to get an array of phillips hur light groups with english and swedish names
server.tool(
  "get-philips-hue-light-groups",
  "Get an array of Phillips Hue light groups with English and Swedish names.",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify([
            { id: "1", name: "living room", name_sv: "vardagsrum" },
            { id: "2", name: "kitchen table", name_sv: "köksbord" },
          ]),
        },
      ],
    };
  }
);

// Register tool that takes a list of philips hue light groups and sets the color for each group
server.tool(
  "set-philips-hue-light-groups-color",
  "Set the color for Phillips Hue light groups.",
  {
    groups: z.array(
      z.object({
        id: z.string().describe("ID of the light group."),
        color: z.string().length(6).describe("Six-letter hexadecimal color code (e.g. FF5733)"),
      })
    ).describe("Array of light groups with IDs and colors."),
  },
  async ({ groups }) => {
    const groupIds = groups.map((group) => group.id);
    const colors = groups.map((group) => group.color);
    await Promise.all(
      groupIds.map(async (groupId, index) => {
        await setLightGroupColor(groupId, colors[index]);
      })
    );
    return {
      content: [
        {
          type: "text",
          text: "Light groups color set successfully.",
        },
      ],
    };
  }
);

// Register tool that gets the brightness of a list of light groups
server.tool(
  "get-philips-hue-light-groups-brightness",
  "Get the brightness of Phillips Hue light groups.",
  {
    groups: z.array(
      z.object({
        id: z.string().describe("ID of the light group."),
      })
    ).describe("Array of light groups with IDs."),
  },
  async ({ groups }) => {
    const groupIds = groups.map((group) => group.id);
    const brightnesses = await Promise.all(
      groupIds.map(async (groupId) => {
        const brightness = await getLightGroupBrightness(groupId);
        return { id: groupId, brightness };
      })
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(brightnesses),
        },
      ],
    };
  }
);
  
// Register tool that sets the brightness of a list of light groups and returns the new values
server.tool(
  "set-philips-hue-light-groups-brightness",
  "Set the brightness of Phillips Hue light groups.",
  {
    groups: z.array(
      z.object({
        id: z.string().describe("ID of the light group."),
        brightness: z.number().min(0).max(100).describe("Brightness level (0-100)."),
      })
    ).describe("Array of light groups with IDs and brightness levels."),
  },
  async ({ groups }) => {
    const groupIds = groups.map((group) => group.id);
    const brightnessLevels = groups.map((group) => group.brightness);
    await Promise.all(
      groupIds.map(async (groupId, index) => {
        await setLightGroupBrightness(groupId, brightnessLevels[index]);
      })
    );
    return {  
      content: [
        {
          type: "text",
          text: JSON.stringify(brightnessLevels),
        },
      ],
    };
  }
);

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Phillips Hue MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });