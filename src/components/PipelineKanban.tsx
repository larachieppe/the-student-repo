import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type Stage = "shortlisted" | "contacted" | "interviewing" | "hired" | "not_a_fit";

interface StudentInPipeline {
  id: string;
  studentId: string;
  stage: Stage;
  notes: string | null;
  updatedAt: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    school: string;
    graduation_year: string;
    major: string | null;
    skills: string[] | null;
    profile_picture_url: string | null;
  } | null;
}

const STAGES = [
  { key: "shortlisted" as Stage, label: "Shortlisted", color: "bg-blue-50" },
  { key: "contacted" as Stage, label: "Contacted", color: "bg-yellow-50" },
  { key: "interviewing" as Stage, label: "Interviewing", color: "bg-purple-50" },
  { key: "hired" as Stage, label: "Hired", color: "bg-green-50" },
  { key: "not_a_fit" as Stage, label: "Not a Fit", color: "bg-gray-50" },
];

interface PipelineKanbanProps {
  companyId: string;
}

export default function PipelineKanban({ companyId }: PipelineKanbanProps) {
  const [pipelineData, setPipelineData] = useState<StudentInPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentInPipeline | null>(null);
  const [notesText, setNotesText] = useState("");

  useEffect(() => {
    loadPipeline();
  }, [companyId]);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("student_pipeline")
        .select(`
          id,
          student_id,
          stage,
          notes,
          updated_at,
          student:submissions!student_pipeline_student_id_fkey (
            id,
            first_name,
            last_name,
            school,
            graduation_year,
            major,
            skills,
            profile_picture_url
          )
        `)
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading pipeline:", error);
        return;
      }

      const mapped: StudentInPipeline[] = (data || []).map((item: any) => ({
        id: item.id,
        studentId: item.student_id,
        stage: item.stage,
        notes: item.notes,
        updatedAt: item.updated_at,
        student: item.student,
      }));

      setPipelineData(mapped);
    } catch (err) {
      console.error("Unexpected error loading pipeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (studentId: string, newStage: Stage, newNotes?: string) => {
    try {
      const { error } = await supabase
        .from("student_pipeline")
        .upsert(
          {
            company_id: companyId,
            student_id: studentId,
            stage: newStage,
            notes: newNotes || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "company_id,student_id",
          }
        );

      if (error) {
        console.error("Error updating stage:", error);
        return;
      }

      await loadPipeline();
    } catch (err) {
      console.error("Unexpected error updating stage:", err);
    }
  };

  const openNotesModal = (student: StudentInPipeline) => {
    setSelectedStudent(student);
    setNotesText(student.notes || "");
    setNotesModalOpen(true);
  };

  const saveNotes = async () => {
    if (!selectedStudent) return;

    await updateStage(selectedStudent.studentId, selectedStudent.stage, notesText);
    setNotesModalOpen(false);
    setSelectedStudent(null);
    setNotesText("");
  };

  const getStudentsByStage = (stage: Stage) => {
    return pipelineData.filter((item) => item.stage === stage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track student conversion stages from shortlist to hire
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const studentsInStage = getStudentsByStage(stage.key);

          return (
            <div key={stage.key} className="flex flex-col">
              <div className={`${stage.color} rounded-t-lg p-3 border border-gray-200`}>
                <h3 className="font-semibold text-sm text-gray-800">
                  {stage.label}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {studentsInStage.length} {studentsInStage.length === 1 ? "student" : "students"}
                </p>
              </div>

              <div className="border-l border-r border-b border-gray-200 rounded-b-lg bg-white min-h-[300px] p-2 space-y-2">
                {studentsInStage.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No students in this stage
                  </p>
                ) : (
                  studentsInStage.map((item) => {
                    const student = item.student;
                    if (!student) return null;

                    const fullName = `${student.first_name} ${student.last_name}`;
                    const gradYear = student.graduation_year?.slice(-2) || "";
                    const schoolDisplay = `${student.school}${gradYear ? ` '${gradYear}` : ""}`;

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-2">
                          {student.profile_picture_url ? (
                            <img
                              src={student.profile_picture_url}
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                              {student.first_name.charAt(0)}
                              {student.last_name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {schoolDisplay}
                            </p>
                            {student.major && (
                              <p className="text-xs text-gray-500 truncate">
                                {student.major}
                              </p>
                            )}
                          </div>
                        </div>

                        {student.skills && student.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {student.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {student.skills.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{student.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-3 space-y-2">
                          <select
                            value={item.stage}
                            onChange={(e) =>
                              updateStage(item.studentId, e.target.value as Stage)
                            }
                            className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                          >
                            {STAGES.map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => openNotesModal(item)}
                            className="w-full text-xs px-2 py-1 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded transition"
                          >
                            {item.notes ? "Edit Notes" : "Add Notes"}
                          </button>
                        </div>

                        {item.notes && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <p className="line-clamp-2">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {notesModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Notes for{" "}
              {selectedStudent.student
                ? `${selectedStudent.student.first_name} ${selectedStudent.student.last_name}`
                : "Student"}
            </h3>

            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add internal notes about this student..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-blue resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={saveNotes}
                className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:brightness-95 transition"
              >
                Save Notes
              </button>
              <button
                onClick={() => {
                  setNotesModalOpen(false);
                  setSelectedStudent(null);
                  setNotesText("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
