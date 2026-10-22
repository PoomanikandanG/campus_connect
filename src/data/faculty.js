/**
 * The single source of faculty records. Add teachers only to this array.
 * Keep each id unique and unchanged when a teacher's name or details change.
 *
 * @typedef {Object} FacultyRecord
 * @property {string} id Stable identifier used by profile URLs and timetable links.
 * @property {string} name
 * @property {string} [department]
 * @property {string} [role] Designation (the alias `designation` is also supported).
 * @property {string} [initials] Generated from the name when omitted.
 * @property {string} [color] blue, purple, peach, green, or sand.
 * @property {string} [building] The existing `block` field remains supported.
 * @property {string} [block]
 * @property {string} [floor]
 * @property {string} [cabin]
 * @property {string} [subjectArea] Teaching category, separate from official department.
 * @property {string[]} [subjects] Imported teaching subjects; not availability or timetable data.
 * @property {string} [dataSource] Provenance of imported cabin and subject details.
 * @property {string} [photo] Image URL or public asset path; initials on failure.
 * @property {{suitColor?: string, accentColor?: string, skinColor?: string, hairColor?: string, idleAnimation?: boolean}} [avatar] Hex colors; all settings optional.
 * @property {Array<{id?: string, facultyId?: string, day?: string, subject?: string, startsAt?: string, endsAt?: string}>} [timetable] Reserved data only. Each entry receives this faculty's stable ID when normalized. No scheduling or timetable UI is implemented.
 */

// Imported from faculty_import.js; this array is the only runtime data source.
// Building name is unconfirmed. G09 is confirmed as Ground Floor by the project owner.
// Existing IDs, locations, and visual settings are retained; unknown details use UI placeholders.
// Subject names and categories follow the supplied subject update. Official departments
// and designations remain unconfirmed; do not infer them from titles or subjects.
/** @type {FacultyRecord[]} */
export const faculty = [
  {
    "id": "mahesh-h",
    "floor": "Ground Floor",
    "name": "Mr. Mahesh H",
    "initials": "MH",
    "role": null,
    "department": null,
    "cabin": "G09",
    "color": "blue",
    "building": null,
    "subjects": [
      "Computer Organization & Architecture"
    ],
    "dataSource": "Faculty directory screenshots",
    "subjectArea": "Computer Science"
  },
  {
    "id": "hajeera-nk",
    "floor": "Fifth floor",
    "name": "Ms. Hajeera NK",
    "initials": "HN",
    "role": null,
    "department": null,
    "cabin": "507",
    "color": "purple",
    "building": null,
    "subjects": [
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "subjectArea": "Computer Science"
  },
  {
    "id": "indira-s",
    "floor": "Fifth floor",
    "name": "Dr. Indira S",
    "initials": "IS",
    "role": null,
    "department": null,
    "cabin": "507",
    "color": "peach",
    "building": null,
    "subjects": [
      "Probability Distributions & Statistical Inference"
    ],
    "dataSource": "Faculty directory screenshots",
    "subjectArea": "Mathematics"
  },
  {
    "id": "sadhvi",
    "floor": "Sixth floor",
    "name": "Ms. Sadhvi",
    "initials": "S",
    "role": null,
    "department": null,
    "cabin": "607",
    "color": "green",
    "building": null,
    "subjects": [
      "Operating Systems",
      "Responsive Web Design Lab"
    ],
    "dataSource": "Faculty directory screenshots",
    "subjectArea": "Computer Science"
  },
  {
    "id": "jyothi-narayana-murthy",
    "floor": "Third floor",
    "name": "Mr. Jyothi Narayana Murthy",
    "initials": "JM",
    "role": null,
    "department": null,
    "cabin": "307",
    "color": "sand",
    "building": null,
    "subjects": [
      "Responsive Web Design Lab"
    ],
    "dataSource": "Faculty directory screenshots",
    "subjectArea": "Computer Science"
  },
  {
    "id": "ravi-kumar",
    "name": "Dr. Ravi Kumar",
    "building": null,
    "floor": "Third floor",
    "cabin": "307",
    "subjects": [
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "asha-pv",
    "name": "Ms. Asha PV",
    "building": null,
    "floor": "Second floor",
    "cabin": "207",
    "subjects": [
      "Computer Organization & Architecture"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "rakshitha-jn",
    "name": "Ms. Rakshitha JN",
    "building": null,
    "floor": "Second floor",
    "cabin": "206",
    "subjects": [
      "Computer Organization & Architecture",
      "Universal Human Values"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Interdisciplinary"
  },
  {
    "id": "madhu-g-u",
    "name": "Mr. Madhu G U",
    "building": null,
    "floor": "Fourth floor",
    "cabin": "407",
    "subjects": [
      "Probability & Statistical Inference"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Mathematics"
  },
  {
    "id": "vijaya-b",
    "name": "Ms. Vijaya B",
    "building": null,
    "floor": "Fifth floor",
    "cabin": "507",
    "subjects": [
      "Operating Systems",
      "Computer Organization & Architecture"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "renuka-nd",
    "name": "Ms. Renuka ND",
    "building": null,
    "floor": "Sixth floor",
    "cabin": "607",
    "subjects": [
      "Responsive Web Design Lab"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "ramya-n",
    "name": "Ms. Ramya N",
    "building": null,
    "floor": "Second floor",
    "cabin": "207",
    "subjects": [
      "Additional Mathematics-I"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Mathematics"
  },
  {
    "id": "pavithra-k",
    "name": "Ms. Pavithra K",
    "building": null,
    "floor": "Second floor",
    "cabin": "206",
    "subjects": [
      "Additional Mathematics-I",
      "Probability & Inference"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Mathematics"
  },
  {
    "id": "mary-angel",
    "name": "Ms. Mary Angel",
    "building": null,
    "floor": "Fourth floor",
    "cabin": "407",
    "subjects": [
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "niranjini-m",
    "name": "Ms. Niranjini M",
    "building": null,
    "floor": "Fifth floor",
    "cabin": "507",
    "subjects": [
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "tejas-j",
    "name": "Mr. Tejas J",
    "building": null,
    "floor": "Sixth floor",
    "cabin": "607",
    "subjects": [
      "Probability Distributions & Statistical Inference"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Mathematics"
  },
  {
    "id": "tanzeem-mukthar",
    "name": "Ms. Tanzeem Mukthar",
    "building": null,
    "floor": "Third floor",
    "cabin": "307",
    "subjects": [
      "Operating Systems",
      "Responsive Web Design Lab"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "nayanika-saha",
    "name": "Ms. Nayanika Saha",
    "building": null,
    "floor": null,
    "cabin": null,
    "subjects": [
      "Responsive Web Design Lab"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "vijaylakshmi",
    "name": "Ms. Vijaylakshmi",
    "building": null,
    "floor": "Second floor",
    "cabin": "206",
    "subjects": [
      "Computer Organization & Architecture"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "veena-s",
    "name": "Ms. Veena S",
    "building": null,
    "floor": "Fourth floor",
    "cabin": "407",
    "subjects": [
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "sulakhe-varun-kumar",
    "name": "Mr. Sulakhe Varun Kumar",
    "building": null,
    "floor": null,
    "cabin": null,
    "subjects": [
      "Universal Human Values"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Interdisciplinary"
  },
  {
    "id": "charan-sn",
    "name": "Mr. Charan SN",
    "building": null,
    "floor": "Second floor",
    "cabin": "207",
    "subjects": [
      "Computer Organization & Architecture"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "mahesh-k-s",
    "name": "Mr. Mahesh K S",
    "building": null,
    "floor": null,
    "cabin": null,
    "subjects": [
      "Probability Distributions & Statistical Inference"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Mathematics"
  },
  {
    "id": "simran-pal",
    "name": "Ms. Simran Pal",
    "building": null,
    "floor": "Fourth floor",
    "cabin": "407",
    "subjects": [
      "Operating Systems",
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "poornima-t",
    "name": "Ms. Poornima T",
    "building": null,
    "floor": "Fifth floor",
    "cabin": "507",
    "subjects": [
      "Responsive Web Design Lab"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "chaitra-p",
    "name": "Ms. Chaitra P",
    "building": null,
    "floor": "Sixth floor",
    "cabin": "607",
    "subjects": [
      "Computer Organization & Architecture"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "preethi-bs",
    "name": "Ms. Preethi BS",
    "building": null,
    "floor": "Third floor",
    "cabin": "307",
    "subjects": [
      "Computer Organization & Architecture",
      "Operating Systems"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "ramya-s-k",
    "name": "Ms. Ramya S K",
    "building": null,
    "floor": "Second floor",
    "cabin": "207",
    "subjects": [
      "Probability Distributions & Statistical Inference"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Mathematics"
  },
  {
    "id": "harshitha-s",
    "name": "Ms. Harshitha S",
    "building": null,
    "floor": "Second floor",
    "cabin": "206",
    "subjects": [
      "Operating Systems"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "shambhavi-b",
    "name": "Ms. Shambhavi B",
    "building": null,
    "floor": null,
    "cabin": null,
    "subjects": [
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "priyanka-cm",
    "name": "Ms. Priyanka CM",
    "building": null,
    "floor": "Fifth floor",
    "cabin": "507",
    "subjects": [
      "Operating Systems"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "reena-dk",
    "name": "Prof. Reena DK",
    "building": null,
    "floor": null,
    "cabin": null,
    "subjects": [
      "Responsive Web Design Lab"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "tanmoy-kundu",
    "name": "Mr. Tanmoy Kundu",
    "building": null,
    "floor": "Third floor",
    "cabin": "307",
    "subjects": [
      "Universal Human Values"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Interdisciplinary"
  },
  {
    "id": "roshini-b",
    "name": "Ms. Roshini B",
    "building": null,
    "floor": "Second floor",
    "cabin": "207",
    "subjects": [
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  },
  {
    "id": "aemi-kalari",
    "name": "Ms. Aemi Kalari",
    "building": null,
    "floor": null,
    "cabin": null,
    "subjects": [
      "Data Structures & Applications"
    ],
    "dataSource": "Faculty directory screenshots",
    "department": null,
    "subjectArea": "Computer Science"
  }
]
