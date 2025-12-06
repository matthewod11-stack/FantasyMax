'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  parseCsvFile,
  generateCsvTemplate,
  type CsvImportType,
  type ParseResult,
} from '@/lib/import/csv-parser';

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

interface ImportState {
  step: ImportStep;
  type: CsvImportType;
  file: File | null;
  parseResult: ParseResult<unknown> | null;
  importResult: {
    success: boolean;
    created: number;
    updated: number;
    errors: string[];
  } | null;
}

const importTypes: { id: CsvImportType; label: string; description: string }[] = [
  { id: 'members', label: 'Members', description: 'League managers' },
  { id: 'seasons', label: 'Seasons', description: 'Season configurations' },
  { id: 'teams', label: 'Teams', description: 'Team records per season' },
  { id: 'matchups', label: 'Matchups', description: 'Weekly matchup results' },
  { id: 'trades', label: 'Trades', description: 'Trade history' },
];

export default function CsvImportPage() {
  const [activeTab, setActiveTab] = useState<CsvImportType>('members');
  const [importState, setImportState] = useState<ImportState>({
    step: 'upload',
    type: 'members',
    file: null,
    parseResult: null,
    importResult: null,
  });

  const handleDownloadTemplate = (type: CsvImportType) => {
    const csv = generateCsvTemplate(type);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fantasymax-${type}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: CsvImportType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportState((prev) => ({
      ...prev,
      step: 'preview',
      type,
      file,
      parseResult: null,
    }));

    const result = await parseCsvFile(file, type);
    setImportState((prev) => ({
      ...prev,
      parseResult: result,
    }));
  };

  const handleImport = async () => {
    if (!importState.parseResult || importState.parseResult.data.length === 0) return;

    setImportState((prev) => ({ ...prev, step: 'importing' }));

    try {
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importState.type,
          data: importState.parseResult.data,
        }),
      });

      const result = await response.json();

      setImportState((prev) => ({
        ...prev,
        step: 'complete',
        importResult: result,
      }));
    } catch (error) {
      setImportState((prev) => ({
        ...prev,
        step: 'complete',
        importResult: {
          success: false,
          created: 0,
          updated: 0,
          errors: [error instanceof Error ? error.message : 'Import failed'],
        },
      }));
    }
  };

  const resetImport = () => {
    setImportState({
      step: 'upload',
      type: activeTab,
      file: null,
      parseResult: null,
      importResult: null,
    });
  };

  const renderUploadStep = (type: CsvImportType) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Upload CSV File</h3>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with your {type} data
          </p>
        </div>
        <Button variant="outline" onClick={() => handleDownloadTemplate(type)}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <Label htmlFor={`file-${type}`} className="cursor-pointer">
          <span className="text-primary hover:underline">Click to upload</span>
          <span className="text-muted-foreground"> or drag and drop</span>
        </Label>
        <Input
          id={`file-${type}`}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFileSelect(e, type)}
        />
        <p className="text-xs text-muted-foreground mt-2">CSV files only</p>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!importState.parseResult) {
      return <p>Loading...</p>;
    }

    const { data, errors, totalRows } = importState.parseResult;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">Preview Import</h3>
            <p className="text-sm text-muted-foreground">
              {data.length} valid rows, {errors.length} errors
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={resetImport}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={data.length === 0}>
              <Upload className="mr-2 h-4 w-4" />
              Import {data.length} Records
            </Button>
          </div>
        </div>

        {errors.length > 0 && (
          <Card className="border-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors.length} Validation Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-32 overflow-auto text-sm">
                {errors.slice(0, 10).map((err, i) => (
                  <p key={i} className="text-muted-foreground">
                    Row {err.row}: {err.message}
                  </p>
                ))}
                {errors.length > 10 && (
                  <p className="text-muted-foreground">...and {errors.length - 10} more</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Data Preview (first 10 rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data[0]
                      ? Object.keys(data[0] as Record<string, unknown>).map((key) => (
                          <TableHead key={key} className="whitespace-nowrap">
                            {key}
                          </TableHead>
                        ))
                      : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row as Record<string, unknown>).map((value, j) => (
                        <TableCell key={j} className="whitespace-nowrap">
                          {String(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCompleteStep = () => {
    if (!importState.importResult) return null;

    const { success, created, updated, errors } = importState.importResult;

    return (
      <div className="space-y-4">
        <Card className={success ? 'border-green-500' : 'border-destructive'}>
          <CardContent className="pt-6">
            <div className="text-center">
              {success ? (
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              ) : (
                <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              )}
              <h3 className="text-lg font-medium">
                {success ? 'Import Successful' : 'Import Failed'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Created: {created} | Updated: {updated}
              </p>
              {errors.length > 0 && (
                <div className="mt-4 text-sm text-destructive">
                  {errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button onClick={resetImport}>Import More Data</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">CSV Import</h1>
        <p className="text-muted-foreground">
          Import your league&apos;s historical data from CSV files
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Order</CardTitle>
          <CardDescription>
            For best results, import data in this order to ensure proper relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {importTypes.map((type, index) => (
              <div key={type.id} className="flex items-center gap-2">
                <Badge
                  variant={activeTab === type.id ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setActiveTab(type.id);
                    resetImport();
                  }}
                >
                  {index + 1}. {type.label}
                </Badge>
                {index < importTypes.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as CsvImportType);
          resetImport();
        }}
      >
        <TabsList>
          {importTypes.map((type) => (
            <TabsTrigger key={type.id} value={type.id}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {importTypes.map((type) => (
          <TabsContent key={type.id} value={type.id}>
            <Card>
              <CardHeader>
                <CardTitle>{type.label}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {importState.step === 'upload' && renderUploadStep(type.id)}
                {importState.step === 'preview' &&
                  importState.type === type.id &&
                  renderPreviewStep()}
                {importState.step === 'importing' && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Importing data...</p>
                  </div>
                )}
                {importState.step === 'complete' &&
                  importState.type === type.id &&
                  renderCompleteStep()}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
