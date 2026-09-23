import React from 'react';
import { BarChart3, Car, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { REPORT_TEMPLATES } from '../constants';
import { notify } from '../../utils/notify';

const iconMap = {
  file: FileText,
  chart: BarChart3,
  car: Car,
} as const;

export function AccidentReportsTab() {
  const handleGenerate = (title: string) => {
    notify.success(`${title} generation started — download will begin shortly`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {REPORT_TEMPLATES.map((template) => {
        const Icon = iconMap[template.icon];
        return (
          <Card key={template.id} className="border shadow-none hover:border-[#193cb8]/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Icon className="h-5 w-5 text-[#193cb8]" />
                {template.title}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleGenerate(template.title)}
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
