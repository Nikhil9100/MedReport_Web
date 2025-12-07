import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, Activity, Info } from "lucide-react";
import type { MedicalReport, MedicalTest } from "@shared/schema";

interface ExtractedReportDisplayProps {
  report: MedicalReport;
  className?: string;
}

export function ExtractedReportDisplay({ report, className }: ExtractedReportDisplayProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-red-100 text-red-800 border-l-4 border-red-500";
      case "borderline":
        return "bg-amber-50 text-amber-900 border-l-4 border-amber-400";
      case "normal":
        return "bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-red-100 text-red-700 border border-red-300";
      case "borderline":
        return "bg-amber-100 text-amber-700 border border-amber-300";
      case "normal":
        return "bg-emerald-100 text-emerald-700 border border-emerald-300";
      default:
        return "bg-gray-100 text-gray-700";
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

  const abnormalTests = report.tests.filter(t => t.status === "high" || t.status === "borderline");

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Abnormal/Borderline Tests Summary */}
      {abnormalTests.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-gray-900">
              ⚠️ Abnormal & Borderline Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {abnormalTests.map((test: MedicalTest, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${getStatusColor(test.status)} transition-all`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      {test.name} of {test.value} {test.unit} exceeds normal range of {test.range}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-lg font-bold text-gray-900">+15</span>
                    <p className="text-xs text-gray-600">risk score</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Patient Information */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                📅 Age
              </p>
              <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-2xl font-bold text-gray-900">{report.age}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gender</p>
              <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-lg font-semibold text-gray-900">{report.gender}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                🏥 Diagnoses
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {report.diagnoses.map((diagnosis, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {diagnosis}
                    <span className="ml-1 cursor-pointer hover:font-bold">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Values Table */}
      {report.tests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              🧪 Medical Values{" "}
              <span className="text-sm font-normal text-blue-600 cursor-pointer hover:underline">
                (Click to edit)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-white">
                    <th className="text-left py-3 px-0 font-semibold text-gray-700">Test</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Value</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {report.tests.map((test: MedicalTest, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-0">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-1 h-8 rounded-l ${
                              test.status === "high"
                                ? "bg-red-500"
                                : test.status === "borderline"
                                  ? "bg-amber-400"
                                  : "bg-emerald-500"
                            }`}
                          ></div>
                          <div>
                            <p className="font-medium text-gray-900">{test.name}</p>
                            <p className="text-xs text-gray-500 hidden sm:block">
                              {test.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">
                          {test.value} <span className="text-gray-600 font-normal text-xs">{test.unit}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{test.range}</td>
                      <td className="py-3 px-4">
                        <Badge className={`capitalize text-xs ${getStatusBadgeColor(test.status)}`}>
                          {test.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-gray-600 hover:text-gray-900 p-1">
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Test Status Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {report.tests.filter(t => t.status === "high").length}
                  </p>
                  <p className="text-xs text-gray-600">High/Abnormal</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {report.tests.filter(t => t.status === "borderline").length}
                  </p>
                  <p className="text-xs text-gray-600">Borderline</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {report.tests.filter(t => t.status === "normal").length}
                  </p>
                  <p className="text-xs text-gray-600">Normal</p>
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
            <CardTitle className="text-lg font-bold text-green-900">
              💊 Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.medications.map((medication, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border-l-4 border-green-500"
                >
                  <span className="text-lg">💊</span>
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
