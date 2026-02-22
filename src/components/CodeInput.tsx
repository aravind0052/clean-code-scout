import { useRef } from "react";
import { Upload, FileCode, Terminal } from "lucide-react";
import { Language, detectLanguage } from "@/lib/analyzer";

interface CodeInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const LANGUAGES: { value: Language; label: string; icon: string }[] = [
  { value: "python", label: "Python", icon: "🐍" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "c", label: "C", icon: "⚙️" },
];

const CodeInput = ({ code, onCodeChange, language, onLanguageChange, onAnalyze, isAnalyzing }: CodeInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const detected = detectLanguage(file.name);
    if (detected) onLanguageChange(detected);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onCodeChange(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              onClick={() => onLanguageChange(lang.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium font-mono transition-all ${
                language === lang.value
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {lang.icon} {lang.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.java,.c,.h"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={onAnalyze}
            disabled={!code.trim() || isAnalyzing}
            className="flex items-center gap-2 px-5 py-1.5 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all glow-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <span className="animate-pulse-glow">Analyzing...</span>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                Analyze Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code editor */}
      <div className="relative rounded-lg border border-border bg-muted overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/50">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono text-muted-foreground">
            source.{language === "python" ? "py" : language === "java" ? "java" : "c"}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">{lineCount} lines</span>
        </div>
        <div className="flex">
          {/* Line numbers */}
          <div className="flex-shrink-0 py-3 px-2 text-right select-none border-r border-border bg-secondary/30">
            {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
              <div key={i} className="text-xs font-mono text-muted-foreground/50 leading-6 h-6">
                {i + 1}
              </div>
            ))}
          </div>
          {/* Textarea */}
          <textarea
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder={`Paste your ${language === "python" ? "Python" : language === "java" ? "Java" : "C"} code here...`}
            className="flex-1 bg-transparent text-foreground font-mono text-sm p-3 resize-none outline-none min-h-[400px] leading-6 placeholder:text-muted-foreground/30"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeInput;
