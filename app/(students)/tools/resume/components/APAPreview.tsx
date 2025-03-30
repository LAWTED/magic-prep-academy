"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, ChevronDown, ChevronUp, Database } from "lucide-react";
import { generateAPAResumePdf } from "./generateAPAResumePdf";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

// Define resume data type
export type ResumeData = {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    orcid?: string;
    website?: string;
  };
  education?: Array<{
    degree: string;
    institution: string;
    location: string;
    dates: string;
    gpa?: string;
    relevantCoursework?: string[];
    thesis?: string;
    advisor?: string;
  }>;
  workExperience?: Array<{
    position: string;
    company: string;
    location: string;
    dates: string;
    description: string[];
    supervisor?: string;
    achievements?: string[];
  }>;
  research?: Array<{
    title: string;
    lab: string;
    pi: string;
    institution: string;
    dates: string;
    description: string[];
  }>;
  projects?: Array<{
    title: string;
    organization: string;
    dates: string;
    description: string[];
    technologies?: string[];
    url?: string;
  }>;
  publications?: Array<{
    title: string;
    authors: string;
    journal: string;
    volume: string;
    pages: string;
    year: string;
    doi?: string;
    url?: string;
    impact_factor?: string;
  }>;
  presentations?: Array<{
    title: string;
    authors: string;
    conference: string;
    location: string;
    date: string;
    type?: "poster" | "oral" | "invited";
  }>;
  teaching?: Array<{
    title: string;
    institution: string;
    location: string;
    dates: string;
    description: string[];
    courses?: Array<{
      code: string;
      name: string;
      role: string;
      semester: string;
    }>;
  }>;
  awards?: Array<{
    title: string;
    organization: string;
    date: string;
    description?: string;
    amount?: string;
  }>;
  grants?: Array<{
    title: string;
    agency: string;
    amount: string;
    dates: string;
    role: string;
    pi?: string;
  }>;
  professional?: Array<{
    title?: string;
    organization: string;
    role: string;
    dates: string;
  }>;
  certifications?: Array<{
    name: string;
    organization: string;
    date: string;
    expiration?: string;
  }>;
  skills?: {
    research?: string[];
    technical?: string[];
    languages?: string[];
    laboratory?: string[];
  };
};

type APAPreviewProps = {
  resumeData: ResumeData;
  fileName: string;
  defaultExpanded?: boolean;
  documentId?: string | null;
};

export default function APAPreview({
  resumeData,
  fileName,
  defaultExpanded = true,
  documentId = null,
}: APAPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    education: defaultExpanded,
    workExperience: defaultExpanded,
    research: defaultExpanded,
    projects: defaultExpanded,
    publications: defaultExpanded,
    presentations: defaultExpanded,
    teaching: defaultExpanded,
    awards: defaultExpanded,
    grants: defaultExpanded,
    professional: defaultExpanded,
    certifications: defaultExpanded,
    skills: defaultExpanded,
  });
  const [isSaving, setIsSaving] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper function to check if an array is empty or null
  const isEmpty = (arr: any[] | null | undefined) => !arr || arr.length === 0;

  // Generate and download PDF
  const handleDownloadPDF = async () => {
    try {
      await generateAPAResumePdf(resumeData, fileName);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  // Save to document_versions table
  const handleSave = async () => {
    if (!documentId) return;

    try {
      setIsSaving(true);
      const supabase = createClient();

      // First get the latest version number
      const { data: versionData, error: versionError } = await supabase
        .from("document_versions")
        .select("version_number")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false })
        .limit(1);

      if (versionError) {
        throw versionError;
      }

      // Calculate next version number
      const nextVersionNumber =
        versionData && versionData.length > 0
          ? versionData[0].version_number + 1
          : 1;

      // Prepare metadata
      const metadata = {
        format: "APA",
        content: resumeData,
      };

      // Insert new version
      const { error: insertError } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentId,
          version_number: nextVersionNumber,
          metadata: metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      toast.success("Resume saved successfully!");
    } catch (error) {
      console.error("Failed to save resume:", error);
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-sand text-black rounded-lg p-6 max-w-2xl mx-auto">
      {/* Header with actions */}
      <div className="mb-6 flex justify-end space-x-2">
        {documentId && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full  text-bronze"
            title="Save as new version"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Database
              size={18}
              className={isSaving ? "text-gray-400 animate-pulse" : ""}
            />
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full  text-bronze"
          title="Download PDF"
          onClick={handleDownloadPDF}
        >
          <Download size={18} />
        </motion.button>
      </div>

      {/* Resume content in APA style */}
      <div className="font-serif">
        {/* Personal Information */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1">
            {resumeData.personalInfo.name}
          </h1>
          <p className="text-sm">
            {resumeData.personalInfo.address} • {resumeData.personalInfo.phone}{" "}
            • {resumeData.personalInfo.email}
          </p>
          {(resumeData.personalInfo.orcid ||
            resumeData.personalInfo.website) && (
            <p className="text-sm mt-1">
              {resumeData.personalInfo.orcid && (
                <>ORCID: {resumeData.personalInfo.orcid} • </>
              )}
              {resumeData.personalInfo.website && (
                <>{resumeData.personalInfo.website}</>
              )}
            </p>
          )}
        </div>

        {/* Education */}
        {!isEmpty(resumeData.education) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("education")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                EDUCATION
              </h2>
              {expandedSections.education ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.education && (
              <div className="mt-2">
                {resumeData.education?.map((edu, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between">
                      <p className="font-semibold">{edu.institution}</p>
                      <p>{edu.dates}</p>
                    </div>
                    <p>
                      <span className="italic">{edu.degree}</span>,{" "}
                      {edu.location}
                    </p>
                    {edu.gpa && <p>GPA: {edu.gpa}</p>}
                    {edu.advisor && <p>Advisor: {edu.advisor}</p>}
                    {edu.thesis && <p>Thesis: "{edu.thesis}"</p>}
                    {edu.relevantCoursework &&
                      edu.relevantCoursework.length > 0 && (
                        <>
                          <p className="font-semibold mt-1">
                            Relevant Coursework:
                          </p>
                          <p>{edu.relevantCoursework.join("; ")}</p>
                        </>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Work Experience */}
        {!isEmpty(resumeData.workExperience) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("workExperience")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                WORK EXPERIENCE
              </h2>
              {expandedSections.workExperience ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.workExperience && (
              <div className="mt-2">
                {resumeData.workExperience?.map((work, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between">
                      <p className="font-semibold">{work.position}</p>
                      <p>{work.dates}</p>
                    </div>
                    <p>
                      {work.company}, {work.location}
                    </p>
                    {work.supervisor && (
                      <p className="italic">Supervisor: {work.supervisor}</p>
                    )}
                    <ul className="list-disc ml-5 mt-1">
                      {work.description.map((desc, i) => (
                        <li key={i} className="text-sm">
                          {desc}
                        </li>
                      ))}
                    </ul>
                    {work.achievements && work.achievements.length > 0 && (
                      <>
                        <p className="font-semibold text-sm mt-1">
                          Key Achievements:
                        </p>
                        <ul className="list-disc ml-5">
                          {work.achievements.map((achievement, i) => (
                            <li key={i} className="text-sm">
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Research Experience */}
        {!isEmpty(resumeData.research) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("research")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                RESEARCH EXPERIENCE
              </h2>
              {expandedSections.research ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.research && (
              <div className="mt-2">
                {resumeData.research?.map((res, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between">
                      <p className="font-semibold">{res.title}</p>
                      <p>{res.dates}</p>
                    </div>
                    <p>
                      {res.lab}, {res.institution}
                    </p>
                    <p className="italic">Principal Investigator: {res.pi}</p>
                    <ul className="list-disc ml-5 mt-1">
                      {res.description.map((desc, i) => (
                        <li key={i} className="text-sm">
                          {desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {!isEmpty(resumeData.projects) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("projects")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                PROJECTS
              </h2>
              {expandedSections.projects ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.projects && (
              <div className="mt-2">
                {resumeData.projects?.map((project, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between">
                      <p className="font-semibold">{project.title}</p>
                      <p>{project.dates}</p>
                    </div>
                    <p className="text-sm">{project.organization}</p>
                    <ul className="list-disc ml-5 mt-1">
                      {project.description.map((desc, i) => (
                        <li key={i} className="text-sm">
                          {desc}
                        </li>
                      ))}
                    </ul>
                    {project.technologies &&
                      project.technologies.length > 0 && (
                        <p className="text-sm mt-1">
                          <span className="font-semibold">Technologies:</span>{" "}
                          {project.technologies.join(", ")}
                        </p>
                      )}
                    {project.url && (
                      <p className="text-sm mt-1">
                        <span className="font-semibold">URL:</span>{" "}
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {project.url}
                        </a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Publications */}
        {!isEmpty(resumeData.publications) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("publications")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                PUBLICATIONS
              </h2>
              {expandedSections.publications ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.publications && (
              <div className="mt-2">
                <ul className="list-none ml-5">
                  {resumeData.publications?.map((pub, index) => (
                    <li key={index} className="mb-2 text-sm">
                      {pub.authors} ({pub.year}). {pub.title}.{" "}
                      <span className="italic">
                        {pub.journal}, {pub.volume}
                      </span>
                      , {pub.pages}.{pub.doi && <span> {pub.doi}</span>}
                      {pub.impact_factor && (
                        <span className="text-xs ml-1">
                          (Impact Factor: {pub.impact_factor})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Presentations */}
        {!isEmpty(resumeData.presentations) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("presentations")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                PRESENTATIONS
              </h2>
              {expandedSections.presentations ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.presentations && (
              <div className="mt-2">
                <ul className="list-none ml-5">
                  {resumeData.presentations?.map((pres, index) => (
                    <li key={index} className="mb-2 text-sm">
                      {pres.authors} ({pres.date}).{" "}
                      <span className="italic">{pres.title}</span>.
                      {pres.type === "poster" && "Poster presented at "}
                      {pres.type === "oral" && "Oral presentation at "}
                      {pres.type === "invited" && "Invited talk at "}
                      {!pres.type && "Presented at "}
                      {pres.conference}, {pres.location}.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Teaching Experience */}
        {!isEmpty(resumeData.teaching) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("teaching")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                TEACHING EXPERIENCE
              </h2>
              {expandedSections.teaching ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.teaching && (
              <div className="mt-2">
                {resumeData.teaching?.map((teach, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between">
                      <p className="font-semibold">{teach.title}</p>
                      <p>{teach.dates}</p>
                    </div>
                    <p>
                      {teach.institution}, {teach.location}
                    </p>
                    <ul className="list-disc ml-5 mt-1">
                      {teach.description.map((desc, i) => (
                        <li key={i} className="text-sm">
                          {desc}
                        </li>
                      ))}
                    </ul>
                    {teach.courses && teach.courses.length > 0 && (
                      <div className="mt-1">
                        <p className="font-semibold text-sm">Courses:</p>
                        <ul className="list-none ml-5">
                          {teach.courses.map((course, i) => (
                            <li key={i} className="text-sm">
                              {course.code}: {course.name} ({course.role},{" "}
                              {course.semester})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Awards & Honors */}
        {!isEmpty(resumeData.awards) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("awards")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                AWARDS & HONORS
              </h2>
              {expandedSections.awards ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.awards && (
              <div className="mt-2">
                <ul className="list-none">
                  {resumeData.awards?.map((award, index) => (
                    <li key={index} className="mb-2">
                      <div className="flex justify-between">
                        <p className="font-semibold">{award.title}</p>
                        <p>{award.date}</p>
                      </div>
                      <p className="text-sm">{award.organization}</p>
                      {award.amount && (
                        <p className="text-sm">Amount: {award.amount}</p>
                      )}
                      {award.description && (
                        <p className="text-sm">{award.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Grants & Funding */}
        {!isEmpty(resumeData.grants) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("grants")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                GRANTS & FUNDING
              </h2>
              {expandedSections.grants ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.grants && (
              <div className="mt-2">
                <ul className="list-none">
                  {resumeData.grants?.map((grant, index) => (
                    <li key={index} className="mb-2">
                      <div className="flex justify-between">
                        <p className="font-semibold">{grant.title}</p>
                        <p>{grant.dates}</p>
                      </div>
                      <p className="text-sm">
                        {grant.agency} - {grant.amount} ({grant.role})
                      </p>
                      {grant.pi && grant.role !== "Principal Investigator" && (
                        <p className="text-sm">
                          Principal Investigator: {grant.pi}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Professional Memberships */}
        {!isEmpty(resumeData.professional) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("professional")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                PROFESSIONAL MEMBERSHIPS
              </h2>
              {expandedSections.professional ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.professional && (
              <div className="mt-2">
                <ul className="list-none">
                  {resumeData.professional?.map((prof, index) => (
                    <li key={index} className="mb-2">
                      <div className="flex justify-between">
                        <p className="font-semibold">{prof.organization}</p>
                        <p>{prof.dates}</p>
                      </div>
                      <p className="text-sm">{prof.role}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Certifications */}
        {!isEmpty(resumeData.certifications) && (
          <div className="mb-4">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("certifications")}
            >
              <h2 className="text-lg font-bold border-b border-black w-full">
                CERTIFICATIONS
              </h2>
              {expandedSections.certifications ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </div>

            {expandedSections.certifications && (
              <div className="mt-2">
                <ul className="list-none">
                  {resumeData.certifications?.map((cert, index) => (
                    <li key={index} className="mb-2">
                      <div className="flex justify-between">
                        <p className="font-semibold">{cert.name}</p>
                        <p>
                          {cert.date}
                          {cert.expiration ? ` - ${cert.expiration}` : ""}
                        </p>
                      </div>
                      <p className="text-sm">{cert.organization}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Skills */}
        <div className="mb-4">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("skills")}
          >
            <h2 className="text-lg font-bold border-b border-black w-full">
              SKILLS
            </h2>
            {expandedSections.skills ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </div>

          {expandedSections.skills && resumeData.skills && (
            <div className="mt-2">
              {Object.entries(resumeData.skills).map(([category, skills]) => {
                if (!skills || skills.length === 0) return null;

                // Format category name for display (capitalize first letter of each word)
                const formattedCategory = category
                  .split(/(?=[A-Z])/)
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

                return (
                  <p key={category} className="mt-1 first:mt-0">
                    <span className="font-semibold">
                      {formattedCategory} Skills:
                    </span>{" "}
                    {skills.join(", ")}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
