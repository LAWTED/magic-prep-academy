// 游戏配置, 以汉堡店为例
import {
  CircleDollarSign,
  Heart,
  BookOpen,
  FileText,
  Globe,
  Award,
  Stamp,
  GraduationCap,
  Mail,
} from "lucide-react";
import { QUIZ_TYPES } from "./const";

export const themeConfig = {
  xpReward: (num: number) => (
    <span className="flex items-center gap-1 text-bronze font-bold">
      <CircleDollarSign className="w-4 h-4 text-grass  font-bold " />
      {num}
    </span>
  ),
  hearts: (num: number) => (
    <span className="flex items-center gap-1 text-bronze font-bold">
      <Heart className="w-4 h-4 fill-current text-tomato font-bold" />
      {num}
    </span>
  ),

  // Timeline theme configuration
  timeline: {
    colors: {
      languageTest: "bg-skyblue/20 text-skyblue",
      applicationMaterials: "bg-gold/30 text-bronze",
      submitApplication: "bg-grass/20 text-grass",
      receiveOffers: "bg-gold/40 text-bronze",
      prepareVisa: "bg-tomato/20 text-tomato",
      startSchool: "bg-lime/30 text-grass",
    } as const,
    icons: {
      languageTest: BookOpen,
      applicationMaterials: FileText,
      submitApplication: Globe,
      receiveOffers: Award,
      prepareVisa: Stamp,
      startSchool: GraduationCap,
    } as const,
  },

  // Action type to theme mapping
  actionThemes: {
    language_test: {
      color: "bg-skyblue/20 text-skyblue border-skyblue/20",
      icon: BookOpen,
    },
    application_materials: {
      color: "bg-gold/30 text-bronze border-gold/30",
      icon: FileText,
    },
    submit_application: {
      color: "bg-grass/20 text-grass border-grass/20",
      icon: Globe,
    },
    receive_offers: {
      color: "bg-gold/40 text-gold border-gold/40",
      icon: Award,
    },
    prepare_visa: {
      color: "bg-tomato/20 text-tomato border-tomato/20",
      icon: Stamp,
    },
    start_school: {
      color: "bg-lime/30 text-grass border-lime/30",
      icon: GraduationCap,
    },
    recommendation_letter_sent: {
      color: "bg-lime/30 text-grass border-lime/30",
      icon: Mail,
    },
  } as const,

  // Common timeline events that apply to most schools
  // These can be updated once per year
  commonTimelineEvents: {
    language_test: {
      id: 1,
      title: "Prepare Language Tests",
      description: "Study for TOEFL/IELTS exams to meet school requirements",
      start_date: "2025-03-01",
      end_date: "2025-06-30",
      pic: "/images/cal/language_test.png",
    },
    application_materials: {
      id: 2,
      title: "Prepare Application Materials",
      description:
        "Work on personal statements, recommendation letters, and other documents",
      start_date: "2025-07-01",
      end_date: "2025-10-31",
      pic: "/images/cal/application_materials.png",
    },
    submit_application: {
      id: 3,
      title: "Submit Applications",
      description:
        "Submit your applications to target schools before deadlines",
      start_date: "2025-11-01",
      end_date: "2026-01-15",
      pic: "/images/cal/application_materials.png",
    },
    receive_offers: {
      id: 5,
      title: "Receive Offers",
      description: "Receive admission notices and confirm your acceptance",
      start_date: "2026-02-01",
      end_date: "2026-04-15",
      pic: "/images/cal/receive_offers.png",
    },
    prepare_visa: {
      id: 6,
      title: "Prepare Visa",
      description: "Apply for and obtain your student visa",
      start_date: "2026-04-16",
      end_date: "2026-07-15",
      pic: "/images/cal/prepare_visa.png",
    },
    start_school: {
      id: 7,
      title: "Start School",
      description: "Arrive at the university and begin your first semester",
      start_date: "2026-08-01",
      end_date: "2026-09-30",
      pic: "/images/cal/start_school.png",
    },
  } as const,
};
