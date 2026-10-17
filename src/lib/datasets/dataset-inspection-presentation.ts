const formats: Record<string, string> = {
  UTF8_CSV_SYNTAX_V1: "CSV · UTF-8 text",
  UTF8_TSV_SYNTAX_V1: "TSV · UTF-8 text",
  UTF8_JSONL_SYNTAX_V1: "JSON Lines · UTF-8 text",
  RIFF_INTEGER_PCM_WAVE_V1: "WAV · integer PCM audio",
  PNG_STATIC_8BIT_V1: "PNG · static 8-bit image",
  ZIP32_CONTAINER_V1: "ZIP32 archive",
};
export const recordedFormatLabel = (profile: string) =>
  Object.hasOwn(formats, profile) ? formats[profile] : "Other recorded format";
export const recordedResultLabel = (result: string) =>
  ({
    COMPLETE: "Format check completed",
    STRUCTURE_ONLY: "Structure checked only",
    UNSUPPORTED: "Unsupported content",
    NOT_CHECKED: "Not checked",
    FAILED: "Format check failed",
  })[result] ?? "Result unavailable";
const labels: Record<string, string> = {
  dataRecordCount: "Data records",
  recordCount: "Parsed records",
  columnCount: "Columns",
  headerConvention: "Declared header",
  recordKind: "JSON record shape",
  utf8Bom: "UTF-8 byte order marker",
  channels: "Channels",
  sampleRate: "Sample rate (Hz)",
  bitsPerSample: "Bits per sample",
  sampleFrames: "Sample frames",
  dataBytes: "Audio data bytes",
  width: "Width (pixels)",
  height: "Height (pixels)",
  bitDepth: "Bit depth",
  pixelCount: "Pixels",
  alphaChannel: "Alpha channel",
  transparencyKey: "Transparency key",
  paletteEntries: "Palette entries",
  entryCount: "Archive entries",
  fileCount: "Files",
  directoryCount: "Directories",
  expandedBytes: "Expanded bytes",
  archiveBytes: "Archive bytes",
  decodedRows: "Decoded image rows",
};
const basic = new Set(Object.keys(labels));
export function recordedMeasurements(
  facts: Record<string, string | number | boolean | null>
) {
  const rows = Object.entries(facts)
    .filter(([key]) => basic.has(key))
    .map(([key, value]) => ({
      key,
      label: labels[key],
      value:
        value === null
          ? "Not measured"
          : typeof value === "boolean"
            ? value
              ? "Yes"
              : "No"
            : key === "headerConvention"
              ? ({
                  PRESENT: "Present",
                  ABSENT: "Absent",
                  NOT_APPLICABLE: "Not applicable",
                }[String(value)] ?? String(value))
              : String(value),
    }));
  const numerator = facts.durationNumerator,
    denominator = facts.durationDenominator;
  if (
    typeof numerator === "string" &&
    /^(0|[1-9][0-9]{0,30})$/.test(numerator) &&
    typeof denominator === "number" &&
    Number.isSafeInteger(denominator) &&
    denominator > 0
  ) {
    const scale = BigInt(1000),
      zero = BigInt(0);
    const milliseconds = (BigInt(numerator) * scale) / BigInt(denominator);
    rows.push({
      key: "duration",
      label: "Audio duration",
      value:
        BigInt(numerator) > zero && milliseconds === zero
          ? "Less than 0.001 seconds"
          : `${milliseconds / scale}.${String(milliseconds % scale).padStart(3, "0")} seconds (rounded down to milliseconds)`,
    });
  }
  return rows;
}
