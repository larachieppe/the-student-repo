import { useState, useEffect } from "react";
import { supabase } from "../supabase";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  school: string;
  graduation_year: string;
  major: string;
  skills: string[];
  profile_picture_url: string | null;
}

interface PipelineEntry {
  id: string;
  student_id: string;
  stage: string;
  notes: string | null;
  updated_at: string;
  student: Student;
}

interface PipelineKanbanProps {
  companyId: string;
}

const STAGES = [
  { key: "shortlisted", label: "Shortlisted", color: "bg-blue-50" },
  { key: "contacted", label: "Contacted", color: "bg-yellow-50" },
  { key: "interviewing", label: "Interviewing", color: "bg-purple-50" },
  { key: "hired", label: "Hired", color: "bg-green-50" },
  { key: "not_a_fit", label: "Not a Fit", color: "bg-gray-50" },
];

export default function PipelineKanban({ companyId }: PipelineKanbanProps) {
  const [pipelineData, setPipelineData] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<PipelineEntry | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Load pipeline data
  useEffect(() => {
    if (!companyId) return;

    const loadPipeline = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("student_pipeline")
          .select(
            `
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
          `
          )
          .eq("company_id", companyId)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error loading pipeline:", error);
          return;
        }

        // Flatten the student data
        const formattedData: PipelineEntry[] = (data || []).map((entry: any) => ({
          id: entry.id,
          student_id: entry.student_id,
          stage: entry.stage,
          notes: entry.notes,
          updated_at: entry.updated_at,
          student: Array.isArray(entry.student) ? entry.student[0] : entry.student,
        }));

        setPipelineData(formattedData);
      } catch (err) {
        console.error("Unexpected error loading pipeline:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPipeline();
  }, [companyId]);

  // Get students for a specific stage
  const getStudentsByStage = (stage: string) => {
    return pipelineData.filter((entry) => entry.stage === stage);
  };

  // Update student stage
  const updateStage = async (studentId: string, newStage: string, newNotes?: string) => {
    if (!companyId) return;

    setUpdating(true);
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
        alert("Failed to update stage. Please try again.");
        return;
      }

      // Update local state
      setPipelineData((prev) => {
        const existing = prev.find((e) => e.student_id === studentId);
        if (existing) {
          return prev.map((e) =>
            e.student_id === studentId
              ? { ...e, stage: newStage, notes: newNotes || e.notes, updated_at: new Date().toISOString() }
              : e
          );
        }
        return prev;
      });

      setShowNotesModal(false);
      setSelectedStudent(null);
      setNotes("");
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Failed to update stage. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Open notes modal
  const openNotesModal = (entry: PipelineEntry) => {
    setSelectedStudent(entry);
    setNotes(entry.notes || "");
    setShowNotesModal(true);
  };

  // Handle stage change from dropdown
  const handleStageChange = (entry: PipelineEntry, newStage: string) => {
    if (newStage === entry.stage) return;

    setSelectedStudent(entry);
    setNotes(entry.notes || "");

    // Ask if they want to add notes
    const confirmed = window.confirm(
      `Move ${entry.student.first_name} ${entry.student.last_name} to "${STAGES.find((s) => s.key === newStage)?.label}"?\n\nClick OK to confirm, or Cancel to add notes.`
    );

    if (confirmed) {
      updateStage(entry.student_id, newStage, entry.notes || undefined);
    } else {
      // Open notes modal for them to add notes
      setShowNotesModal(true);
    }
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
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const students = getStudentsByStage(stage.key);

          return (
            <div key={stage.key} className="flex flex-col">
              {/* Column Header */}
              <div className={`${stage.color} rounded-t-xl p-3 border-b border-gray-200`}>
                <h3 className="font-semibold text-sm text-gray-900">
                  {stage.label}
                  <span className="ml-2 text-xs text-gray-500">({students.length})</span>
                </h3>
              </div>

              {/* Column Content */}
              <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-2 min-h-[400px] space-y-2">
                {students.length === 0 ? (
                  <div className="flex items-center justify-center h-20">
                    <p className="text-xs text-gray-400">No students</p>
                  </div>
                ) : (
                  students.map((entry) => (
                    <StudentCard
                      key={entry.id}
                      entry={entry}
                      onStageChange={handleStageChange}
                      onViewNotes={() => openNotesModal(entry)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNotesModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Stage for {selectedStudent.student.first_name} {selectedStudent.student.last_name}
            </h3>

            {/* Stage Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Stage
              </label>
              <select
                value={selectedStudent.stage}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {STAGES.map((stage) => (
                  <option key={stage.key} value={stage.key}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Add internal notes about this student..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStage(selectedStudent.student_id, selectedStudent.stage, notes)}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition disabled:opacity-60"
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Student Card Component
interface StudentCardProps {
  entry: PipelineEntry;
  onStageChange: (entry: PipelineEntry, newStage: string) => void;
  onViewNotes: () => void;
}

function StudentCard({ entry, onStageChange, onViewNotes }: StudentCardProps) {
  const student = entry.student;
  const gradYear = student.graduation_year?.slice(-2) || "";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition cursor-pointer">
      <div className="flex items-start gap-2">
        {/* Profile Picture */}
        {student.profile_picture_url ? (
          <img
            src={student.profile_picture_url}
            alt={`${student.first_name} ${student.last_name}`}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-gray-500">
              {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {student.first_name} {student.last_name}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {student.school} '{gradYear}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {student.major}
          </p>

          {/* Stage Dropdown */}
          <select
            value={entry.stage}
            onChange={(e) => {
              e.stopPropagation();
              onStageChange(entry, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full mt-2 text-xs px-2 py-1 border border-gray-300 rounded"
          >
            {STAGES.map((stage) => (
              <option key={stage.key} value={stage.key}>
                {stage.label}
              </option>
            ))}
          </select>

          {/* Notes Button */}
          {entry.notes && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewNotes();
              }}
              className="mt-2 text-xs text-brand-blue hover:underline"
            >
              View Notes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
