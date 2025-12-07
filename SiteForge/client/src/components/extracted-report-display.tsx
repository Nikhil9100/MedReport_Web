import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, Pill, User, BarChart3 } from "lucide-react";
import type { MedicalReport, MedicalTest } from "@shared/schema";

interface ExtractedReportDisplayProps {
  report: MedicalReport;
  className?: string;
}

export function ExtractedReportDisplay({ report, className }: ExtractedReportDisplayProps) {
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

  const getRowColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-red-50";
      case "borderline":
        return "bg-amber-50";
      case "normal":
        return "bg-emerald-50";
      default:
        return "bg-white";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Patient Demographics Table */}
      <Card className="border-2 border-blue-300">
        <CardHeader className="bg-blue-100 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-900">
            <User className="h-5 w-5" />
            Patient Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-blue-200 hover:bg-blue-50">
                <td className="py-4 px-4 font-semibold text-gray-700 bg-blue-100 w-1/3">Age</td>
                <td className="py-4 px-4 text-gray-900 font-bold text-lg">{report.age} years</td>
              </tr>
              <tr className="border-b border-blue-200 hover:bg-blue-50">
                <td className="py-4 px-4 font-semibold text-gray-700 bg-blue-100 w-1/3">Gender</td>
                <td className="py-4 px-4 text-gray-900 font-bold text-lg">{report.gender}</td>
              </tr>
              <tr className="hover:bg-blue-50">
                <td className="py-4 px-4 font-semibold text-gray-700 bg-blue-100 w-1/3">Smoking Status</td>
                <td className="py-4 px-4 text-gray-900 font-bold text-lg">{report.smokingStatus || "Not specified"}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Diagnoses Table */}
      {report.diagnoses.length > 0 && (
        <Card className="border-2 border-red-300">
          <CardHeader className="bg-red-100 pb-3">
            <CardTitle className="text-base font-bold text-red-900">
              🔴 Diagnosed Conditions ({report.diagnoses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {report.diagnoses.map((diagnosis, idx) => (
                  <tr key={idx} className={`border-b border-red-200 ${idx % 2 === 0 ? "bg-red-50" : "bg-white"} hover:bg-red-100`}>
                    <td className="py-3 px-4 text-center w-12">
                      <span className="inline-block bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{diagnosis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Medical Tests Table - Professional Format */}
      {report.tests.length > 0 && (
        <Card className="border-2 border-gray-400">
          <CardHeader className="bg-gray-700 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              Medical Test Results ({report.tests.length} tests)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="py-3 px-4 text-left font-semibold">#</th>
                  <th className="py-3 px-4 text-left font-semibold">Test Name</th>
                  <th className="py-3 px-4 text-center font-semibold">Value</th>
                  <th className="py-3 px-4 text-center font-semibold">Unit</th>
                  <th className="py-3 px-4 text-center font-semibold">Reference Range</th>
                  <th className="py-3 px-4 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.tests.map((test: MedicalTest, idx: number) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-gray-300 ${getRowColor(test.status)} hover:opacity-80 transition`}
                  >
                    <td className="py-3 px-4 font-bold text-gray-800">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{test.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">{test.value}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{test.unit}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{test.range}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(test.status)}
                        <Badge className={`capitalize text-xs font-semibold ${getStatusBadgeColor(test.status)}`}>
                          {test.status}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Test Summary Stats */}
      {report.tests.length > 0 && (
        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">📊 Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-100 p-4 rounded-lg border-2 border-emerald-300 text-center">
                <div className="text-3xl font-bold text-emerald-700">
                  {report.tests.filter(t => t.status === "normal").length}
                </div>
                <div className="text-sm font-semibold text-emerald-600 mt-1">Normal Tests</div>
              </div>
              <div className="bg-amber-100 p-4 rounded-lg border-2 border-amber-300 text-center">
                <div className="text-3xl font-bold text-amber-700">
                  {report.tests.filter(t => t.status === "borderline").length}
                </div>
                <div className="text-sm font-semibold text-amber-600 mt-1">Borderline Tests</div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg border-2 border-red-300 text-center">
                <div className="text-3xl font-bold text-red-700">
                  {report.tests.filter(t => t.status === "high").length}
                </div>
                <div className="text-sm font-semibold text-red-600 mt-1">Abnormal Tests</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medications Table */}
      {report.medications && report.medications.length > 0 && (
        <Card className="border-2 border-green-300">
          <CardHeader className="bg-green-100 pb-3">
            <CardTitle className="text-base font-bold text-green-900 flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Current Medications ({report.medications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {report.medications.map((medication, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-green-200 ${idx % 2 === 0 ? "bg-green-50" : "bg-white"} hover:bg-green-100`}
                  >
                    <td className="py-3 px-4 text-center w-12 font-bold">
                      <span className="inline-block bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs">{idx + 1}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{medication}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Report Overview */}
      <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">📋 Report Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-300 text-center">
              <div className="text-xs font-bold text-gray-600 uppercase">Total Tests</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{report.tests.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-300 text-center">
              <div className="text-xs font-bold text-gray-600 uppercase">Diagnoses</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{report.diagnoses.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-300 text-center">
              <div className="text-xs font-bold text-gray-600 uppercase">Medications</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{report.medications?.length || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-red-300 text-center">
              <div className="text-xs font-bold text-red-600 uppercase">Critical Issues</div>
              <div className="text-3xl font-bold text-red-700 mt-2">{report.tests.filter(t => t.status === "high").length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
