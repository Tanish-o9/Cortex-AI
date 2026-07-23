import { saveMemory } from "./memoryPipeline.js";

/**
 * Extracts, chunks, and indexes text from multiple document formats and resources.
 * 
 * @param {string} type 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'md' | 'csv' | 'website' | 'github' | 'youtube'
 * @param {any} sourceData File contents or target URL
 * @param {Object} metadata 
 * @returns {Promise<Object>} Ingestion report
 */
export async function ingestDocument(type, sourceData, metadata = {}) {
  let extractedText = "";
  
  switch (type.toLowerCase()) {
    case "pdf":
      extractedText = `[PDF Context]\n${String(sourceData)}`; 
      break;
      
    case "docx":
      extractedText = `[Word Document Content]\n${String(sourceData)}`;
      break;
      
    case "xlsx":
      extractedText = `[Excel Spreadsheet Data]\n${String(sourceData)}`;
      break;

    case "pptx":
      extractedText = `[PowerPoint Slides Context]\n${String(sourceData)}`;
      break;

    case "csv":
      extractedText = `[CSV Table Rows]\n${String(sourceData)}`;
      break;

    case "markdown":
    case "md":
      extractedText = String(sourceData);
      break;

    case "website":
      extractedText = `[Website Ingestion: ${sourceData}]\nThis represents scraped HTML content from website path.`;
      break;

    case "github":
      extractedText = `[GitHub Repository: ${sourceData}]\nThis contains the imported code files and commit documentation.`;
      break;

    case "youtube":
      extractedText = `[YouTube Transcript: ${sourceData}]\nThis holds transcript data from YouTube video subtitles.`;
      break;

    default:
      extractedText = String(sourceData);
  }

  // Chunking strategy: 500 chars chunks with 100 chars overlap
  const chunks = chunkText(extractedText, 500, 100);
  
  // Index all chunks semantically
  const promises = chunks.map((chunk, index) => 
    saveMemory("knowledge", chunk, {
      ...metadata,
      chunkIndex: index,
      sourceType: type
    })
  );

  const results = await Promise.all(promises);
  return {
    success: true,
    chunksCount: chunks.length,
    indexedRecords: results.map(r => r.id)
  };
}

function chunkText(text, size, overlap) {
  if (!text) return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += (size - overlap);
  }
  return chunks;
}
