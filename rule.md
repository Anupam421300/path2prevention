{
  "ruleSetId": "p2p-core",
  "version": "1.1.0",
  "factsVersion": "1.1.0",
  "maxActive": 5,
  "categoryDedupe": true,
  "selection": {
    "meterThresholds": { "LOW_MAX": 24, "MED_MAX": 49, "HIGH_MAX": 74, "VERY_HIGH_MIN": 75 },
    "confidenceGates": { "minLogsForOptimization": 3, "minSleepLogsForSleepRules": 3, "minDietLogsForDietRules": 3 },
    "defaultSnoozeDays": 7
  },
  "evidenceSources": [
    {
      "sourceId": "EV_WHO_PA_BEHEALTHY",
      "title": "Physical activity recommendations",
      "publisher": "WHO",
      "url": "https://www.who.int/initiatives/behealthy/physical-activity",
      "tags": ["physical_activity", "guidelines"],
      "snippet": "Adults should do at least 150 minutes of moderate-intensity activity weekly (or equivalent combination)."
    },
    {
      "sourceId": "EV_CDC_PA_ADULTS",
      "title": "Adult Activity: An Overview",
      "publisher": "CDC",
      "url": "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
      "tags": ["physical_activity", "guidelines"],
      "snippet": "Adults need at least 150 minutes of moderate-intensity physical activity a week; also include muscle strengthening."
    },
    {
      "sourceId": "EV_CDC_WHAT_COUNTS",
      "title": "What Counts as Physical Activity for Adults",
      "publisher": "CDC",
      "url": "https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html",
      "tags": ["physical_activity", "examples"],
      "snippet": "Rule of thumb: 1 minute vigorous is about the same as 2 minutes moderate; activity can be split into smaller chunks."
    },
    {
      "sourceId": "EV_AASM_SLEEP_7H",
      "title": "Seven or more hours of sleep per night",
      "publisher": "AASM/SRS",
      "url": "https://aasm.org/seven-or-more-hours-of-sleep-per-night-a-health-necessity-for-adults",
      "tags": ["sleep", "duration"],
      "snippet": "Adults should sleep 7 or more hours per night on a regular basis."
    },
    {
      "sourceId": "EV_HARVARD_SLEEP_HYGIENE",
      "title": "Sleep hygiene: Simple practices for better rest",
      "publisher": "Harvard Health",
      "url": "https://www.health.harvard.edu/staying-healthy/sleep-hygiene-simple-practices-for-better-rest",
      "tags": ["sleep", "habits"],
      "snippet": "Sleep hygiene includes consistent schedule, relaxing routine, and supportive sleep environment."
    },
    {
      "sourceId": "EV_AHA_ADDED_SUGARS",
      "title": "Added Sugars",
      "publisher": "American Heart Association",
      "url": "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sugar/added-sugars",
      "tags": ["diet", "added_sugar"],
      "snippet": "Limiting added sugars (including sugary beverages) supports healthier eating patterns."
    },
    {
      "sourceId": "EV_NIDDK_PLATE_METHOD",
      "title": "Diet, eating & physical activity (Plate method)",
      "publisher": "NIDDK",
      "url": "https://www.niddk.nih.gov/health-information/diabetes/overview/diet-eating-physical-activity",
      "tags": ["diet", "plate_method"],
      "snippet": "Plate method: half nonstarchy vegetables, one quarter carbs (high fiber), one quarter protein."
    },
    {
      "sourceId": "EV_ADA_FRUIT",
      "title": "Fruit and diabetes-friendly choices",
      "publisher": "American Diabetes Association",
      "url": "https://diabetes.org/healthy-living/recipes-nutrition/eating-well/fruit",
      "tags": ["diet", "fruit"],
      "snippet": "Whole fruits are generally good choices; limit juice and watch portions for dried fruit."
    },
    {
      "sourceId": "EV_CDC_BMI_CATEGORIES",
      "title": "Adult BMI Categories",
      "publisher": "CDC",
      "url": "https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html",
      "tags": ["weight", "bmi"],
      "snippet": "BMI categories: healthy 18.5–<25; overweight 25–<30; obesity ≥30."
    },
    {
      "sourceId": "EV_WHO_ASIAN_BMI",
      "title": "BMI for Asian populations (WHO Expert Consultation)",
      "publisher": "PubMed",
      "url": "https://pubmed.ncbi.nlm.nih.gov/14726171/",
      "tags": ["weight", "bmi", "asia"],
      "snippet": "WHO consultation proposed public-health action points (e.g., 23, 27.5) for Asian populations."
    },
    {
      "sourceId": "EV_USDA_FDC_API",
      "title": "FoodData Central API Guide",
      "publisher": "USDA",
      "url": "https://fdc.nal.usda.gov/api-guide",
      "tags": ["diet", "nutrients", "database"],
      "snippet": "FoodData Central provides nutrient data and search via API."
    },
    {
      "sourceId": "EV_CDC_DIAB_TESTING",
      "title": "Diabetes Testing (A1C and fasting plasma glucose ranges)",
      "publisher": "CDC",
      "url": "https://www.cdc.gov/diabetes/diabetes-testing/index.html",
      "tags": ["labs", "a1c", "fpg"],
      "snippet": "Diabetes: A1C ≥6.5% or fasting plasma glucose ≥126 mg/dL; Prediabetes: A1C 5.7–6.4% or fasting 100–125."
    },
    {
      "sourceId": "EV_CDC_A1C",
      "title": "A1C Test for Diabetes and Prediabetes",
      "publisher": "CDC",
      "url": "https://www.cdc.gov/diabetes/diabetes-testing/prediabetes-a1c-test.html",
      "tags": ["labs", "a1c"],
      "snippet": "A1C ranges: normal <5.7; prediabetes 5.7–6.4; diabetes ≥6.5."
    }
  ],
  "baseRules": [
    {
      "id": "R_ENGAGE_ONBOARDING",
      "category": "Engagement",
      "basePriority": 95,
      "trigger": { "==": [{ "var": "facts.profile.onboardingComplete" }, false] },
      "resolve": { "==": [{ "var": "facts.profile.onboardingComplete" }, true] },
      "whyTemplate": "Complete your profile to personalize recommendations.",
      "actions": [
        "Add height and baseline weight",
        "Select optional health conditions if any apply",
        "Set your schedule type (regular/rotating/night-shift)"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 2, "cooldownDays": 3, "dedupeKey": "ENGAGE_ONBOARDING" }
    },
    {
      "id": "R_ENGAGE_LOW_LOGGING",
      "category": "Engagement",
      "basePriority": 85,
      "trigger": { "<=": [{ "var": "facts.metrics.daysLogged7d" }, 2] },
      "resolve": { ">=": [{ "var": "facts.metrics.daysLogged7d" }, 4] },
      "whyTemplate": "More consistent logging improves the accuracy of insights and recommendations.",
      "actions": [
        "Log just 1 thing daily (steps OR sleep OR activity)",
        "Aim for 4 logging days this week",
        "Review the dashboard on the last day of the week"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 5, "cooldownDays": 7, "dedupeKey": "ENGAGE_LOGGING" }
    },
    {
      "id": "R_ENGAGE_MODERATE_LOGGING",
      "category": "Engagement",
      "basePriority": 60,
      "trigger": { "==": [{ "var": "facts.metrics.daysLogged7d" }, 3] },
      "resolve": { ">=": [{ "var": "facts.metrics.daysLogged7d" }, 4] },
      "whyTemplate": "You’re close to consistent tracking. One extra day improves trend accuracy.",
      "actions": [
        "Pick one day and log steps + sleep",
        "Keep a simple weekly streak: 4 days/week",
        "Use reminders in Settings if needed"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 7, "cooldownDays": 7, "dedupeKey": "ENGAGE_LOGGING" }
    },
    {
      "id": "R_ENGAGE_MISSING_WEIGHT_LOG",
      "category": "Engagement",
      "basePriority": 55,
      "trigger": { ">=": [{ "var": "facts.metrics.noWeightLogDays" }, 14] },
      "resolve": { "<": [{ "var": "facts.metrics.noWeightLogDays" }, 8] },
      "whyTemplate": "Weekly weight logging helps track trend rather than day-to-day fluctuation.",
      "actions": [
        "Log weight once this week (same time of day)",
        "Focus on the 4-week trend line, not single readings",
        "If you prefer, log waist monthly instead"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 7, "cooldownDays": 14, "dedupeKey": "ENGAGE_WEIGHTLOG" }
    },
    {
      "id": "R_ENGAGE_CONFIDENCE_GATE",
      "category": "Engagement",
      "basePriority": 70,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.daysLogged7d" }, 1] },
          { "<": [{ "var": "facts.metrics.daysLogged7d" }, 3] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.daysLogged7d" }, 3] },
      "whyTemplate": "We need a bit more data to tailor sleep and diet insights accurately.",
      "actions": [
        "Log sleep hours on 3 days this week",
        "Log diet signals (sugary drinks/fast food) on 3 days",
        "Then review Insights for more specific guidance"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 7, "cooldownDays": 7, "dedupeKey": "ENGAGE_CONFIDENCE" }
    },
    {
      "id": "R_SAFETY_VERY_HIGH_METER",
      "category": "Safety",
      "basePriority": 100,
      "trigger": { "==": [{ "var": "facts.state.meterLevel" }, "VERY_HIGH"] },
      "resolve": { "<": [{ "var": "facts.state.riskIndex" }, 75] },
      "whyTemplate": "Your risk meter is Very High. This app is educational—consider seeking professional advice for personalized guidance.",
      "actions": [
        "Review your top 3 recommendations today",
        "Prioritize logging for the next 7 days",
        "If you have medical concerns, consult a professional before relying on app guidance"
      ],
      "evidenceRefs": ["EV_CDC_PA_ADULTS", "EV_AASM_SLEEP_7H"],
      "policy": { "snoozeDays": 1, "cooldownDays": 1, "dedupeKey": "SAFETY", "suppressOthersWhenActive": false }
    },
    {
      "id": "R_SAFETY_LABS_DIABETES_RANGE",
      "category": "Safety",
      "basePriority": 100,
      "trigger": {
        "or": [
          { ">=": [{ "var": "facts.labs.hba1cPct" }, 6.5] },
          { ">=": [{ "var": "facts.labs.fpgMgdl" }, 126] }
        ]
      },
      "resolve": {
        "and": [
          { "<": [{ "var": "facts.labs.hba1cPct" }, 6.5] },
          { "<": [{ "var": "facts.labs.fpgMgdl" }, 126] }
        ]
      },
      "whyTemplate": "A lab value you entered may be in a diabetes range. This app is educational; please seek professional medical evaluation.",
      "actions": [
        "Do not rely solely on app guidance for lab interpretation",
        "Consider discussing these values with a professional",
        "Continue general healthy habits (activity, sleep, diet) while you seek guidance"
      ],
      "evidenceRefs": ["EV_CDC_DIAB_TESTING", "EV_CDC_A1C"],
      "policy": { "snoozeDays": 1, "cooldownDays": 1, "dedupeKey": "SAFETY_LABS", "suppressOthersWhenActive": true }
    },
    {
      "id": "R_ACTIVITY_VERY_LOW",
      "category": "Activity",
      "basePriority": 85,
      "trigger": { "<": [{ "var": "facts.metrics.moderateEqMin7d" }, 30] },
      "resolve": { ">=": [{ "var": "facts.metrics.moderateEqMin7d" }, 60] },
      "whyTemplate": "Your weekly physical activity is very low. Start with tiny routines and build up.",
      "actions": [
        "Start with 5–10 minutes on 3 days",
        "Add 2–3 minutes every 2–3 days",
        "If short on time, do 3×5-minute bouts"
      ],
      "evidenceRefs": ["EV_WHO_PA_BEHEALTHY", "EV_CDC_WHAT_COUNTS"],
      "policy": { "snoozeDays": 7, "cooldownDays": 7, "dedupeKey": "ACTIVITY_TIER" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_ACTIVITY_LOW",
      "category": "Activity",
      "basePriority": 78,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.moderateEqMin7d" }, 30] },
          { "<": [{ "var": "facts.metrics.moderateEqMin7d" }, 60] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.moderateEqMin7d" }, 90] },
      "whyTemplate": "You’ve started. Build toward 60–90 minutes/week as a next checkpoint.",
      "actions": [
        "Do 4×15 minutes moderate activity this week",
        "Add one extra short session (10 minutes)",
        "Aim for activity on 4 days/week"
      ],
      "evidenceRefs": ["EV_WHO_PA_BEHEALTHY"],
      "policy": { "snoozeDays": 7, "cooldownDays": 7, "dedupeKey": "ACTIVITY_TIER" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_ACTIVITY_BUILD_TO_150",
      "category": "Activity",
      "basePriority": 70,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.moderateEqMin7d" }, 60] },
          { "<": [{ "var": "facts.metrics.moderateEqMin7d" }, 150] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.moderateEqMin7d" }, 150] },
      "whyTemplate": "Progress toward 150 min/week improves metabolic health.",
      "actions": [
        "Target 5×30 minutes moderate activity weekly",
        "Or use 10-minute bouts after meals",
        "Add 10 minutes per week until you reach 150"
      ],
      "evidenceRefs": ["EV_WHO_PA_BEHEALTHY", "EV_CDC_PA_ADULTS", "EV_CDC_WHAT_COUNTS"],
      "policy": { "snoozeDays": 7, "cooldownDays": 7, "dedupeKey": "ACTIVITY_TARGET" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_ACTIVITY_DISTRIBUTION",
      "category": "Activity",
      "basePriority": 60,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.moderateEqMin7d" }, 150] },
          { "<=": [{ "var": "facts.metrics.activityDays7d" }, 2] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.activityDays7d" }, 4] },
      "whyTemplate": "You’re meeting weekly minutes, but spreading activity across more days improves consistency.",
      "actions": [
        "Split activity across 4–5 days",
        "Use shorter sessions (15–20 min) on busy days",
        "Keep one longer session if you enjoy it"
      ],
      "evidenceRefs": ["EV_CDC_WHAT_COUNTS"],
      "policy": { "snoozeDays": 10, "cooldownDays": 10, "dedupeKey": "ACTIVITY_DAYS" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_ACTIVITY_STRENGTH_2DAYS",
      "category": "Activity",
      "basePriority": 55,
      "trigger": { "<": [{ "var": "facts.metrics.strengthDays7d" }, 2] },
      "resolve": { ">=": [{ "var": "facts.metrics.strengthDays7d" }, 2] },
      "whyTemplate": "Adding 2 days of muscle-strengthening supports overall fitness. Start light and progress gradually.",
      "actions": [
        "Try 2 days this week: wall push-ups, chair squats, resistance band pulls",
        "Do 1 set of 8–12 reps per movement",
        "Stop if pain worsens; keep it comfortable"
      ],
      "evidenceRefs": ["EV_CDC_PA_ADULTS"],
      "policy": { "snoozeDays": 14, "cooldownDays": 14, "dedupeKey": "ACTIVITY_STRENGTH" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_ACTIVITY_SHORT_BOUTS_SHIFTWORK",
      "category": "Activity",
      "basePriority": 52,
      "trigger": {
        "and": [
          { "==": [{ "var": "facts.profile.scheduleType" }, "NIGHT_SHIFT"] },
          { "<": [{ "var": "facts.metrics.moderateEqMin7d" }, 150] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.moderateEqMin7d" }, 150] },
      "whyTemplate": "Shift schedules can make long workouts harder. Short activity bouts can still add up.",
      "actions": [
        "Do 3×10-minute bouts on workdays (walking, cycling, stairs)",
        "Pick a consistent time window you can repeat",
        "Track weekly minutes rather than perfect daily targets"
      ],
      "evidenceRefs": ["EV_CDC_WHAT_COUNTS"],
      "policy": { "snoozeDays": 14, "cooldownDays": 14, "dedupeKey": "ACTIVITY_SHIFT" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_STEPS_VERY_LOW",
      "category": "Steps",
      "basePriority": 75,
      "trigger": { "<": [{ "var": "facts.metrics.avgSteps7d" }, 5000] },
      "resolve": { ">=": [{ "var": "facts.metrics.avgSteps7d" }, 6500] },
      "whyTemplate": "Your average steps are low. A small step increase improves consistency.",
      "actions": [
        "Add +300 to +500 steps per day this week",
        "Do a 10-minute walk after one meal",
        "Use stairs once per day if comfortable"
      ],
      "evidenceRefs": ["EV_CDC_WHAT_COUNTS"],
      "policy": { "snoozeDays": 7, "cooldownDays": 7, "dedupeKey": "STEPS_TIER" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_STEPS_LOW",
      "category": "Steps",
      "basePriority": 62,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.avgSteps7d" }, 5000] },
          { "<": [{ "var": "facts.metrics.avgSteps7d" }, 7500] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.avgSteps7d" }, 8000] },
      "whyTemplate": "You’re close to a strong daily movement baseline. Increase gradually.",
      "actions": [
        "Add +500 steps/day for 7 days",
        "Try a 15-minute evening walk",
        "Aim for 4–5 walking days this week"
      ],
      "evidenceRefs": ["EV_CDC_WHAT_COUNTS"],
      "policy": { "snoozeDays": 7, "cooldownDays": 10, "dedupeKey": "STEPS_TIER" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_STEPS_GOAL_SETUP",
      "category": "Steps",
      "basePriority": 50,
      "trigger": {
        "or": [
          { "==": [{ "var": "facts.goals.stepsGoalDaily" }, null] },
          { "<=": [{ "var": "facts.goals.stepsGoalDaily" }, 0] }
        ]
      },
      "resolve": { ">": [{ "var": "facts.goals.stepsGoalDaily" }, 0] },
      "whyTemplate": "Set a daily step goal so progress bars and plans match your baseline.",
      "actions": [
        "Start from your 7-day average and add +500 steps/day as a goal",
        "Keep the goal reachable for 2 weeks",
        "Increase again after you succeed"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 14, "cooldownDays": 14, "dedupeKey": "STEPS_GOAL" },
      "constraints": { "requiresMinLogs7d": 3 }
    },
    {
      "id": "R_STEPS_WORSENING_TREND",
      "category": "Steps",
      "basePriority": 65,
      "trigger": {
        "<": [
          { "var": "facts.metrics.avgSteps7d" },
          { "-": [{ "var": "facts.metrics.avgSteps14d" }, 800] }
        ]
      },
      "resolve": {
        ">=": [
          { "var": "facts.metrics.avgSteps7d" },
          { "-": [{ "var": "facts.metrics.avgSteps14d" }, 200] }
        ]
      },
      "whyTemplate": "Your steps are dropping compared to the previous two weeks. Small course corrections help prevent relapse.",
      "actions": [
        "Pick one routine walk time and repeat it for 5 days",
        "Add a short post-meal walk (5–10 minutes)",
        "Reduce sitting time by standing/moving every hour"
      ],
      "evidenceRefs": ["EV_CDC_WHAT_COUNTS"],
      "policy": { "snoozeDays": 10, "cooldownDays": 14, "dedupeKey": "STEPS_TREND" },
      "constraints": { "requiresMinLogs7d": 4 }
    },
    {
      "id": "R_STEPS_INCONSISTENT",
      "category": "Steps",
      "basePriority": 55,
      "trigger": { "<": [{ "var": "facts.metrics.stepsDays7d" }, 4] },
      "resolve": { ">=": [{ "var": "facts.metrics.stepsDays7d" }, 5] },
      "whyTemplate": "Consistency matters more than perfection. Aim to record steps most days.",
      "actions": [
        "Track steps on 5 days this week",
        "If you miss a day, continue the next day without restarting",
        "Use reminders if needed"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 10, "cooldownDays": 10, "dedupeKey": "STEPS_CONSISTENCY" }
    },
    {
      "id": "R_SLEEP_SHORT",
      "category": "Sleep",
      "basePriority": 75,
      "trigger": { "<": [{ "var": "facts.metrics.avgSleepHours7d" }, 6] },
      "resolve": { ">=": [{ "var": "facts.metrics.avgSleepHours7d" }, 7] },
      "whyTemplate": "Your average sleep is short. Aim for 7+ hours with a consistent routine.",
      "actions": [
        "Move bedtime earlier by 15 minutes for 3 nights",
        "Keep wake time consistent within 60 minutes",
        "Avoid screens 30 minutes before bed"
      ],
      "evidenceRefs": ["EV_AASM_SLEEP_7H", "EV_HARVARD_SLEEP_HYGIENE"],
      "policy": { "snoozeDays": 7, "cooldownDays": 14, "dedupeKey": "SLEEP_TIER" },
      "constraints": { "requiresMinSleepLogs7d": 3 }
    },
    {
      "id": "R_SLEEP_MILD_SHORT",
      "category": "Sleep",
      "basePriority": 62,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.avgSleepHours7d" }, 6] },
          { "<": [{ "var": "facts.metrics.avgSleepHours7d" }, 7] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.avgSleepHours7d" }, 7] },
      "whyTemplate": "You’re close to the 7-hour target. Small changes can push you over the line.",
      "actions": [
        "Add 15 minutes sleep time on 4 nights this week",
        "Keep caffeine earlier in the day if possible",
        "Create a 10-minute wind-down routine"
      ],
      "evidenceRefs": ["EV_AASM_SLEEP_7H", "EV_HARVARD_SLEEP_HYGIENE"],
      "policy": { "snoozeDays": 10, "cooldownDays": 14, "dedupeKey": "SLEEP_TIER" },
      "constraints": { "requiresMinSleepLogs7d": 3 }
    },
    {
      "id": "R_SLEEP_INCONSISTENT",
      "category": "Sleep",
      "basePriority": 60,
      "trigger": { ">=": [{ "var": "facts.metrics.sleepStdDev7d" }, 1.5] },
      "resolve": { "<": [{ "var": "facts.metrics.sleepStdDev7d" }, 1.0] },
      "whyTemplate": "Sleep timing is inconsistent. Consistency improves sleep quality for many people.",
      "actions": [
        "Keep bedtime and wake time within a 60-minute window",
        "Pick one consistent wake time for 5 days",
        "Use a wind-down routine 30 minutes before bed"
      ],
      "evidenceRefs": ["EV_HARVARD_SLEEP_HYGIENE"],
      "policy": { "snoozeDays": 10, "cooldownDays": 14, "dedupeKey": "SLEEP_CONSISTENCY" },
      "constraints": { "requiresMinSleepLogs7d": 3 }
    },
    {
      "id": "R_SLEEP_TIMING_LATE",
      "category": "Sleep",
      "basePriority": 55,
      "trigger": { ">": [{ "var": "facts.metrics.avgBedtimeMin" }, 60] },
      "resolve": { "<=": [{ "var": "facts.metrics.avgBedtimeMin" }, 30] },
      "whyTemplate": "Your bedtime is late. Moving it slightly earlier can increase total sleep time.",
      "actions": [
        "Shift bedtime earlier by 15 minutes every 2–3 nights",
        "Avoid heavy meals right before bed when possible",
        "Keep wake time stable"
      ],
      "evidenceRefs": ["EV_HARVARD_SLEEP_HYGIENE"],
      "policy": { "snoozeDays": 14, "cooldownDays": 14, "dedupeKey": "SLEEP_TIMING" },
      "constraints": { "requiresMinSleepLogs7d": 3, "requiresSleepTimesLogged7d": 3 }
    },
    {
      "id": "R_SLEEP_TIMING_IRREGULAR",
      "category": "Sleep",
      "basePriority": 52,
      "trigger": { ">=": [{ "var": "facts.metrics.bedtimeStdDevMin" }, 90] },
      "resolve": { "<": [{ "var": "facts.metrics.bedtimeStdDevMin" }, 60] },
      "whyTemplate": "Your bedtimes vary a lot. Stabilizing bedtimes can reduce next-day fatigue.",
      "actions": [
        "Choose a target bedtime window (±30 minutes)",
        "Set an alarm for wind-down start time",
        "Keep weekends within 60–90 minutes of weekdays"
      ],
      "evidenceRefs": ["EV_HARVARD_SLEEP_HYGIENE"],
      "policy": { "snoozeDays": 14, "cooldownDays": 14, "dedupeKey": "SLEEP_TIMING" },
      "constraints": { "requiresMinSleepLogs7d": 3, "requiresSleepTimesLogged7d": 3 }
    },
    {
      "id": "R_DIET_SSB_HIGH",
      "category": "Diet",
      "basePriority": 80,
      "trigger": { ">=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 7] },
      "resolve": { "<=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 2] },
      "whyTemplate": "High sugary drink intake increases added sugars. Reduce gradually.",
      "actions": [
        "Replace 1 sugary drink/day with water or unsweetened option",
        "Avoid juice as a daily habit; prefer whole fruit",
        "Keep sugary drinks for occasional use"
      ],
      "evidenceRefs": ["EV_AHA_ADDED_SUGARS", "EV_ADA_FRUIT"],
      "policy": { "snoozeDays": 7, "cooldownDays": 14, "dedupeKey": "DIET_SSB" },
      "constraints": { "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_DIET_SSB_MODERATE",
      "category": "Diet",
      "basePriority": 60,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 3] },
          { "<": [{ "var": "facts.metrics.sugaryDrinks7d" }, 7] }
        ]
      },
      "resolve": { "<=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 2] },
      "whyTemplate": "You’re close to a low added-sugar pattern. Small reductions help.",
      "actions": [
        "Replace 2 sugary drinks this week with water/unsweetened options",
        "Choose whole fruit instead of juice when possible",
        "Track your weekly total on the dashboard"
      ],
      "evidenceRefs": ["EV_AHA_ADDED_SUGARS", "EV_ADA_FRUIT"],
      "policy": { "snoozeDays": 10, "cooldownDays": 14, "dedupeKey": "DIET_SSB" },
      "constraints": { "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_DIET_FASTFOOD_HIGH",
      "category": "Diet",
      "basePriority": 70,
      "trigger": { ">=": [{ "var": "facts.metrics.fastFood7d" }, 3] },
      "resolve": { "<=": [{ "var": "facts.metrics.fastFood7d" }, 1] },
      "whyTemplate": "Frequent fast food can raise calories, sodium, and added sugar. Reduce weekly frequency.",
      "actions": [
        "Plan 2 home meals this week",
        "Choose grilled/less fried options when eating out",
        "Add vegetables/salad to one meal daily"
      ],
      "evidenceRefs": ["EV_NIDDK_PLATE_METHOD"],
      "policy": { "snoozeDays": 7, "cooldownDays": 14, "dedupeKey": "DIET_FASTFOOD" },
      "constraints": { "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_DIET_PLATE_METHOD_LOW_SCORE",
      "category": "Diet",
      "basePriority": 55,
      "trigger": {
        "and": [
          { "!=": [{ "var": "facts.metrics.dietScoreAvg7d" }, null] },
          { "<=": [{ "var": "facts.metrics.dietScoreAvg7d" }, 4] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.dietScoreAvg7d" }, 6] },
      "whyTemplate": "Use a simple meal structure to improve consistency.",
      "actions": [
        "Try the plate method: half vegetables, one quarter protein, one quarter high-fiber carbs",
        "Add a protein source to breakfast (e.g., eggs, yogurt, legumes) if suitable",
        "Prefer whole foods over sugary snacks where possible"
      ],
      "evidenceRefs": ["EV_NIDDK_PLATE_METHOD"],
      "policy": { "snoozeDays": 14, "cooldownDays": 14, "dedupeKey": "DIET_STRUCTURE" },
      "constraints": { "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_DIET_FRUIT_GUIDANCE",
      "category": "Diet",
      "basePriority": 50,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 1] },
          { ">=": [{ "var": "facts.metrics.daysLogged7d" }, 3] }
        ]
      },
      "resolve": { "<": [{ "var": "facts.metrics.sugaryDrinks7d" }, 1] },
      "whyTemplate": "Whole fruits are generally better than juice for most people; portions still matter.",
      "actions": [
        "Prefer whole fruit over fruit juice",
        "Limit dried fruit portions (more concentrated sugar)",
        "If choosing canned fruit, prefer no added sugar options"
      ],
      "evidenceRefs": ["EV_ADA_FRUIT"],
      "policy": { "snoozeDays": 21, "cooldownDays": 21, "dedupeKey": "DIET_FRUIT" },
      "constraints": { "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_DIET_PROTEIN_FIBER_SNACK_SWAP",
      "category": "Diet",
      "basePriority": 52,
      "trigger": {
        "or": [
          { ">=": [{ "var": "facts.metrics.fastFood7d" }, 2] },
          { ">=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 3] }
        ]
      },
      "resolve": {
        "and": [
          { "<=": [{ "var": "facts.metrics.fastFood7d" }, 1] },
          { "<=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 2] }
        ]
      },
      "whyTemplate": "Protein + fiber swaps can reduce cravings and make diet changes easier.",
      "actions": [
        "Swap one snack with a protein+fiber option (e.g., yogurt+nuts, eggs+vegetables, legumes, sprouts) if suitable",
        "Add vegetables/salad to one meal daily",
        "Use Diet Explorer to search high-protein/high-fiber foods"
      ],
      "evidenceRefs": ["EV_NIDDK_PLATE_METHOD", "EV_USDA_FDC_API"],
      "policy": { "snoozeDays": 14, "cooldownDays": 14, "dedupeKey": "DIET_SWAP" },
      "constraints": { "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_DIET_EXPLORER_SEARCH_PROMPT",
      "category": "Diet",
      "basePriority": 40,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.daysLogged7d" }, 3] },
          { "==": [{ "var": "facts.state.usedDietSearchRecently" }, false] }
        ]
      },
      "resolve": { "==": [{ "var": "facts.state.usedDietSearchRecently" }, true] },
      "whyTemplate": "Use Diet Explorer to find foods that match your nutrition goal (protein/fiber/low added sugar).",
      "actions": [
        "Search: “high protein breakfast”",
        "Search: “high fiber snacks”",
        "Filter by your diet preference (veg/eggetarian/non-veg)"
      ],
      "evidenceRefs": ["EV_USDA_FDC_API"],
      "policy": { "snoozeDays": 30, "cooldownDays": 30, "dedupeKey": "DIET_SEARCH" }
    },
    {
      "id": "R_WEIGHT_UP_TREND",
      "category": "Weight",
      "basePriority": 75,
      "trigger": { ">=": [{ "var": "facts.metrics.weightTrend28dPct" }, 1.0] },
      "resolve": { "<=": [{ "var": "facts.metrics.weightTrend28dPct" }, 0.3] },
      "whyTemplate": "Your weight trend is rising. Small sustainable changes are effective.",
      "actions": [
        "Reduce sugary drinks and processed snacks this week",
        "Add 10 minutes of walking after dinner",
        "Log weekly weight to monitor trend"
      ],
      "evidenceRefs": ["EV_WHO_PA_BEHEALTHY"],
      "policy": { "snoozeDays": 7, "cooldownDays": 21, "dedupeKey": "WEIGHT_TREND" },
      "constraints": { "requiresWeightData": true }
    },
    {
      "id": "R_WEIGHT_DOWN_TOO_FAST_CAUTION",
      "category": "Weight",
      "basePriority": 90,
      "trigger": { "<=": [{ "var": "facts.metrics.weightTrend28dPct" }, -5.0] },
      "resolve": { ">": [{ "var": "facts.metrics.weightTrend28dPct" }, -5.0] },
      "whyTemplate": "Your weight is changing rapidly. Avoid overly aggressive changes and prioritize safe routines.",
      "actions": [
        "Avoid extreme restriction; focus on consistent meals and activity",
        "If you feel unwell, pause aggressive goals",
        "Consider consulting a professional for personalized guidance"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 7, "cooldownDays": 14, "dedupeKey": "WEIGHT_SAFETY" },
      "constraints": { "requiresWeightData": true }
    },
    {
      "id": "R_WEIGHT_GOAL_SETUP_BMI_RANGE",
      "category": "Weight",
      "basePriority": 60,
      "trigger": {
        "or": [
          { "==": [{ "var": "facts.goals.weightGoalKg" }, null] },
          { "<=": [{ "var": "facts.goals.weightGoalKg" }, 0] }
        ]
      },
      "resolve": { ">": [{ "var": "facts.goals.weightGoalKg" }, 0] },
      "whyTemplate": "Set a realistic weight goal (or target range). The app can show a BMI-based healthy range for reference.",
      "actions": [
        "Review your BMI category and healthy range",
        "Choose a realistic near-term target (e.g., 4 weeks)",
        "Track trend weekly, not daily fluctuations"
      ],
      "evidenceRefs": ["EV_CDC_BMI_CATEGORIES", "EV_WHO_ASIAN_BMI"],
      "policy": { "snoozeDays": 21, "cooldownDays": 21, "dedupeKey": "WEIGHT_GOAL" },
      "constraints": { "requiresMinLogs7d": 1 }
    },
    {
      "id": "R_WEIGHT_BMI_OVERWEIGHT_TIER",
      "category": "Weight",
      "basePriority": 55,
      "trigger": { ">=": [{ "var": "facts.metrics.bmi" }, 25] },
      "resolve": { "<": [{ "var": "facts.metrics.bmi" }, 25] },
      "whyTemplate": "Your BMI is in a higher category. Focus on sustainable habits rather than rapid change.",
      "actions": [
        "Prioritize 150 min/week activity in small steps",
        "Reduce added sugars (especially sugary drinks)",
        "Use the plate method for meal structure"
      ],
      "evidenceRefs": ["EV_CDC_BMI_CATEGORIES", "EV_WHO_PA_BEHEALTHY", "EV_AHA_ADDED_SUGARS", "EV_NIDDK_PLATE_METHOD"],
      "policy": { "snoozeDays": 21, "cooldownDays": 21, "dedupeKey": "WEIGHT_BMI" },
      "constraints": { "requiresMinLogs7d": 1 }
    },
    {
      "id": "R_WEIGHT_PLATEAU_12W",
      "category": "Weight",
      "basePriority": 50,
      "trigger": { "==": [{ "var": "facts.metrics.weightPlateau12w" }, true] },
      "resolve": { "==": [{ "var": "facts.metrics.weightPlateau12w" }, false] },
      "whyTemplate": "Your weight trend has plateaued. Small adjustments can restart progress.",
      "actions": [
        "Add +10 minutes activity on 2 days this week",
        "Reduce sugary drinks by 1–2 per week",
        "Focus on consistent sleep schedule for 7 days"
      ],
      "evidenceRefs": ["EV_WHO_PA_BEHEALTHY", "EV_AHA_ADDED_SUGARS", "EV_AASM_SLEEP_7H"],
      "policy": { "snoozeDays": 21, "cooldownDays": 21, "dedupeKey": "WEIGHT_PLATEAU" },
      "constraints": { "requiresWeightData": true }
    },
    {
      "id": "R_CLUSTER_SLEEP_SSB",
      "category": "Composite",
      "basePriority": 82,
      "trigger": {
        "and": [
          { "<": [{ "var": "facts.metrics.avgSleepHours7d" }, 6.5] },
          { ">=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 3] }
        ]
      },
      "resolve": {
        "and": [
          { ">=": [{ "var": "facts.metrics.avgSleepHours7d" }, 7] },
          { "<=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 2] }
        ]
      },
      "whyTemplate": "Short sleep + higher added sugar can reinforce cravings. Improve sleep routine and reduce sugary drinks together.",
      "actions": [
        "Add 15 minutes sleep time on 4 nights this week",
        "Replace 2 sugary drinks this week with unsweetened options",
        "Use a wind-down routine 30 minutes before bed"
      ],
      "evidenceRefs": ["EV_AASM_SLEEP_7H", "EV_HARVARD_SLEEP_HYGIENE", "EV_AHA_ADDED_SUGARS"],
      "policy": { "snoozeDays": 10, "cooldownDays": 14, "dedupeKey": "CLUSTER_SLEEP_SSB" },
      "constraints": { "requiresMinSleepLogs7d": 3, "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_CLUSTER_LOW_ACTIVITY_HIGH_SSB",
      "category": "Composite",
      "basePriority": 80,
      "trigger": {
        "and": [
          { "<": [{ "var": "facts.metrics.moderateEqMin7d" }, 60] },
          { ">=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 7] }
        ]
      },
      "resolve": {
        "and": [
          { ">=": [{ "var": "facts.metrics.moderateEqMin7d" }, 90] },
          { "<=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 2] }
        ]
      },
      "whyTemplate": "Low activity + high sugary drinks is a strong lever for improvement. Start with small activity and drink swaps.",
      "actions": [
        "Do 3×10 minutes walking/cycling this week",
        "Replace 1 sugary drink/day with water/unsweetened option",
        "Track weekly minutes and drink totals on dashboard"
      ],
      "evidenceRefs": ["EV_WHO_PA_BEHEALTHY", "EV_AHA_ADDED_SUGARS"],
      "policy": { "snoozeDays": 10, "cooldownDays": 14, "dedupeKey": "CLUSTER_ACTIVITY_SSB" },
      "constraints": { "requiresMinLogs7d": 3, "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_CLUSTER_WEIGHT_UP_DIET_RISK",
      "category": "Composite",
      "basePriority": 78,
      "trigger": {
        "and": [
          { ">=": [{ "var": "facts.metrics.weightTrend28dPct" }, 1.0] },
          { "or": [
            { ">=": [{ "var": "facts.metrics.fastFood7d" }, 3] },
            { ">=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 7] }
          ] }
        ]
      },
      "resolve": {
        "and": [
          { "<=": [{ "var": "facts.metrics.weightTrend28dPct" }, 0.3] },
          { "<=": [{ "var": "facts.metrics.fastFood7d" }, 1] },
          { "<=": [{ "var": "facts.metrics.sugaryDrinks7d" }, 2] }
        ]
      },
      "whyTemplate": "Weight trend is rising along with diet risk signals. Focus on 1–2 changes consistently for 2 weeks.",
      "actions": [
        "Reduce fast food to 1 time/week (or less) this week",
        "Reduce sugary drinks to 2/week (or less)",
        "Add 10 minutes walking after dinner on 4 days"
      ],
      "evidenceRefs": ["EV_AHA_ADDED_SUGARS", "EV_NIDDK_PLATE_METHOD", "EV_WHO_PA_BEHEALTHY"],
      "policy": { "snoozeDays": 10, "cooldownDays": 21, "dedupeKey": "CLUSTER_WEIGHT_DIET" },
      "constraints": { "requiresWeightData": true, "requiresMinDietLogs7d": 3 }
    },
    {
      "id": "R_CLUSTER_LOW_DATA_HIGH_METER",
      "category": "Composite",
      "basePriority": 88,
      "trigger": {
        "and": [
          { "or": [
            { "==": [{ "var": "facts.state.meterLevel" }, "HIGH"] },
            { "==": [{ "var": "facts.state.meterLevel" }, "VERY_HIGH"] }
          ] },
          { "<": [{ "var": "facts.metrics.daysLogged7d" }, 3] }
        ]
      },
      "resolve": { ">=": [{ "var": "facts.metrics.daysLogged7d" }, 4] },
      "whyTemplate": "Your meter is high but data is limited. Prioritize logging and one core habit first.",
      "actions": [
        "Log daily for 4 days this week (steps + sleep)",
        "Add 10 minutes activity on 3 days",
        "Then revisit diet changes once data is stable"
      ],
      "evidenceRefs": [],
      "policy": { "snoozeDays": 7, "cooldownDays": 7, "dedupeKey": "CLUSTER_LOW_DATA" }
    }
  ],
  "conditionModifiers": [
    {
      "id": "M_NAFLD_DIET_WEIGHT_BOOST",
      "conditionKey": "NAFLD",
      "appliesToCategories": ["Diet", "Weight", "Composite"],
      "priorityDelta": 10,
      "actionEdits": { "addActions": ["Focus on reducing sugary drinks/juice to lower added sugar exposure"], "trimToMaxActions": 5 },
      "warningsAdd": ["If you have liver-related dietary restrictions, confirm major changes with a professional."],
      "evidenceRefsAdd": ["EV_AHA_ADDED_SUGARS"],
      "explanationTemplate": "Because NAFLD is selected, we prioritized sugar reduction and weight-trend actions."
    },
    {
      "id": "M_PCOS_ACTIVITY_STRENGTH",
      "conditionKey": "PCOS",
      "appliesToCategories": ["Activity", "Weight", "Composite"],
      "priorityDelta": 8,
      "actionEdits": { "addActions": ["Add 2 days/week of light strength training if comfortable"], "trimToMaxActions": 5 },
      "warningsAdd": [],
      "evidenceRefsAdd": ["EV_CDC_PA_ADULTS"],
      "explanationTemplate": "Because PCOS is selected, we boosted activity/weight guidance and included strength training."
    },
    {
      "id": "M_GDM_TIGHTER_MAINTENANCE",
      "conditionKey": "GDM_HISTORY",
      "appliesToCategories": ["Engagement", "Diet", "Weight", "Composite"],
      "priorityDelta": 6,
      "actionEdits": { "addActions": ["Keep maintenance habits steady to reduce relapse risk"], "trimToMaxActions": 5 },
      "warningsAdd": [],
      "evidenceRefsAdd": [],
      "explanationTemplate": "Because GDM history is selected, we increased maintenance priority and relapse sensitivity."
    },
    {
      "id": "M_OSA_SLEEP_PRIORITY",
      "conditionKey": "OSA",
      "appliesToCategories": ["Sleep", "Composite"],
      "priorityDelta": 12,
      "actionEdits": { "addActions": ["Prioritize consistent sleep schedule (bed/wake within 60 minutes)"], "trimToMaxActions": 5 },
      "warningsAdd": ["If you suspect sleep apnea, consider discussing symptoms with a professional."],
      "evidenceRefsAdd": ["EV_AASM_SLEEP_7H"],
      "explanationTemplate": "Because OSA is selected, we boosted sleep consistency recommendations."
    },
    {
      "id": "M_HTN_PROCESSED_FOOD_REDUCE",
      "conditionKey": "HTN",
      "appliesToCategories": ["Diet", "Composite"],
      "priorityDelta": 6,
      "actionEdits": { "addActions": ["Limit fast food frequency to reduce highly processed foods"], "trimToMaxActions": 5 },
      "warningsAdd": [],
      "evidenceRefsAdd": ["EV_NIDDK_PLATE_METHOD"],
      "explanationTemplate": "Because Hypertension is selected, we emphasized reducing processed-food patterns."
    },
    {
      "id": "M_DYSLIPID_FIBER_FORWARD",
      "conditionKey": "DYSLIPID",
      "appliesToCategories": ["Diet", "Composite"],
      "priorityDelta": 6,
      "actionEdits": { "addActions": ["Increase fiber sources (vegetables, legumes, whole grains) if suitable"], "trimToMaxActions": 5 },
      "warningsAdd": [],
      "evidenceRefsAdd": ["EV_NIDDK_PLATE_METHOD"],
      "explanationTemplate": "Because Dyslipidemia is selected, we boosted fiber-forward diet actions."
    },
    {
      "id": "M_DEP_ANX_MICROGOALS",
      "conditionKey": "DEPRESSION_ANXIETY",
      "appliesToCategories": ["Engagement", "Activity", "Steps", "Sleep", "Diet", "Weight", "Composite"],
      "priorityDelta": 4,
      "actionEdits": {
        "replaceActions": [{ "matchContains": "Add 10 minutes", "replacement": "Start with 5 minutes on 3 days this week" }],
        "trimToMaxActions": 3
      },
      "warningsAdd": ["Keep goals small and consistent. If overwhelmed, reduce to one habit at a time."],
      "evidenceRefsAdd": [],
      "explanationTemplate": "Because depression/anxiety is selected, we simplified goals into smaller steps."
    },
    {
      "id": "M_MOBILITY_LOW_IMPACT_SWAP",
      "conditionKey": "MOBILITY_LIMIT",
      "appliesToCategories": ["Activity", "Steps", "Composite"],
      "priorityDelta": 10,
      "actionEdits": {
        "replaceActions": [{ "matchContains": "walk", "replacement": "use low-impact options: cycling, swimming, chair cardio, short bouts" }],
        "trimToMaxActions": 4
      },
      "warningsAdd": ["Choose pain-safe movements; stop if pain worsens."],
      "evidenceRefsAdd": ["EV_CDC_WHAT_COUNTS"],
      "explanationTemplate": "Because mobility limitation is selected, we substituted low-impact activity options."
    },
    {
      "id": "M_DIET_CONSTRAINTS_CAUTION",
      "conditionKey": "DIET_CONSTRAINTS",
      "appliesToCategories": ["Diet", "Composite"],
      "priorityDelta": 0,
      "actionEdits": { "addActions": ["Avoid extreme diet changes; choose small universally safe improvements"], "trimToMaxActions": 5 },
      "warningsAdd": ["If you have kidney/gout/GI conditions, confirm major nutrition targets with a professional."],
      "evidenceRefsAdd": [],
      "explanationTemplate": "Because diet constraints are selected, we avoided restrictive diet recommendations and added safety notes."
    }
  ]
}