# Figma-to-HTML Renderer

Convert Figma design mocks into real, rendered HTML/CSS

## 🚀 Overview
This project implements an automated system that:
1. Fetches a Figma design file using the Figma REST API
2. Converts every screen (frame) into an internal design representation
3. Outputs clean, structured HTML + CSS
4. Produces renders that visually match the original Figma mocks
   
This works not only for the provided Softlight assignment file, but for any arbitrary Figma mock.

## 🧠 Key Concept

The important part of the architecture is that the system does not hard-code any specific Figma layer names or styles.

Instead:

- We introspect the Figma component trees
- Normalize the elements into our own internal IR (Intermediate Representation)
- Use generic HTML & CSS code generators
- Output layout elements using computed sizes, positions, fills, borders, gradients, shadows, and text properties

This ensures generalization beyond a single mock or assignment.

## 🛠️ Tech Used
| Area               | Technology           |
| ------------------ | -------------------- |
| Language           | TypeScript (Node.js) |
| API                | Figma REST API       |
| HTTP               | Axios                |
| Build              | ts-node + Typescript |
| Environment config | dotenv               |
| Output             | HTML + CSS files     |

## 🧩 Project Structure
```

src/
 ├─ index.ts               → main program: fetches and generates HTML/CSS  
 ├─ generate.ts            → (optional) generate from stored JSON  
 ├─ figmaClient.ts         → handles API calls  
 ├─ figma/normalize.ts     → normalizes Figma JSON to IR tree  
 ├─ codegen/htmlGenerator.ts → creates HTML  
 ├─ codegen/cssGenerator.ts  → creates CSS  
 ├─ core/ir.ts             → IR type definitions  
output/
 ├─ index.html  
 ├─ styles.css  
 ├─ <page>.html  
 ├─ <page>.css  
 
 ```

## 🔧 Setup

### 1. Install dependencies

```npm install```

### 2. Add your Figma token

Create a file:

```.env```

Add:

```FIGMA_TOKEN=figd_XXXXXXXXXXXXXXXXXXXXX```

> [!IMPORTANT]
> You must duplicate the Figma assignment into your own workspace and use your own token.

## Running the Renderer

Just run:

```npm start -- <FIGMA_FILE_KEY>```


Example:

```npm start -- 0idT6oA43OeKgv9S80vExd```

> You can see the FIGMA_FILE_KEY in your figma design file link (e.g.,figma.com/design/0idT6oA43OeKgv9S80vExd/)


### This will:

- Fetch the file from the Figma API
- Parse all pages (CANVAS nodes)
- For each page - output:
    - <pageName>.html
    - <pageName>.css

Additionally, the first page becomes:

```output/index.html```

```output/styles.css```

> Opening output/index.html shows a screen that visually matches the Figma design.

## ✨ Features Supported

✔ Absolute layout positioning

✔ Gradients

✔ Shadows

✔ Text extraction

✔ Accurate fonts

✔ Rounded borders

✔ Image content

✔ Figma opacity mapping

✔ Accurate color conversion

✔ Frame-level output

✔ Multiple pages per Figma design

✔ Generic support for any mock

## ⚠️ Current Limitations

(openly documented what’s not fully implemented yet)

❗Does not yet map auto-layout to flexbox

❗Figma component instances (variants) are treated as flattened children

❗Image resources that require external export are not downloaded - only references retained

❗No semantic tagging (everything is div)

❗No CSS optimization/minification yet

❗Not yet generating adaptive responsive breakpoints - layout matches device frame exactly

❗No multi-screen navigation linking - each output is static
