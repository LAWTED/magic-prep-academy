# Magic Prep Academy

Welcome to Magic Prep Academy — a platform designed to support students in preparing for their graduate school applications. (Especially for Doge lovers 🐶)

## PWA

This is a Progressive Web App (PWA), which means you can install it on your phone and enjoy a full-screen experience like a native app.



## Features

- [ ]  means **Planned as part of future updates.**

### Login/Signup

1. **Create a Student Account**
    - Sign up easily using your email.
2. **Create a Mentor Account**
    - Click the “For Mentors” button.
    - Sign up using your email as well.

### Quiz

1. **Mentor-Generated Personalized Games**
    - Mentors can upload PDFs, Word documents, or text files.
        - The system will automatically convert the content into mini-game modules.
        - Mentors can generate four types of quizzes that will instantly appear in the mentee’s game tab:
            - Matching
            - Multiple Choice
            - Fill in the Blank
            - Dialogue
            - [ ]  Voice Chat (with OpenAI voice API)



2. **Interactive Quiz Engagement**
    - Mentees can view and complete quizzes created by mentors.
    - All quiz interactions are gamified for a fun and effective learning experience.



## Hearts & XP

1. Each quiz attempt consumes one heart.
    1. Click the heart button on the top right corner. You can buy some hearts in the shop (by real money). Currently, they are free.
    - [ ]  If all quiz answers are correct, the heart is refunded.


2. Completing a module earns XP.
    1. XP can be used in the shop to unlock items
    - [ ]  The amount of XP earned depends on the number of correct answers.



## School & Program

1. **Search and Filter**
    1. Browse graduate programs by location and subject of interest.
2. **Set Target Programs**
    1. Save any program as a “target” to kick off your application journey.
    2. There will be a deadline shown in the calendar — scary, right? But all your milestones will also show up there, so chill down.



3. **AI-Generated Program Summaries**
    1. View RedNote-like summaries of each program, powered by AI.


4. **AI Eligibility Check**
    1. Instantly check if you meet the admission requirements for your chosen programs.
    2. but first, we needs to write down our academic informations.
    3. I set my Speaking score to 24, which doesn’t meet the minimum requirement of 27 — so even if I meet the other criteria, I’m still not eligible.


5. **Track Application Progress.**
    1.  You can view this section later — prepare some materials in the Tools page.

## Tools - **Letter of Recommendation**

1. **Write me a Letter of Recommendation**
    1. Select your mentor to write a big Letter of Recommendation for you.
    2. Forgive my rude note, but we will use it later.
    3. The system will directly send a chat to the mentor, and they can view it quickly.


2. **OK, Here it is**
    1. Mentors can view student requests in their dashboard.
    2. Mentors can click “Accept” directly from chat.
    3. Mentors can write the LoR in a fantastic text editor, which includes lots of context and suggestions — like what the student mentioned in the notes, which program the student wants to apply to, and even the mentor’s name.


1. **Send LoR to the school**
    1. Send your LoR to the school and track it in your application progress.
    2. What’s more, there’s a milestone in your calendar! Good job, dude.



## Tools - Resume

1. **Upload Your Resume, Wrap It with AI**
    1. You can upload PDFs or DOCX files in any style — AI will extract the info and return a standard format for you.


2. **AI Score**
    1. Each version of your resume will get an AI score, along with suggestions to help you improve next time.


3. **Edit it with AI**
    1. You can edit it by chatting with AI, and preview the generated version quickly.


4. **Export as PDF**
    1. Even though it feels like a game in the app, you can still export a formal PDF.


5. **Ask PhD Mentor**
    1. PhD Mentor is an encouraging AI who helps you with everything — and the good news is, you can send your resume to them without copy-pasting.



**6. Send it to the School**

1. Ooh yeah, now you can just attach your resume — any version you want — just click it and send it to the school.
2. In fact, it’s not actually sent to Stanford… but if they give us an API, we can do it.
3. You can also check it in your calendar, recording every milestone in your journey.


## Tools - SOP

1. **Upload Your SOP**
    1. Just like the resume, you can upload your SOP in many formats — AI will analyze it.
2. **AI Score.**
3. **Mentor edit your SOP.**
    1. Mentors give students suggestions and comments.
    2. AI helps the mentor, but the mentor reviews and finalizes everything under their name.


4. **Student Adapts Suggestions and Iterates SOP**
    1. I really like the design of Dynamic Island — it feels so good. Swipe, swipe!
    2. Students can apply a suggestion and read the comment.


5. **Ask PhD Mentor.**
    1. Same as the resume.
6. **Export as PDF.**
7. **Send it to the School.**
    1. Attach your SOP just like your resume.
    2. And check your milestone in the calendar! Great!



## Tools - PHS

Coming soon. The functionality will be the same as the SOP — students upload, mentors can edit, and everything is in text format.

## Calendar

1. **Record your application milestone**
    1. Whenever you finish your resume, SOP, or LoR, it’s a milestone — and milestones should be carved!
2. **When Are My Target Deadlines?**
    1. Yes, it can remind you with a red line in the calendar.
3. **What should I do now?**
    1. The system has prepared you for Fall 2026, and shows what to focus on each month.



## Realtime Chat & Notification

1. Mentors and students can chat in real time.
2. Notifications are available on both phone and PC.
    1. Even when the app is running in the background.
    2. Google environment is required, because it’s Firebase under the hood.



## Core Functions

1. **Landing/Title Page**

   1. Title: Magic Prep Academy

   - Visual Refs

     Check out this website: [https://www.gameuidatabase.com/index.php?&set=1&scrn=2](https://www.gameuidatabase.com/index.php?&set=1&scrn=2)
     It’s a website dedicated to game UI design.

  2. Mobile-first design

3. **Quiz/Game/Interactive Elements**

   1. The Game Begins: Develop a Duolingo-inspired interactive learning module focused on Psychological Sciences that transforms complex concepts into engaging, game-like interactions. Key requirements:
   2. Core Design: Mirror Duolingo’s clean UI/UX (progress bars, streaks, celebratory feedback) but replace language content with psychology topics (e.g., cognitive biases, neuroanatomy, therapy techniques).
   3. Interactivity First: Prioritize minimal text and maximal interaction – no static textbook excerpts please. Sample implements (Feel free to invent your own, no obligation to follow the examples below):
      - Branching scenario quizzes (e.g., "Drag neurotransmitters to their brain regions")
      - Visual matching games (e.g., Pair therapy techniques to case studies via icons)
      - Interactive case simulations (e.g., Choose dialogue options for a client-therapist roleplay)
   4. Gamification Elements: Include XP systems, "health points" for accuracy streaks, and unlockable "achievements" tied to milestones (e.g., "Mastered Behaviorism Lv.3").

4. **Grad School Application Journey Visualization**

   1. Timeline/Calendar View: Visualize the entire grad school application process (e.g., deadlines, milestones, in a Duolingo/game-like roadmap style)

      - Visual Refs

        ![IMG_3714.JPG](RA%20Recruitment%20Task%201b740dab55c58056a9d8ddea43261493/IMG_3714.jpg)

        ![IMG_3715.JPG](RA%20Recruitment%20Task%201b740dab55c58056a9d8ddea43261493/IMG_3715.jpg)

   2. Progress Tracker: Allow players to track their progress when completed application tasks

5. **University "Bucket" System**

   1. University Hub: Allow players to filter universities by major/field (e.g., "Computer Science," "Psychology") and geographic location
   2. Save to Bucket: Let users save universities to a personalized list ("My Target Schools")
   3. Deadline Tracking Automation: Auto-populate application deadlines for saved universities & update them on the timeline/calendar view mentioned above

6. **Magical Tools Inventory**

   1. Letters of Recommendation (LoR)
      1. Recommender Dashboard: Allow players to input professor/employer details and track letter status (e.g., "Requested," "In Progress," "Submitted")
      2. "Ask a PhD Mentor" Chat: ****Players click "Help" in the LoR tab → opens a chat window, then, a PhD mentor can message them and does Q&As; An LLM is linked here, it serves as the PhD mentor and gives human-like, real-time feedback and encouragement to the player
      3. Letter Revision: Interactive templates for emailing recommenders, with auto-fill fields like deadlines, program name
   2. CV/Resume
      1. Upload: Allow players to upload current CV (PDF/DOCX)
      2. Auto-formatting: Auto-restructure CV to field-specific academic templates (in the case of Psychological Science, use the APA format)
      3. Initial evaluation score: Metrics might include Completeness, Academic Jargon Use, Structure, Relevance to Target Program. Example: “Your CV scores 72/100. Boost relevance by adding RA experience!” Use AI to mark red flags: Highlight missing sections (e.g., “Publications,” “Conferences”)
      4. "Ask a PhD Mentor" Chat
      5. Version Control:
         - Save multiple CV versions (e.g., “PhD Applications,” “Master Applications”); Track changes with AI commentary: “Version 3 added 2 publications (+15% completeness).” Export as PDF, LaTeX, or DOCX
   3. Statement of Purpose (SoP)
      1. Upload: Allow players to upload current SoP (PDF/DOCX)
      2. Initial Evaluation Score
      3. Auto-formatting: Auto-tailor to each program’s specific font, page limit etc.
      4. "Ask a PhD Mentor" Chat
      5. Version Control:
         - Save multiple SoP versions (e.g., for different universities and programs). Export as PDF, LaTeX, or DOCX
   4. Personal History Statement
      1. Upload: Allow players to upload current PHS (PDF/DOCX)
      2. Initial Evaluation Score
      3. Auto-formatting: Auto-tailor to each program’s specific font, page limit etc.
      4. "Ask a PhD Mentor" Chat
   5. TOEFL/IELTS
      1. Quick Check: "Do I Need the Test?” Players answer simple questions, the system outputs whether they need to take any English language test or not
   6. GPA
      1. WES Quick Check: Players answer simple questions, the system outputs whether they need to get their Official Transcript evaluated by WES

7. PhD Mentor Dashboard (A Separate Desktop Version)

   1. Log in: Allow mentors to access data of their paired mentees
   2. Document Review: In a Grammarly-like style, hover over an AI suggestion → Click “✓” to accept (logged as mentor’s edit) or “✕” to reject; Example: AI suggests changing “did research” → “designed experiments.” Mentor clicks “✓” → Edit is attributed to them
   3. Manual Edit Tools: Mentors type directly into the document → Changes are highlighted in blue with their name/avatar
   4. Tag: All edits (AI-accepted or manual) are tagged with the mentor’s user name for accountability
   5. Send Back Workflow: Mentor clicks “Send Feedback” → Document locks for further edits. Revised document appears in the student’s chat with a notification. System auto-generates a summary: “Dr. Jane Smith revised your CV: 12 edits accepted, 3 comments added.”
   6. Game Design: Mentors can upload textbooks, blogs, or academic journal articles, and they are automatically “translated” into new mini-game modules, and instantly added to the mentee’s game tab (mentioned in 2a). In a Duolingo-like metaphor, this means: Instead of Duolingo already has all the quizes, in this game, you will have a mentor, they assign you new games/tasks everyday based on ever-newer scientific advances, the guru’s most recent Tweets, or newly published articles on *Nature* or *Science*.

8. Domain Transfer (IMPORTANT!)

   1. Since this project is not the ACTUAL RESEARCH PROJECT, we want you to pay attention to the codebase’s adaptability for future projects. We will evaluate **domain transferability** by analyzing how easily your core function systems (e.g., gamification mechanics, progress tracking, AI-driven content generation) could be repurposed for other games (such as a K12 space physics learning game). To guide your design, we have come up with the following questions for you to THINK HARD before designing the system:
   2. Modularity of systems: Are psychology-specific logic and content decoupled from reusable components (e.g., quiz engines, XP systems)?
   3. Configurability: Can asset pipelines, LLM prompts, and UI templates be swapped via configuration files rather than code rewrites?
   4. Documentation clarity: Do API endpoints and database schemas include domain-agnostic descriptions? Please give an estimate of the additional hours required to adapt the codebase (e.g., 20+ hours for tightly coupled systems vs. <5 hours for modular architectures) and propose optimizations to improve cross-domain reusability for future research.

# Evaluation (Score 0 to 40)

| **Metric**                   | **Evaluation Focus**                                         | **Score (1-5)** |
| ---------------------------- | ------------------------------------------------------------ | --------------- |
| **System Architecture**      | Backend scalability (from 0 to 100k users), database design, API efficiency |                 |
| **~~UI/UX Implementation~~** | ~~Visual appeal, playability, a sense of wonder for players~~ |                 |
| **AI Integration**           | LLM performance (in the mentor chat), auto-formatting accuracy, dynamic content generation |                 |
| **Gamification & Flow**      | XP/Game system functionality, interactive elements, progress synchronization |                 |
| **Data Automation**          | Deadline tracking, document version control, filtering systems |                 |
| **Collaboration Tools**      | Mentor dashboard functionality, document locking/attribution |                 |
| **Error Handling**           | Failure recovery, user-friendly errors, API fallbacks        |                 |
| **Deployment**               | CI/CD implementation, load testing, monitoring systems       |                 |
| **Domain Transferability**   | Code modularity, content-config separation, documentation for domain adaptation |                 |

**Scoring Guide**:

- **1** = Critical flaws
- **3** = Functional but needs improvement
- **5** = Production-ready excellence

**Specifically For “Domain Transferability” Scoring**:

- **1** = Hard-coded psychology content (needs full rebuild)
- **3** = Core game engine reusable but content layers require recoding (~40hrs)
- **5** = Plug-and-play content system (swap psychology → space physics via config files <20hrs)

