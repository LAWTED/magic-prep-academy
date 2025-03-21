import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { ResumeData } from "./APAPreview";

// Register hyphenation callback to prevent word breaks
Font.registerHyphenationCallback(word => [word]);

// Create styles using standard PDF fonts
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Times-Roman",
    fontSize: 12,
  },
  section: {
    marginBottom: 10,
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  name: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 10,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    marginBottom: 5,
    borderBottom: "1pt solid black",
    paddingBottom: 2,
  },
  entryContainer: {
    marginBottom: 8,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  institution: {
    fontFamily: "Times-Bold",
    fontSize: 11,
  },
  degree: {
    fontFamily: "Times-Italic",
    fontSize: 11,
  },
  dates: {
    fontSize: 10,
  },
  location: {
    fontSize: 10,
  },
  description: {
    fontSize: 10,
    marginLeft: 10,
    marginTop: 3,
  },
  listItem: {
    fontSize: 9,
    marginBottom: 2,
  },
  bullet: {
    width: 10,
  },
  bulletText: {
    flexDirection: "row",
  },
  authorText: {
    fontSize: 9,
    marginBottom: 3,
    textAlign: "left",
  },
  publicationText: {
    fontSize: 9,
    marginBottom: 3,
    textAlign: "left",
  },
  courseItem: {
    fontSize: 9,
    marginLeft: 10,
    marginBottom: 2,
  },
  italic: {
    fontFamily: "Times-Italic",
  },
  bold: {
    fontFamily: "Times-Bold",
  },
  boldItalic: {
    fontFamily: "Times-BoldItalic",
  },
});

type APAPreviewPDFProps = {
  resumeData: ResumeData;
};

const APAPreviewPDF = ({ resumeData }: APAPreviewPDFProps) => {
  // Helper function to check if an array is empty or null
  const isEmpty = (arr: any[] | null | undefined) => !arr || arr.length === 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Personal Information */}
        <View style={styles.header}>
          <Text style={styles.name}>{resumeData.personalInfo.name}</Text>
          <Text style={styles.contactInfo}>
            {resumeData.personalInfo.address} • {resumeData.personalInfo.phone} • {resumeData.personalInfo.email}
          </Text>
          {(resumeData.personalInfo.orcid || resumeData.personalInfo.website) && (
            <Text style={styles.contactInfo}>
              {resumeData.personalInfo.orcid && `ORCID: ${resumeData.personalInfo.orcid} • `}
              {resumeData.personalInfo.website}
            </Text>
          )}
        </View>

        {/* Education */}
        {!isEmpty(resumeData.education) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {resumeData.education?.map((edu, index) => (
              <View key={`edu-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{edu.institution}</Text>
                  <Text style={styles.dates}>{edu.dates}</Text>
                </View>
                <Text>
                  <Text style={styles.degree}>{edu.degree}</Text>
                  <Text style={styles.location}>, {edu.location}</Text>
                </Text>
                {edu.gpa && <Text style={styles.listItem}>GPA: {edu.gpa}</Text>}
                {edu.advisor && <Text style={styles.listItem}>Advisor: {edu.advisor}</Text>}
                {edu.thesis && <Text style={styles.listItem}>Thesis: "{edu.thesis}"</Text>}
                {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
                  <View>
                    <Text style={{...styles.listItem, ...styles.bold, marginTop: 3}}>Relevant Coursework:</Text>
                    <Text style={styles.listItem}>{edu.relevantCoursework.join("; ")}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Work Experience */}
        {!isEmpty(resumeData.workExperience) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WORK EXPERIENCE</Text>
            {resumeData.workExperience?.map((work, index) => (
              <View key={`work-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{work.position}</Text>
                  <Text style={styles.dates}>{work.dates}</Text>
                </View>
                <Text style={styles.location}>
                  {work.company}, {work.location}
                </Text>
                {work.supervisor && (
                  <Text style={styles.listItem}>Supervisor: {work.supervisor}</Text>
                )}
                {work.description && (
                  <View style={styles.description}>
                    {work.description.map((desc, i) => (
                      <View key={`work-desc-${i}`} style={styles.bulletText}>
                        <Text style={styles.bullet}>• </Text>
                        <Text style={styles.listItem}>{desc}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Research Experience */}
        {!isEmpty(resumeData.research) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RESEARCH EXPERIENCE</Text>
            {resumeData.research?.map((res, index) => (
              <View key={`research-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{res.title}</Text>
                  <Text style={styles.dates}>{res.dates}</Text>
                </View>
                <Text style={styles.location}>
                  {res.lab}, {res.institution}
                </Text>
                <Text style={{...styles.listItem, ...styles.italic}}>
                  Principal Investigator: {res.pi}
                </Text>
                {res.description && (
                  <View style={styles.description}>
                    {res.description.map((desc, i) => (
                      <View key={`research-desc-${i}`} style={styles.bulletText}>
                        <Text style={styles.bullet}>• </Text>
                        <Text style={styles.listItem}>{desc}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {!isEmpty(resumeData.projects) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {resumeData.projects?.map((proj, index) => (
              <View key={`project-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{proj.title}</Text>
                  <Text style={styles.dates}>{proj.dates}</Text>
                </View>
                <Text style={styles.location}>{proj.organization}</Text>
                {proj.technologies && (
                  <Text style={{...styles.listItem, ...styles.italic}}>
                    Technologies: {proj.technologies.join(", ")}
                  </Text>
                )}
                {proj.description && (
                  <View style={styles.description}>
                    {proj.description.map((desc, i) => (
                      <View key={`project-desc-${i}`} style={styles.bulletText}>
                        <Text style={styles.bullet}>• </Text>
                        <Text style={styles.listItem}>{desc}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Publications */}
        {!isEmpty(resumeData.publications) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PUBLICATIONS</Text>
            <View style={{marginLeft: 10, marginTop: 5}}>
              {resumeData.publications?.map((pub, index) => (
                <View key={`pub-${index}`} style={{marginBottom: 6}}>
                  <Text style={styles.authorText}>
                    {pub.authors} ({pub.year}). {pub.title}.{" "}
                    <Text style={styles.italic}>
                      {pub.journal}, {pub.volume}
                    </Text>
                    , {pub.pages}.{pub.doi && ` ${pub.doi}`}
                    {pub.impact_factor && ` (Impact Factor: ${pub.impact_factor})`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Presentations */}
        {!isEmpty(resumeData.presentations) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRESENTATIONS</Text>
            <View style={{marginLeft: 10, marginTop: 5}}>
              {resumeData.presentations?.map((pres, index) => (
                <View key={`pres-${index}`} style={{marginBottom: 6}}>
                  <Text style={styles.authorText}>
                    {pres.authors} ({pres.date}).{" "}
                    <Text style={styles.italic}>{pres.title}</Text>.{" "}
                    {pres.type === "poster" && "Poster presented at "}
                    {pres.type === "oral" && "Oral presentation at "}
                    {pres.type === "invited" && "Invited talk at "}
                    {!pres.type && "Presented at "}
                    {pres.conference}, {pres.location}.
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Teaching Experience */}
        {!isEmpty(resumeData.teaching) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TEACHING EXPERIENCE</Text>
            {resumeData.teaching?.map((teach, index) => (
              <View key={`teaching-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{teach.title}</Text>
                  <Text style={styles.dates}>{teach.dates}</Text>
                </View>
                <Text style={styles.location}>
                  {teach.institution}, {teach.location}
                </Text>
                {teach.description && (
                  <View style={styles.description}>
                    {teach.description.map((desc, i) => (
                      <View key={`teach-desc-${i}`} style={styles.bulletText}>
                        <Text style={styles.bullet}>• </Text>
                        <Text style={styles.listItem}>{desc}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {teach.courses && teach.courses.length > 0 && (
                  <View style={{marginTop: 3, marginLeft: 10}}>
                    <Text style={{...styles.listItem, ...styles.bold}}>Courses:</Text>
                    {teach.courses.map((course, i) => (
                      <Text key={`course-${i}`} style={styles.courseItem}>
                        {course.code}: {course.name} ({course.role}, {course.semester})
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Awards */}
        {!isEmpty(resumeData.awards) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AWARDS & HONORS</Text>
            {resumeData.awards?.map((award, index) => (
              <View key={`award-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{award.title}</Text>
                  <Text style={styles.dates}>{award.date}</Text>
                </View>
                <Text style={styles.location}>{award.organization}</Text>
                {award.description && (
                  <Text style={styles.listItem}>{award.description}</Text>
                )}
                {award.amount && (
                  <Text style={styles.listItem}>Amount: {award.amount}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Grants */}
        {!isEmpty(resumeData.grants) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GRANTS & FUNDING</Text>
            {resumeData.grants?.map((grant, index) => (
              <View key={`grant-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{grant.title}</Text>
                  <Text style={styles.dates}>{grant.dates}</Text>
                </View>
                <Text style={styles.listItem}>
                  {grant.agency} - {grant.amount} ({grant.role})
                </Text>
                {grant.pi && grant.role !== "Principal Investigator" && (
                  <Text style={styles.listItem}>
                    Principal Investigator: {grant.pi}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Professional Memberships */}
        {!isEmpty(resumeData.professional) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROFESSIONAL MEMBERSHIPS</Text>
            {resumeData.professional?.map((membership, index) => (
              <View key={`prof-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{membership.organization}</Text>
                  <Text style={styles.dates}>{membership.dates}</Text>
                </View>
                <Text style={styles.listItem}>{membership.role}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {!isEmpty(resumeData.certifications) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            {resumeData.certifications?.map((cert, index) => (
              <View key={`cert-${index}`} style={styles.entryContainer}>
                <View style={styles.entryHeader}>
                  <Text style={styles.institution}>{cert.name}</Text>
                  <Text style={styles.dates}>{cert.date}</Text>
                </View>
                <Text style={styles.location}>{cert.organization}</Text>
                {cert.expiration && (
                  <Text style={styles.listItem}>
                    Expires: {cert.expiration}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {resumeData.skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            {resumeData.skills.research && resumeData.skills.research.length > 0 && (
              <View style={{marginBottom: 4}}>
                <Text style={{...styles.listItem, ...styles.bold}}>Research:</Text>
                <Text style={{...styles.listItem, marginLeft: 10}}>
                  {resumeData.skills.research.join(", ")}
                </Text>
              </View>
            )}
            {resumeData.skills.technical && resumeData.skills.technical.length > 0 && (
              <View style={{marginBottom: 4}}>
                <Text style={{...styles.listItem, ...styles.bold}}>Technical:</Text>
                <Text style={{...styles.listItem, marginLeft: 10}}>
                  {resumeData.skills.technical.join(", ")}
                </Text>
              </View>
            )}
            {resumeData.skills.languages && resumeData.skills.languages.length > 0 && (
              <View style={{marginBottom: 4}}>
                <Text style={{...styles.listItem, ...styles.bold}}>Languages:</Text>
                <Text style={{...styles.listItem, marginLeft: 10}}>
                  {resumeData.skills.languages.join(", ")}
                </Text>
              </View>
            )}
            {resumeData.skills.laboratory && resumeData.skills.laboratory.length > 0 && (
              <View style={{marginBottom: 4}}>
                <Text style={{...styles.listItem, ...styles.bold}}>Laboratory:</Text>
                <Text style={{...styles.listItem, marginLeft: 10}}>
                  {resumeData.skills.laboratory.join(", ")}
                </Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default APAPreviewPDF;