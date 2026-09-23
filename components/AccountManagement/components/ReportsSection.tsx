import React, { useState } from 'react';
import { BarChart3, Download, FileText, Loader2, Target } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { notify } from '../../utils/notify';
import { accountApi } from '../../utils/api';

const REPORTS = [
  {
    id: 'summary',
    title: 'Financial Summary Report',
    description: 'Complete financial overview across all operations',
    icon: FileText,
  },
  {
    id: 'revenue',
    title: 'Revenue Analysis',
    description: 'Detailed revenue breakdown by source and region',
    icon: BarChart3,
  },
  {
    id: 'budget',
    title: 'Budget Performance',
    description: 'Budget vs actual spending analysis',
    icon: Target,
  },
];

export function ReportsSection() {
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleGenerate = async (id: string, title: string) => {
    setExportingId(id);
    try {
      const response = await accountApi.exportReport({ format: 'pdf', tab: id });
      if (response.success) {
        notify.success(`${title} generated successfully`);
      } else {
        notify.error(response.error || 'Failed to generate report');
      }
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {REPORTS.map(({ id, title, description, icon: Icon }) => (
        <Card key={id} className="border shadow-none hover:border-[#193cb8]/20 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-md bg-muted/60 p-2.5">
                <Icon className="h-5 w-5 text-[#193cb8]" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={exportingId === id}
              onClick={() => void handleGenerate(id, title)}
            >
              {exportingId === id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
