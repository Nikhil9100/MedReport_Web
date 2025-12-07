import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import type { MedicalReport, MedicalTest } from "@shared/schema";

interface MedicalReportViewerProps {
  report: MedicalReport;
  className?: string;
}

export function MedicalReportViewer({ report, className }: MedicalReportViewerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "borderline":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "normal":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "borderline":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "high":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Patient Information */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-gray-600">Age</p>
              <p className="text-2xl font-bold text-gray-900">{report.age}</p>
              <p className="text-xs text-gray-500">years old</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-gray-600">Gender</p>
              <p className="text-2xl font-bold text-gray-900">{report.gender}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-gray-600">Smoking Status</p>
              <p className="text-xl font-bold text-gray-900">{report.smokingStatus}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">{report.tests.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnoses */}
      {report.diagnoses.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-red-900">
              🔴 Diagnoses ({report.diagnoses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {report.diagnoses.map((diagnosis, idx) => (
                <Badge key={idx} variant="destructive" className="text-sm px-3 py-2">
                  {diagnosis}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {report.tests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-gray-900">
              🧪 Test Results ({report.tests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Test Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Value</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference Range</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.tests.map((test: MedicalTest, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{test.name}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">
                          {test.value} <span className="text-gray-600 font-normal">{test.unit}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{test.range}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.status)}
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${getStatusColor(test.status)}`}
                          >
                            {test.status}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Status Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-gray-600">Normal</p>
                    <p className="text-lg font-bold">{report.tests.filter(t => t.status === "normal").length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-600">Borderline</p>
                    <p className="text-lg font-bold">{report.tests.filter(t => t.status === "borderline").length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-600">High/Abnormal</p>
                    <p className="text-lg font-bold">{report.tests.filter(t => t.status === "high").length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medications */}
      {report.medications && report.medications.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-green-900">
              💊 Current Medications ({report.medications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.medications.map((medication, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                  <p className="font-medium text-gray-900">{medication}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
