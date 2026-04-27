declare module "mammoth/mammoth.browser" {
  interface ConvertResult {
    value: string
    messages: Array<{ type: string; message: string }>
  }
  interface ConvertInput {
    arrayBuffer: ArrayBuffer
  }
  export function convertToHtml(input: ConvertInput): Promise<ConvertResult>
  export function extractRawText(input: ConvertInput): Promise<ConvertResult>
}
