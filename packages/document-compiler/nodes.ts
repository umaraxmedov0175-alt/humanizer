export type DocumentNodeType =
  | "paragraph"
  | "heading"
  | "list"
  | "list_item"
  | "blockquote"
  | "code_block"
  | "inline_code"
  | "table"
  | "link"
  | "citation"
  | "formula"
  | "footnote"
  | "horizontal_rule"
  | "placeholder";

export interface BaseDocumentNode {
  id: string;
  type: DocumentNodeType;
  originalPosition: number;
  isLocked: boolean;
  canRewrite: boolean;
  extractedFacts: string[];
}

export interface ParagraphNode extends BaseDocumentNode {
  type: "paragraph";
  text: string;
}

export interface HeadingNode extends BaseDocumentNode {
  type: "heading";
  level: number;
  text: string;
}

export interface CodeBlockNode extends BaseDocumentNode {
  type: "code_block";
  language?: string;
  code: string;
}

export interface FormulaNode extends BaseDocumentNode {
  type: "formula";
  expression: string;
  isInline: boolean;
}

export type DocumentNode = ParagraphNode | HeadingNode | CodeBlockNode | FormulaNode;

export interface DocumentAST {
  version: string;
  nodes: DocumentNode[];
  metadata: {
    totalWords: number;
    hasCode: boolean;
    hasTables: boolean;
    hasFormulas: boolean;
  };
}
