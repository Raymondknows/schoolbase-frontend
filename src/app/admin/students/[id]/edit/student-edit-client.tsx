"use client";

import { getBackendUrl } from "@/lib/backend-url";




import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, ChevronDown, ChevronLeft } from "lucide-react";
import { pupilName } from "@/lib/format";
import { resolveFileUrl } from "@/lib/api-client";

export default function StudentEditClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [address, setAddress] = useState("");

  const [guardianFirst, setGuardianFirst] = useState("");
  const [guardianLast, setGuardianLast] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("Parent");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianAltPhone, setGuardianAltPhone] = useState("");
  const [guardianOccupation, setGuardianOccupation] = useState("");

  const [bloodGroup, setBloodGroup] = useState("");
  const [genotype, setGenotype] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [previousSchool, setPreviousSchool] = useState("");
  const [previousClass, setPreviousClass] = useState("");

  const [classes, setClasses] = useState<any[]>([]);
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load student data
        const studentResponse = await fetch(`/api/admin/students/${studentId}`);
        if (!studentResponse.ok) {
          throw new Error("Failed to load student");
        }
        const studentData = await studentResponse.json();
        setStudent(studentData);

        // Populate form fields
        setFirstName(studentData.firstName || "");
        setMiddleName(studentData.middleName || "");
        setLastName(studentData.lastName || "");
        setStudentEmail(studentData.studentEmail || "");
        setStudentPhone(studentData.studentPhone || "");
        setGender(studentData.gender || "Male");
        setDateOfBirth(studentData.dateOfBirth ? studentData.dateOfBirth.split("T")[0] : "");
        setAdmissionDate(studentData.admissionDate ? studentData.admissionDate.split("T")[0] : "");
        setClassId(studentData.classId || "");
        setStatus(studentData.status || "ACTIVE");
        setAddress(studentData.address || "");
        setBloodGroup(studentData.bloodGroup || "");
        setGenotype(studentData.genotype || "");
        setMedicalNotes(studentData.medicalNotes || "");
        setPreviousSchool(studentData.previousSchool || "");
        setPreviousClass(studentData.previousClass || "");

        // Load guardian data if exists
        if (studentData.guardians && studentData.guardians.length > 0) {
          const g = studentData.guardians[0];
          setGuardianFirst(g.guardian?.firstName || "");
          setGuardianLast(g.guardian?.lastName || "");
          setGuardianRelationship(g.relationship || "Parent");
          setGuardianEmail(g.guardian?.email || "");
          setGuardianPhone(g.guardian?.whatsapp || g.guardian?.phone || "");
          setGuardianAltPhone(g.guardian?.altPhone || "");
          setGuardianOccupation(g.guardian?.occupation || "");
        }

        // Set photo preview if exists
        if (studentData.photoUrl) {
          const resolvedUrl = resolveFileUrl(studentData.photoUrl, studentData.id);
          if (resolvedUrl) {
            setPhotoPreview(resolvedUrl);
          }
        }

        // Load classes
        const backendUrl = getBackendUrl();
        const classesResponse = await fetch(`${backendUrl}/api/admin/students/data`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setClasses(classesData.classes || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [studentId]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("lastName", lastName);
      formData.append("firstName", firstName);
      formData.append("middleName", middleName);
      formData.append("classId", classId);
      formData.append("status", status);
      formData.append("admissionDate", admissionDate || new Date().toISOString().split("T")[0]);
      formData.append("gender", gender);
      formData.append("dateOfBirth", dateOfBirth);
      formData.append("studentEmail", studentEmail);
      formData.append("studentPhone", studentPhone);
      formData.append("address", address);
      formData.append("bloodGroup", bloodGroup);
      formData.append("genotype", genotype);
      formData.append("medicalNotes", medicalNotes);
      formData.append("previousSchool", previousSchool);
      formData.append("previousClass", previousClass);
      formData.append("guardianFirst", guardianFirst);
      formData.append("guardianLast", guardianLast);
      formData.append("guardianRelationship", guardianRelationship);
      formData.append("guardianEmail", guardianEmail);
      formData.append("guardianPhone", guardianPhone);
      formData.append("guardianAltPhone", guardianAltPhone);
      formData.append("guardianOccupation", guardianOccupation);

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update student");
      }

      router.push(`/admin/students/${studentId}?updated=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading student information...</div>;
  }

  if (error && !student) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-0">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm py-1.5 -mx-6 px-6 mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/students/${studentId}`}>
            <ChevronLeft className="h-5 w-5 text-muted hover:text-foreground transition" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit Student</h1>
            <p className="mt-0.5 text-sm text-muted">Update {student?.firstName} {student?.lastName}'s information</p>
          </div>
          <Button variant="secondary" href={`/admin/students/${studentId}`}>
            Cancel
          </Button>
          <Button type="submit" form="edit-student-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>

      <form id="edit-student-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Error Alert */}
        {error && (
          <div className="lg:col-span-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Left: photo card (sticky) */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm lg:sticky lg:top-28">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Profile photo</p>
                <p className="mt-1 text-sm text-muted">Upload a clear student portrait for the profile card.</p>
              </div>
              <div className="rounded-full bg-surface/80 p-2 text-muted">
                <Upload className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-dashed border-border/70 bg-surface/80 p-4 text-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Selected student photo" className="mx-auto h-40 w-40 rounded-3xl object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-3xl bg-surface/80 text-muted">
                  <span className="text-sm">No photo selected</span>
                </div>
              )}
            </div>

            <label className="mt-5 block text-sm font-semibold text-foreground">
              Upload photo
              <input name="photo" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handlePhotoChange} className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:text-white" />
            </label>
            <p className="mt-3 text-xs leading-5 text-muted">JPG, PNG or WEBP. Keep the file under 4MB and use a square image for best layout.</p>

            <div className="mt-6 space-y-2 text-sm text-muted border-t border-border pt-6">
              <div>
                <p className="text-xs text-muted uppercase">Admission Number</p>
                <p className="font-semibold text-foreground">{student?.admissionNo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: main form fields */}
        <div className="lg:col-span-2 space-y-2">
          {/* Admission Details */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold text-foreground">
                Class *
                <select name="classId" value={classId} onChange={(e) => setClassId(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}{item.arm ? ` ${item.arm}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-foreground">
                Status
                <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-foreground">
                Admission date
                <input name="admissionDate" type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>
            </div>
          </div>

          {/* Student Information */}
          <div className="rounded-lg border border-border bg-surface p-4 mb-3">
            <h3 className="text-lg font-semibold text-foreground mb-4">Student information</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold text-foreground">
                Surname *
                <input name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                First name *
                <input name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Middle name
                <input name="middleName" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Gender *
                <select name="gender" value={gender} onChange={(e) => setGender(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-foreground">
                Date of birth
                <input name="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Email
                <input name="studentEmail" type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@example.com" className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Phone number
                <input name="studentPhone" type="tel" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} placeholder="+234..." className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground lg:col-span-3">
                Address
                <textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>
            </div>
          </div>

          {/* Parent / Guardian Information */}
          <div className="rounded-lg border border-border bg-surface p-4 mb-3">
            <h3 className="text-lg font-semibold text-foreground mb-4">Parent / Guardian information</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold text-foreground">
                First name
                <input name="guardianFirst" value={guardianFirst} onChange={(e) => setGuardianFirst(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Last name
                <input name="guardianLast" value={guardianLast} onChange={(e) => setGuardianLast(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Relationship *
                <select name="guardianRelationship" value={guardianRelationship} onChange={(e) => setGuardianRelationship(e.target.value)} required className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10">
                  <option value="Parent">Parent</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-foreground">
                Phone number *
                <input name="guardianPhone" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} required placeholder="+234..." className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Alternative phone
                <input name="guardianAltPhone" value={guardianAltPhone} onChange={(e) => setGuardianAltPhone(e.target.value)} placeholder="Optional" className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Email
                <input name="guardianEmail" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} type="email" placeholder="guardian@example.com" className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>

              <label className="text-sm font-semibold text-foreground">
                Occupation
                <input name="guardianOccupation" value={guardianOccupation} onChange={(e) => setGuardianOccupation(e.target.value)} placeholder="Optional" className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
              </label>
            </div>
          </div>

          {/* Medical Information (collapsible) */}
          <div className="rounded-lg border border-border bg-surface p-0 mb-3">
            <button type="button" onClick={() => setMedicalOpen((v) => !v)} className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/90 transition">
              <div className="flex items-center gap-3">
                <ChevronDown className={`h-5 w-5 text-muted transition-transform ${medicalOpen ? "rotate-180" : ""}`} />
                <div>
                  <h4 className="text-lg font-semibold text-foreground">Medical information</h4>
                  <p className="mt-1 text-sm text-muted">Optional medical details (expand to edit).</p>
                </div>
              </div>
            </button>

            {medicalOpen && (
              <div className="border-t border-border p-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm font-semibold text-foreground">
                    Blood group
                    <input name="bloodGroup" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
                  </label>

                  <label className="text-sm font-semibold text-foreground">
                    Genotype
                    <input name="genotype" value={genotype} onChange={(e) => setGenotype(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
                  </label>

                  <label className="text-sm font-semibold text-foreground lg:col-span-3">
                    Medical notes
                    <textarea name="medicalNotes" value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Previous School (collapsible) */}
          <div className="rounded-lg border border-border bg-surface p-0 mb-3">
            <button type="button" onClick={() => setPreviousOpen((v) => !v)} className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/90 transition">
              <div className="flex items-center gap-3">
                <ChevronDown className={`h-5 w-5 text-muted transition-transform ${previousOpen ? "rotate-180" : ""}`} />
                <div>
                  <h4 className="text-lg font-semibold text-foreground">Previous school</h4>
                  <p className="mt-1 text-sm text-muted">Optional previous school information.</p>
                </div>
              </div>
            </button>

            {previousOpen && (
              <div className="border-t border-border p-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm font-semibold text-foreground">
                    Previous school
                    <input name="previousSchool" value={previousSchool} onChange={(e) => setPreviousSchool(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
                  </label>

                  <label className="text-sm font-semibold text-foreground">
                    Previous class
                    <input name="previousClass" value={previousClass} onChange={(e) => setPreviousClass(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
