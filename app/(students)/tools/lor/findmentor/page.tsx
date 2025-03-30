"use client";

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { toast } from 'sonner';

interface Mentor {
  id: string;
  name: string;
  avatar_name: string;
  subjects: string[];
  email?: string;
  auth_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface Subject {
  id: string;
  subject_name: string;
  created_at?: string;
  updated_at?: string;
}

interface Program {
  id: string;
  name: string;
  school_id: string;
  subject_id: string;
  content: any;
  created_at?: string;
  updated_at?: string;
}

interface School {
  id: string;
  name: string;
  location: string;
  created_at?: string;
  updated_at?: string;
}

export default function FindMentorPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUserStore();

  // Step management
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Data states
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  // Selection states
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [programSearchQuery, setProgramSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      try {
        // Fetch mentors
        const { data: mentorsData, error: mentorsError } = await supabase
          .from('mentors')
          .select('*')
          .is('deleted_at', null);

        if (mentorsError) {
          console.error('Error fetching mentors:', mentorsError);
        } else if (mentorsData) {
          setMentors(mentorsData);
        }

        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*');

        if (subjectsError) {
          console.error('Error fetching subjects:', subjectsError);
        } else if (subjectsData) {
          setSubjects(subjectsData);
        }

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select('*');

        if (programsError) {
          console.error('Error fetching programs:', programsError);
        } else if (programsData) {
          setPrograms(programsData);
        }

        // Fetch schools
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('schools')
          .select('*');

        if (schoolsError) {
          console.error('Error fetching schools:', schoolsError);
        } else if (schoolsData) {
          setSchools(schoolsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Filter mentors based on search query
  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (mentor.subjects.some(subjectId =>
      subjects.find(s => s.id === subjectId)?.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  // Filter programs based on search query
  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(programSearchQuery.toLowerCase()) ||
    schools.find(s => s.id === program.school_id)?.name.toLowerCase().includes(programSearchQuery.toLowerCase())
  );

  // Get subject names for a mentor
  const getMentorSubjects = (mentor: Mentor) => {
    return mentor.subjects
      .map(subjectId => subjects.find(s => s.id === subjectId)?.subject_name)
      .filter(Boolean)
      .join(', ');
  };

  // Get school name for a program
  const getSchoolName = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return "";

    const school = schools.find(s => s.id === program.school_id);
    return school ? school.name : "";
  };

  // Navigation functions
  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Submit the form
  const handleSubmit = async () => {
    if (!selectedMentor || !selectedProgram || !user?.id) return;

    try {
      setSubmitting(true);

      // Get selected program details
      const program = programs.find(p => p.id === selectedProgram);
      const school = schools.find(s => s.id === program?.school_id);

      // Create the interaction record
      const { data, error } = await supabase
        .from('mentor_student_interactions')
        .insert({
          student_id: user.id,
          mentor_id: selectedMentor,
          type: 'lor_request',
          status: 'pending',
          metadata: {
            program_id: selectedProgram,
            program_name: program?.name,
            school_id: program?.school_id,
            school_name: school?.name,
            notes: notes,
            request_date: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id');

      if (error) {
        console.error('Error submitting request:', error);
        throw error;
      }

      // Store the request ID
      const requestId = data[0].id;

      // Get student name from user store
      const studentName = user.name || user.email || 'your student';
      const mentorName = mentors.find(m => m.id === selectedMentor)?.name || 'mentor';

      // Prepare message content with requestId included for LoR button detection
      const message = `Hello ${mentorName}, I am ${studentName}, I am applying for ${program?.name} at ${school?.name}. ${notes}

\`\`\`json
{
  "type": "lor_request",
  "requestId": "${requestId}",
  "programName": "${program?.name}",
  "schoolName": "${school?.name}"
}
\`\`\``;

      // Check if a chat interaction already exists with this mentor
      const { data: existingChat, error: chatQueryError } = await supabase
        .from('mentor_student_interactions')
        .select('*')
        .eq('student_id', user.id)
        .eq('mentor_id', selectedMentor)
        .eq('type', 'chat')
        .maybeSingle();

      if (chatQueryError) {
        console.error('Error checking existing chat:', chatQueryError);
      }

      const newMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date(),
        sender_id: user.id,
        sender_name: user.name,
        sender_avatar: user.avatar_name
      };

      if (existingChat) {
        // Add message to existing chat
        const existingMessages = existingChat.metadata?.messages || [];
        const updatedMessages = [...existingMessages, newMessage];

        const { error: updateError } = await supabase
          .from('mentor_student_interactions')
          .update({
            metadata: {
              ...existingChat.metadata,
              messages: updatedMessages
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', existingChat.id);

        if (updateError) {
          console.error('Error updating chat with message:', updateError);
        }
      } else {
        // Create a new chat interaction with the message
        const { error: createChatError } = await supabase
          .from('mentor_student_interactions')
          .insert({
            student_id: user.id,
            mentor_id: selectedMentor,
            type: 'chat',
            status: 'active',
            metadata: {
              messages: [newMessage]
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createChatError) {
          console.error('Error creating chat with message:', createChatError);
        }
      }

      // Navigate to the mentor's chat window instead of the LOR page
      router.push(`/chat?person=${selectedMentor}`);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('There was an error submitting your request. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Link href="/tools/lor">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="ml-3 text-2xl font-bold">Request a Letter</h1>
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Request a recommendation letter</span>
          <span>
            {step}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Steps Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {/* Step 1: Select a Mentor */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-purple-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-2">Select a Mentor</h2>
                <p className="text-gray-700 mb-4">
                  Choose a mentor who can provide a recommendation for your applications.
                </p>

                {/* Search input */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-white w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Search mentors by name or subject"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Mentors list */}
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                  </div>
                ) : filteredMentors.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {filteredMentors.map((mentor) => (
                      <motion.div
                        key={mentor.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMentor(mentor.id === selectedMentor ? null : mentor.id)}
                        className={`p-4 rounded-lg border ${
                          selectedMentor === mentor.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white"
                        } cursor-pointer transition-all duration-200`}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center overflow-hidden">
                            {mentor.avatar_name ? (
                              <Image
                                src={`/images/avatars/${mentor.avatar_name}.png`}
                                alt={mentor.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to initial if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const span = document.createElement('span');
                                    span.className = 'font-bold text-purple-700';
                                    span.innerText = mentor.name.charAt(0);
                                    parent.appendChild(span);
                                  }
                                }}
                              />
                            ) : (
                              <span className="font-bold text-purple-700">{mentor.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className="font-semibold text-lg">{mentor.name}</h3>
                            <p className="text-sm text-gray-600">{getMentorSubjects(mentor)}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 ${
                            selectedMentor === mentor.id
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300"
                          } flex items-center justify-center`}>
                            {selectedMentor === mentor.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-3 h-3 bg-white rounded-full"
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No mentors found matching your search.</p>
                  </div>
                )}

                {/* Action button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={!selectedMentor}
                  onClick={nextStep}
                  className={`mt-6 w-full py-3 rounded-lg font-semibold
                    ${selectedMentor
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                >
                  Continue
                </motion.button>
              </div>
            </div>
          )}

          {/* Step 2: Select a Program */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-purple-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-2">Select a Program</h2>
                <p className="text-gray-700 mb-4">
                  Choose the program you're applying to.
                </p>

                {/* Search input */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-white w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Search programs or schools"
                    value={programSearchQuery}
                    onChange={(e) => setProgramSearchQuery(e.target.value)}
                  />
                </div>

                {/* Programs list */}
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                  </div>
                ) : filteredPrograms.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {filteredPrograms.map((program) => (
                      <motion.div
                        key={program.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedProgram(program.id === selectedProgram ? null : program.id)}
                        className={`p-4 rounded-lg border ${
                          selectedProgram === program.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white"
                        } cursor-pointer transition-all duration-200`}
                      >
                        <div className="flex items-center">
                          <div className="ml-0 flex-1">
                            <h3 className="font-semibold text-lg">{program.name}</h3>
                            <p className="text-sm text-gray-600">
                              {schools.find(s => s.id === program.school_id)?.name}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 ${
                            selectedProgram === program.id
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300"
                          } flex items-center justify-center`}>
                            {selectedProgram === program.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-3 h-3 bg-white rounded-full"
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No programs found matching your search.</p>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="mt-6 flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={prevStep}
                    className="w-1/3 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700"
                  >
                    Back
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={!selectedProgram}
                    onClick={nextStep}
                    className={`w-2/3 py-3 rounded-lg font-semibold
                      ${selectedProgram
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                  >
                    Continue
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Add Notes */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-purple-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-2">Add Notes</h2>
                <p className="text-gray-700 mb-4">
                  Add any additional notes for your mentor about your recommendation request.
                </p>

                {/* Notes textarea */}
                <div className="mb-4">
                  <textarea
                    placeholder="Enter any details about your application, achievements, or specific points you'd like your mentor to highlight..."
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    className="w-full min-h-[150px] rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Summary section */}
                <div className="bg-white p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-lg mb-2">Request Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mentor:</span>
                      <span className="font-medium">
                        {mentors.find(m => m.id === selectedMentor)?.name || ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Program:</span>
                      <span className="font-medium">
                        {programs.find(p => p.id === selectedProgram)?.name || ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">School:</span>
                      <span className="font-medium">
                        {getSchoolName(selectedProgram || "")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="mt-6 flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={prevStep}
                    className="w-1/3 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700"
                  >
                    Back
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-2/3 py-3 rounded-lg font-semibold bg-purple-600 text-white"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}