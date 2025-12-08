import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Pill, User, BarChart3 } from "lucide-react";
import type { ExtractedMedicalReport } from "../../../shared/schema";

interface ExtractedReportDisplayProps {
  report: ExtractedMedicalReport;
  className?: string;
}

export function ExtractedReportDisplay({ report, className }: ExtractedReportDisplayProps) {
  const lowConf = (c?: number | null) => (c ?? 0) < 0.7;

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
                <td className="py-4 px-4 text-gray-900 font-bold text-lg">{report.patient.age != null ? `${report.patient.age} years` : "—"}</td>
              </tr>
              <tr className="border-b border-blue-200 hover:bg-blue-50">
                <td className="py-4 px-4 font-semibold text-gray-700 bg-blue-100 w-1/3">Gender</td>
                <td className="py-4 px-4 text-gray-900 font-bold text-lg">{report.patient.gender ?? "—"}</td>
              </tr>
              <tr className="hover:bg-blue-50">
                <td className="py-4 px-4 font-semibold text-gray-700 bg-blue-100 w-1/3">Smoking Status</td>
                <td className={`py-4 px-4 font-bold text-lg ${lowConf(report.smoking_status.confidence) ? "text-amber-700" : "text-gray-900"}`}>
                  {report.smoking_status.status ?? "Not specified"}
                </td>
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
                {report.diagnoses.map((d, idx) => (
                  <tr key={idx} className={`border-b border-red-200 ${idx % 2 === 0 ? "bg-red-50" : "bg-white"} hover:bg-red-100`}>
                    <td className="py-3 px-4 text-center w-12">
                      <span className="inline-block bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {d.name}
                      {lowConf(d.confidence) && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 border border-amber-300 text-xs">low confidence</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Medical Tests Table - Professional Format */}
      {report.tests.length > 0 && (
        <Card className="border-2 border-gray-300 bg-white">
          <CardHeader className="bg-gray-100 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
              <BarChart3 className="h-5 w-5" />
              Medical Test Results ({report.tests.length} tests)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-900">
                  <th className="py-3 px-4 text-left font-semibold">#</th>
                  <th className="py-3 px-4 text-left font-semibold">Test Name</th>
                  <th className="py-3 px-4 text-center font-semibold">Value</th>
                  <th className="py-3 px-4 text-center font-semibold">Unit</th>
                  <th className="py-3 px-4 text-center font-semibold">Ref Low</th>
                  <th className="py-3 px-4 text-center font-semibold">Ref High</th>
                  <th className="py-3 px-4 text-center font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {report.tests.map((t, idx: number) => (
                  <tr 
                    key={idx}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition ${lowConf(t.confidence) ? "bg-amber-50" : "bg-white"}`}
                  >
                    <td className="py-3 px-4 font-bold text-gray-800">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{t.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">{t.value as any}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{t.unit ?? ""}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{t.ref_low ?? ""}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{t.ref_high ?? ""}</td>
                    <td className="py-3 px-4 text-center">
                      {lowConf(t.confidence) ? (
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs">low</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs">high</Badge>
                      )}
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
                {report.medications.map((m, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-green-200 ${idx % 2 === 0 ? "bg-green-50" : "bg-white"} hover:bg-green-100`}
                  >
                    <td className="py-3 px-4 text-center w-12 font-bold">
                      <span className="inline-block bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs">{idx + 1}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {m.name}
                      {m.dose ? ` • ${m.dose}` : ""} {m.frequency ? ` • ${m.frequency}` : ""}
                      {lowConf(m.confidence) && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 border border-amber-300 text-xs">low confidence</Badge>
                      )}
                    </td>
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
              <div className="text-3xl font-bold text-red-700 mt-2">{report.warnings.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Vitals */}
      <Card className="border-2 border-gray-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">🩺 Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className={`bg-white p-4 rounded-lg border ${lowConf(report.vitals.confidence) ? "border-amber-300 bg-amber-50" : "border-gray-300"}`}>
              <div className="text-xs font-bold text-gray-600 uppercase">Blood Pressure</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{report.vitals.bp ?? "—"}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="text-xs font-bold text-gray-600 uppercase">Heart Rate</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{report.vitals.hr ?? "—"}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="text-xs font-bold text-gray-600 uppercase">SpO₂</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{report.vitals.spo2 ?? "—"}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="text-xs font-bold text-gray-600 uppercase">Temp (°C)</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{report.vitals.temp_c ?? "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              Warnings ({report.warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 text-sm text-amber-900">
              {report.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
