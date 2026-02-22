import { useState, useCallback } from "react";
import { Code2, Zap } from "lucide-react";
import CodeInput from "@/components/CodeInput";
import AnalysisReportView from "@/components/AnalysisReportView";
import { analyzeCode, AnalysisReport, Language } from "@/lib/analyzer";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const SAMPLE_CODE: Record<Language, string> = {
  python: `# Bubble Sort Implementation
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

# Main execution
numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = bubble_sort(numbers)
result = binary_search(sorted_numbers, 22)
print(f"Found at index: {result}")
`,
  java: `public class SortExample {
    // Bubble sort implementation
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    public static int binarySearch(int[] arr, int target) {
        int low = 0;
        int high = arr.length - 1;
        while (low <= high) {
            int mid = (low + high) / 2;
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] numbers = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(numbers);
        int result = binarySearch(numbers, 22);
        System.out.println("Found at: " + result);
    }
}
`,
  c: `#include <stdio.h>

// Bubble sort implementation
void bubbleSort(int arr[], int n) {
    int i, j, temp;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int binarySearch(int arr[], int n, int target) {
    int low = 0;
    int high = n - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    int numbers[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(numbers) / sizeof(numbers[0]);
    bubbleSort(numbers, n);
    int result = binarySearch(numbers, n, 22);
    printf("Found at index: %d\\n", result);
    return 0;
}
`,
};

const Index = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("python");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = useCallback(() => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    // Small delay for UX feedback
    setTimeout(() => {
      const result = analyzeCode(code, language);
      setReport(result);
      setIsAnalyzing(false);
    }, 300);
  }, [code, language]);

  const handleExportPdf = useCallback(async () => {
    const el = document.getElementById("analysis-report");
    if (!el) return;
    const canvas = await html2canvas(el, {
      backgroundColor: "#0f1219",
      scale: 2,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("code-analysis-report.pdf");
  }, []);

  const loadSample = () => {
    setCode(SAMPLE_CODE[language]);
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 glow-primary">
              <Code2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gradient">Code Analyzer</h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Paste or upload your source code to get instant metrics, complexity analysis, quality checks, and optimization suggestions.
          </p>
          <button onClick={loadSample} className="mt-3 text-xs font-mono text-primary/70 hover:text-primary transition-colors underline underline-offset-2">
            <Zap className="w-3 h-3 inline mr-1" />
            Load sample {language} code
          </button>
        </header>

        {/* Input */}
        <CodeInput
          code={code}
          onCodeChange={setCode}
          language={language}
          onLanguageChange={setLanguage}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />

        {/* Report */}
        {report && (
          <div className="mt-10">
            <AnalysisReportView report={report} onExportPdf={handleExportPdf} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
