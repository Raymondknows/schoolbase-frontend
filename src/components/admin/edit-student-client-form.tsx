"use client";

import { useState, type ChangeEvent, type FormEvent, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, ChevronDown } from "lucide-react";
import { updateStudent } from "@/app/admin/actions";
import { resolveFileUrl } from "@/lib/api-client";

export default function EditStudentClientForm({
  pupil,
  classes,
}: {
  pupil: any;
  classes: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Student info
  const [firstName, setFirstName] = useState(pupil.firstName || "");
  const [middleName, setMiddleName] = useState(pupil.middleName || "");
  const [lastName, setLastName] = useState(pupil.lastName || "");
  const [studentEmail, setStudentEmail] = useState(pupil.studentEmail || "");
  const [studentPhone, setStudentPhone] = useState(pupil.studentPhone || "");
  const [gender, setGender] = useState(pupil.gender || "Male");
  const [dateOfBirth, setDateOfBirth] = useState(
    pupil.dateOfBirth ? new Date(pupil.dateOfBirth).toISOString().split("T")[0] : ""
  );
  const [admissionDate, setAdmissionDate] = useState(
    pupil.admissionDate ? new Date(pupil.admissionDate).toISOString().split("T")[0] : ""
  );
  const [classId, setClassId] = useState(pupil.classId || "");
  const [status, setStatus] = useState(pupil.status || "ACTIVE");
  const [address, setAddress] = useState(pupil.address || "");

  // Guardian info
  const primaryGuardian = pupil.guardians?.[0];
  const [guardianFirst, setGuardianFirst] = useState(primaryGuardian?.guardian?.firstName || "");
  const [guardianLast, setGuardianLast] = useState(primaryGuardian?.guardian?.lastName || "");
  const [guardianRelationship, setGuardianRelationship] = useState(
    primaryGuardian?.relation || "Parent"
  );
  const [guardianEmail, setGuardianEmail] = useState(primaryGuardian?.guardian?.email || "");
  const [guardianPhone, setGuardianPhone] = useState(primaryGuardian?.guardian?.whatsapp || primaryGuardian?.guardian?.phone || "");
  const [guardianAltPhone, setGuardianAltPhone] = useState(
    primaryGuardian?.guardian?.altPhone || ""
  );
  const [guardianOccupation, setGuardianOccupation] = useState(
    primaryGuardian?.guardian?.occupation || ""
  );

  // Medical info
  const [bloodGroup, setBloodGroup] = useState(pupil.bloodGroup || "");
  const [genotype, setGenotype] = useState(pupil.genotype || "");
  const [medicalNotes, setMedicalNotes] = useState(pupil.medicalNotes || "");

  // Previous school info
  const [previousSchool, setPreviousSchool] = useState(pupil.previousSchool || "");
  const [previousClass, setPreviousClass] = useState(pupil.previousClass || "");

  const [medicalOpen, setMedicalOpen] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(false);

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

  const getInitials = () => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return `${first}${last}`;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("studentId", pupil.id);
        if (primaryGuardian?.guardian?.id) {
          formData.append("guardianId", primaryGuardian.guardian.id);
        }
        formData.append("firstName", firstName);
        formData.append("middleName", middleName);
        formData.append("lastName", lastName);
        formData.append("studentEmail", studentEmail);
        formData.append("studentPhone", studentPhone);
        formData.append("gender", gender);
        formData.append("dateOfBirth", dateOfBirth);
        formData.append("admissionDate", admissionDate);
        formData.append("classId", classId);
        formData.append("status", status);
        formData.append("address", address);
        formData.append("guardianFirst", guardianFirst);
        formData.append("guardianLast", guardianLast);
        formData.append("guardianRelationship", guardianRelationship);
        formData.append("guardianEmail", guardianEmail);
        formData.append("guardianPhone", guardianPhone);
        formData.append("guardianAltPhone", guardianAltPhone);
        formData.append("guardianOccupation", guardianOccupation);
        formData.append("bloodGroup", bloodGroup);
        formData.append("genotype", genotype);
        formData.append("medicalNotes", medicalNotes);
        formData.append("previousSchool", previousSchool);
        formData.append("previousClass", previousClass);

        if (photoFile) {
          formData.append("photo", photoFile);
        }

        await updateStudent(formData);
        router.push(`/admin/students/${pupil.id}`);
      } catch (error) {
        console.error("Error updating student:", error);
      }
    });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-4">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm py-3">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit Student</h1>
            <p className="mt-0.5 text-sm text-slate-600 max-w-2xl">
              Update student information, guardian details, medical records and academic information.
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button variant="secondary" href={`/admin/students/${pupil.id}`}>
              Back to Student
            </Button>
            <Button type="submit" form="edit-student-form" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>

      <form
        id="edit-student-form"
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
      >

        {/* Left: photo card (sticky) */}
        <div className="lg:col-span-1">
          <div className="rounded-[28px] border border-border bg-white p-5 shadow-sm lg:sticky lg:top-28">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Profile photo</p>
                <p className="mt-1 text-sm text-slate-500">Update student portrait for the profile card.</p>
              </div>
              <div className="rounded-full bg-slate-100 p-2 text-slate-500">
                <Upload className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-dashed border-border/70 bg-slate-50 p-4 text-center">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Selected student photo"
                  className="mx-auto h-40 w-40 rounded-3xl object-cover"
                />
              ) : pupil.photoUrl ? (
                <img
                  src={resolveFileUrl(pupil.photoUrl, pupil.id) ?? undefined}
                  alt={`${firstName} ${lastName}`}
                  className="mx-auto h-40 w-40 rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                  <span className="text-4xl font-bold text-slate-400">{getInitials()}</span>
                </div>
              )}
            </div>

            <label className="mt-5 block text-sm font-semibold text-slate-800">
              Upload photo
              <input
                name="photo"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handlePhotoChange}
                className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:text-white"
              />
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              JPG, PNG or WEBP. Keep the file under 4MB and use a square image for best layout.
            </p>

            <div className="mt-6 space-y-3 text-sm text-slate-600 border-t border-slate-200 pt-6">
              <div>
                <p className="text-xs uppercase font-semibold text-slate-500">Admission Number</p>
                <p className="mt-1 font-medium text-slate-900">{pupil.admissionNo}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-slate-500">Class</p>
                <p className="mt-1 font-medium text-slate-900">
                  {classes.find((c) => c.id === classId)?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-slate-500">Status</p>
                <p className="mt-1 font-medium text-slate-900">{status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: main form fields */}
        <div className="lg:col-span-2">
          {/* Top row: Admission details */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 mb-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold text-slate-800">
                Admission number
                <input
                  name="admissionNo"
                  defaultValue={pupil.admissionNo || ""}
                  readOnly
                  className="mt-2 w-full rounded-2xl border border-border bg-slate-100 px-4 py-3 text-sm text-slate-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Class *
                <select
                  name="classId"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}{item.arm ? ` ${item.arm}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Status
                <select
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Admission date
                <input
                  name="admissionDate"
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>
            </div>
          </div>

          {/* Section 1: Student Information */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Student information</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold text-slate-800">
                Surname *
                <input
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                First name *
                <input
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Middle name
                <input
                  name="middleName"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Gender *
                <select
                  name="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Date of birth
                <input
                  name="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Email
                <input
                  name="studentEmail"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Phone number
                <input
                  name="studentPhone"
                  type="tel"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="+234..."
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800 lg:col-span-3">
                Address
                <textarea
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Parent / Guardian Information */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Parent / Guardian information</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold text-slate-800">
                First name
                <input
                  name="guardianFirst"
                  value={guardianFirst}
                  onChange={(e) => setGuardianFirst(e.target.value)}
                  placeholder="John"
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Last name
                <input
                  name="guardianLast"
                  value={guardianLast}
                  onChange={(e) => setGuardianLast(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Relationship *
                <select
                  name="guardianRelationship"
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                >
                  <option value="Parent">Parent</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Phone number *
                <input
                  name="guardianPhone"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  required
                  placeholder="+234..."
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Alternative phone
                <input
                  name="guardianAltPhone"
                  value={guardianAltPhone}
                  onChange={(e) => setGuardianAltPhone(e.target.value)}
                  placeholder="Optional"
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Email
                <input
                  name="guardianEmail"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  type="email"
                  placeholder="guardian@example.com"
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>

              <label className="text-sm font-semibold text-slate-800">
                Occupation
                <input
                  name="guardianOccupation"
                  value={guardianOccupation}
                  onChange={(e) => setGuardianOccupation(e.target.value)}
                  placeholder="Optional"
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Medical Information (collapsible) */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-0 mb-6">
            <button
              type="button"
              onClick={() => setMedicalOpen((v) => !v)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={`h-5 w-5 text-slate-600 transition-transform ${medicalOpen ? "rotate-180" : ""}`}
                />
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Medical information</h4>
                  <p className="mt-1 text-sm text-slate-600">Optional medical details (expand to edit).</p>
                </div>
              </div>
            </button>

            {medicalOpen ? (
              <div className="border-t border-slate-200 p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm font-semibold text-slate-800">
                    Blood group
                    <input
                      name="bloodGroup"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-800">
                    Genotype
                    <input
                      name="genotype"
                      value={genotype}
                      onChange={(e) => setGenotype(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-800 lg:col-span-3">
                    Medical notes
                    <textarea
                      name="medicalNotes"
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          {/* Section 4: Previous School (collapsible) */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-0 mb-6">
            <button
              type="button"
              onClick={() => setPreviousOpen((v) => !v)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={`h-5 w-5 text-slate-600 transition-transform ${previousOpen ? "rotate-180" : ""}`}
                />
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Previous school</h4>
                  <p className="mt-1 text-sm text-slate-600">Optional previous school information.</p>
                </div>
              </div>
            </button>

            {previousOpen ? (
              <div className="border-t border-slate-200 p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm font-semibold text-slate-800">
                    Previous school
                    <input
                      name="previousSchool"
                      value={previousSchool}
                      onChange={(e) => setPreviousSchool(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-800">
                    Previous class
                    <input
                      name="previousClass"
                      value={previousClass}
                      onChange={(e) => setPreviousClass(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">All changes are saved to the student record.</div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" href={`/admin/students/${pupil.id}`}>
                Cancel
              </Button>
              <Button type="submit" form="edit-student-form" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
