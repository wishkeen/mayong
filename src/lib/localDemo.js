export const localDemoEnabled =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_DEMO_AUTH === "true";

export const localDemoAccount = {
  id: "local-demo-admin",
  email: import.meta.env.VITE_LOCAL_DEMO_EMAIL || "",
  full_name: "Local Demo Admin",
  role: "admin",
};

export const LOCAL_DEMO_SESSION_KEY = "ritualos_local_demo_session";

export const localDemoCategories = [
  {
    id: "demo-category-mindfulness",
    name: "Mindfulness",
    slug: "mindfulness",
    icon: "🌙",
    description: "Simple, reflective practices for a quieter moment.",
    sort_order: 0,
  },
  {
    id: "demo-category-intention",
    name: "Intention",
    slug: "intention",
    icon: "✨",
    description: "Small practices for setting a personal intention.",
    sort_order: 1,
  },
];

export const localDemoRituals = [
  {
    id: "demo-ritual-grounding",
    name: "A Moment to Ground",
    category_id: "demo-category-mindfulness",
    category_slug: "mindfulness",
    category_name: "Mindfulness",
    description: "A short, gentle breathing and reflection practice to help you pause and notice the present moment.",
    duration_minutes: 3,
    difficulty: "Beginner",
    price: 0,
    is_featured: true,
    is_published: true,
    sort_order: 0,
    practice_type: "meditative",
    source: "Original RitualOS demonstration content.",
    steps: [
      { id: "demo-grounding-1", order: 0, type: "instruction", title: "Arrive", content: "Settle into a comfortable position. Notice the support beneath you." },
      { id: "demo-grounding-2", order: 1, type: "instruction", title: "Breathe", content: "Take three comfortable breaths, without forcing their pace or depth." },
      { id: "demo-grounding-3", order: 2, type: "completion", title: "Return", content: "Notice one thing you can see, hear, and feel. Continue when you are ready." },
    ],
  },
  {
    id: "demo-ritual-intention",
    name: "Set a Gentle Intention",
    category_id: "demo-category-intention",
    category_slug: "intention",
    category_name: "Intention",
    description: "Take a few minutes to name one kind, realistic intention for the day ahead.",
    duration_minutes: 5,
    difficulty: "Beginner",
    price: 0,
    is_featured: true,
    is_published: true,
    sort_order: 1,
    practice_type: "intention",
    source: "Original RitualOS demonstration content.",
    steps: [
      { id: "demo-intention-1", order: 0, type: "instruction", title: "Pause", content: "Take a moment to settle and notice how you feel." },
      { id: "demo-intention-2", order: 1, type: "instruction", title: "Choose", content: "Name one small, realistic intention that feels useful to you today." },
      { id: "demo-intention-3", order: 2, type: "completion", title: "Carry it forward", content: "Write down your intention or simply keep it in mind as you continue your day." },
    ],
  },
];

export const localDemoSteps = {
  "demo-ritual-grounding": [
    { id: "demo-grounding-1", order: 0, type: "instruction", title: "Arrive", content: "Settle into a comfortable position. Notice the support beneath you." },
    { id: "demo-grounding-2", order: 1, type: "instruction", title: "Breathe", content: "Take three comfortable breaths, without forcing their pace or depth." },
    { id: "demo-grounding-3", order: 2, type: "completion", title: "Return", content: "Notice one thing you can see, hear, and feel. Continue when you are ready." },
  ],
  "demo-ritual-intention": [
    { id: "demo-intention-1", order: 0, type: "instruction", title: "Pause", content: "Take a moment to settle and notice how you feel." },
    { id: "demo-intention-2", order: 1, type: "instruction", title: "Choose", content: "Name one small, realistic intention that feels useful to you today." },
    { id: "demo-intention-3", order: 2, type: "completion", title: "Carry it forward", content: "Write down your intention or simply keep it in mind as you continue your day." },
  ],
};
