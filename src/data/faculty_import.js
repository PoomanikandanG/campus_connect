
/**
 * CampusConnect — Faculty Import Dataset
 *
 * Temporary dataset for merging into faculty.js.
 * Review names, subjects, and cabin numbers before publishing.
 *
 * All faculty share one academic building.
 * The official building name is not yet confirmed.
 *
 * Do not use these records as live availability data.
 */

import { deriveFloorFromCabin } from '../utils/faculty.js';

const facultyRecords = [
  // Format: [Name, Subject(s), Cabin Number]

  ["Dr. Ravi Kumar",
    ["Data Structures & Applications"], "307"],

  ["Ms. Asha PV",
    ["Computer Organization & Architecture"], "207"],

  ["Ms. Rakshitha JN",
    ["COA", "Universal Human Values"], "206"],

  ["Mr. Madhu G U",
    ["Probability & Statistical Inference"], "407"],

  ["Ms. Vijaya B",
    ["Operating Systems", "COA"], "507"],

  ["Ms. Renuka ND",
    ["Responsive Web Design Lab"], "607"],

  ["Mr. Jyothi Narayana Murthy",
    ["Responsive Web Design Lab"], "307"],

  ["Ms. Ramya N",
    ["Additional Mathematics-I"], "207"],

  ["Ms. Pavithra K",
    ["Additional Mathematics", "Probability & Inference"], "206"],

  ["Ms. Mary Angel",
    ["Data Structures & Applications"], "407"],

  ["Ms. Niranjini M",
    ["Data Structures & Applications"], "507"],

  ["Mr. Tejas J",
    ["Probability Distributions & Inference"], "607"],

  ["Ms. Tanzeem Mukthar",
    ["Operating Systems", "RWD Lab"], "307"],

  ["Ms. Nayanika Saha",
    ["Responsive Web Design Lab"], null],

  ["Ms. Vijaylakshmi",
    ["Computer Organization & Architecture"], "206"],

  ["Ms. Veena S",
    ["Data Structures & Applications"], "407"],

  ["Dr. Indira S",
    ["Probability Distributions & Inference"], "507"],

  ["Ms. Sadhvi",
    ["Operating Systems", "RWD Lab"], "607"],

  ["Mr. Sulakhe Varun Kumar",
    ["Universal Human Values"], null],

  ["Mr. Charan SN",
    ["Computer Organization & Architecture"], "207"],

  ["Mr. Mahesh K S",
    ["Probability Distributions & Inference"], null],

  ["Ms. Simran Pal",
    ["Operating Systems", "Data Structures"], "407"],

  ["Ms. Poornima T",
    ["Responsive Web Design Lab"], "507"],

  ["Ms. Chaitra P",
    ["Computer Organization & Architecture"], "607"],

  ["Ms. Preethi BS",
    ["COA", "Operating Systems"], "307"],

  ["Ms. Ramya S K",
    ["Probability Distributions & Inference"], "207"],

  ["Ms. Harshitha S",
    ["Operating Systems"], "206"],

  ["Ms. Shambhavi B",
    ["Data Structures & Applications"], null],

  ["Ms. Priyanka CM",
    ["Operating Systems"], "507"],

  ["Prof. Reena DK",
    ["Responsive Web Design Lab"], null],

  ["Mr. Tanmoy Kundu",
    ["Universal Human Values"], "307"],

  ["Ms. Roshini B",
    ["Data Structures & Applications"], "207"],

  ["Ms. Aemi Kalari",
    ["Data Structures & Applications"], null],

  // Latest confirmed corrections:
  ["Mr. Mahesh H",
    ["Computer Organization & Architecture"], "G09"],

  ["Ms. Hajeera NK",
    ["Data Structures & Applications"], "507"],
];

export const facultyImport = facultyRecords.map(
  ([name, subjects, cabin]) => ({
    id: name
      .toLowerCase()
      .replace(/^(mr|ms|mrs|dr|prof)\.?\s+/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),

    name,
    subjects,

    cabin,
    floor: deriveFloorFromCabin(cabin),

    department: null,
    building: null,

    photo: null,
    avatar: null,

    dataSource: "Faculty directory screenshots",
  })
);

export default facultyImport;
