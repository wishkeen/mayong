do $$
declare
  ritual_category_id text;
  ritual_category_name text;
begin
  insert into public.categories (id, name, slug, icon, description, sort_order)
  values (
    'ritualos-job-career',
    'Job & Career',
    'job-career',
    '💼',
    'Rituals for employment, career intentions, and work-related transitions.',
    6
  )
  on conflict (slug) do update set
    name = excluded.name,
    icon = excluded.icon,
    description = excluded.description;

  select id, name
  into ritual_category_id, ritual_category_name
  from public.categories
  where slug = 'job-career';

  if ritual_category_id is null then
    raise exception 'The Job & Career category could not be created.';
  end if;

  insert into public.rituals (
    id, name, category_id, category_slug, category_name, description,
    duration_minutes, difficulty, price, source, practice_type,
    practice_disclaimer, translations, image_url, is_published, is_featured
  ) values (
    'ritualos-peepal-job-seeking',
    'Peepal Root Prayer for Job Seekers',
    ritual_category_id,
    'job-career',
    ritual_category_name,
    'A traditional devotional practice described for job seekers, people seeking employment, and laborers looking for work. The supplied article describes worship beginning Saturday and continuing through Thursday, while also calling Thursday the fifth day; confirm the intended schedule before practice. The article describes taking a living tree root, which can damage the tree; do not cut or remove a root without the landowner’s permission and an arborist’s assurance that it will not harm the tree. This practice cannot guarantee employment or success.',
    20,
    'Intermediate',
    0,
    'User-provided article. The source text specifies Saturday through Thursday but calls Thursday the fifth day; schedule needs confirmation.',
    'spiritual',
    'Traditional spiritual practice; it cannot guarantee employment, an interview, exam result, or other outcome. Do not damage a living tree or remove roots without permission and qualified guidance. Use open flames only where permitted, attended at all times, and safely away from trees and dry material.',
    '[
      {"language":"bn","name":"চাকরিপ্রার্থীদের জন্য অশ্বত্থমূল প্রার্থনা","description":"চাকরিপ্রার্থী, কর্মসংস্থান খুঁজছেন এমন ব্যক্তি এবং কাজের সন্ধানে থাকা শ্রমিকদের জন্য বর্ণিত একটি ঐতিহ্যবাহী ভক্তিমূলক অনুশীলন। নিবন্ধে শনিবার থেকে বৃহস্পতিবার পর্যন্ত উপাসনার কথা বলা হয়েছে, আবার বৃহস্পতিবারকে পঞ্চম দিনও বলা হয়েছে; অনুশীলনের আগে সঠিক সময়সূচি নিশ্চিত করুন। এতে জীবন্ত গাছের শিকড় নেওয়ার কথা আছে, যা গাছের ক্ষতি করতে পারে। জমির মালিকের অনুমতি ও গাছের ক্ষতি হবে না—এমন বিশেষজ্ঞের নিশ্চিতকরণ ছাড়া শিকড় কাটবেন বা সরাবেন না। এটি চাকরি বা সাফল্যের নিশ্চয়তা দেয় না।","source":"ব্যবহারকারীর দেওয়া নিবন্ধ। মূল লেখায় শনিবার থেকে বৃহস্পতিবার বলা হয়েছে, কিন্তু বৃহস্পতিবারকে পঞ্চম দিন বলা হয়েছে; সময়সূচি নিশ্চিত করা দরকার।"},
      {"language":"hi","name":"नौकरी तलाशने वालों के लिए पीपल-जड़ प्रार्थना","description":"नौकरी तलाशने वालों, रोजगार चाहने वाले लोगों और काम की खोज में लगे श्रमिकों के लिए वर्णित एक पारंपरिक भक्ति-अभ्यास। लेख में शनिवार से गुरुवार तक पूजा करने की बात है, लेकिन गुरुवार को पाँचवाँ दिन भी कहा गया है; अभ्यास से पहले सही समय-सारणी की पुष्टि करें। इसमें जीवित पेड़ की जड़ लेने का वर्णन है, जिससे पेड़ को नुकसान हो सकता है। भूमि-मालिक की अनुमति और किसी योग्य वृक्ष विशेषज्ञ की पुष्टि के बिना जड़ न काटें या हटाएँ। यह नौकरी या सफलता की गारंटी नहीं देता।","source":"उपयोगकर्ता द्वारा दिया गया लेख। मूल पाठ शनिवार से गुरुवार कहता है, लेकिन गुरुवार को पाँचवाँ दिन भी बताता है; समय-सारणी की पुष्टि आवश्यक है।"}
    ]'::jsonb,
    '',
    false,
    false
  )
  on conflict (id) do update set
    name = excluded.name,
    category_id = excluded.category_id,
    category_slug = excluded.category_slug,
    category_name = excluded.category_name,
    description = excluded.description,
    duration_minutes = excluded.duration_minutes,
    difficulty = excluded.difficulty,
    price = excluded.price,
    source = excluded.source,
    practice_type = excluded.practice_type,
    practice_disclaimer = excluded.practice_disclaimer,
    translations = excluded.translations,
    image_url = excluded.image_url,
    is_published = excluded.is_published,
    is_featured = excluded.is_featured;

  insert into public.ritual_steps (
    id, ritual_id, "order", type, title, content, duration_seconds, repetitions
  ) values
    (
      'ritualos-peepal-job-seeking-step-1',
      'ritualos-peepal-job-seeking',
      0, 'instruction', 'Who This Practice Is For',
      'The supplied article presents this practice specifically for job seekers, people seeking employment, and laborers looking for work. It says it is not intended for business owners or commercial shopkeepers. It describes a Saturday start and worship through Thursday, but calls Thursday the fifth day; verify the schedule before beginning.',
      120, 0
    ),
    (
      'ritualos-peepal-job-seeking-step-2',
      'ritualos-peepal-job-seeking',
      1, 'instruction', 'Gather the Materials',
      'On Saturday, gather an earthen lamp (diya), mustard or sesame oil, incense sticks, camphor, matches, turmeric (haldi), vermilion (kumkum), red powder (gulal), colored rice grains (akshat), perfume (itr), and fresh water in an earthen bowl. For the first day, the article specifies kheer and puri. For the following days it specifies a milk-based sweet prepared at home. Fresh flowers are optional.',
      180, 0
    ),
    (
      'ritualos-peepal-job-seeking-step-3',
      'ritualos-peepal-job-seeking',
      2, 'instruction', 'Daily Worship at the Peepal Tree',
      'At a secluded Peepal tree, the article says to gently uncover an exposed root, wash it with clean water, apply five kumkum dots, then offer akshat, haldi, gulal, and itr to the root and tree. It describes lighting five incense sticks near the root and five near the tree, offering camphor, optional flowers, sweets and water at both places, and lighting the diya by the root. Keep flames attended and safely away from the tree and dry material; do not uncover or damage roots.',
      600, 0
    ),
    (
      'ritualos-peepal-job-seeking-step-4',
      'ritualos-peepal-job-seeking',
      3, 'instruction', 'State Your Intention',
      'Pray sincerely, stating your name, situation, and specific goal, such as finding work, preparing for an interview or exam, or seeking labor work. The supplied prayer says: “O Peepal deity, I have this specific problem [state your issue]. For this purpose, I will worship here for 5 days, and on the 5th day, I will take your root with me. Please bless me and fulfill my wish.” The article’s Saturday-to-Thursday schedule conflicts with its “5 days” wording.',
      120, 0
    ),
    (
      'ritualos-peepal-job-seeking-step-5',
      'ritualos-peepal-job-seeking',
      4, 'instruction', 'Closing and Ongoing Practice (Article Description)',
      'The article says that on Thursday the worship is repeated and permission is requested before taking a piece of root. Removing a living root can harm the tree; do not do this without the landowner’s permission and qualified guidance. At home, the article describes washing the root with Ganga Jal, applying the listed offerings, wrapping it in red cloth, and keeping it in a place of worship. It says to touch it to the forehead before going to an interview, exam, or work. These are traditional devotional directions, not a promise of success.',
      180, 0
    )
  on conflict (id) do update set
    ritual_id = excluded.ritual_id,
    "order" = excluded."order",
    type = excluded.type,
    title = excluded.title,
    content = excluded.content,
    duration_seconds = excluded.duration_seconds,
    repetitions = excluded.repetitions;
end;
$$;

notify pgrst, 'reload schema';
