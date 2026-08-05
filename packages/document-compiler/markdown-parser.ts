import { DocumentAST, DocumentNode, HeadingNode, ParagraphNode, CodeBlockNode } from "./nodes";

export function parseMarkdownToAST(markdown: string): DocumentAST {
  const lines = markdown.split(/\r?\n/);
  const nodes: DocumentNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = "";
  let position = 0;
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      position++;
      const text = paragraphBuffer.join(" ").trim();
      if (text) {
        const node: ParagraphNode = {
          id: `node_para_${position}`,
          type: "paragraph",
          originalPosition: position,
          isLocked: false,
          canRewrite: true,
          extractedFacts: [],
          text,
        };
        nodes.push(node);
      }
      paragraphBuffer = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        position++;
        const codeNode: CodeBlockNode = {
          id: `node_code_${position}`,
          type: "code_block",
          originalPosition: position,
          isLocked: true,
          canRewrite: false,
          extractedFacts: [],
          language: codeLang,
          code: codeBuffer.join("\n"),
        };
        nodes.push(codeNode);
        codeBuffer = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        flushParagraph();
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      position++;
      const headingNode: HeadingNode = {
        id: `node_heading_${position}`,
        type: "heading",
        originalPosition: position,
        isLocked: false,
        canRewrite: true,
        extractedFacts: [],
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      };
      nodes.push(headingNode);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushParagraph();

  const totalWords = nodes.reduce((acc, node) => {
    if (node.type === "paragraph") return acc + node.text.split(/\s+/).filter(Boolean).length;
    if (node.type === "heading") return acc + node.text.split(/\s+/).filter(Boolean).length;
    return acc;
  }, 0);

  return {
    version: "2.0.0",
    nodes,
    metadata: {
      totalWords,
      hasCode: nodes.some((n) => n.type === "code_block"),
      hasTables: false,
      hasFormulas: false,
    },
  };
}

export function compileASTToMarkdown(ast: DocumentAST): string {
  return ast.nodes
    .map((node) => {
      if (node.type === "heading") {
        return `${"#".repeat(node.level)} ${node.text}`;
      }
      if (node.type === "code_block") {
        return `\`\`\`${node.language || ""}\n${node.code}\n\`\`\``;
      }
      if (node.type === "paragraph") {
        return node.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}
