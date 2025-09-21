import {
  readTemplateStructureFromJson,
  saveTemplateStructureToJson,
} from "@/modules/playground/lib/path-to-json";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    console.error("Invalid JSON structure:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

const {id} = await params;

if(!id){
      return Response.json({ error: "Missing playground ID" }, { status: 400 });
}

const playground = await db.playground.findUnique({
    where:{id}
})

  if (!playground) {
    return Response.json({ error: "Playground not found" }, { status: 404 });
  }
  
  const templateKey = playground.template as keyof typeof templatePaths;
  const templatePath = templatePaths[templateKey]

    if (!templatePath) {
    return Response.json({ error: "Invalid template" }, { status: 404 });
  }

  try {
    const inputPath = path.join(process.cwd() , templatePath);
    const outputFile = path.join(process.cwd() , `output/${templateKey}.json`);

    // Check if directory exists
    try {
      await fs.access(inputPath);
    } catch {
      // Directory doesn't exist, return a default template
      const defaultTemplate = {
        folderName: "Root",
        items: [
          {
            folderName: "src",
            items: [
              {
                filename: "App",
                fileExtension: "jsx",
                content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello from React!</h1>
        <p>Start editing to see your changes.</p>
      </header>
    </div>
  );
}

export default App;`
              },
              {
                filename: "index",
                fileExtension: "js",
                content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
              }
            ]
          },
          {
            filename: "package",
            fileExtension: "json",
            content: `{
  "name": "react-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}`
          },
          {
            filename: "index",
            fileExtension: "html",
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`
          }
        ]
      };
      return Response.json({ success: true, templateJson: defaultTemplate }, { status: 200 });
    }

    await saveTemplateStructureToJson(inputPath , outputFile);
    const result = await readTemplateStructureFromJson(outputFile);


    // Validate the JSON structure before saving
    if (!validateJsonStructure(result.items)) {
      return Response.json({ error: "Invalid JSON structure" }, { status: 500 });
    }

    await fs.unlink(outputFile)


      return Response.json({ success: true, templateJson: result }, { status: 200 });
  } catch (error) {
      console.error("Error generating template JSON:", error);
    return Response.json({ error: "Failed to generate template" }, { status: 500 });
  }


}
