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
      languageTest: "bg-blue-100 text-blue-600",
      applicationMaterials: "bg-purple-100 text-purple-600",
      submitApplication: "bg-green-100 text-green-600",
      receiveOffers: "bg-yellow-100 text-yellow-600",
      prepareVisa: "bg-red-100 text-red-600",
      startSchool: "bg-indigo-100 text-indigo-600",
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
      color: "bg-blue-100 text-blue-600",
      icon: BookOpen,
    },
    application_materials: {
      color: "bg-purple-100 text-purple-600",
      icon: FileText,
    },
    submit_application: {
      color: "bg-green-100 text-green-600",
      icon: Globe,
    },
    receive_offers: {
      color: "bg-yellow-100 text-yellow-600",
      icon: Award,
    },
    prepare_visa: {
      color: "bg-red-100 text-red-600",
      icon: Stamp,
    },
    start_school: {
      color: "bg-indigo-100 text-indigo-600",
      icon: GraduationCap,
    },
    recommendation_letter_sent: {
      color: "bg-emerald-100 text-emerald-600",
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
